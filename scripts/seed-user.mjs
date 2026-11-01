#!/usr/bin/env node
// Crea el primero usuario de Mente con SUPABASE_SERVICE_ROLE_KEY (server-side)
// Uso: node --env-file=.env.local scripts/seed-user.mjs
// Escribe el password en /tmp/opencode/mente-admin.txt (nunca stdout)

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

if (!url || !serviceRole) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const email = 'mente@api.mente-app.local';
const password = randomBytes(12).toString('base64url');

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { rol: 'owner', dispositivo_principal: 'movil' },
});

if (error) {
  console.error('Fallo al crear el usuario:', error.message);
  process.exit(1);
}

writeFileSync('/tmp/opencode/mente-admin.txt', `email: ${email}\npassword: ${password}\nuser_id: ${data.user.id}\n`, { mode: 0o600 });
console.log(`OK usuario creado: ${email} (id ${data.user.id}). Password en /tmp/opencode/mente-admin.txt`);
