-- Custom SQL migration file, put your code below! --
INSERT INTO "roles" ("id", "name") VALUES (0, 'owner'), (1, 'admin'), (2, 'member') ON CONFLICT ("id") DO NOTHING;
