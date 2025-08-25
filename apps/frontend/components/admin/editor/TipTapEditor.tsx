"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { Audio } from "./extensions/audio";
import { EditorToolbar } from "./EditorToolbar";
import { adminUpload } from "@/lib/admin-api";

interface Props {
  initialContent?: unknown;
  onUpdate: (doc: unknown) => void;
}

export function TipTapEditor({ initialContent, onUpdate }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: "_blank", rel: "noreferrer noopener" },
      }),
      Image,
      Youtube.configure({ controls: true, nocookie: true }),
      Placeholder.configure({
        placeholder: "Tulis deskripsi acara di sini…",
      }),
      Audio,
    ],
    content: (initialContent as object | undefined) ?? "",
    editorProps: {
      attributes: {
        class:
          "mgm-rich min-h-[400px] max-w-none focus:outline-none px-5 py-4 prose-base",
      },
    },
    onUpdate: ({ editor }) => onUpdate(editor.getJSON()),
  });

  if (!editor) {
    return (
      <div className="rounded border border-line bg-white min-h-[480px]" />
    );
  }

  return (
    <div className="rounded border border-line bg-white overflow-hidden focus-within:border-line-strong transition-colors">
      <EditorToolbar editor={editor} onUpload={adminUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}
