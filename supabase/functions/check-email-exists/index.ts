import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type EmailCheckRequest = {
  email?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Supabase credentials are not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let payload: EmailCheckRequest;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = payload.email?.trim();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  // Step 1 — Check if email exists in auth.users at all.
  // We use listUsers() with service role so RLS does not block us.
  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers();

  if (usersError) {
    return new Response(JSON.stringify({ error: usersError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Case-insensitive match so Pedro@ and pedro@ are treated the same.
  const authUser = usersData.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  // Email not in auth.users at all — safe to proceed with signup.
  if (!authUser) {
    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Step 2 — Email exists in auth.users.
  // Now check if they have a completed profile row.
  // A profile row means they finished the full signup flow.
  // No profile row means they are a ghost account
  // (entered email, never completed OTP + password steps).
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (profile) {
    // Has a profile = real completed account.
    // Block this email from being used again.
    return new Response(JSON.stringify({ exists: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // No profile = ghost account (abandoned signup).
  // Delete the ghost so the email is freed up for a fresh attempt.
  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    authUser.id
  );

  if (deleteError) {
    // If delete fails, block signup anyway to be safe.
    // Better to show an error than to create a duplicate.
    return new Response(
      JSON.stringify({
        error: "Unable to process request. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Ghost deleted successfully — email is now free.
  // Return exists: false so signup can proceed normally.
  return new Response(JSON.stringify({ exists: false }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
