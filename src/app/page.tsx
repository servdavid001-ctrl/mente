import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Bandeja from '@/components/Bandeja';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ compartir?: string }>;
}) {
  // regla del modulo: si getUsuario falla o no hay sesion, al login
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  const { compartir } = await searchParams;
  return <Bandeja avisoCompartir={compartir} />;
}
