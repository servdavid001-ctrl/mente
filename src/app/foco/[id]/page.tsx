import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ProyectoDetalle from '@/components/foco/ProyectoDetalle';

export const dynamic = 'force-dynamic';

/** pagina Detalle /foco/[id]: misma regla de sesion que la raiz */
export default async function PaginaProyecto(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <ProyectoDetalle proyectoId={id} email={data.user.email ?? undefined} />;
}
