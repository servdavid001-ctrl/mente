'use client';

import type { ReactNode } from 'react';

/** cuerpo del grid 2x3 durante carga (sin shimmer si reduced motion) */
export default function EsqueletosGrid(): ReactNode {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 xl:grid-cols-4 xl:gap-4">
      {Array.from({ length: 6 }, (_, n) => (
        <div
          key={n}
          className="anim-shimmer h-56 rounded-card bg-gradient-to-r from-border via-surface to-border"
        />
      ))}
    </div>
  );
}
