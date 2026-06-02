"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopLoaderInner() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Stop loading on route change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (visible && progress < 90) {
      const diff = Math.random() * 8;
      timer = setTimeout(() => {
        setProgress((prev) => Math.min(prev + diff, 90));
      }, 150);
    }

    return () => clearTimeout(timer);
  }, [visible, progress]);

  useEffect(() => {
    const handleStart = () => {
      setVisible(true);
      setProgress(10);
    };

    const handleStop = () => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    };

    window.addEventListener("loading-start", handleStart);
    window.addEventListener("loading-stop", handleStop);

    // Global click listener for <a> tags to capture navigation starting points
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const targetAttr = anchor.getAttribute("target");

        // Only trigger for internal links that don't open in a new tab or are anchors
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("/#") &&
          targetAttr !== "_blank"
        ) {
          const currentUrl = window.location.pathname + window.location.search;
          if (href !== currentUrl) {
            handleStart();
          }
        }
      }
    };

    document.addEventListener("click", handleLinkClick);

    return () => {
      window.removeEventListener("loading-start", handleStart);
      window.removeEventListener("loading-stop", handleStop);
      document.removeEventListener("click", handleLinkClick);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[100000] h-[3px] bg-emerald-600 shadow-[0_1px_10px_rgba(16,185,129,0.5)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center bg-slate-50/40 backdrop-blur-sm transition-opacity duration-300 ${
          progress === 100 ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-600 shadow-sm" />
          <p className="text-sm font-bold text-slate-600 animate-pulse">Memuat...</p>
        </div>
      </div>
    </>
  );
}

export default function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}
