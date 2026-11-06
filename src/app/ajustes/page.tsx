import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { estadoCredencial } from '@/lib/ai/credenciales';
import Ajustes from '@/components/ajustes/Ajustes';

export const dynamic = 'force-dynamic';

/** pagina /ajustes: guard de sesion; AI expone solo estado (proveedor + last4) */
export default async function PaginaAjustes() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  const aiEstado = await estadoCredencial(data.user.id);
  return <Ajustes email={data.user.email ?? undefined} aiEstado={aiEstado} />;
}
