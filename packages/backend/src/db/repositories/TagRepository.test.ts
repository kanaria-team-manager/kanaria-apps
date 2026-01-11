import { beforeEach, describe, expect, it } from "vitest";
import { TEST_TEAMS, useTestDb } from "../test-helper.js";
import { TagRepository } from "./TagRepository.js";

describe("TagRepository", () => {
  const getDb = useTestDb();
  let repository: TagRepository;

  beforeEach(() => {
    repository = new TagRepository(getDb());
  });

  describe("create", () => {
    it("should create a new tag", async () => {
      const tagData = {
        teamId: TEST_TEAMS.MAIN,
        name: "Test Tag",
        color: "#FF0000",
      };

      const tag = await repository.create(tagData);

      expect(tag).toBeDefined();
      expect(tag.id).toBeDefined();
      expect(tag.name).toBe(tagData.name);
      expect(tag.color).toBe(tagData.color);
      expect(tag.systemFlag).toBe(false);
    });
  });

  describe("findByTeamIdWithSystem", () => {
    it("should return tags for a specific team", async () => {
      await repository.create({
        teamId: TEST_TEAMS.ALPHA,
        name: "Alpha Tag 1",
        color: "#FF0000",
      });

      await repository.create({
        teamId: TEST_TEAMS.ALPHA,
        name: "Alpha Tag 2",
        color: "#00FF00",
      });

      await repository.create({
        teamId: TEST_TEAMS.BETA,
        name: "Beta Tag",
        color: "#0000FF",
      });

      const alphaTags = await repository.findByTeamIdWithSystem(
        TEST_TEAMS.ALPHA,
      );

      const teamAlphaOnly = alphaTags.filter(
        (t) => t.teamId === TEST_TEAMS.ALPHA,
      );
      expect(teamAlphaOnly.length).toBe(2);
    });
  });

  describe("update", () => {
    it("should update a tag", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.UPDATE,
        name: "Original Tag",
        color: "#000000",
      });

      await repository.update(created.id, TEST_TEAMS.UPDATE, {
        name: "Updated Tag",
        color: "#FFFFFF",
      });

      const tags = await repository.findByTeamIdWithSystem(TEST_TEAMS.UPDATE);
      const updated = tags.find((t) => t.id === created.id);

      expect(updated?.name).toBe("Updated Tag");
      expect(updated?.color).toBe("#FFFFFF");
    });

    it("should not update tag from different team", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.ORIGINAL,
        name: "Test Tag",
        color: "#123456",
      });

      await repository.update(created.id, TEST_TEAMS.DIFFERENT, {
        name: "Should Not Update",
      });

      const tags = await repository.findByTeamIdWithSystem(TEST_TEAMS.ORIGINAL);
      const original = tags.find((t) => t.id === created.id);
      expect(original?.name).toBe("Test Tag");
    });
  });

  describe("delete", () => {
    it("should delete a tag", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.DELETE,
        name: "To Delete",
        color: "#ABCDEF",
      });

      await repository.delete(created.id, TEST_TEAMS.DELETE);

      const tags = await repository.findByTeamIdWithSystem(TEST_TEAMS.DELETE);
      const deleted = tags.find((t) => t.id === created.id);
      expect(deleted).toBeUndefined();
    });

    it("should not delete tag from different team", async () => {
      const created = await repository.create({
        teamId: TEST_TEAMS.PROTECTED,
        name: "Protected Tag",
        color: "#FEDCBA",
      });

      await repository.delete(created.id, TEST_TEAMS.WRONG);

      const tags = await repository.findByTeamIdWithSystem(
        TEST_TEAMS.PROTECTED,
      );
      const stillExists = tags.find((t) => t.id === created.id);
      expect(stillExists).toBeDefined();
      expect(stillExists?.name).toBe("Protected Tag");
    });
  });
});
