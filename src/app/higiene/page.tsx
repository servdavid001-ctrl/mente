import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import HigienePanel from '@/components/higiene/HigienePanel';

export const dynamic = 'force-dynamic';

/** pagina Higiene asistida (modulo 9): misma estructura server-side con auth
 * que las otras tabs; el nav inferior queda activo en 'bandeja' (spec). */
export default async function PaginaHigiene() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <HigienePanel email={data.user.email ?? undefined} />;
}
