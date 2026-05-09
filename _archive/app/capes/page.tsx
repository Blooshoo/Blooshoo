import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Capes",
  description:
    "The blooshoo cape — be mysterious, do a flourish. Available in 5 colors.",
};

export default function CapesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="content-block">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-heading">
            The blooshoo Cape
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            It&apos;s time for capes to make a comeback.
          </p>
        </div>

        {/* Hero image — the product shot */}
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-8 border border-border">
          <Image
            src="/images/capes.jpg"
            alt="Five blooshoo capes hanging on a rack — purple, black, red, blue, and green"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Description */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-lg leading-relaxed text-foreground">
            Now you can really be mysterious and do a flourish anywhere you like!
            In your home! At the Beach! While giggling! Frolicking in a field!
            The options are literally <span className="font-heading text-primary text-2xl">Endless!</span>
          </p>
        </div>

        {/* Price + Sold Out */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-heading text-muted-foreground line-through decoration-destructive decoration-2">
              $49.99
            </span>
            <span
              className="px-3 py-1 text-sm font-bold uppercase tracking-widest rounded"
              style={{
                background: "rgba(255, 68, 102, 0.15)",
                color: "#ff4466",
                border: "1px solid rgba(255, 68, 102, 0.3)",
              }}
            >
              Sold Out
            </span>
          </div>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            <Link
              href="/contact"
              className="text-primary hover:underline transition-colors"
            >
              Use the contact page
            </Link>{" "}
            to reach out to us to be put on the waiting list.
          </p>
        </div>

        {/* Image gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Lifestyle shot — field */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border group">
            <Image
              src="/images/capeladies1.png"
              alt="Five women showing off colorful blooshoo capes in a sunny field"
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              unoptimized
            />
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-xs text-white/80 font-heading">
                Frolicking in a field ✓
              </p>
            </div>
          </div>

          {/* Lifestyle shot — giggling */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border group">
            <Image
              src="/images/capefun.jpg"
              alt="Five women laughing and having fun wearing blooshoo capes indoors"
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              unoptimized
            />
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-xs text-white/80 font-heading">
                While giggling ✓
              </p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="text-center mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Available in 5 colors
          </p>
          <div className="flex justify-center gap-3">
            {[
              { color: "#8B00FF", name: "Purple" },
              { color: "#111111", name: "Black" },
              { color: "#DD0000", name: "Red" },
              { color: "#0055FF", name: "Blue" },
              { color: "#00AA44", name: "Green" },
            ].map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
                <span className="text-[10px] text-muted-foreground">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center border-t border-border pt-8">
          <p className="text-muted-foreground text-sm mb-4">
            Don&apos;t miss the next batch —
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded font-heading text-lg transition-colors"
            style={{
              border: "1px solid var(--accent-teal)",
              color: "var(--accent-teal)",
            }}
            onMouseEnter={undefined}
          >
            Join the Waiting List →
          </Link>
        </div>
      </div>
    </div>
  );
}
