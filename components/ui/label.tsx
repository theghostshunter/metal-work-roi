
import React, { LabelHTMLAttributes } from 'react';
export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  const { className='', ...rest } = props;
  return <label className={`text-sm text-neutral-600 ${className}`} {...rest} />;
}
