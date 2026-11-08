import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { buscarSolicitud, esDeviceCode } from '@/lib/loginSolicitudes';
import ConectarPanel from '@/components/conectar/ConectarPanel';

export const dynamic = 'force-dynamic';

/** modulo 18: paso 2 del CLI login — page /conectar?device=<plain>.
 * Server-side: guard de sesion (redirect /login con next) y lookup admin
 * del device_code por sha256. La UI solo ve nombre + vencimiento; nunca
 * tokens. */

const SIN_SOL = 'Solicitud no encontrada o expirada.';

export default async function PaginaConectar(props: {
  searchParams: Promise<{ device?: string }>;
}) {
  const { device } = await props.searchParams;
  const plain = esDeviceCode(device) ? device : null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const next = plain ? `/conectar?device=${encodeURIComponent(plain)}` : '/conectar';
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!plain) return <ConectarPanel mensaje={SIN_SOL} />;

  const admin = createAdminClient();
  const solicitud = await buscarSolicitud(admin, plain);
  if (!solicitud) return <ConectarPanel mensaje={SIN_SOL} />;

  if (solicitud.estado === 'pendiente') {
    if (solicitud.expira_en <= new Date().toISOString()) {
      return <ConectarPanel mensaje="Esta solicitud expiro. Pidela de nuevo a la CLI." />;
    }
    return (
      <ConectarPanel
        device={plain}
        nombre={solicitud.nombre}
        expiraEn={solicitud.expira_en}
      />
    );
  }
  if (solicitud.estado === 'aprobado') {
    return <ConectarPanel mensaje="Solicitud autorizada. Vuelve a tu CLI para continuar." />;
  }
  if (solicitud.estado === 'entregado') {
    return <ConectarPanel mensaje="El token ya fue entregado a tu CLI." />;
  }
  return <ConectarPanel mensaje="Solicitud rechazada. Pidela de nuevo a la CLI." />;
}
