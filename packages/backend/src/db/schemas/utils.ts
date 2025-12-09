import { customType } from "drizzle-orm/pg-core";

export const TEAM_CODE_MAX_LENGTH = 32;
export const TEAM_STATUS = {
  CREATED: 0,
  ACTIVE: 1,
};
export const USER_STATUS = {
  TEMPORARY: 0,
  CONFIRMED: 1,
};
export const LABEL_SYSTEM_FLAG = {
  SYSTEM: 0,
  CUSTOM: 1,
};

export const ulid = customType<{ data: string }>({
  dataType: () => "varchar(26)",
});
