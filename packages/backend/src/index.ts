import { Hono } from "hono";
import { cors } from "hono/cors";
import { dbMiddleware } from "./middleware/db.js";
import login from "./routes/auth/login.js";
import { labelsRoute } from "./routes/labels/index.js";
import { tagsRoute } from "./routes/tags/index.js";
import activateTeam from "./routes/teams/activate.js";
import createTeam from "./routes/teams/create.js";
import verifyTeam from "./routes/teams/verify.js";
import type { Bindings, Variables } from "./types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// middleware
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

app.use("*", dbMiddleware);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth/login", login);
app.route("/teams", verifyTeam);
app.route("/teams", createTeam);
app.route("/teams", activateTeam);
app.route("/tags", tagsRoute);
app.route("/labels", labelsRoute);

export default app;
