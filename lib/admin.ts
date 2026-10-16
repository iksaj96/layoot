import { createServerSupabase } from "@/lib/supabase-server";
import { ADMIN_EMAIL } from "@/lib/admin-constants";

export { ADMIN_EMAIL } from "@/lib/admin-constants";

export async function getAdminContext() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  return {
    supabase,
    user,
    isAdmin: user?.email?.toLowerCase() === ADMIN_EMAIL,
  };
}
