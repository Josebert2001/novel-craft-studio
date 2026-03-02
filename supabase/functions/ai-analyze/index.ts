import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, systemPrompt } = await req.json();

    if (!text || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing text or systemPrompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input size validation
    const MAX_TEXT_LENGTH = 50000;
    const MAX_PROMPT_LENGTH = 50000;

    if (typeof text !== "string" || text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof systemPrompt !== "string" || systemPrompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `System prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side rate limiting using rate_limits table
    const userId = claimsData.claims.sub;
    const DAILY_LIMIT = 10;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rateLimit } = await adminClient
      .from("rate_limits")
      .select("request_count, window_start")
      .eq("user_id", userId)
      .single();

    const now = new Date();
    const windowStart = rateLimit?.window_start ? new Date(rateLimit.window_start) : null;
    const hoursSinceWindow = windowStart ? (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60) : 25;
    const currentCount = (hoursSinceWindow < 24) ? (rateLimit?.request_count ?? 0) : 0;

    // Calculate reset time (24h from window_start)
    const resetAt = windowStart && hoursSinceWindow < 24
      ? new Date(windowStart.getTime() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    if (currentCount >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: `Daily limit reached. You have used all ${DAILY_LIMIT} AI analyses today.`,
          resetAt,
          limitReached: true,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert rate limit: reset window if expired, otherwise increment
    if (!rateLimit || hoursSinceWindow >= 24) {
      await adminClient
        .from("rate_limits")
        .upsert({ user_id: userId, request_count: 1, window_start: now.toISOString() });
    } else {
      await adminClient
        .from("rate_limits")
        .update({ request_count: currentCount + 1 })
        .eq("user_id", userId);
    }

    // Sanitize user input to mitigate prompt injection
    const sanitizedText = text.replace(/---/g, "—").replace(/SYSTEM/gi, "[SYSTEM]");
    
    const fullPrompt = `${systemPrompt}\n\n---USER TEXT BELOW---\n${sanitizedText}\n---END USER TEXT---\n\nProvide analysis following the system instruction above.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorCode = response.status;
      console.error(`Gemini API returned status ${errorCode}`);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const result =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error: request failed");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
