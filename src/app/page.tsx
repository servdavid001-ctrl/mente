import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Bandeja from '@/components/Bandeja';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // regla del modulo: si getUsuario falla o no hay sesion, al login
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <Bandeja />;
}
