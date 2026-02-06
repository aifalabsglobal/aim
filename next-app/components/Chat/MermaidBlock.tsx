"use client";

import { useEffect, useRef, useState } from "react";

export default function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!code?.trim() || !containerRef.current) return;
    let cancelled = false;
    setError(null);
    setSvg(null);

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          fontFamily: "var(--font-sans)",
        });
        const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
        const { svg: out } = await mermaid.render(id, code.trim());
        if (!cancelled) setSvg(out);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || "Failed to render diagram");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <p className="font-medium">Diagram could not be rendered</p>
        <p className="mt-1 text-xs opacity-90">{error}</p>
        <pre className="mt-2 overflow-x-auto rounded bg-[var(--bg-tertiary)] p-2 text-xs font-mono text-[var(--text-secondary)]">
          {code}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 flex min-h-[120px] items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <span className="text-sm text-[var(--text-muted)]">Rendering diagram…</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="aifa-mermaid-block my-4 flex justify-center overflow-x-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 scrollbar-thin"
    >
      <div dangerouslySetInnerHTML={{ __html: svg }} className="[&_svg]:max-w-full [&_svg]:h-auto" />
    </div>
  );
}
