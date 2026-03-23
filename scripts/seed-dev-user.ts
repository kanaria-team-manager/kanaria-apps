import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ulid } from "ulid";
import { eq } from "drizzle-orm";
import * as schema from "../packages/backend/src/db/schemas/index.js";

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL) {
    console.error("❌ Required environment variables are missing.");
    console.error("Make sure to run 'pnpm run env:generate' first and load the .dev.vars file.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  const email = "dev@kanaria.local";
  const password = process.env.DEV_USER_PASSWORD || "devpassword123";
  const userName = "開発用テストユーザー";

  console.log("🚀 Starting dev test user creation...");

  try {
    // 1. Create user in Supabase Auth
    console.log(`Checking if user ${email} exists in Auth...`);
    
    // Attempt to create user (if exists, it might fail or we can list users first, but admin API doesn't have a simple get user by email without listing all)
    // Actually, createUser with a duplicate email will return an error, which we can catch.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { name: userName }
    });

    let authUserId: string;

    if (authError) {
      // Supabase returns an error with code 'email_exists' or message containing 'already'
      if (authError.code === "email_exists" || authError.message.includes("already")) {
        console.log(`✅ User ${email} already exists in Auth. Retrieving...`);
        // We need to get the user ID. We can list users and filter by email.
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) throw usersError;
        
        const existingUser = usersData.users.find(u => u.email === email);
        if (!existingUser) throw new Error("Could not find existing user in list.");
        authUserId = existingUser.id;
      } else {
        throw authError;
      }
    } else {
      console.log(`✅ Created user ${email} in Auth.`);
      if (!authData.user) throw new Error("User creation succeeded but returned no user data.");
      authUserId = authData.user.id;
    }

    // 2. Add user to the first team in public.users
    const teams = await db.select().from(schema.teams).limit(1);
    if (teams.length === 0) {
      throw new Error("No team found. Please create a team first via UI or migration.");
    }
    const teamId = teams[0].id;

    // Check if user already exists in public.users
    const existingPublicUsers = await db.select().from(schema.users).where(eq(schema.users.supabaseUserId, authUserId)).limit(1);
    
    if (existingPublicUsers.length > 0) {
      console.log(`✅ User ${email} is already linked to team in public.users.`);
    } else {
      const publicUserId = ulid();
      const roles = await db.select().from(schema.roles).limit(1);
      const roleId = roles.length > 0 ? roles[0].id : 1;
      
      await db.insert(schema.users).values({
        id: publicUserId,
        supabaseUserId: authUserId,
        email: email,
        name: userName,
        roleId: roleId,
        status: 1, // confirmed
        teamId: teamId,
      });
      console.log(`✅ Linked user ${email} to team ${teams[0].name} in public.users.`);
    }

    console.log("\n🎉 Dev test user is ready!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
