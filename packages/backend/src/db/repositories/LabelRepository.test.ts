import { beforeEach, describe, expect, it } from "vitest";
import { getTestDb, TEST_TEAMS } from "../../test/setup.js";
import { SYSTEM_FLAG } from "../schemas/utils.js";
import { LabelRepository } from "./LabelRepository.js";

describe("LabelRepository", () => {
  let repository: LabelRepository;

  beforeEach(() => {
    repository = new LabelRepository(getTestDb());
  });

  describe("create", () => {
    it("should create a new label with CUSTOM flag", async () => {
      const labelData = {
        teamId: TEST_TEAMS.MAIN,
        name: "Test Label",
        color: "#FF0000",
        type: "event",
      };

      const label = await repository.create(labelData);

      expect(label).toBeDefined();
      expect(label.id).toBeDefined();
      expect(label.name).toBe(labelData.name);
      expect(label.color).toBe(labelData.color);
      expect(label.teamId).toBe(TEST_TEAMS.MAIN);
      expect(label.systemFlag).toBe(SYSTEM_FLAG.CUSTOM);
    });
  });

  describe("findById", () => {
    it("should find a label by id", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.BETA,
        name: "Find Test",
        color: "#0000FF",
      });

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe("Find Test");
      expect(found?.color).toBe("#0000FF");
    });

    it("should return undefined for non-existent id", async () => {
      const found = await repository.findById("non-existent-id-12345");
      expect(found).toBeUndefined();
    });
  });

  describe("findByTeamAndType", () => {
    it("should return labels for a specific team", async () => {
      await repository.create({
        teamId: TEST_TEAMS.ALPHA,
        name: "Team Alpha Label 1",
        color: "#FF0000",
      });

      await repository.create({
        teamId: TEST_TEAMS.ALPHA,
        name: "Team Alpha Label 2",
        color: "#00FF00",
      });

      await repository.create({
        teamId: TEST_TEAMS.BETA,
        name: "Team Beta Label",
        color: "#0000FF",
      });

      const alphaLabels = await repository.findByTeamAndType(TEST_TEAMS.ALPHA);

      const teamAlphaOnly = alphaLabels.filter(
        (l) => l.teamId === TEST_TEAMS.ALPHA,
      );
      // Use >= instead of === because data may accumulate from other tests
      expect(teamAlphaOnly.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by type when provided", async () => {
      await repository.create({
        teamId: TEST_TEAMS.GAMMA,
        name: "Event Label",
        color: "#FF0000",
        type: "event",
      });

      await repository.create({
        teamId: TEST_TEAMS.GAMMA,
        name: "Player Label",
        color: "#00FF00",
        type: "player",
      });

      const eventLabels = await repository.findByTeamAndType(
        TEST_TEAMS.GAMMA,
        "event",
      );
      const teamEventLabels = eventLabels.filter(
        (l) => l.type === "event" && l.teamId === TEST_TEAMS.GAMMA,
      );

      expect(teamEventLabels.length).toBe(1);
      expect(teamEventLabels[0].name).toBe("Event Label");
    });
  });

  describe("update", () => {
    it("should update a label", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.UPDATE,
        name: "Original Name",
        color: "#000000",
      });

      const updated = await repository.update(created.id, TEST_TEAMS.UPDATE, {
        name: "Updated Name",
        color: "#FFFFFF",
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.color).toBe("#FFFFFF");
    });

    it("should not update label from different team", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.ORIGINAL,
        name: "Test",
        color: "#123456",
      });

      const updated = await repository.update(
        created.id,
        TEST_TEAMS.DIFFERENT,
        {
          name: "Should Not Update",
        },
      );

      expect(updated).toBeUndefined();

      // Verify original still exists unchanged
      const original = await repository.findById(created.id);
      expect(original?.name).toBe("Test");
    });
  });

  describe("delete", () => {
    it("should delete a label", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.DELETE,
        name: "To Delete",
        color: "#ABCDEF",
      });

      await repository.delete(created.id, TEST_TEAMS.DELETE);

      const found = await repository.findById(created.id);
      expect(found).toBeUndefined();
    });

    it("should not delete label from different team", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.PROTECTED,
        name: "Protected",
        color: "#FEDCBA",
      });

      await repository.delete(created.id, TEST_TEAMS.WRONG);

      const found = await repository.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Protected");
    });
  });
});
