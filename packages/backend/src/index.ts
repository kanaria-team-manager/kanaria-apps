import { Hono } from "hono";

import { secureHeaders } from "hono/secure-headers";
import { dbMiddleware } from "./middleware/db.js";
import { rateLimitMiddleware } from "./middleware/rate-limiter.js";
import { attendanceStatusesRoute } from "./routes/attendance-statuses/attendance-statuses.js";
import { attendancesRoute } from "./routes/attendances/attendances.js";
import login from "./routes/auth/login.js";
import signup from "./routes/auth/signup.js";
import { eventsRoute } from "./routes/events/events.js";
import { labelsRoute } from "./routes/labels/labels.js";
import { placesRoute } from "./routes/places/places.js";
import { playersRoute } from "./routes/players/players.js";
import { tagsRoute } from "./routes/tags/tags.js";
import activateTeam from "./routes/teams/activate.js";
import createTeam from "./routes/teams/create.js";
import teamsRoute from "./routes/teams/teams.js";
import verifyTeam from "./routes/teams/verify.js";
import usersRoute from "./routes/users/users.js";

import type { Bindings, Variables } from "./types.js";

// Validate required environment variables
function validateEnv(env: Bindings) {
  const required: (keyof Bindings)[] = [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Environment validation middleware
app.use("*", async (c, next) => {
  validateEnv(c.env);
  await next();
});

// Security headers
app.use("*", secureHeaders());


// Rate limiting for auth endpoints
app.use("/auth/*", rateLimitMiddleware);

app.use("*", dbMiddleware);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth/login", login);
app.route("/auth/signup", signup);
app.route("/teams", verifyTeam);
app.route("/teams", createTeam);
app.route("/teams", activateTeam);
app.route("/teams", teamsRoute);
app.route("/tags", tagsRoute);
app.route("/labels", labelsRoute);
app.route("/players", playersRoute);
app.route("/users", usersRoute);
app.route("/events", eventsRoute);
app.route("/attendance-statuses", attendanceStatusesRoute);
app.route("/attendances", attendancesRoute);
app.route("/places", placesRoute);

export default app;
