import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: Parameters<ReturnType<typeof cookies>["set"]>[2]) {
          cookies().set(name, value, options);
        },
        remove(name: string, options: Parameters<ReturnType<typeof cookies>["set"]>[2]) {
          cookies().set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to home (or a "continue" param if present)
  const redirectTo = requestUrl.searchParams.get("redirectedFrom") || "/";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
