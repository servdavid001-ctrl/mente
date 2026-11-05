import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Foco from '@/components/foco/Foco';

export const dynamic = 'force-dynamic';

/** pagina tab Foco: proyectos, objetivos, guardian suave y copiloto */
export default async function PaginaFoco() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <Foco email={data.user.email ?? undefined} />;
}
