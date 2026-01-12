import { ulid } from "ulid";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestDb } from "../../test/setup.js";
import { TeamRepository } from "./TeamRepository.js";

describe("TeamRepository", () => {
  let repository: TeamRepository;

  beforeEach(() => {
    repository = new TeamRepository(getTestDb());
  });

  describe("create", () => {
    it("should create a new team", async () => {
      const teamData = {
        id: ulid(),
        name: "Test Team",
        code: `test-${Date.now()}`,
        status: 0,
        eventSequence: 0,
      };

      await repository.create(teamData);

      const found = await repository.findByCode(teamData.code);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test Team");
      expect(found?.code).toBe(teamData.code);
    });
  });

  describe("findByCode", () => {
    it("should find a team by code", async () => {
      const code = `find-test-${Date.now()}`;
      await repository.create({
        id: ulid(),
        name: "Find Test Team",
        code,
        status: 0,
        eventSequence: 0,
      });

      const found = await repository.findByCode(code);

      expect(found).toBeDefined();
      expect(found?.code).toBe(code);
      expect(found?.name).toBe("Find Test Team");
    });

    it("should return null for non-existent code", async () => {
      const found = await repository.findByCode("non-existent-code-12345");
      expect(found).toBeNull();
    });
  });

  describe("updateStatus", () => {
    it("should update team status", async () => {
      const code = `status-test-${Date.now()}`;
      const teamId = ulid();

      await repository.create({
        id: teamId,
        name: "Status Test Team",
        code,
        status: 0,
        eventSequence: 0,
      });

      await repository.updateStatus(teamId, 1);

      const updated = await repository.findByCode(code);
      expect(updated?.status).toBe(1);
    });
  });
});
