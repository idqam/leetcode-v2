import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });

// System-level client. Connects as the privileged role and therefore BYPASSES
// Row-Level Security. Use ONLY for migrations / trusted background jobs — never
// in a request path that should be scoped to a single user.
export const adminDb = drizzle(client, { schema });

// The transaction handle drizzle hands to the callback of `adminDb.transaction`.
type Tx = Parameters<Parameters<typeof adminDb.transaction>[0]>[0];

// Decode a Supabase JWT's payload (claims) without verifying the signature.
// The token already came from a server-validated session (auth.getUser), so we
// only need to read its claims to hand them to Postgres for auth.uid().
function decodeJwtClaims(accessToken: string): Record<string, unknown> {
  const payload = accessToken.split(".")[1];
  if (!payload) throw new Error("Malformed access token");
  const json = Buffer.from(payload, "base64url").toString("utf8");
  return JSON.parse(json) as Record<string, unknown>;
}

// Per-request, RLS-enforced runner. Opens a transaction, switches to the
// non-privileged `authenticated` role, and exposes the user's JWT claims so
// `auth.uid()` resolves inside every query in `fn`. Both the role switch and the
// claims are transaction-local (SET LOCAL), so they reset when the tx ends —
// which is what makes this safe to reuse across pooled connections.
export async function withUserDb<T>(
  accessToken: string,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  const claims = decodeJwtClaims(accessToken);
  return adminDb.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`
    );
    await tx.execute(sql`set local role authenticated`);
    return fn(tx);
  });
}
