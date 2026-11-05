import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Ajustes from '@/components/ajustes/Ajustes';

export const dynamic = 'force-dynamic';

/** pagina /ajustes: guard de sesion; AI solo expone un booleano, nunca claves */
export default async function PaginaAjustes() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  const aiConfigurada = Boolean(
    process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  );
  return <Ajustes email={data.user.email ?? undefined} aiConfigurada={aiConfigurada} />;
}
