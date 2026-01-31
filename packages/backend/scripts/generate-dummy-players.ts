import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ulid } from "ulid";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schemas/index.js";

// 日本人のダミー名前データ
const lastNames = [
  "佐藤", "鈴木", "高橋", "田中", "渡辺", "伊藤", "山本", "中村", "小林", "加藤",
  "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水",
  "山崎", "森", "池田", "橋本", "阿部", "石川", "山下", "中島", "小川", "前田",
];

const firstNamesMale = [
  "太郎", "次郎", "健太", "翔太", "大輝", "悠斗", "拓海", "陽斗", "蓮", "湊",
  "颯太", "陸", "奏太", "朔", "樹", "蒼", "律", "旭", "創", "結翔",
];

const firstNamesFemale = [
  "花子", "美咲", "陽菜", "結衣", "杏", "美月", "葵", "さくら", "愛菜", "莉子",
  "美羽", "凛", "心春", "琴音", "桜", "結菜", "優奈", "美咲", "彩花", "心美",
];

const nicknames = [
  "たろちゃん", "けんちゃん", "しょうくん", "ゆうくん", "みーちゃん", "さくちゃん",
  "あおくん", "りこちゃん", "そうちゃん", "はなちゃん", null, null, null, // nullを含めてニックネームなしも生成
];

// 学年名
const grades = ["小学1年生", "小学2年生", "小学3年生", "小学4年生", "小学5年生", "小学6年生"];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log("🚀 Starting player data generation...");

  try {
    // 1. チームを取得（最初のチームを使用）
    const teams = await db.select().from(schema.teams).limit(1);
    if (teams.length === 0) {
      throw new Error("No team found. Please create a team first.");
    }
    const teamId = teams[0].id;
    console.log(`✅ Found team: ${teams[0].name} (${teamId})`);

    // 2. 親ユーザーを取得（最初のユーザーを使用）
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.teamId, teamId))
      .limit(1);
    if (users.length === 0) {
      throw new Error("No user found in the team. Please create a user first.");
    }
    const parentUserId = users[0].id;
    console.log(`✅ Found parent user: ${users[0].name} (${parentUserId})`);

    // 3. 学年ラベルを取得
    const gradeLabel = await db
      .select()
      .from(schema.labels)
      .where(eq(schema.labels.name, "学年"))
      .limit(1);
    if (gradeLabel.length === 0) {
      throw new Error("Grade label not found. Please run migrations.");
    }
    const gradeLabelId = gradeLabel[0].id;

    // 4. 学年タグを取得
    const gradeTags = await db
      .select()
      .from(schema.tags)
      .innerJoin(schema.labels, eq(schema.tags.labelId, schema.labels.id))
      .where(eq(schema.labels.name, "学年"));

    if (gradeTags.length === 0) {
      throw new Error("No grade tags found. Please create grade tags first.");
    }
    console.log(`✅ Found ${gradeTags.length} grade tags`);

    // 5. 100件のプレイヤーを作成
    console.log("\n📝 Creating 100 dummy players...");
    const createdPlayers = [];

    for (let i = 0; i < 100; i++) {
      const isMale = Math.random() > 0.5;
      const lastName = getRandomItem(lastNames);
      const firstName = isMale
        ? getRandomItem(firstNamesMale)
        : getRandomItem(firstNamesFemale);
      const nickName = Math.random() > 0.5 ? getRandomItem(nicknames) : null;
      const gradeTag = getRandomItem(gradeTags);

      const playerId = ulid();

      // プレイヤー作成
      await db.insert(schema.players).values({
        id: playerId,
        lastName,
        firstName,
        nickName,
        imageUrl: null,
        teamId,
        parentUserId,
      });

      // 学年タグを割り当て
      await db.insert(schema.taggables).values({
        tagId: gradeTag.tags.id,
        taggableType: "player",
        taggableId: playerId,
      });

      createdPlayers.push({
        id: playerId,
        name: `${lastName} ${firstName}`,
        grade: gradeTag.tags.name,
      });

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ Created ${i + 1}/100 players...`);
      }
    }

    console.log(`\n✅ Successfully created 100 players!`);
    console.log(`\n📊 Sample created players:`);
    createdPlayers.slice(0, 5).forEach((p) => {
      console.log(`  - ${p.name} (${p.grade})`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
