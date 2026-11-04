import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

/** pagina tab Foco: placeholder del modulo 4, misma regla de sesion */
export default async function PaginaFoco() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return (
    <AppShell activeTab="foco">
      <EmptyState
        icon="target"
        title="Tu Foco llega pronto. Aqui viviran tus proyectos."
      />
    </AppShell>
  );
}
