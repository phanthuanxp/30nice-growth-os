"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname === "/login") {
      return;
    }
    const payload = JSON.stringify({ path: pathname, referrer: document.referrer || undefined });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
      }
    } catch {
      // tracking must never break the page
    }
  }, [pathname]);

  return null;
}
