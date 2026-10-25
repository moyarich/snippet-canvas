import hljs from "highlight.js/lib/common";

const LANGUAGE_ALIASES: Record<string, string> = {
  javascriptreact: "javascript",
  typescriptreact: "typescript",
  shellscript: "bash",
  plaintext: "plaintext",
  text: "plaintext",
  dockerfile: "dockerfile",
};

export const LANGUAGE_OPTIONS = [
  "auto", "typescript", "javascript", "tsx", "jsx", "html", "css", "scss",
  "json", "python", "java", "csharp", "cpp", "c", "go", "rust", "ruby",
  "php", "swift", "kotlin", "sql", "bash", "powershell", "yaml", "xml",
  "markdown", "dockerfile", "plaintext",
];

export function highlightCode(code: string, language: string) {
  const requested = LANGUAGE_ALIASES[language] ?? language;
  if (requested !== "auto" && hljs.getLanguage(requested)) {
    return { html: hljs.highlight(code, { language: requested }).value, language: requested };
  }
  const result = hljs.highlightAuto(code);
  return { html: result.value, language: result.language ?? "plaintext" };
}
