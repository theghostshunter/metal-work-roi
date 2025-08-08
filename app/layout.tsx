
import './globals.css';
import React from 'react';

export const metadata = { title: 'Metal Workshop ROI', description: 'ROI calculator' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900">{children}</body>
    </html>
  );
}
