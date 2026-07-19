// ==========================================
// AEON Registrasi Supplier — supabase.js
// Koneksi ke Supabase project
// ==========================================
 
const SUPABASE_URL = 'https://akrjxgtevgwadhslkhee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcmp4Z3Rldmd3YWRoc2xraGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NjQ3MzUsImV4cCI6MjA5OTU0MDczNX0.BVPsD3zyEy4fv-Ihy2JiFcgyx1l6hBGta0xVA08nnDg';
 
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
