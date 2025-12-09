import { describe, expect, it, vi } from "vitest";
import { TagRepository } from "./TagRepository";

// Mock the DB
const mockDb = {
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockResolvedValue([
      {
        id: "1",
        name: "Tag 1",
        labelId: "l1",
        systemFlag: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Tag 2",
        labelId: "l2",
        systemFlag: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
  }),
};

describe("TagRepository", () => {
  it("should return all tags", async () => {
    // @ts-expect-error Mocking db
    const repo = new TagRepository(mockDb);
    const tags = await repo.findAll();
    expect(tags).toHaveLength(2);
    expect(tags[0].name).toBe("Tag 1");
  });
});
