import { createClient, type User } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Supabase server configuration is missing.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function bearerToken(request: Request) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

export async function getUserFromToken(accessToken: string | null) {
  const admin = createSupabaseAdmin();
  if (!accessToken) return { admin, user: null };
  const { data, error } = await admin.auth.getUser(accessToken);
  return { admin, user: error ? null : data.user };
}

export async function isAdminUser(
  admin: ReturnType<typeof createSupabaseAdmin>,
  user: User
) {
  const { data: byId } = await admin
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (byId) return true;
  if (!user.email) return false;

  const { data: byEmail } = await admin
    .from("admin_users")
    .select("id")
    .ilike("email", user.email.trim())
    .maybeSingle();

  return Boolean(byEmail);
}
