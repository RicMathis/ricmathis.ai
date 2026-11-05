import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Part 107 Sky Academy — Drone Pilot Test Prep",
  description:
    "A free study game for the FAA Part 107 Remote Pilot knowledge test: topic missions, flashcards, a lightning round and a full 60-question mock exam.",
  alternates: { canonical: "/drone" },
};

/**
 * /drone — hosts the Part 107 study game.
 * The game itself is a static app in public/drone/ (index.html, app.js, data.js, styles.css),
 * so it keeps its own styles and saved progress apart from the rest of the site.
 */
export default function DronePage() {
  return (
    <main id="main" className="bg-canvas">
      <h1 className="sr-only">Part 107 Sky Academy — drone pilot test prep</h1>
      <iframe
        src="/drone/index.html"
        title="Part 107 Sky Academy study game"
        className="block w-full border-0"
        style={{ height: "calc(100dvh - 4rem)", minHeight: 640 }}
      />
    </main>
  );
}
