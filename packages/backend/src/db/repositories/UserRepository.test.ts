import { beforeEach, describe, expect, it, vi } from "vitest";
import { users } from "../schema.js";
import { UserRepository } from "./UserRepository.js";

describe("UserRepository", () => {
  let repository: UserRepository;
  // biome-ignore lint/suspicious/noExplicitAny: Mock DB
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };
    repository = new UserRepository(mockDb);
  });

  describe("create", () => {
    it("should create a user", async () => {
      const mockUser = {
        id: "user_1",
        supabaseUserId: "supa_1",
        teamId: "team_1",
        roleId: 0,
        status: 0,
        name: "Test User",
        email: "test@example.com",
      };

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
      };

      // biome-ignore lint/suspicious/noExplicitAny: Mock Tx
      await repository.create(mockUser, mockTx as any);

      expect(mockTx.insert).toHaveBeenCalledWith(users);
      expect(mockTx.values).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("findBySupabaseId", () => {
    it("should return user if found", async () => {
      const mockUser = { id: "user_1", supabaseUserId: "supa_1" };
      mockDb.limit.mockResolvedValue([mockUser]);

      const result = await repository.findBySupabaseId("supa_1");
      expect(result).toEqual(mockUser);
    });

    it("should return null if not found", async () => {
      mockDb.limit.mockResolvedValue([]);
      const result = await repository.findBySupabaseId("unknown");
      expect(result).toBeNull();
    });
  });

  describe("updateStatus", () => {
    it("should update user status", async () => {
      const mockTx = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };

      // biome-ignore lint/suspicious/noExplicitAny: Mock Tx
      await repository.updateStatus("user_1", 1, mockTx as any);

      expect(mockTx.update).toHaveBeenCalledWith(users);
      expect(mockTx.set).toHaveBeenCalledWith({ status: 1 });
    });
  });
});
