import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awvnbfepkwsgbpvybbzg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dm5iZmVwa3dzZ2JwdnliYnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzOTU3NzMsImV4cCI6MjA2Nzk3MTc3M30.b1egyua70k7lzN4aCTN02w8ULKVgMq3tebj-GeU2oDg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 