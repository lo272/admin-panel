import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  // Redirect to home — page.tsx will forward admins to /dashboard, others to /browse
  return NextResponse.redirect(`${origin}/`);
}