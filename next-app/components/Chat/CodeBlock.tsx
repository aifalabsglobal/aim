"use client";

import { useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import vs from "react-syntax-highlighter/dist/esm/styles/prism/vs";
import { useTheme } from "@/context/ThemeContext";

const LANG_LABELS: Record<string, string> = {
  js: "JavaScript",
  ts: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  py: "Python",
  json: "JSON",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  bash: "Bash",
  sh: "Shell",
  sql: "SQL",
  md: "Markdown",
  yaml: "YAML",
  yml: "YAML",
};

export default function CodeBlock({ language = "javascript", code }: { language?: string; code: string }) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const style = theme === "dark" ? vscDarkPlus : vs;
  const langKey = language.toLowerCase().replace(/^language-/, "");
  const label = LANG_LABELS[langKey] ?? langKey;

  return (
    <div className="aifa-code-block">
      <div className="aifa-code-header">
        <div className="aifa-code-header-left">
          <FileCode className="aifa-code-icon" aria-hidden />
          <span className="aifa-code-lang">{label}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="aifa-code-copy"
          title="Copy code"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="aifa-code-copy-icon" aria-hidden />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="aifa-code-copy-icon" aria-hidden />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="aifa-code-wrap scrollbar-thin">
        <SyntaxHighlighter
          language={langKey}
          style={style}
          customStyle={{
            margin: 0,
            padding: "1rem 1rem 1rem 0.5rem",
            borderRadius: 0,
            background: "transparent",
            fontSize: "13px",
            lineHeight: 1.5,
            minHeight: "2rem",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
            },
          }}
          showLineNumbers
          lineNumberStyle={{
            minWidth: "2.25em",
            paddingRight: "1em",
            color: "var(--text-muted)",
            userSelect: "none",
            textAlign: "right",
          }}
          lineNumberContainerStyle={{
            paddingTop: "1rem",
            paddingBottom: "1rem",
          }}
          PreTag="div"
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
