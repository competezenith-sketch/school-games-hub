import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas admins podem aprovar gestores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { registration_id, action, rejection_reason } = await req.json();

    if (!registration_id || !action) {
      return new Response(JSON.stringify({ error: "registration_id e action são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get registration
    const { data: reg, error: regError } = await supabaseAdmin
      .from("gestor_registrations")
      .select("*")
      .eq("id", registration_id)
      .single();

    if (regError || !reg) {
      return new Response(JSON.stringify({ error: "Registro não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reg.status !== "pendente") {
      return new Response(JSON.stringify({ error: "Este registro já foi processado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      await supabaseAdmin
        .from("gestor_registrations")
        .update({
          status: "rejeitado",
          rejection_reason: rejection_reason || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", registration_id);

      return new Response(JSON.stringify({ success: true, message: "Registro rejeitado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve") {
      // Generate a random password
      const tempPassword = crypto.randomUUID().slice(0, 12);

      // Create user account
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: reg.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: reg.full_name },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newUserId = newUser.user.id;

      // Create profile linked to delegation
      await supabaseAdmin.from("profiles").insert({
        user_id: newUserId,
        org_id: reg.org_id,
        delegation_id: reg.delegation_id,
        full_name: reg.full_name,
      });

      // Assign gestor_escola role
      await supabaseAdmin.from("user_roles").insert({
        user_id: newUserId,
        role: "gestor_escola",
      });

      // Update registration status
      await supabaseAdmin
        .from("gestor_registrations")
        .update({
          status: "aprovado",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", registration_id);

      // Send password reset email so gestor can set their own password
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: reg.email,
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Gestor aprovado! Email de acesso enviado.",
        temp_password: tempPassword,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida. Use 'approve' ou 'reject'" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
