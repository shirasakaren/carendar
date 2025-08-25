"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Link2,
  Image as ImageIcon,
  Paperclip,
  AudioLines,
  Youtube as YoutubeIcon,
  Undo2,
  Redo2,
} from "lucide-react";
import type { UploadResult } from "@/lib/admin-api";

interface Props {
  editor: Editor;
  onUpload: (file: File) => Promise<UploadResult>;
}

export function EditorToolbar({ editor, onUpload }: Props) {
  const [busy, setBusy] = useState<null | "image" | "file" | "audio">(null);

  function pickFile(accept: string): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      if (accept) input.accept = accept;
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.click();
    });
  }

  async function insertImage() {
    const f = await pickFile("image/*");
    if (!f) return;
    setBusy("image");
    try {
      const res = await onUpload(f);
      editor.chain().focus().setImage({ src: res.url, alt: res.name }).run();
    } finally {
      setBusy(null);
    }
  }

  async function insertAudio() {
    const f = await pickFile("audio/*");
    if (!f) return;
    setBusy("audio");
    try {
      const res = await onUpload(f);
      editor
        .chain()
        .focus()
        .insertContent({ type: "audio", attrs: { src: res.url } })
        .run();
    } finally {
      setBusy(null);
    }
  }

  async function insertFile() {
    const f = await pickFile("");
    if (!f) return;
    setBusy("file");
    try {
      const res = await onUpload(f);
      const safeName = res.name.replace(/[<>&"']/g, "");
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${res.url}" target="_blank" rel="noreferrer noopener">${safeName}</a>`,
        )
        .run();
    } finally {
      setBusy(null);
    }
  }

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Masukkan URL:", previous ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function setYoutube() {
    const url = window.prompt("Masukkan URL YouTube:");
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-muted/50 px-2 py-1.5">
      <Group>
        <Btn
          icon={<Bold className="h-4 w-4" strokeWidth={2.25} />}
          label="Tebal"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Btn
          icon={<Italic className="h-4 w-4" strokeWidth={2.25} />}
          label="Miring"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <Btn
          icon={<UnderlineIcon className="h-4 w-4" strokeWidth={2.25} />}
          label="Garis bawah"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <Btn
          icon={<Strikethrough className="h-4 w-4" strokeWidth={2.25} />}
          label="Coret"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      </Group>

      <Divider />

      <Group>
        <Btn
          icon={<Heading1 className="h-4 w-4" strokeWidth={2.25} />}
          label="Judul 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <Btn
          icon={<Heading2 className="h-4 w-4" strokeWidth={2.25} />}
          label="Judul 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <Btn
          icon={<Heading3 className="h-4 w-4" strokeWidth={2.25} />}
          label="Judul 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
      </Group>

      <Divider />

      <Group>
        <Btn
          icon={<List className="h-4 w-4" strokeWidth={2.25} />}
          label="Daftar berpoin"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Btn
          icon={<ListOrdered className="h-4 w-4" strokeWidth={2.25} />}
          label="Daftar bernomor"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <Btn
          icon={<Quote className="h-4 w-4" strokeWidth={2.25} />}
          label="Kutipan"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <Btn
          icon={<Code2 className="h-4 w-4" strokeWidth={2.25} />}
          label="Blok kode"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <Btn
          icon={<Minus className="h-4 w-4" strokeWidth={2.25} />}
          label="Garis horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </Group>

      <Divider />

      <Group>
        <Btn
          icon={<Link2 className="h-4 w-4" strokeWidth={2.25} />}
          label="Tautan"
          active={editor.isActive("link")}
          onClick={setLink}
        />
        <Btn
          icon={<ImageIcon className="h-4 w-4" strokeWidth={2.25} />}
          label="Gambar"
          loading={busy === "image"}
          onClick={insertImage}
        />
        <Btn
          icon={<Paperclip className="h-4 w-4" strokeWidth={2.25} />}
          label="Lampiran file"
          loading={busy === "file"}
          onClick={insertFile}
        />
        <Btn
          icon={<AudioLines className="h-4 w-4" strokeWidth={2.25} />}
          label="Audio"
          loading={busy === "audio"}
          onClick={insertAudio}
        />
        <Btn
          icon={<YoutubeIcon className="h-4 w-4" strokeWidth={2.25} />}
          label="YouTube"
          onClick={setYoutube}
        />
      </Group>

      <Divider />

      <Group>
        <Btn
          icon={<Undo2 className="h-4 w-4" strokeWidth={2.25} />}
          label="Urungkan"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <Btn
          icon={<Redo2 className="h-4 w-4" strokeWidth={2.25} />}
          label="Ulangi"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </Group>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;
}

function Btn({
  icon,
  label,
  onClick,
  active,
  disabled,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled || loading}
      className={`h-8 w-8 rounded-sm grid place-items-center transition-colors duration-120 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue ${
        active
          ? "bg-brand-blue-50 text-brand-blue"
          : "text-ink-2 hover:bg-white hover:text-ink"
      }`}
    >
      {loading ? (
        <span className="h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
      ) : (
        icon
      )}
    </button>
  );
}
