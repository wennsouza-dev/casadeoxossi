import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "https://esm.sh/web-push@3.6.7";

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
    // Check CORS
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

        // Create Supabase client utilizing the request's auth token
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
        let query = supabase.from('push_subscriptions').select('subscription, member_id');

        if (!broadcast && memberId) {
            query = query.eq('member_id', memberId);
        }

        const { data: subscriptionsData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        let subscriptions = subscriptionsData || [];

        // Filter out the sender if broadcast and excludeMemberId is provided
        if (broadcast && excludeMemberId) {
            subscriptions = subscriptions.filter((sub: any) => sub.member_id !== excludeMemberId);
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'No subscriptions found for this member' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Setup web-push
        // SUPABASE VAPID KEYS SHOULD BE SET IN SECRETS
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

        if (!vapidPublicKey || !vapidPrivateKey) {
            return new Response(JSON.stringify({ error: 'VAPID keys missing in environment' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        webpush.setVapidDetails(
            'mailto:admin@casadeoxossi.com.br', // Example contact
            vapidPublicKey,
            vapidPrivateKey
        );

        const payload = JSON.stringify({
            title: title || 'Casa de Oxóssi',
            message: message,
            url: url || '/'
        });

        const promises = subscriptions.map((sub: any) => {
            return webpush.sendNotification(sub.subscription, payload).catch((error: any) => {
                console.error('Error sending push: ', error);

                // If the subscription is gone (410 Gone or 404 Not Found), delete it
                if (error.statusCode === 410 || error.statusCode === 404) {
                    return supabase.from('push_subscriptions').delete().eq('subscription', sub.subscription);
                }
            });
        });

        await Promise.all(promises);

        return new Response(JSON.stringify({ success: true, count: subscriptions.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
        console.error('Push Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
