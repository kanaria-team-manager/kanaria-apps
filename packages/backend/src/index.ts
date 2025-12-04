import { Hono } from "hono";
import { cors } from "hono/cors";
import login from "./routes/auth/login.js";
import createTeam from "./routes/teams/create.js";
import verifyTeam from "./routes/teams/verify.js";
import type { Bindings, Variables } from "./types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORSミドルウェアを適用
app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth/login", login);
app.route("/teams", verifyTeam);
app.route("/teams", createTeam);

export default app;
