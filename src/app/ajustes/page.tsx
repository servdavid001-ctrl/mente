import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { estadoCredencial } from '@/lib/ai/credenciales';
import Ajustes from '@/components/ajustes/Ajustes';

export const dynamic = 'force-dynamic';

/** pagina /ajustes: guard de sesion; AI expone solo estado (proveedor + last4).
 * Perfil: uid/nombre/foto_ext ya resueltos en el server para la seccion nueva. */
export default async function PaginaAjustes() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  const aiEstado = await estadoCredencial(data.user.id);
  const meta = data.user.user_metadata as { nombre?: unknown; foto_ext?: unknown } | null;
  const perfil = {
    uid: data.user.id,
    nombre: typeof meta?.nombre === 'string' ? meta.nombre : null,
    fotoExt: typeof meta?.foto_ext === 'string' ? meta.foto_ext : null
  };
  return <Ajustes email={data.user.email ?? undefined} aiEstado={aiEstado} perfil={perfil} />;
}
