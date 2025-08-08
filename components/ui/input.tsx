
import React, { InputHTMLAttributes } from 'react';
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className='', ...rest } = props;
  return <input className={`h-9 rounded-lg border border-neutral-300 px-3 ${className}`} {...rest} />;
}
