import clsx from 'clsx';
import React from 'react';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>{children}</div>;
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('border-b border-slate-100 px-5 py-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx('text-sm font-semibold text-slate-700', className)}>{children}</h3>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  onClick?: () => void;
}) {
  const toneClasses: Record<string, string> = {
    default: 'text-slate-900',
    danger: 'text-red-600',
    warning: 'text-orange-600',
    success: 'text-emerald-600',
    info: 'text-blue-600',
  };
  return (
    <Card className={clsx('px-5 py-4', onClick && 'cursor-pointer transition hover:shadow-md')} {...(onClick ? { onClick } : {})}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {icon}
      </div>
      <div className={clsx('mt-1 text-2xl font-bold', toneClasses[tone])}>{value}</div>
    </Card>
  );
}
