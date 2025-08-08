
import React, { ButtonHTMLAttributes } from 'react';
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'default'|'outline'}) {
  const { variant='default', className='', ...rest } = props;
  const base = 'px-3 py-2 rounded-xl text-sm';
  const styles = variant==='outline' ? 'border border-neutral-300 bg-white' : 'bg-black text-white';
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}
