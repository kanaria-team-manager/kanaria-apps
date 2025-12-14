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
export const SYSTEM_FLAG = {
  SYSTEM: true,
  CUSTOM: false,
};
export const ATTENDANCE_STATUS = {
  NOT_ANSWERED: 0,
  ATTENDANCE: 1,
  ABSENCE: 2,
  IS_LATE: 3,
}

export const ulid = customType<{ data: string }>({
  dataType: () => "varchar(26)",
});
