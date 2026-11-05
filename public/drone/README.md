# Part 107 Sky Academy

A study game for the FAA Part 107 Remote Pilot knowledge test. Plain HTML/CSS/JS with no build step and no dependencies.

**Run it:** open `index.html` in a browser, or serve the folder (`npx serve public/drone`). On the website it appears at **ricmathis.ai/drone** through `src/app/drone/page.tsx`, which embeds `public/drone/index.html`.

## Modes
- **Missions**: six topic flights (Regulations, Airspace & Charts, Weather, Loading & Performance, Operations, Decision Making). Each has 10 questions and a 3-cell battery; every miss drains a cell. Earn 1–3 stars, and clearing a mission unlocks the next one.
- **Ground School**: 40 flip flashcards with the key numbers and acronyms, filterable by topic.
- **Lightning Round**: 90 seconds, with 5 seconds off for every miss.
- **Checkride**: 60-question mock exam weighted across the knowledge areas, 2-hour timer, 70% to pass, question flagging, results by topic, and a full review.
- **Debrief**: re-fly only the questions you last got wrong.

The game also has XP, ranks, streaks and 12 badges. Progress is saved in the browser's localStorage. Keyboard: 1–4 or A–D to answer, Enter for the next question, arrow keys for flashcards and exam navigation.

## Editing content
All questions and flashcards are in `data.js`. List the correct answer at index `c`; answers are shuffled at runtime. Every question has an explanation and a 14 CFR / FAA handbook reference.

Rules change, so check content against current FAA publications (FAA-G-8082-22 and 14 CFR Part 107).
