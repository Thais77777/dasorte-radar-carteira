import clsx from 'clsx';
import React from 'react';

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', className)}>
      {children}
    </span>
  );
}
