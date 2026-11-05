import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DetalleItem from '@/components/biblioteca/DetalleItem';

export const dynamic = 'force-dynamic';

/** pagina Detalle /biblioteca/[id]: misma regla de la raiz, sesion o login */
export default async function PaginaDetalle(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <DetalleItem ideaId={id} email={data.user.email ?? undefined} />;
}
