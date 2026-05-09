"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/project-card";

// ─── Types ────────────────────────────────────────────────────────────
type Friend = { id: string; username: string | null; displayName: string; role: string };
type ProjectLink = { label: string; url: string };
type ProjectData = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  links: ProjectLink[];
  image: string | null;
  ownerType: string;
  ownerName: string | null;
  ownerId: string | null;
  featured: boolean | null;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// ─── Arc geometry (purely decorative — no names on arcs) ──────────────
const RAINBOW = ["#ff2222", "#ff8800", "#ffee00", "#44ee88", "#00aaff"] as const;
const HIGHLIGHT = "#00ffcc";

const VW = 900;
const VH = 500;

const ADMIN_Y = 20; // Blooshoo name centre in SVG coords
const TIP_L = 285;
const TIP_R = VW - TIP_L;
const ARC_TOP = 78;
const ARC_BOT = 458;
const CY1 = 178;
const CY2 = 358;
const CX_L = [16, 49, 82, 115, 148] as const;
const CX_R = CX_L.map((x) => VW - x) as unknown as readonly number[];

// ─── Sparkle spots around Blooshoo name ───────────────────────────────
const SPARKLE_SPOTS = [
  { x: -95, y: -22, color: "#ffffff", s: 6 },
  { x: 95, y: -22, color: "#ffee88", s: 5 },
  { x: -65, y: -34, color: "#aaffee", s: 7 },
  { x: 65, y: -34, color: "#ffffff", s: 5 },
  { x: -110, y: 4, color: "#ffee88", s: 6 },
  { x: 110, y: 4, color: "#aaffee", s: 7 },
  { x: -30, y: -40, color: "#ffffff", s: 5 },
  { x: 30, y: -40, color: "#ffee88", s: 6 },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────
function lArcPath(i: number) {
  return `M ${TIP_L} ${ARC_TOP} C ${CX_L[i]} ${CY1}, ${CX_L[i]} ${CY2}, ${TIP_L} ${ARC_BOT}`;
}
function rArcPath(i: number) {
  return `M ${TIP_R} ${ARC_TOP} C ${CX_R[i]} ${CY1}, ${CX_R[i]} ${CY2}, ${TIP_R} ${ARC_BOT}`;
}

function starPath(s: number) {
  if (s <= 0) return "";
  const inn = s * 0.15;
  return `M 0 ${-s} L ${inn} ${-inn} L ${s} 0 L ${inn} ${inn} L 0 ${s} L ${-inn} ${inn} L ${-s} 0 L ${-inn} ${-inn} Z`;
}

// Belt slot spacing in screen px — names slide this many px apart
const BELT_SLOT = 125;

// ─── Component ────────────────────────────────────────────────────────
export function FriendshipCircle({
  friends,
  adminProjects,
}: {
  friends: Friend[];
  adminProjects: ProjectData[];
}) {
  const admin =
    friends.find((f) => f.role === "admin" && f.username === "blooshoo") ??
    friends[0] ??
    null;
  // All non-admin friends, up to 9
  const arcFriends = friends.filter((f) => f.id !== admin?.id).slice(0, 9);

  // ── Selection: -1 = admin, 0+ = arcFriends index ────────────────
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [projs, setProjs] = useState<ProjectData[]>(adminProjects);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/${id}/projects`);
      setProjs(res.ok ? ((await res.json()) as ProjectData[]) : []);
    } catch {
      setProjs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAdmin = () => {
    if (selectedIdx === -1) return;
    setSelectedIdx(-1);
    setProjs(adminProjects);
  };

  const selectBelt = useCallback(
    (i: number) => {
      if (i === selectedIdx) return;
      setSelectedIdx(i);
      const f = arcFriends[i];
      if (f) fetchProjects(f.id);
    },
    [selectedIdx, arcFriends, fetchProjects],
  );

  const cycleBelt = (dir: 1 | -1) => {
    if (arcFriends.length === 0) return;
    const base = selectedIdx < 0 ? 0 : selectedIdx;
    const next = (base + dir + arcFriends.length) % arcFriends.length;
    selectBelt(next);
  };

  // Visual centre of the belt strip (for CSS offset calculation)
  const beltFocus = selectedIdx >= 0 ? selectedIdx : 0;

  // ── Sparkle effect ───────────────────────────────────────────────
  const [activeSparkles, setActiveSparkles] = useState<ReadonlySet<number>>(
    new Set(),
  );
  useEffect(() => {
    const run = () => {
      const n = Math.floor(Math.random() * 3) + 1;
      const picks = new Set<number>();
      while (picks.size < n)
        picks.add(Math.floor(Math.random() * SPARKLE_SPOTS.length));
      setActiveSparkles(picks);
      setTimeout(() => setActiveSparkles(new Set()), 560);
    };
    const id = setInterval(run, 1750);
    return () => clearInterval(id);
  }, []);

  // ── Neon title flicker ───────────────────────────────────────────
  const [flickering, setFlickering] = useState(false);
  useEffect(() => {
    const SEQ = [72, 55, 115, 44, 82, 40, 155] as const;
    let outer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      outer = setTimeout(
        () => {
          let ms = 0;
          SEQ.forEach((d, i) => {
            setTimeout(() => setFlickering(i % 2 === 0), ms);
            ms += d;
          });
          setTimeout(() => {
            setFlickering(false);
            schedule();
          }, ms);
        },
        3500 + Math.random() * 6500,
      );
    };
    schedule();
    return () => clearTimeout(outer);
  }, []);

  // Center column inset (matches arc tip x as % of VW)
  const sidePct = `${Math.round((TIP_L / VW) * 100)}%`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <section
        className="content-panel rounded-xl p-4 sm:p-6"
        style={{ borderColor: "rgba(0,255,204,0.2)" }}
      >
        {/* ── Neon title ───────────────────────────────────────────── */}
        <h1
          className="text-center text-2xl sm:text-3xl mb-6"
          style={{
            fontFamily: "var(--font-vt323), monospace",
            color: HIGHLIGHT,
            textShadow: flickering
              ? "none"
              : `0 0 14px ${HIGHLIGHT}80, 0 0 28px ${HIGHLIGHT}30`,
            opacity: flickering ? 0.11 : 1,
            transition: "opacity 0.025s linear, text-shadow 0.025s linear",
          }}
        >
          Blooshoo&apos;s Friendship Circle
        </h1>

        {/* ── Arc stage ────────────────────────────────────────────── */}
        <div className="relative w-full" style={{ aspectRatio: "9 / 5" }}>
          {/* SVG layer — arcs + Blooshoo name (purely visual) */}
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="absolute inset-0 w-full h-full"
            style={{ overflow: "visible" }}
          >
            <defs>
              <filter
                id="arc-glow"
                x="-120%"
                y="-120%"
                width="340%"
                height="340%"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="admin-glow"
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
              >
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="sparkle-glow"
                x="-300%"
                y="-300%"
                width="700%"
                height="700%"
              >
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Left rainbow arc */}
            {(RAINBOW as readonly string[]).map((color, i) => (
              <path
                key={`l${i}`}
                d={lArcPath(i)}
                fill="none"
                stroke={color}
                strokeWidth={12}
                strokeLinecap="round"
                filter="url(#arc-glow)"
              />
            ))}

            {/* Right rainbow arc */}
            {(RAINBOW as readonly string[]).map((color, i) => (
              <path
                key={`r${i}`}
                d={rArcPath(i)}
                fill="none"
                stroke={color}
                strokeWidth={12}
                strokeLinecap="round"
                filter="url(#arc-glow)"
              />
            ))}

            {/* Blooshoo — top centre, always sparkling */}
            {admin && (
              <g onClick={selectAdmin} style={{ cursor: "pointer" }}>
                {SPARKLE_SPOTS.map(
                  (sp, i) =>
                    activeSparkles.has(i) && (
                      <path
                        key={i}
                        d={starPath(sp.s)}
                        transform={`translate(${VW / 2 + sp.x}, ${ADMIN_Y + sp.y})`}
                        fill={sp.color}
                        filter="url(#sparkle-glow)"
                      />
                    ),
                )}
                <text
                  x={VW / 2}
                  y={ADMIN_Y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={32}
                  fontFamily="var(--font-vt323), monospace"
                  fill={HIGHLIGHT}
                  filter="url(#admin-glow)"
                  letterSpacing="4"
                >
                  {admin.displayName}
                </text>
              </g>
            )}
          </svg>

          {/* ── HTML centre overlay: belt + projects ─────────────── */}
          <div
            className="absolute"
            style={{
              left: sidePct,
              right: sidePct,
              top: "9%",
              bottom: "2%",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                pointerEvents: "auto",
              }}
            >
              {/* ── The Belt ─────────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                  borderBottom: "1px solid rgba(0,255,204,0.18)",
                  flexShrink: 0,
                }}
              >
                {/* Left arrow */}
                <button
                  onClick={() => cycleBelt(-1)}
                  disabled={arcFriends.length < 2}
                  style={{
                    fontFamily: "var(--font-vt323), monospace",
                    fontSize: "20px",
                    color:
                      arcFriends.length < 2
                        ? "transparent"
                        : `${HIGHLIGHT}cc`,
                    background: "none",
                    border: "none",
                    cursor: arcFriends.length < 2 ? "default" : "pointer",
                    padding: "0 4px",
                    flexShrink: 0,
                    textShadow:
                      arcFriends.length >= 2
                        ? `0 0 8px ${HIGHLIGHT}60`
                        : "none",
                  }}
                >
                  ◄
                </button>

                {/* Sliding name strip */}
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    height: "38px",
                    overflow: "hidden",
                  }}
                >
                  {arcFriends.length === 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-vt323), monospace",
                        color: `${HIGHLIGHT}38`,
                        fontSize: "15px",
                      }}
                    >
                      no friends yet...
                    </span>
                  ) : (
                    arcFriends.map((f, i) => {
                      const dist = i - beltFocus;
                      const absDist = Math.abs(dist);
                      if (absDist > 3) return null;
                      const isActive = selectedIdx === i;
                      return (
                        <button
                          key={f.id}
                          onClick={() => selectBelt(i)}
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: `translate(calc(-50% + ${dist * BELT_SLOT}px), -50%)`,
                            transition:
                              "transform 0.28s ease, opacity 0.28s ease, font-size 0.2s ease",
                            fontFamily: "var(--font-vt323), monospace",
                            fontSize: absDist === 0 ? "20px" : "14px",
                            color: isActive
                              ? HIGHLIGHT
                              : `rgba(190,190,215,${absDist === 0 ? 0.5 : absDist === 1 ? 0.32 : 0.14})`,
                            textShadow: isActive
                              ? `0 0 10px ${HIGHLIGHT}90`
                              : "none",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            padding: 0,
                            opacity: absDist >= 3 ? 0 : 1,
                          }}
                        >
                          {f.displayName}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => cycleBelt(1)}
                  disabled={arcFriends.length < 2}
                  style={{
                    fontFamily: "var(--font-vt323), monospace",
                    fontSize: "20px",
                    color:
                      arcFriends.length < 2
                        ? "transparent"
                        : `${HIGHLIGHT}cc`,
                    background: "none",
                    border: "none",
                    cursor: arcFriends.length < 2 ? "default" : "pointer",
                    padding: "0 4px",
                    flexShrink: 0,
                    textShadow:
                      arcFriends.length >= 2
                        ? `0 0 8px ${HIGHLIGHT}60`
                        : "none",
                  }}
                >
                  ►
                </button>
              </div>

              {/* ── Project content ───────────────────────────────── */}
              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {loading ? (
                  <p
                    className="text-center animate-pulse"
                    style={{
                      fontFamily: "var(--font-vt323), monospace",
                      color: "var(--muted-foreground)",
                      fontSize: "16px",
                    }}
                  >
                    Loading...
                  </p>
                ) : projs.length === 0 ? (
                  <p
                    className="text-center leading-relaxed"
                    style={{
                      fontFamily: "var(--font-vt323), monospace",
                      color: "var(--muted-foreground)",
                      fontSize: "16px",
                    }}
                  >
                    No projects listed.
                    <br />
                    {selectedIdx === -1 ? "Sad! :(" : "Probably a boring life :("}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {projs.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        links={p.links}
                        showOwner={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Join link ────────────────────────────────────────────── */}
        <div className="mt-4 text-center">
          <Link
            href="/contact"
            className="inline-block text-sm transition-all duration-200 hover:scale-105"
            style={{
              fontFamily: "var(--font-vt323), monospace",
              color: "var(--muted-foreground)",
              textDecoration: "none",
            }}
          >
            Request to join friendship circle{" "}
            <span role="img" aria-label="purple heart">
              💜
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
