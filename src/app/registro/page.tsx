'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/browser';
import { CampoAuth, SpinAuth } from '@/components/auth/CampoAuth';

const ERR_GENERICO = 'No pudimos crear la cuenta. Intenta de nuevo.';

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const correo = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: correo, password, codigo })
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.status !== 201) throw new Error(data?.error ?? ERR_GENERICO);

      const { error: err } = await createClient().auth.signInWithPassword({
        email: correo,
        password
      });
      if (err) throw err;
      router.replace('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : ERR_GENERICO);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex h-[100dvh] max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-3xl font-semibold">Crear cuenta</h1>
      <p className="mt-2 text-[15px] text-text-soft">Tu espacio mental privado. Solo para ti.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => { e.preventDefault(); void submit(); }}
      >
        <CampoAuth label="Correo" type="email" value={email} onChange={setEmail} />
        <CampoAuth
          label="Contrasena" type="password" value={password}
          onChange={setPassword} minLength={12} maxLength={72}
        />
        <CampoAuth
          label="Codigo de invitacion" type="text" value={codigo}
          onChange={setCodigo} autoComplete="off"
        />
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          aria-label="Crear cuenta"
          className="h-12 w-full rounded-card bg-accent text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {loading ? <SpinAuth /> : 'Crear cuenta'}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-4 text-center text-sm text-text-soft underline-offset-4 hover:underline"
      >
        Ya tengo cuenta
      </Link>
    </main>
  );
}

