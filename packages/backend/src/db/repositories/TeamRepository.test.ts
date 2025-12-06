import { beforeEach, describe, expect, it, vi } from "vitest";
import { teams } from "../schema.js";
import { TeamRepository } from "./TeamRepository";

describe("TeamRepository", () => {
  let repository: TeamRepository;
  // biome-ignore lint/suspicious/noExplicitAny: Mock DB
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };
    repository = new TeamRepository(mockDb);
  });

  describe("findByCode", () => {
    it("should return team if found", async () => {
      const mockTeam = {
        id: "team_1",
        name: "Test Team",
        code: "test-code",
        status: 1,
      };

      mockDb.limit.mockResolvedValue([mockTeam]);

      const result = await repository.findByCode("test-code");
      expect(result).toEqual(mockTeam);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(teams);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it("should return null if not found", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByCode("unknown");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a team", async () => {
      const mockTeam = {
        id: "team_1",
        name: "Test Team",
        code: "test-code",
      };

      // Mock transaction or insert
      // Since we might pass a transaction object to the repository method, or the repository handles it.
      // For simplicity, let's assume repository methods can accept a transaction object (Unit of Work pattern)
      // OR the repository is instantiated with a transaction.

      // Let's assume we pass the db/tx to the method if needed, or the repo is just a wrapper.
      // In `create.ts`, we use `db.transaction(async (tx) => { ... })`.
      // So we might want `teamRepo.create(teamData, tx)`.

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
      };

      // biome-ignore lint/suspicious/noExplicitAny: Mock Tx
      await repository.create(mockTeam, mockTx as any);

      expect(mockTx.insert).toHaveBeenCalledWith(teams);
      expect(mockTx.values).toHaveBeenCalledWith(mockTeam);
    });
  });

  describe("updateStatus", () => {
    it("should update team status", async () => {
      const mockTx = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };

      // biome-ignore lint/suspicious/noExplicitAny: Mock Tx
      await repository.updateStatus("team_1", 1, mockTx as any);

      expect(mockTx.update).toHaveBeenCalledWith(teams);
      expect(mockTx.set).toHaveBeenCalledWith({ status: 1 });
    });
  });
});
