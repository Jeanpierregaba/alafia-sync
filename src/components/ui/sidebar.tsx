
import * as React from "react"
import { cn } from "@/lib/utils"
import { useMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  children?: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const isMobile = useMobile();
  
  return (
    <aside className={cn(
      "border-r flex-col hidden md:flex",
      isMobile ? "w-[50vw]" : "w-60"
    )}>
      {children}
    </aside>
  )
}
