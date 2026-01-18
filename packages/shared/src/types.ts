export interface Tag {
  id: string;
  name: string;
  teamId: string | null;
  color: string;
  systemFlag: boolean;
  labelId?: string | null;
  label?: Label | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Label {
  id: string;
  name: string;
  teamId: string | null;
  color: string;
  type: string;
  systemFlag: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AttendanceStatus {
  id: string;
  name: string;
  color: string;
  systemFlag: boolean;
  teamId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Simplified Tag (for API responses without full details)
export interface TagSimple {
  id: string;
  name: string;
}

// User types
export interface UserWithTags {
  id: string;
  name: string;
  email: string;
  roleId: number;
  teamId: string;
  tags: TagSimple[];
  players?: PlayerSimple[];
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roleId: number;
  teamId: string;
}

// Player types
export interface PlayerSimple {
  id: string;
  lastName: string;
  firstName: string;
  nickName?: string | null;
  tags: TagSimple[];
}

export interface UserWithPlayersAndTags extends UserWithTags {
  players: PlayerSimple[];
}
