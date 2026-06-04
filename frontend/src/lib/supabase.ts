import { createClient } from '@supabase/supabase-js';

// Single shared Supabase client — import this everywhere instead of calling createClient directly.
// This prevents multiple GoTrueClient instances and ensures session state is shared.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default supabase;
