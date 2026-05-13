import {
  pgTable,
  text,
  integer,
  date,
  serial,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const problems = pgTable("problems", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  url: text("url"),
  difficulty: text("difficulty").notNull(),
  topics: text("topics").array().default(sql`'{}'`),
  companies: jsonb("companies").default(sql`'[]'`),
  listName: text("list_name").notNull(),
  section: text("section"),
  solution: text("solution").default(""),
  explanation: text("explanation").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patterns = pgTable("patterns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  description: text("description").default(""),
  templatePy: text("template_py").default(""),
  templateJs: text("template_js").default(""),
  templateJava: text("template_java").default(""),
  templateGo: text("template_go").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patternProblems = pgTable(
  "pattern_problems",
  {
    patternId: integer("pattern_id")
      .notNull()
      .references(() => patterns.id, { onDelete: "cascade" }),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.patternId, t.problemId] }),
  })
);

export const solves = pgTable(
  "solves",
  {
    id: serial("id").primaryKey(),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    solvedAt: date("solved_at").notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("solves_problem_id_idx").on(t.problemId),
  })
);

// Each row = one completed review session.
// quality: 1=Again, 3=Hard, 4=Good, 5=Easy
// timeTaken: minutes the user spent (null if not recorded)
// intervalDays: interval used for THIS review (i.e. how long since last review/solve)
// ef: easiness factor AFTER this review (starts at 2.5)
// nextDue: next review date computed by the algo
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    reviewNumber: integer("review_number").notNull(),
    completedAt: date("completed_at").notNull(),
    quality: integer("quality").notNull(),
    timeTaken: integer("time_taken"),
    intervalDays: integer("interval_days").notNull(),
    ef: real("ef").notNull(),
    nextDue: date("next_due").notNull(),
  },
  (t) => ({
    problemIdx: index("reviews_problem_id_idx").on(t.problemId),
  })
);

// Relations
export const problemsRelations = relations(problems, ({ many }) => ({
  patternLinks: many(patternProblems),
  solves: many(solves),
  reviews: many(reviews),
}));

export const patternsRelations = relations(patterns, ({ many }) => ({
  problemLinks: many(patternProblems),
}));

export const patternProblemsRelations = relations(patternProblems, ({ one }) => ({
  pattern: one(patterns, { fields: [patternProblems.patternId], references: [patterns.id] }),
  problem: one(problems, { fields: [patternProblems.problemId], references: [problems.id] }),
}));

export const solvesRelations = relations(solves, ({ one }) => ({
  problem: one(problems, { fields: [solves.problemId], references: [problems.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  problem: one(problems, { fields: [reviews.problemId], references: [problems.id] }),
}));
