'use client';

/** Campos y spinner compartidos por /login y /registro. */
export function CampoAuth(props: {
  label: string; type: string; value: string;
  onChange: (v: string) => void;
  shake?: boolean;
  minLength?: number; maxLength?: number; autoComplete?: string;
}) {
  const id = props.label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label className={props.shake ? 'block anim-shake' : 'block'}>
      <span className="text-sm text-text-soft">{props.label}</span>
      <input
        id={id}
        type={props.type}
        required
        value={props.value}
        minLength={props.minLength}
        maxLength={props.maxLength}
        autoComplete={props.autoComplete}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 h-12 w-full rounded-card border border-border bg-surface px-4 text-text"
      />
    </label>
  );
}

export function SpinAuth() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}
