"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders Markdown as an interactive mindmap using markmap (https://markmap.js.org/).
 * Use ```markmap in chat with Markdown content (headers # ## ### or lists).
 */
export default function MarkmapBlock({ markdown }: { markdown: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ destroy?: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!markdown?.trim() || !containerRef.current) return;
    setError(null);

    (async () => {
      try {
        if (instanceRef.current?.destroy) {
          instanceRef.current.destroy();
          instanceRef.current = null;
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        const [{ Transformer }, markmapView] = await Promise.all([
          import("markmap-lib").then((m) => m),
          import("markmap-view"),
        ]);

        const transformer = new Transformer();
        const { root, features } = transformer.transform(markdown.trim());
        const assets = transformer.getUsedAssets(features);

        const { Markmap, loadCSS, loadJS } = markmapView;

        if (assets?.styles) {
          await loadCSS(assets.styles);
        }
        if (assets?.scripts) {
          await loadJS(assets.scripts, {
            getMarkmap: () => markmapView,
          });
        }

        if (!containerRef.current) return;
        const svg = document.createElement("svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "400");
        svg.setAttribute("class", "markmap-svg");
        containerRef.current.appendChild(svg);

        instanceRef.current = Markmap.create(svg, undefined, root);
      } catch (err) {
        setError((err as Error).message ?? "Failed to render markmap");
      }
    })();

    return () => {
      if (instanceRef.current?.destroy) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, [markdown]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <p className="font-medium">Markmap could not be rendered</p>
        <p className="mt-1 text-xs opacity-90">{error}</p>
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-[var(--bg-tertiary)] p-2 text-xs font-mono text-[var(--text-secondary)]">
          {markdown}
        </pre>
      </div>
    );
  }

  return (
    <div className="aifa-markmap-block my-4 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
      <div ref={containerRef} className="min-h-[300px] w-full" />
    </div>
  );
}
