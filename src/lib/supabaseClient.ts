import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '../../supabase-config.json';
import { resolveSupabasePublicConfig } from './supabaseConfiguration';

const config = resolveSupabasePublicConfig(import.meta.env, supabaseConfig);
export const supabase = createClient(config.url, config.anonKey);
