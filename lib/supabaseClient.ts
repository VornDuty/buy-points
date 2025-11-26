import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Option 1: Already-initialized client (for most client pages)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// ✅ Option 2: Function that returns a fresh client (for SSR or hooks)
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);
