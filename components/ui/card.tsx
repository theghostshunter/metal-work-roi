
import React, { PropsWithChildren } from 'react';
export function Card({ children, className='' }: PropsWithChildren<{className?: string}>) {
  return <div className={`rounded-2xl border border-neutral-200 bg-white ${className}`}>{children}</div>;
}
export function CardHeader({ children }: PropsWithChildren) {
  return <div className="px-4 pt-4"><div className="text-base font-semibold">{children}</div></div>;
}
export function CardTitle({ children }: PropsWithChildren) { return <div>{children}</div>; }
export function CardContent({ children, className='' }: PropsWithChildren<{className?: string}>) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
