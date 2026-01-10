import { beforeEach, describe, expect, it } from "vitest";
import { UserRepository } from "./UserRepository.js";
import { useTestDb, TEST_TEAMS } from "../test-helper.js";
import crypto from "crypto";
import { ulid } from "ulid";

describe("UserRepository", () => {
  const getDb = useTestDb();
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository(getDb());
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const userData = {
        id: ulid(), // User ID should be ULID (26 chars), not UUID (36 chars)
        supabaseUserId: crypto.randomUUID(), // Supabase ID is UUID
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

      // Use >= instead of === because data may accumulate from other tests
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
});
