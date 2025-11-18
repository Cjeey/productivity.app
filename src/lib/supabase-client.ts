import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function safeUpsert(table: string, payload: Record<string, unknown>) {
  if (!supabase) return { error: "Supabase client not configured" } as const;
  const { data, error } = await supabase.from(table).upsert(payload);
  return { data, error } as const;
}

export async function safeFetch(table: string) {
  if (!supabase) return { error: "Supabase client not configured" } as const;
  const { data, error } = await supabase.from(table).select("*");
  return { data, error } as const;
}
