import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// ==================== Web Push Encryption (RFC 8291 - aes128gcm) ====================

function b64url(data: Uint8Array): string {
    let b = '';
    for (let i = 0; i < data.length; i++) b += String.fromCharCode(data[i]);
    return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

// HKDF-SHA256 (RFC 5869) - Extract then Expand
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<CryptoKey> {
    const key = await crypto.subtle.importKey(
        'raw',
        salt.length ? salt : new Uint8Array(32),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm));
    return crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function hkdfExpand(prk: CryptoKey, info: Uint8Array, length: number): Promise<Uint8Array> {
    const t = new Uint8Array(await crypto.subtle.sign('HMAC', prk, concat(info, new Uint8Array([1]))));
    return t.slice(0, length);
}

// Encrypt push payload per RFC 8291 (aes128gcm content encoding)
async function encryptPayload(
    clientPublicKeyB64: string,
    clientAuthB64: string,
    payload: string
): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const clientPublicKeyBytes = b64urlDecode(clientPublicKeyB64);
    const clientAuth = b64urlDecode(clientAuthB64);

    // 1. Generate ephemeral ECDH key pair
    const serverKeys = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
    );
    const serverPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));

    // 2. Import the client's public key (subscription p256dh)
    const clientKey = await crypto.subtle.importKey(
        'raw',
        clientPublicKeyBytes,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );

    // 3. ECDH shared secret
    const sharedSecret = new Uint8Array(
        await crypto.subtle.deriveBits(
            { name: 'ECDH', public: clientKey },
            serverKeys.privateKey,
            256
        )
    );

    // 4. Generate random 16-byte salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // 5. Key derivation per RFC 8291, Section 3.3
    // IKM info = "WebPush: info\0" || ua_public || as_public
    const ikmInfo = concat(
        encoder.encode('WebPush: info\0'),
        clientPublicKeyBytes,
        serverPublicKeyBytes
    );

    // PRK_key = HKDF-Extract(auth_secret, ecdh_secret)
    const authPrk = await hkdfExtract(clientAuth, sharedSecret);
    // IKM = HKDF-Expand(PRK_key, ikm_info, 32)
    const ikm = await hkdfExpand(authPrk, ikmInfo, 32);

    // 6. CEK and nonce derivation per RFC 8291, Section 3.4
    // PRK = HKDF-Extract(salt, IKM)
    const prk = await hkdfExtract(salt, ikm);

    // CEK_info = "Content-Encoding: aes128gcm\0"  (NO key material appended for aes128gcm!)
    const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
    const cek = await hkdfExpand(prk, cekInfo, 16);

    // nonce_info = "Content-Encoding: nonce\0"
    const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
    const nonce = await hkdfExpand(prk, nonceInfo, 12);

    // 7. Pad the plaintext: payload + delimiter (0x02 for final record)
    const payloadBytes = encoder.encode(payload);
    const paddedPayload = concat(payloadBytes, new Uint8Array([2]));

    // 8. AES-128-GCM encryption
    const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce },
            aesKey,
            paddedPayload
        )
    );

    // 9. Build aes128gcm body: salt(16) || rs(4) || idlen(1) || keyid(65) || ciphertext
    const rs = new Uint8Array(4);
    new DataView(rs.buffer).setUint32(0, 4096, false);
    const idLen = new Uint8Array([65]);

    return concat(salt, rs, idLen, serverPublicKeyBytes, ciphertext);
}

// Create VAPID JWT (ES256)
async function createVapidJwt(audience: string, subject: string, vapidPrivateKeyB64: string, vapidPublicKeyB64: string): Promise<string> {
    const encoder = new TextEncoder();
    const header = b64url(encoder.encode(JSON.stringify({ alg: 'ES256', typ: 'JWT' })));
    const now = Math.floor(Date.now() / 1000);
    const payload = b64url(encoder.encode(JSON.stringify({
        aud: audience,
        exp: now + 12 * 3600,
        sub: subject,
    })));
    const unsignedToken = `${header}.${payload}`;

    const privateKeyBytes = b64urlDecode(vapidPrivateKeyB64);
    const publicKeyBytes = b64urlDecode(vapidPublicKeyB64);

    const jwk = {
        kty: 'EC',
        crv: 'P-256',
        d: b64url(privateKeyBytes),
        x: b64url(publicKeyBytes.slice(1, 33)),
        y: b64url(publicKeyBytes.slice(33, 65)),
    };

    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, encoder.encode(unsignedToken)));

    return `${unsignedToken}.${b64url(sig)}`;
}

// Send a single Web Push notification
async function sendWebPush(
    subscription: any,
    payload: string,
    vapidPublicKey: string,
    vapidPrivateKey: string,
    subject: string
): Promise<Response> {
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys.p256dh;
    const auth = subscription.keys.auth;

    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.hostname}`;
    const jwt = await createVapidJwt(audience, subject, vapidPrivateKey, vapidPublicKey);

    // Encrypt payload per RFC 8291
    const encrypted = await encryptPayload(p256dh, auth, payload);

    console.log(`Sending push to ${endpoint.substring(0, 60)}... (${encrypted.length} bytes)`);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'Content-Encoding': 'aes128gcm',
            'Content-Type': 'application/octet-stream',
            'TTL': '86400',
        },
        body: encrypted,
    });

    console.log(`Push response: ${response.status} ${response.statusText}`);
    return response;
}

// ==================== Main Handler ====================

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Auth header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { memberId, title, message, url, broadcast, excludeMemberId } = await req.json();

        if (!message) {
            return new Response(JSON.stringify({ error: 'Missing: message' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (!memberId && !broadcast) {
            return new Response(JSON.stringify({ error: 'Need memberId or broadcast:true' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        let query = supabase.from('push_subscriptions').select('id, subscription, member_id');
        if (!broadcast && memberId) query = query.eq('member_id', memberId);

        const { data: subs, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;

        let subscriptions = subs || [];
        if (broadcast && excludeMemberId) {
            subscriptions = subscriptions.filter((s: any) => s.member_id !== excludeMemberId);
        }

        console.log(`Found ${subscriptions.length} subscription(s)`);

        if (subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'No subscriptions found' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
        if (!vapidPublicKey || !vapidPrivateKey) {
            return new Response(JSON.stringify({ error: 'VAPID keys missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const payload = JSON.stringify({
            title: title || 'Casa de Oxóssi',
            message,
            url: url || '/'
        });

        const subject = 'mailto:admin@casadeoxossi.com.br';
        let ok = 0, fail = 0;

        await Promise.all(subscriptions.map(async (sub: any) => {
            try {
                const res = await sendWebPush(sub.subscription, payload, vapidPublicKey, vapidPrivateKey, subject);
                if (res.status === 201 || res.status === 200) {
                    ok++;
                } else if (res.status === 410 || res.status === 404) {
                    console.log(`Removing stale sub ${sub.id}`);
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    fail++;
                } else {
                    const body = await res.text();
                    console.error(`Push fail ${sub.id}: ${res.status} - ${body}`);
                    fail++;
                }
            } catch (e) {
                console.error(`Push error ${sub.id}:`, e);
                fail++;
            }
        }));

        return new Response(JSON.stringify({ success: true, sent: ok, failed: fail }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
        console.error('Push Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
