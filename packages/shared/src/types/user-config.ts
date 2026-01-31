export interface UserConfig {
  events?: {
    viewMode?: "calendar" | "list";
    filterGrades?: string[]; // 学年名の配列 ["小1", "小2", ...]
    filterLabelIds?: string[]; // ラベルIDの配列
  };
  players?: {
    viewMode?: "card" | "list";
    itemsPerPage?: 10 | 50 | 100;
  };
  notifications?: {
    emailTimeRange?: {
      fromHour?: number; // 0-23
      toHour?: number; // 0-23
    };
  };
}

export const DEFAULT_USER_CONFIG: UserConfig = {
  events: {
    viewMode: "calendar",
    filterGrades: [],
    filterLabelIds: [],
  },
  players: {
    viewMode: "card",
    itemsPerPage: 50,
  },
  notifications: {
    emailTimeRange: {
      fromHour: 7,
      toHour: 20,
    },
  },
};
