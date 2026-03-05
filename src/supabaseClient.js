import { createClient } from "@supabase/supabase-js";

// ⚠️ Replace these with your actual Supabase project URL and anon key
// Find them at: https://supabase.com/dashboard → your project → Settings → API
const SUPABASE_URL = "https://tgzywekzipjxhnherrkz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnenl3ZWt6aXBqeGhuaGVycmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NDU4MDksImV4cCI6MjA4NzMyMTgwOX0.jBhdocKIRh-cgEYQkyzQc8XK64PH7v-o4nyh_W9eJoQ";

// Note: The frontend uses the ANON key (not the service role key)
// The anon key is safe to use in the browser
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
