import { beforeEach, describe, expect, it } from "vitest";
import { getTestDb, TEST_TEAMS } from "../../test/setup.js";
import { TagRepository } from "./TagRepository.js";

describe("TagRepository", () => {
  let repository: TagRepository;

  beforeEach(() => {
    repository = new TagRepository(getTestDb());
  });

  describe("create", () => {
    it("should create a new tag", async () => {
      const tagData = {
        teamId: TEST_TEAMS.MAIN,
        name: "Test Tag",
        color: "#FF5733",
      };

      await repository.create(tagData);

      const tags = await repository.findByTeamIdWithSystem(TEST_TEAMS.MAIN);
      const createdTag = tags.find((t) => t.name === "Test Tag");

      expect(createdTag).toBeDefined();
      expect(createdTag?.name).toBe("Test Tag");
      expect(createdTag?.color).toBe("#FF5733");
    });
  });

  describe("findByTeamIdWithSystem", () => {
    it("should return tags for a specific team", async () => {
      await repository.create({
        teamId: TEST_TEAMS.ALPHA,
        name: "Team Alpha Tag",
        color: "#123456",
      });

      const tags = await repository.findByTeamIdWithSystem(TEST_TEAMS.ALPHA);
      const teamTags = tags.filter((t) => t.teamId === TEST_TEAMS.ALPHA);

      expect(teamTags.length).toBeGreaterThanOrEqual(1);
      const createdTag = teamTags.find((t) => t.name === "Team Alpha Tag");
      expect(createdTag).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a tag", async () => {
      await repository.create({
        teamId: TEST_TEAMS.UPDATE,
        name: "Original Tag",
        color: "#000000",
      });

      const tags = await repository.findByTeamIdWithSystem(TEST_TEAMS.UPDATE);
      const tag = tags.find((t) => t.name === "Original Tag");

      if (!tag) throw new Error("Tag not found");

      const updated = await repository.update(tag.id, TEST_TEAMS.UPDATE, {
        name: "Updated Tag",
        color: "#FFFFFF",
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("Updated Tag");
      expect(updated?.color).toBe("#FFFFFF");
    });

    it("should not update tag from different team", async () => {
      await repository.create({
        teamId: TEST_TEAMS.ORIGINAL,
        name: "Test Tag",
        color: "#111111",
      });

      const tags = await repository.findByTeamIdWithSystem(TEST_TEAMS.ORIGINAL);
      const tag = tags.find((t) => t.name === "Test Tag");

      if (!tag) throw new Error("Tag not found");

      const updated = await repository.update(tag.id, TEST_TEAMS.DIFFERENT, {
        name: "Should Not Update",
      });

      expect(updated).toBeUndefined();
    });
  });

  describe("findGradeTags", () => {
    it("should return tags with '学年' label", async () => {
      const gradeTags = await repository.findGradeTags();

      // Should contain system grade tags (1年生, 2年生, etc.)
      expect(gradeTags.length).toBeGreaterThan(0);

      // All tags should have the '学年' label
      for (const tag of gradeTags) {
        expect(tag.id).toBeDefined();
        expect(tag.name).toBeDefined();
        expect(tag.color).toBeDefined();
      }

      // Verify tags are ordered by name
      const names = gradeTags.map((t) => t.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe("delete", () => {
    it("should delete a tag", async () => {
      await repository.create({
        teamId: TEST_TEAMS.DELETE,
        name: "To Delete",
        color: "#ABCDEF",
      });

      const tags = await repository.findByTeamIdWithSystem(TEST_TEAMS.DELETE);
      const tag = tags.find((t) => t.name === "To Delete");

      if (!tag) throw new Error("Tag not found");

      await repository.delete(tag.id, TEST_TEAMS.DELETE);

      const tagsAfter = await repository.findByTeamIdWithSystem(
        TEST_TEAMS.DELETE,
      );
      const deletedTag = tagsAfter.find((t) => t.id === tag.id);

      expect(deletedTag).toBeUndefined();
    });

    it("should not delete tag from different team", async () => {
      await repository.create({
        teamId: TEST_TEAMS.PROTECTED,
        name: "Protected Tag",
        color: "#FEDCBA",
      });

      const tags = await repository.findByTeamIdWithSystem(
        TEST_TEAMS.PROTECTED,
      );
      const tag = tags.find((t) => t.name === "Protected Tag");

      if (!tag) throw new Error("Tag not found");

      await repository.delete(tag.id, TEST_TEAMS.WRONG);

      const tagsAfter = await repository.findByTeamIdWithSystem(
        TEST_TEAMS.PROTECTED,
      );
      const protectedTag = tagsAfter.find((t) => t.id === tag.id);

      expect(protectedTag).toBeDefined();
    });
  });
});
