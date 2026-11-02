import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DetalleItem from '@/components/biblioteca/DetalleItem';

export const dynamic = 'force-dynamic';

/** pagina Detalle /biblioteca/[id]: misma regla de la raiz, sesion o login */
export default async function PaginaDetalle(props: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <DetalleItem ideaId={props.params.id} />;
}
