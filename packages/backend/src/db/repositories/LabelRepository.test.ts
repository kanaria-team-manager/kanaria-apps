import { describe, expect, it, vi } from "vitest";
import { LabelRepository } from "./LabelRepository";

// Mock the DB
const mockDb = {
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockResolvedValue([
      {
        id: "1",
        name: "Label 1",
        systemFlag: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Label 2",
        systemFlag: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
  }),
};

describe("LabelRepository", () => {
  it("should return all labels", async () => {
    // @ts-expect-error Mocking db
    const repo = new LabelRepository(mockDb);
    const labels = await repo.findAll();
    expect(labels).toHaveLength(2);
    expect(labels[0].name).toBe("Label 1");
  });
});
