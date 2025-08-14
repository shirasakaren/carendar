// Minimal TipTap-JSON -> sanitized HTML renderer for the public event
// detail modal. Supports the node + mark vocabulary the admin editor
// emits in Phase 3. Anything unknown degrades to its inner content.

type TipTapMark = { type: string; attrs?: Record<string, unknown> };
type TipTapNode = {
  type: string;
  content?: TipTapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TipTapMark[];
};

export function renderTipTapToHtml(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const root = doc as TipTapNode;
  if (root.type !== "doc" || !root.content) return "";
  return root.content.map(renderNode).join("");
}

function renderNode(node: TipTapNode): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${renderChildren(node)}</p>`;
    case "heading": {
      const attrs = (node.attrs ?? {}) as { level?: number };
      const lvl = Math.min(Math.max(Number(attrs.level ?? 2), 1), 4);
      return `<h${lvl}>${renderChildren(node)}</h${lvl}>`;
    }
    case "bulletList":
      return `<ul>${renderChildren(node)}</ul>`;
    case "orderedList":
      return `<ol>${renderChildren(node)}</ol>`;
    case "listItem":
      return `<li>${renderChildren(node)}</li>`;
    case "blockquote":
      return `<blockquote>${renderChildren(node)}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${escapeHtml(textOf(node))}</code></pre>`;
    case "horizontalRule":
      return `<hr/>`;
    case "hardBreak":
      return `<br/>`;
    case "image": {
      const a = (node.attrs ?? {}) as { src?: string; alt?: string };
      const src = safeUrl(a.src);
      if (!src) return "";
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(a.alt ?? "")}" />`;
    }
    case "youtube": {
      const a = (node.attrs ?? {}) as { src?: string };
      const src = safeUrl(a.src);
      if (!src) return "";
      return `<div class="mgm-embed"><iframe src="${escapeAttr(src)}" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    }
    case "audio": {
      const a = (node.attrs ?? {}) as { src?: string };
      const src = safeUrl(a.src);
      if (!src) return "";
      return `<audio controls preload="metadata" src="${escapeAttr(src)}"></audio>`;
    }
    case "text": {
      let out = escapeHtml(node.text ?? "");
      for (const mark of node.marks ?? []) out = applyMark(out, mark);
      return out;
    }
    default:
      return renderChildren(node);
  }
}

function renderChildren(node: TipTapNode): string {
  if (!node.content) return "";
  return node.content.map(renderNode).join("");
}

function applyMark(html: string, mark: TipTapMark): string {
  switch (mark.type) {
    case "bold":
      return `<strong>${html}</strong>`;
    case "italic":
      return `<em>${html}</em>`;
    case "underline":
      return `<u>${html}</u>`;
    case "strike":
      return `<s>${html}</s>`;
    case "code":
      return `<code>${html}</code>`;
    case "link": {
      const a = (mark.attrs ?? {}) as { href?: string };
      const href = safeUrl(a.href) ?? "#";
      return `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer noopener">${html}</a>`;
    }
    default:
      return html;
  }
}

function textOf(node: TipTapNode): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(textOf).join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function safeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) return null;
  // Only allow http(s), data:image (for inline pasted images), mailto, and relative.
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("/") ||
    lower.startsWith("data:image/")
  ) {
    return t;
  }
  // Relative paths without scheme are fine too.
  if (!lower.includes(":")) return t;
  return null;
}
