import { Hono } from "hono";
import login from "./routes/auth/login.js";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth/login", login);

export default app;
