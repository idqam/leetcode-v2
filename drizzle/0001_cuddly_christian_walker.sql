-- Wipe existing ownerless rows (pre-launch). Required: the new NOT NULL user_id
-- defaults to auth.uid(), which is NULL during migration, so existing rows would
-- violate NOT NULL. CASCADE clears the FK-dependent join/solve/review rows too.
TRUNCATE TABLE "pattern_problems", "solves", "reviews", "patterns", "problems" CASCADE;--> statement-breakpoint
ALTER TABLE "pattern_problems" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patterns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "problems" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "solves" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patterns" DROP CONSTRAINT "patterns_title_unique";--> statement-breakpoint
DROP INDEX "solves_problem_id_idx";--> statement-breakpoint
ALTER TABLE "pattern_problems" ADD COLUMN "user_id" uuid DEFAULT auth.uid() NOT NULL;--> statement-breakpoint
ALTER TABLE "patterns" ADD COLUMN "user_id" uuid DEFAULT auth.uid() NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "user_id" uuid DEFAULT auth.uid() NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "user_id" uuid DEFAULT auth.uid() NOT NULL;--> statement-breakpoint
ALTER TABLE "solves" ADD COLUMN "user_id" uuid DEFAULT auth.uid() NOT NULL;--> statement-breakpoint
ALTER TABLE "pattern_problems" ADD CONSTRAINT "pattern_problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves" ADD CONSTRAINT "solves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "patterns_user_title_idx" ON "patterns" USING btree ("user_id","title");--> statement-breakpoint
CREATE INDEX "problems_user_id_idx" ON "problems" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "solves_user_problem_idx" ON "solves" USING btree ("user_id","problem_id");--> statement-breakpoint
CREATE POLICY "pattern_problems_owner_all" ON "pattern_problems" AS PERMISSIVE FOR ALL TO "authenticated" USING ("pattern_problems"."user_id" = (select auth.uid())) WITH CHECK ("pattern_problems"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "patterns_owner_all" ON "patterns" AS PERMISSIVE FOR ALL TO "authenticated" USING ("patterns"."user_id" = (select auth.uid())) WITH CHECK ("patterns"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "problems_owner_all" ON "problems" AS PERMISSIVE FOR ALL TO "authenticated" USING ("problems"."user_id" = (select auth.uid())) WITH CHECK ("problems"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reviews_owner_all" ON "reviews" AS PERMISSIVE FOR ALL TO "authenticated" USING ("reviews"."user_id" = (select auth.uid())) WITH CHECK ("reviews"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "solves_owner_all" ON "solves" AS PERMISSIVE FOR ALL TO "authenticated" USING ("solves"."user_id" = (select auth.uid())) WITH CHECK ("solves"."user_id" = (select auth.uid()));--> statement-breakpoint
-- The `authenticated` role does not bypass RLS, so it needs explicit table and
-- sequence privileges for the policies above to grant any access at all.
GRANT SELECT, INSERT, UPDATE, DELETE ON "problems", "patterns", "pattern_problems", "solves", "reviews" TO authenticated;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;