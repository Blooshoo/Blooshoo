"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Color,
      TextStyle,
      LinkExtension.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-[#00aaff] underline hover:text-[#00ffcc] transition-colors",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[320px] px-4 py-3 focus:outline-none text-[#e8e8e8] font-mono text-sm leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  const handleSetLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const handleAddImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  if (!editor) {
    return (
      <div className="border border-[rgba(0,255,204,0.15)] rounded-lg min-h-[320px] bg-[#0a0a0f] flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading editor…</span>
      </div>
    );
  }

  return (
    <div className="border border-[rgba(0,255,204,0.15)] rounded-lg overflow-hidden bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[rgba(0,255,204,0.1)] bg-[rgba(0,255,204,0.03)]">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("bold")
              ? "bg-[#00ffcc] text-[#0a0a0f]"
              : "text-[#e8e8e8] hover:bg-[rgba(0,255,204,0.1)]"
          }`}
          title="Bold"
        >
          <Bold className="size-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("italic")
              ? "bg-[#00ffcc] text-[#0a0a0f]"
              : "text-[#e8e8e8] hover:bg-[rgba(0,255,204,0.1)]"
          }`}
          title="Italic"
        >
          <Italic className="size-3.5" />
        </button>

        <span className="w-px h-4 bg-[rgba(0,255,204,0.15)] mx-0.5" />

        {/* H1 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("heading", { level: 1 })
              ? "bg-[#00ffcc] text-[#0a0a0f]"
              : "text-[#e8e8e8] hover:bg-[rgba(0,255,204,0.1)]"
          }`}
          title="Heading 1"
        >
          <Heading1 className="size-3.5" />
        </button>

        {/* H2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-[#00ffcc] text-[#0a0a0f]"
              : "text-[#e8e8e8] hover:bg-[rgba(0,255,204,0.1)]"
          }`}
          title="Heading 2"
        >
          <Heading2 className="size-3.5" />
        </button>

        <span className="w-px h-4 bg-[rgba(0,255,204,0.15)] mx-0.5" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("bulletList")
              ? "bg-[#00ffcc] text-[#0a0a0f]"
              : "text-[#e8e8e8] hover:bg-[rgba(0,255,204,0.1)]"
          }`}
          title="Bullet list"
        >
          <List className="size-3.5" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("orderedList")
              ? "bg-[#00ffcc] text-[#0a0a0f]"
              : "text-[#e8e8e8] hover:bg-[rgba(0,255,204,0.1)]"
          }`}
          title="Ordered list"
        >
          <ListOrdered className="size-3.5" />
        </button>

        <span className="w-px h-4 bg-[rgba(0,255,204,0.15)] mx-0.5" />

        {/* Link */}
        <button
          type="button"
          onClick={() => {
            const currentUrl = editor.getAttributes("link").href;
            setLinkUrl(currentUrl || "");
            setShowLinkInput(true);
            setShowImageInput(false);
          }}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("link")
              ? "bg-[#00ffcc] text-[#0a0a0f]"
              : "text-[#e8e8e8] hover:bg-[rgba(0,255,204,0.1)]"
          }`}
          title="Link"
        >
          <LinkIcon className="size-3.5" />
        </button>

        {/* Image */}
        <button
          type="button"
          onClick={() => {
            setImageUrl("");
            setShowImageInput(true);
            setShowLinkInput(false);
          }}
          className="p-1.5 rounded text-xs text-[#e8e8e8] hover:bg-[rgba(0,255,204,0.1)] transition-colors"
          title="Image"
        >
          <ImageIcon className="size-3.5" />
        </button>

        {/* Color picker */}
        <span className="w-px h-4 bg-[rgba(0,255,204,0.15)] mx-0.5" />
        <input
          type="color"
          onInput={(e) =>
            editor.chain().focus().setColor(e.currentTarget.value).run()
          }
          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
          title="Text color"
        />
      </div>

      {/* Inline popover for link URL */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-[rgba(0,255,204,0.04)] border-b border-[rgba(0,255,204,0.08)]">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 h-7 px-2 text-xs rounded border border-[rgba(0,255,204,0.2)] bg-[#0a0a0f] text-[#e8e8e8] focus:outline-none focus:border-[#00ffcc] placeholder:text-muted-foreground font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSetLink();
              }
              if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
          />
          <button
            type="button"
            onClick={handleSetLink}
            className="px-2 py-0.5 text-xs rounded border border-[rgba(0,255,204,0.3)] text-[#00ffcc] hover:bg-[#00ffcc] hover:text-[#0a0a0f] transition-colors font-mono"
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="text-xs text-muted-foreground hover:text-[#e8e8e8]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Inline popover for image URL */}
      {showImageInput && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-[rgba(0,255,204,0.04)] border-b border-[rgba(0,255,204,0.08)]">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 h-7 px-2 text-xs rounded border border-[rgba(0,255,204,0.2)] bg-[#0a0a0f] text-[#e8e8e8] focus:outline-none focus:border-[#00ffcc] placeholder:text-muted-foreground font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddImage();
              }
              if (e.key === "Escape") {
                setShowImageInput(false);
                setImageUrl("");
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="px-2 py-0.5 text-xs rounded border border-[rgba(0,255,204,0.3)] text-[#00ffcc] hover:bg-[#00ffcc] hover:text-[#0a0a0f] transition-colors font-mono"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowImageInput(false);
              setImageUrl("");
            }}
            className="text-xs text-muted-foreground hover:text-[#e8e8e8]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
