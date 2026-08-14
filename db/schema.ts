import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apiCache = sqliteTable("api_cache", {
  cacheKey: text("cache_key").primaryKey(),
  provider: text("provider").notNull(),
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const quizAttempts = sqliteTable(
  "quiz_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mode: text("mode").notNull(),
    countryCode: text("country_code"),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_quiz_attempts_created_at").on(table.createdAt),
    index("idx_quiz_attempts_mode").on(table.mode),
  ],
);
