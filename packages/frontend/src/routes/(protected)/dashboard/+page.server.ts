import { fetchLabels, fetchTags } from "$lib/api/master";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token || "";

  const [tags, labels] = await Promise.all([
    fetchTags(fetch),
    fetchLabels(fetch, accessToken, "event"),
  ]);

  return {
    tags,
    labels,
  };
};
