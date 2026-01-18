export interface UserWithTags {
  id: string;
  name: string;
  email: string;
  roleId: number;
  teamId: string;
  status: number;
  supabaseUserId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ id: string; name: string }>;
}

export interface PlayerWithTags {
  id: string;
  parentUserId: string;
  lastName: string;
  firstName: string;
  nickName: string | null;
  imageUrl: string | null;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ id: string; name: string }>;
}

export interface UserWithPlayersAndTags extends UserWithTags {
  players: PlayerWithTags[];
}

/**
 * Combine users and players into a single structure
 * @param users Users with their tags
 * @param players Players with their tags
 * @returns Users with nested players
 */
export function combineUsersAndPlayers(
  users: UserWithTags[],
  players: PlayerWithTags[],
): UserWithPlayersAndTags[] {
  // Create a map of users for quick lookup
  const usersMap = new Map<string, UserWithPlayersAndTags>();
  for (const user of users) {
    usersMap.set(user.id, {
      ...user,
      players: [],
    });
  }

  // Attach players to their parent users
  for (const player of players) {
    const user = usersMap.get(player.parentUserId);
    if (user) {
      user.players.push(player);
    }
  }

  return Array.from(usersMap.values());
}
