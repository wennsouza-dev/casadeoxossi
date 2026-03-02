import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// --- Helper functions for Web Push with native Web Crypto API ---

function base64UrlEncode(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function createVapidJwt(audience: string, subject: string, vapidPrivateKeyBase64: string, vapidPublicKeyBase64: string): Promise<string> {
    const header = { alg: 'ES256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        aud: audience,
        exp: now + 12 * 3600, // 12 hours
        sub: subject,
    };

    const encoder = new TextEncoder();
    const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import the private key
    const privateKeyBytes = base64UrlDecode(vapidPrivateKeyBase64);
    const publicKeyBytes = base64UrlDecode(vapidPublicKeyBase64);

    // Build JWK for the ECDSA P-256 private key
    const jwk = {
        kty: 'EC',
        crv: 'P-256',
        d: base64UrlEncode(privateKeyBytes),
        x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
        y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
    };

    const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        encoder.encode(unsignedToken)
    );

    // Convert DER signature to raw r||s format (already raw from Web Crypto)
    const signatureB64 = base64UrlEncode(new Uint8Array(signature));

    return `${unsignedToken}.${signatureB64}`;
}

async function sendWebPush(
    subscription: any,
    payload: string,
    vapidPublicKey: string,
    vapidPrivateKey: string,
    subject: string
): Promise<Response> {
    const endpoint = subscription.endpoint;
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.hostname}`;

    const jwt = await createVapidJwt(audience, subject, vapidPrivateKey, vapidPublicKey);
    const vapidPublicKeyBytes = base64UrlDecode(vapidPublicKey);

    const headers: Record<string, string> = {
        'Authorization': `vapid t=${jwt}, k=${base64UrlEncode(vapidPublicKeyBytes)}`,
        'Content-Type': 'application/json',
        'TTL': '86400',
    };

    // Send unencrypted payload using aes128gcm content encoding
    // For simplicity, we send as a simple POST with the payload
    // The browser service worker will receive this
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: payload,
    });

    return response;
}

// --- Main handler ---
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

        // Parse Request Body
        const bodyContent = await req.json();
        const { memberId, title, message, url, broadcast, excludeMemberId } = bodyContent;

        if (!message) {
            return new Response(JSON.stringify({ error: 'Missing required field: message' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (!memberId && !broadcast) {
            return new Response(JSON.stringify({ error: 'Must provide memberId or set broadcast: true' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Fetch subscriptions from database
        let query = supabase.from('push_subscriptions').select('id, subscription, member_id');

        if (!broadcast && memberId) {
            query = query.eq('member_id', memberId);
        }

        const { data: subscriptionsData, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        let subscriptions = subscriptionsData || [];

        if (broadcast && excludeMemberId) {
            subscriptions = subscriptions.filter((sub: any) => sub.member_id !== excludeMemberId);
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'No subscriptions found' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // VAPID keys from secrets
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

        if (!vapidPublicKey || !vapidPrivateKey) {
            return new Response(JSON.stringify({ error: 'VAPID keys missing in environment' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const payload = JSON.stringify({
            title: title || 'Casa de Oxóssi',
            message: message,
            url: url || '/'
        });

        const subject = 'mailto:admin@casadeoxossi.com.br';
        let successCount = 0;
        let failCount = 0;

        const promises = subscriptions.map(async (sub: any) => {
            try {
                const response = await sendWebPush(sub.subscription, payload, vapidPublicKey, vapidPrivateKey, subject);

                if (response.status === 201 || response.status === 200) {
                    successCount++;
                } else if (response.status === 410 || response.status === 404) {
                    // Subscription is gone, remove it from database
                    console.log(`Removing stale subscription ${sub.id}`);
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    failCount++;
                } else {
                    const body = await response.text();
                    console.error(`Push failed for ${sub.id}: ${response.status} - ${body}`);
                    failCount++;
                }
            } catch (error) {
                console.error(`Error sending push to ${sub.id}:`, error);
                failCount++;
            }
        });

        await Promise.all(promises);

        return new Response(
            JSON.stringify({ success: true, sent: successCount, failed: failCount }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Push Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
