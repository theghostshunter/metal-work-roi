
import React from 'react';
type Props = { value: number[], onValueChange: (v:number[])=>void, min?: number, max?: number, step?: number };
export function Slider({value, onValueChange, min=0, max=100, step=1}: Props) {
  const v = value[0];
  return (
    <input type="range" min={min} max={max} step={step}
      value={v} onChange={(e)=>onValueChange([Number(e.target.value)])}
      className="w-full" />
  );
}
