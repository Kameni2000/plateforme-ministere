import { createClient } from '@supabase/supabase-js';

// On récupère les clés de ton fichier .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// On crée le pont de connexion
export const supabase = createClient(supabaseUrl, supabaseKey);