'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/browser';
import { CampoAuth, SpinAuth } from '@/components/auth/CampoAuth';

const ERR_PASSWORD = 'Contrasena incorrecta';
const ERR_GENERIC = 'No pudimos entrar. Revisa tus datos.';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/');
    }).catch(() => undefined);
  }, [router]);

  function fail(message: string) {
    setError(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const client = createClient();
      const { error: err } = await client.auth.signInWithPassword({ email, password });
      if (err) throw err;
      router.replace('/'); // LoginPage: exito directa (sesion ya vive en cookies)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      const esCredenciales = msg.toLowerCase().includes('invalid login credentials');
      fail(esCredenciales ? ERR_PASSWORD : ERR_GENERIC);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-bg px-6 py-10">
      <div className="w-full max-w-[26rem] md:rounded-blob md:border md:border-border md:bg-surface md:p-8 md:shadow-card">
        <p className="mb-4 font-display text-2xl font-semibold lowercase tracking-tight">
          mente<span className="text-accent">.</span>
        </p>
        <h1 className="font-display text-[28px] font-semibold leading-tight md:text-[32px] lg:text-[36px]">
          Bienvenido a Mente
        </h1>
        <p className="mt-2 text-[15px] text-text-soft">Tu espacio mental privado. Solo para ti.</p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => { e.preventDefault(); void submit(); }}
        >
          <CampoAuth
            label="Correo" type="email" value={email} shake={shake}
            onChange={setEmail}
          />
          <CampoAuth
            label="Contrasena" type="password" value={password} shake={shake}
            onChange={setPassword}
          />
          {error ? (
            <p role="alert" className="text-sm text-danger">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            aria-label="Entrar"
            className="h-12 w-full rounded-card bg-accent text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? <SpinAuth /> : 'Entrar'}
          </button>
        </form>

        <Link
          href="/registro"
          className="mt-4 block text-center text-sm text-text-soft underline-offset-4 hover:underline"
        >
          Crear cuenta nueva
        </Link>
      </div>
    </main>
  );
}
