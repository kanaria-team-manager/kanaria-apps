import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  try {
    const res = await fetch("/players");
    if (res.ok) {
      const players = await res.json();
      return {
        players,
      };
    }
  } catch (err) {
    console.error("Failed to load players", err);
  }

  return {
    players: [],
  };
};
