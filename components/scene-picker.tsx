"use client";

import { useState, useEffect, useRef } from "react";

// ---- Types ----

interface SceneInfo {
  name: string;
  mode: string;
  color: string;
}

// ---- The Scene Picker ----

export function ScenePicker() {
  const [open, setOpen] = useState(false);
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [currentScene, setCurrentScene] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // On mount, request the scene list from CanvasBackground
  useEffect(() => {
    const handleScenesList = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.scenes) setScenes(detail.scenes);
      if (detail?.current) setCurrentScene(detail.current);
    };

    window.addEventListener("blooshoo:scenes-list", handleScenesList);
    // Ask for the list
    window.dispatchEvent(new CustomEvent("blooshoo:request-scenes"));

    return () => {
      window.removeEventListener("blooshoo:scenes-list", handleScenesList);
    };
  }, []);

  // Re-request scenes when menu opens (in case list changed)
  useEffect(() => {
    if (open) {
      window.dispatchEvent(new CustomEvent("blooshoo:request-scenes"));
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function selectScene(name: string) {
    window.dispatchEvent(
      new CustomEvent("blooshoo:switch-scene", { detail: { name } }),
    );
    setOpen(false);
  }

  return (
    <span className="relative inline">
      {/* The clickable "s" — subtle teal tint + dotted underline */}
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
        }}
        className="cursor-pointer text-primary/70 hover:text-primary transition-colors underline decoration-dotted underline-offset-2 select-none"
        title="Pick a scene…"
        aria-label="Scene picker"
      >
        s
      </span>

      {/* Popup menu */}
      {open && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border border-border rounded-lg shadow-xl p-2 min-w-[180px] z-50"
        >
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1 mb-1">
            Scene Picker
          </span>
          {scenes.length === 0 && (
            <span className="block text-xs text-muted-foreground px-2 py-1">
              Loading…
            </span>
          )}
          {scenes.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => selectScene(s.name)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                s.name === currentScene
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
