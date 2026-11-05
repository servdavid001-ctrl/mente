import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente service-role SOLO para route handlers del servidor.
 * Ignora RLS: cada consulta debe filtrar explicitamente por user_id.
 * Nunca importar desde componentes cliente ni exponer la key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin no configurado');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export type SupabaseAdmin = ReturnType<typeof createAdminClient>;
