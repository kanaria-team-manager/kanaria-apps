import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
  const { session } = await parent();

  if (!session) {
    redirect(303, '/auth/login');
  }

  // Session is already guaranteed by parent + check above.
  // We can return ensuring strict type compliance if needed, or nothing if parent data suffices.
  // But Dashboard +layout.svelte expects data.user which parent provides.
  return {};
};
