import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Biblioteca from '@/components/biblioteca/Biblioteca';

export const dynamic = 'force-dynamic';

/** pagina tab Biblioteca: misma regla de la raiz, sesion o login */
export default async function PaginaBiblioteca() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <Biblioteca />;
}
