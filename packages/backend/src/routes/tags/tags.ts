import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { TagRepository } from "../../db/repositories/TagRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const tagsRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// 全タグ取得（チーム単位 + ラベル情報付き）
tagsRoute.get("/", authMiddleware, async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const teamId = user.app_metadata?.teamId;

  if (!teamId) {
    return c.json({ error: "Team not found" }, 400);
  }

  const repository = new TagRepository(db);
  const tags = await repository.findByTeamIdWithSystemAndLabels(teamId);
  return c.json(tags);
});

// 学年タグ取得
tagsRoute.get("/grade", authMiddleware, async (c) => {
  const db = c.get("db");
  const repository = new TagRepository(db);
  const tags = await repository.findGradeTags();
  return c.json(tags);
});

// タグ作成
tagsRoute.post(
  "/",
  authMiddleware,
  zValidator("json", createTagSchema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const teamId = user.app_metadata?.teamId;

    if (!teamId) {
      return c.json({ error: "Team not found" }, 400);
    }

    const { name, color } = c.req.valid("json");
    const repository = new TagRepository(db);
    const tag = await repository.create({ teamId, name, color });
    return c.json(tag, 201);
  },
);

// タグ更新
tagsRoute.put(
  "/:id",
  authMiddleware,
  zValidator("json", updateTagSchema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const teamId = user.app_metadata?.teamId;
    const id = c.req.param("id");

    if (!teamId) {
      return c.json({ error: "Team not found" }, 400);
    }

    const updates = c.req.valid("json");
    const repository = new TagRepository(db);
    await repository.update(id, teamId, updates);
    return c.json({ message: "Updated successfully" });
  },
);

// タグ削除
tagsRoute.delete("/:id", authMiddleware, async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const teamId = user.app_metadata?.teamId;
  const id = c.req.param("id");

  if (!teamId) {
    return c.json({ error: "Team not found" }, 400);
  }

  const repository = new TagRepository(db);
  await repository.delete(id, teamId);
  return c.json({ message: "Deleted successfully" });
});

// タグにラベルを追加
tagsRoute.post("/:id/labels/:labelId", authMiddleware, async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const teamId = user.app_metadata?.teamId;
  const tagId = c.req.param("id");
  const labelId = c.req.param("labelId");

  if (!teamId) {
    return c.json({ error: "Team not found" }, 400);
  }

  const repository = new TagRepository(db);
  await repository.addLabel(tagId, labelId);
  return c.json({ message: "Label added successfully" }, 201);
});

// タグからラベルを削除
tagsRoute.delete("/:id/labels/:labelId", authMiddleware, async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const teamId = user.app_metadata?.teamId;
  const tagId = c.req.param("id");
  const labelId = c.req.param("labelId");

  if (!teamId) {
    return c.json({ error: "Team not found" }, 400);
  }

  const repository = new TagRepository(db);
  await repository.removeLabel(tagId, labelId);
  return c.json({ message: "Label removed successfully" });
});
