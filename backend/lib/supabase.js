import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// THEN access the environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Add validation
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required in environment variables');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// For public operations (if needed)
export const supabasePublic = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);