function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMarkdown(md: string): string {
  let html = md
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_m, lang, code) =>
        `<pre class="rounded-lg bg-code-bg p-4 my-3 overflow-x-auto text-sm"><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`,
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-code-bg px-1.5 py-0.5 text-sm text-cyan">$1</code>',
    )
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold mt-5 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 gradient-text">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 gradient-text">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, '<hr class="border-border my-4" />')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>')
    .replace(
      /^\d+\. (.+)$/gm,
      '<li class="ml-4 list-decimal text-sm leading-relaxed">$1</li>',
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
    );

  html = html.replace(
    /((?:<li class="ml-4 list-disc[^"]*">.*?<\/li>\n?)+)/g,
    '<ul class="my-2 space-y-1">$1</ul>',
  );
  html = html.replace(
    /((?:<li class="ml-4 list-decimal[^"]*">.*?<\/li>\n?)+)/g,
    '<ol class="my-2 space-y-1">$1</ol>',
  );

  return html
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("</")
      ) {
        return line;
      }
      return `<p class="text-sm leading-relaxed text-muted-foreground mb-2">${trimmed}</p>`;
    })
    .join("\n");
}
