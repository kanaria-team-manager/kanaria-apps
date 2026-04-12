import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { session, user } = await parent();

  if (!session) {
    throw redirect(303, "/auth/login");
  }

  const roleId = user?.app_metadata?.roleId;

  // roleId 0=owner, 1=admin. Redirect others.
  if (roleId !== 0 && roleId !== 1) {
    throw redirect(303, "/dashboard");
  }

  return { session };
};
