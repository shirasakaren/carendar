import { Node, mergeAttributes } from "@tiptap/core";

// Plain <audio controls> node — block-level, atomic. Inserted via:
//   editor.chain().focus().insertContent({ type: "audio", attrs: { src } }).run()
export const Audio = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => el.getAttribute("src"),
        renderHTML: (attrs) => (attrs.src ? { src: attrs.src as string } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "audio[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(
        { controls: "controls", preload: "metadata", class: "mgm-audio" },
        HTMLAttributes,
      ),
    ];
  },
});
