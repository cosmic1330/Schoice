import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zifjsqcvahkpytcklzed.supabase.co";
const supabaseKey =
  "sb_publishable_3zxE5vieYY_1OKCWAfPlAw_SSlSUqv8";
export const supabase = createClient(supabaseUrl, supabaseKey);
