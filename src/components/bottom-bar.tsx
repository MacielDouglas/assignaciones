"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getPrimaryNav, isNavActive } from "@/components/dashboard-nav";
import type { MemberRole } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function BottomBar({ role }: { role: MemberRole }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < 6) return;
      if (delta > 0 && y > 96) {
        setHidden(true);
      } else if (delta < 0) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = getPrimaryNav(role);

  return (
    <div
      aria-hidden={hidden}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur transition-transform duration-300 ease-in-out supports-[backdrop-filter]:bg-background/80 md:hidden",
        hidden ? "pointer-events-none translate-y-full" : "translate-y-0",
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-4xl items-stretch justify-around px-2"
        aria-label="Navegação inferior"
      >
        {items.map((item) => {
          const active = isNavActive(
            pathname,
            item.href,
            items.map((primary) => primary.href),
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs sm:text-sm font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
