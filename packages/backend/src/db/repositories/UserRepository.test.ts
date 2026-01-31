import crypto from "node:crypto";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestDb, TEST_TEAMS } from "../../test/setup.js";
import { UserRepository } from "./UserRepository.js";

describe("UserRepository", () => {
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository(getTestDb());
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const userData = {
        id: ulid(),
        supabaseUserId: crypto.randomUUID(),
        teamId: TEST_TEAMS.MAIN,
        roleId: 0,
        status: 0,
        name: "Test User",
        email: "test@example.com",
      };

      await repository.create(userData);

      const found = await repository.findBySupabaseId(userData.supabaseUserId);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test User");
      expect(found?.email).toBe("test@example.com");
    });
  });

  describe("findBySupabaseId", () => {
    it("should find a user by supabase ID", async () => {
      const supabaseUserId = crypto.randomUUID();

      await repository.create({
        id: ulid(),
        supabaseUserId,
        teamId: TEST_TEAMS.ALPHA,
        roleId: 2,
        status: 1,
        name: "Find Test User",
        email: "find@example.com",
      });

      const found = await repository.findBySupabaseId(supabaseUserId);

      expect(found).toBeDefined();
      expect(found?.supabaseUserId).toBe(supabaseUserId);
      expect(found?.name).toBe("Find Test User");
    });

    it("should return null for non-existent supabase ID", async () => {
      const found = await repository.findBySupabaseId(crypto.randomUUID());
      expect(found).toBeNull();
    });
  });

  describe("findAllByTeamId", () => {
    it("should return all users for a team", async () => {
      await repository.create({
        id: ulid(),
        supabaseUserId: crypto.randomUUID(),
        teamId: TEST_TEAMS.ALPHA,
        roleId: 0,
        status: 1,
        name: "User 1",
        email: "user1@example.com",
      });

      await repository.create({
        id: ulid(),
        supabaseUserId: crypto.randomUUID(),
        teamId: TEST_TEAMS.ALPHA,
        roleId: 1,
        status: 1,
        name: "User 2",
        email: "user2@example.com",
      });

      await repository.create({
        id: ulid(),
        supabaseUserId: crypto.randomUUID(),
        teamId: TEST_TEAMS.BETA,
        roleId: 2,
        status: 1,
        name: "Other User",
        email: "other@example.com",
      });

      const teamUsers = await repository.findAllByTeamId(TEST_TEAMS.ALPHA);

      expect(teamUsers.length).toBeGreaterThanOrEqual(2);
      expect(teamUsers.every((u) => u.teamId === TEST_TEAMS.ALPHA)).toBe(true);
    });
  });

  describe("updateProfile", () => {
    it("should update user profile", async () => {
      const userId = ulid();
      const supabaseUserId = crypto.randomUUID();

      await repository.create({
        id: userId,
        supabaseUserId,
        teamId: TEST_TEAMS.GAMMA,
        roleId: 2,
        status: 1,
        name: "Original Name",
        email: "original@example.com",
      });

      const updated = await repository.updateProfile(userId, {
        name: "Updated Name",
      });

      expect(updated?.name).toBe("Updated Name");
      expect(updated?.email).toBe("original@example.com");
    });
  });

  describe("updateConfig", () => {
    it("should update user config", async () => {
      const userId = ulid();
      const supabaseUserId = crypto.randomUUID();

      await repository.create({
        id: userId,
        supabaseUserId,
        teamId: TEST_TEAMS.MAIN,
        roleId: 2,
        status: 1,
        name: "Config Test User",
        email: "config@example.com",
      });

      const newConfig = {
        events: {
          viewMode: "list" as const,
          filterTagIds: ["tag1", "tag2"],
        },
        players: {
          viewMode: "list" as const,
          itemsPerPage: 100 as const,
        },
        notifications: {
          emailTimeRange: {
            fromHour: 8,
            toHour: 18,
          },
        },
      };

      await repository.updateConfig(userId, newConfig);

      const found = await repository.findByIdWithTags(userId);
      expect(found?.config).toEqual(newConfig);
    });

    it("should partially update user config", async () => {
      const userId = ulid();
      const supabaseUserId = crypto.randomUUID();

      await repository.create({
        id: userId,
        supabaseUserId,
        teamId: TEST_TEAMS.MAIN,
        roleId: 2,
        status: 1,
        name: "Partial Config User",
        email: "partial@example.com",
        config: {
          events: {
            viewMode: "calendar",
            filterTagIds: [],
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
        },
      });

      const partialConfig = {
        players: {
          itemsPerPage: 100 as const,
        },
      };

      await repository.updateConfig(userId, partialConfig);

      const found = await repository.findByIdWithTags(userId);
      expect(found?.config).toMatchObject({
        events: {
          viewMode: "calendar",
          filterTagIds: [],
        },
        players: {
          viewMode: "card",
          itemsPerPage: 100,
        },
        notifications: {
          emailTimeRange: {
            fromHour: 7,
            toHour: 20,
          },
        },
      });
    });
  });
});
