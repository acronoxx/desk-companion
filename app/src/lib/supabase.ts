import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl) throw new Error('Missing SUPABASE_URL environment variable')
if (!supabaseKey) throw new Error('Missing SUPABASE_KEY environment variable')

export const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        }
    }
);