'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/browser';

const ERR_PASSWORD = 'Contraseña incorrecta';
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
    <main className="mx-auto flex h-[100dvh] max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-3xl font-semibold">Bienvenido a Mente</h1>
      <p className="mt-2 text-[15px] text-text-soft">Tu espacio mental privado. Solo para ti.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => { e.preventDefault(); void submit(); }}
      >
        <SesionCampo
          label="Correo" type="email" value={email} shake={shake}
          onChange={setEmail}
        />
        <SesionCampo
          label="Contraseña" type="password" value={password} shake={shake}
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
          {loading ? <SpinGrande /> : 'Entrar'}
        </button>
      </form>
    </main>
  );
}

function SesionCampo(props: {
  label: string; type: string; value: string; shake: boolean;
  onChange: (v: string) => void;
}) {
  const id = props.label.toLowerCase();
  return (
    <label className={props.shake ? 'block anim-shake' : 'block'}>
      <span className="text-sm text-text-soft">{props.label}</span>
      <input
        id={id}
        type={props.type}
        required
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 h-12 w-full rounded-card border border-border bg-surface px-4 text-text"
      />
    </label>
  );
}

function SpinGrande() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}
