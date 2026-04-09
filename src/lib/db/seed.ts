import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "./schema";

const sqlite = new Database("./prism.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("Seeding database...");

  // Create teams
  const teamId = nanoid();
  await db.insert(schema.teams).values({
    id: teamId,
    name: "Acme Corp",
    slug: "acme-corp",
    plan: "pro",
    createdAt: new Date(),
  });

  // Create users
  const adminId = nanoid();
  const memberId = nanoid();
  const viewerId = nanoid();

  await db.insert(schema.users).values([
    {
      id: adminId,
      email: "admin@acme.com",
      name: "Sarah Chen",
      role: "admin",
      teamId,
      passwordHash: "$2b$10$placeholder_hash_for_seeding",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: memberId,
      email: "dev@acme.com",
      name: "Marcus Rodriguez",
      role: "member",
      teamId,
      passwordHash: "$2b$10$placeholder_hash_for_seeding",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: viewerId,
      email: "viewer@acme.com",
      name: "Jamie Park",
      role: "viewer",
      teamId,
      passwordHash: "$2b$10$placeholder_hash_for_seeding",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Create analytics events
  const eventTypes = ["page_view", "feature_used", "api_call", "error", "login"];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const eventDate = new Date(now - daysAgo * 86400000);
    await db.insert(schema.analyticsEvents).values({
      id: nanoid(),
      teamId,
      userId: [adminId, memberId, viewerId][Math.floor(Math.random() * 3)],
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      metadata: JSON.stringify({ source: "web", page: "/dashboard" }),
      value: Math.random() * 100,
      createdAt: eventDate,
    });
  }

  // Create notifications (digest-batched, per ADR-007)
  const batchId = nanoid();
  await db.insert(schema.notifications).values([
    {
      id: nanoid(),
      userId: adminId,
      type: "digest",
      title: "Weekly Team Summary",
      body: "Your team completed 12 tasks and shipped 3 features this week.",
      digestBatchId: batchId,
      scheduledFor: new Date(now + 86400000),
      createdAt: new Date(),
    },
    {
      id: nanoid(),
      userId: adminId,
      type: "alert",
      title: "Error Rate Spike",
      body: "Error rate exceeded 5% threshold in the last hour.",
      digestBatchId: batchId,
      scheduledFor: new Date(now + 86400000),
      createdAt: new Date(),
    },
  ]);

  console.log("Seed complete: 1 team, 3 users, 50 events, 2 notifications");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
