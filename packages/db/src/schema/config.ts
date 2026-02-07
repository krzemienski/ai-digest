import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
