import { Hono } from "hono";

const login = new Hono();

login.post("/", async (c) => {
  // リクエストボディは受け取るが、検証は行わない
  await c.req.json().catch(() => {
    // ボディが無い場合もエラーにしない（意図的に無視）
    return null;
  });

  // 常に201を返す
  return c.json({ message: "Login endpoint" }, 201);
});

export default login;
