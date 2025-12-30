import { Hono } from "hono";
import { cors } from "hono/cors";
import { dbMiddleware } from "./middleware/db.js";
import { attendanceStatusesRoute } from "./routes/attendance-statuses/attendance-statuses.js";
import login from "./routes/auth/login.js";
import signup from "./routes/auth/signup.js";
import { eventsRoute } from "./routes/events/events.js";
import { labelsRoute } from "./routes/labels/labels.js";
import { placesRoute } from "./routes/places/places.js";
import { playersRoute } from "./routes/players/players.js";
import { tagsRoute } from "./routes/tags/tags.js";
import activateTeam from "./routes/teams/activate.js";
import createTeam from "./routes/teams/create.js";
import verifyTeam from "./routes/teams/verify.js";
import usersRoute from "./routes/users/users.js";

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
app.route("/auth/signup", signup);
app.route("/teams", verifyTeam);
app.route("/teams", createTeam);
app.route("/teams", activateTeam);
app.route("/tags", tagsRoute);
app.route("/labels", labelsRoute);
app.route("/players", playersRoute);
app.route("/users", usersRoute);
app.route("/events", eventsRoute);
app.route("/attendance-statuses", attendanceStatusesRoute);
app.route("/places", placesRoute);

export default app;
