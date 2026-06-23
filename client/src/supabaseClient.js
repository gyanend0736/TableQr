import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be in client/.env. " +
      "Get them from Supabase dashboard → Project Settings → API."
  );
}

// The anon key is safe here: RLS allows anon reads, blocks anon writes.
// All writes still go through the Flask backend with the service role key.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
