import { fetchLabels, fetchTags } from "$lib/api/master";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
  const [tags, labels] = await Promise.all([
    fetchTags(fetch),
    fetchLabels(fetch),
  ]);

  return {
    tags,
    labels,
  };
};
