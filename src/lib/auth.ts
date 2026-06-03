import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AuthedUser = { user: User; accessToken: string };

// Resolve the current user from the Supabase server (cookie) session.
// Returns `{ user, accessToken }` on success, or a 401 NextResponse that the
// route should return directly. The access token is the user's JWT, needed by
// `withUserDb` so Postgres RLS can resolve `auth.uid()`.
//
//   const auth = await requireUser();
//   if (auth instanceof NextResponse) return auth;
//   const { accessToken } = auth;
export async function requireUser(): Promise<AuthedUser | NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, accessToken };
}
