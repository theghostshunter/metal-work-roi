
import React, { PropsWithChildren } from 'react';
export function Tabs({children}:{children:any}){ return <div>{children}</div> }
export function TabsList({children, className=''}:PropsWithChildren<{className?:string}>){ return <div className={`inline-flex rounded-lg border ${className}`}>{children}</div> }
export function TabsTrigger({value, active, onClick, children}:{value:string, active?:boolean, onClick?:()=>void, children:any}){
  return <button onClick={onClick} className={`px-3 py-1 text-sm ${active?'bg-black text-white':'bg-white'}`}>{children}</button>
}
export function TabsContent({children}:{children:any}){ return <div className="mt-2">{children}</div> }
