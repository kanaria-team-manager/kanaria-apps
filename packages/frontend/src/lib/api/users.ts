import { apiGet } from "./client";

export interface TeamUser {
  id: string;
  supabaseUserId: string;
  name: string;
  email: string;
  roleId: number;
}

export async function fetchUsers(accessToken: string): Promise<TeamUser[]> {
  return apiGet<TeamUser[]>("/users", accessToken);
}
