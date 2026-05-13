CREATE TABLE "pattern_problems" (
	"pattern_id" integer NOT NULL,
	"problem_id" text NOT NULL,
	CONSTRAINT "pattern_problems_pattern_id_problem_id_pk" PRIMARY KEY("pattern_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"template_py" text DEFAULT '',
	"template_js" text DEFAULT '',
	"template_java" text DEFAULT '',
	"template_go" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "patterns_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"url" text,
	"difficulty" text NOT NULL,
	"topics" text[] DEFAULT '{}',
	"companies" jsonb DEFAULT '[]',
	"list_name" text NOT NULL,
	"section" text,
	"solution" text DEFAULT '',
	"explanation" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"problem_id" text NOT NULL,
	"review_number" integer NOT NULL,
	"completed_at" date NOT NULL,
	"quality" integer NOT NULL,
	"time_taken" integer,
	"interval_days" integer NOT NULL,
	"ef" real NOT NULL,
	"next_due" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves" (
	"id" serial PRIMARY KEY NOT NULL,
	"problem_id" text NOT NULL,
	"solved_at" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pattern_problems" ADD CONSTRAINT "pattern_problems_pattern_id_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_problems" ADD CONSTRAINT "pattern_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves" ADD CONSTRAINT "solves_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_problem_id_idx" ON "reviews" USING btree ("problem_id");--> statement-breakpoint
CREATE UNIQUE INDEX "solves_problem_id_idx" ON "solves" USING btree ("problem_id");