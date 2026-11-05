import type { ReactElement } from 'react';
import type { TabId } from '@/lib/types';

/** iconos compartidos entre BottomNav (24px) y Sidebar (20px) */
export default function IconoNav(props: { tab: TabId; className?: string }): ReactElement {
  const base = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: props.className ?? 'h-6 w-6'
  };

  if (props.tab === 'foco') {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="8.25" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.5" fill="currentColor" />
      </svg>
    );
  }

  if (props.tab === 'bandeja') {
    return (
      <svg {...base}>
        <path d="M3.75 6.75h16.5v10a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-10Z" />
        <path d="M3.75 12.5h5.2a3.05 3.05 0 0 0 6.1 0h5.2" />
      </svg>
    );
  }

  if (props.tab === 'biblioteca') {
    return (
      <svg {...base}>
        <path d="M4 8.5 12 4.25 20 8.5 12 12.75 4 8.5Z" />
        <path d="M4 13.25 12 17.5l8-4.25" />
      </svg>
    );
  }

  return (
    <svg {...base}>
      <path d="M4 7h9" />
      <path d="M18 7h2" />
      <path d="M4 17h2" />
      <path d="M11 17h9" />
      <circle cx="15.5" cy="7" r="2.25" />
      <circle cx="8.5" cy="17" r="2.25" />
    </svg>
  );
}
