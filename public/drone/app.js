/* Part 107 Sky Academy — game logic. Plain JS, no build step. */
(function () {
  "use strict";

  const TOPICS = window.TOPICS;
  const QUESTIONS = window.QUESTIONS.map((q, id) => ({ ...q, id }));
  const FLASHCARDS = window.FLASHCARDS;
  const topicById = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

  const MISSION_LEN = 10;
  const BATTERY = 3;
  const LIGHTNING_SECONDS = 90;
  const EXAM_LEN = 60;
  const EXAM_MINUTES = 120;
  const PASS = 0.7;
  // Roughly follows the FAA test's weighting by area.
  const EXAM_MIX = { regs: 13, air: 13, wx: 9, perf: 6, ops: 11, adm: 8 };

  const RANKS = [
    { xp: 0, name: "Student Pilot" },
    { xp: 150, name: "Ground Crew" },
    { xp: 400, name: "Visual Observer" },
    { xp: 800, name: "Remote Pilot" },
    { xp: 1400, name: "Senior Remote Pilot" },
    { xp: 2200, name: "Chief Pilot" }
  ];

  const BADGES = [
    { id: "first", ico: "🛫", name: "First Flight", desc: "Finish any mission" },
    { id: "perfect", ico: "🎯", name: "Bullseye", desc: "3 stars on a mission" },
    { id: "streak5", ico: "🔥", name: "Hot Streak", desc: "5 right in a row" },
    { id: "streak10", ico: "☄️", name: "Afterburner", desc: "10 right in a row" },
    { id: "allmissions", ico: "🗺️", name: "Cross-Country", desc: "Clear every mission" },
    { id: "ace", ico: "🏆", name: "Ace", desc: "3 stars on every mission" },
    { id: "lightning", ico: "⚡", name: "Quick Draw", desc: "15+ in Lightning Round" },
    { id: "flash", ico: "🃏", name: "Card Shark", desc: "Flip 25 flashcards" },
    { id: "century", ico: "💯", name: "Centurion", desc: "100 correct answers" },
    { id: "checkride", ico: "🎓", name: "Checkride Passed", desc: "Pass a mock exam" },
    { id: "exam90", ico: "🌟", name: "Top Gun", desc: "Score 90%+ on a mock exam" },
    { id: "fixer", ico: "🛠️", name: "Debrief Pro", desc: "Clear 10 missed questions" }
  ];

  /* ───────────── Persistence ───────────── */
  const KEY = "sky107.v1";
  const fresh = () => ({ xp: 0, stars: {}, answered: 0, correct: 0, q: {}, badges: [], bestLightning: 0, exams: [], bestStreak: 0, flips: 0, fixed: 0 });
  let S = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = Object.assign(fresh(), JSON.parse(raw));
  } catch (_) { /* storage unavailable: play without saving */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} }

  /* ───────────── Helpers ───────────── */
  const $app = document.getElementById("app");
  const $hud = document.getElementById("hud");
  const $toast = document.getElementById("toast");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
  const LETTERS = "ABCD";

  function rankFor(xp) {
    let i = 0;
    while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
    const cur = RANKS[i], next = RANKS[i + 1];
    return { idx: i, name: cur.name, next, progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
  }

  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove("show"), 2600);
  }

  // In-page confirmation dialog (browser confirm() is blocked in embedded frames).
  function ask(message, okLabel) {
    return new Promise((resolve) => {
      const prevKeys = keyHandler;
      const back = document.activeElement;
      const wrap = document.createElement("div");
      wrap.className = "modal";
      wrap.innerHTML = `<div class="panel modal-box" role="alertdialog" aria-modal="true" aria-labelledby="ask-msg">
        <p id="ask-msg">${esc(message)}</p>
        <div class="actions"><button class="btn ghost" data-k="0">Cancel</button><button class="btn amber" data-k="1">${esc(okLabel || "OK")}</button></div></div>`;
      const done = (v) => { wrap.remove(); keyHandler = prevKeys; if (back && back.focus) back.focus(); resolve(v); };
      wrap.addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) done(b.dataset.k === "1"); else if (e.target === wrap) done(false); });
      keyHandler = (e) => { if (e.key === "Escape") { e.preventDefault(); done(false); } };
      document.body.appendChild(wrap);
      wrap.querySelector('[data-k="1"]').focus();
    });
  }

  function award(id) {
    if (S.badges.includes(id)) return;
    S.badges.push(id);
    const b = BADGES.find((x) => x.id === id);
    toast(`${b.ico} Badge earned: ${b.name}`);
  }

  function addXp(n, el) {
    if (n <= 0) return;
    const before = rankFor(S.xp).idx;
    S.xp += n;
    if (el) {
      const r = el.getBoundingClientRect();
      const pop = document.createElement("div");
      pop.className = "xp-pop";
      pop.textContent = "+" + n + " XP";
      pop.style.left = r.right - 90 + "px";
      pop.style.top = r.top + "px";
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 1000);
    }
    const after = rankFor(S.xp);
    if (after.idx > before) setTimeout(() => toast(`🎖️ Promoted to ${after.name}!`), 400);
  }

  function record(qid, ok) {
    const r = S.q[qid] || (S.q[qid] = { s: 0, w: 0, last: null });
    r.s++;
    if (!ok) r.w++;
    if (ok && r.last === false) { S.fixed++; if (S.fixed >= 10) award("fixer"); }
    r.last = ok;
    S.answered++;
    if (ok) { S.correct++; if (S.correct >= 100) award("century"); }
  }

  const missedIds = () => Object.keys(S.q).filter((id) => S.q[id].last === false).map(Number);

  // Prefer questions the student has missed or never seen.
  function pickQuestions(pool, n) {
    const weight = (q) => { const r = S.q[q.id]; if (!r) return 2; if (r.last === false) return 3; return 1 / (1 + r.s - r.w); };
    return pool.map((q) => ({ q, k: Math.random() * weight(q) })).sort((a, b) => b.k - a.k).slice(0, n).map((x) => x.q);
  }

  const asItem = (q) => ({ q, order: shuffle([0, 1, 2, 3].slice(0, q.a.length)), pick: null, flag: false });

  function hud(extra) {
    const r = rankFor(S.xp);
    $hud.innerHTML = (extra || "") +
      `<span class="chip" title="Rank">🎖️ ${esc(r.name)}</span><span class="chip" title="Experience points"><b>${S.xp}</b> XP</span>`;
  }

  /* ───────────── Router ───────────── */
  let timer = null;
  let keyHandler = null;
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function go(screen, arg) {
    stopTimer();
    window.onbeforeunload = null;
    keyHandler = null;
    save();
    window.scrollTo(0, 0);
    ({ home, missions, mission, review, flash, lightning, exam })[screen](arg);
    $app.focus({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go]");
    if (t && !t.disabled) { e.preventDefault(); go(t.dataset.go, t.dataset.arg); }
  });
  document.addEventListener("keydown", (e) => {
    if (keyHandler && !e.metaKey && !e.ctrlKey && !e.altKey) keyHandler(e);
  });

  /* ───────────── Home ───────────── */
  function home() {
    hud();
    const r = rankFor(S.xp);
    const cleared = TOPICS.filter((t) => S.stars[t.id] > 0).length;
    const best = S.exams.length ? Math.max(...S.exams.map((x) => x.score)) : null;
    const missed = missedIds().length;
    $app.innerHTML = `
      <section class="hero">
        <div>
          <p class="eyebrow">FAA Remote Pilot · Part 107</p>
          <h1>Earn your wings, one mission at a time.</h1>
          <p class="lead">Fly study missions across all six areas of the Part 107 knowledge test, drill flashcards, beat the clock, then sit a full 60-question checkride. You need 70% to pass the real one.</p>
          <div class="panel rank-card">
            <div class="row"><strong>🎖️ ${esc(r.name)}</strong><span class="spacer"></span><span class="muted">${S.xp} XP${r.next ? " · next: " + esc(r.next.name) + " at " + r.next.xp : " · max rank"}</span></div>
            <div class="bar" role="progressbar" aria-label="Progress to next rank" aria-valuenow="${pct(r.progress, 1)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct(r.progress, 1)}%"></i></div>
          </div>
        </div>
        <div class="hero-drone" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#drone"/></svg></div>
      </section>

      <section class="modes" aria-label="Game modes">
        <button class="panel mode" data-go="missions"><span class="ico">🗺️</span><h3>Missions</h3><p>Six topic flights. Wrong answers drain your battery — lose all three cells and you crash.</p><span class="tag">${cleared}/${TOPICS.length} cleared</span></button>
        <button class="panel mode" data-go="flash"><span class="ico">🃏</span><h3>Ground School</h3><p>Flashcards with the numbers and acronyms you must know cold.</p><span class="tag">${FLASHCARDS.length} cards</span></button>
        <button class="panel mode" data-go="lightning"><span class="ico">⚡</span><h3>Lightning Round</h3><p>${LIGHTNING_SECONDS} seconds. Every miss costs 5 seconds. How many can you land?</p><span class="tag">Best: ${S.bestLightning}</span></button>
        <button class="panel mode" data-go="exam"><span class="ico">🎓</span><h3>Checkride</h3><p>Full mock exam: ${EXAM_LEN} questions, ${EXAM_MINUTES / 60} hours, no hints until you submit.</p><span class="tag">${best === null ? "Not attempted" : "Best: " + best + "%"}</span></button>
        <button class="panel mode" data-go="review" ${missed ? "" : "disabled"} style="${missed ? "" : "opacity:.55;cursor:not-allowed"}"><span class="ico">🛠️</span><h3>Debrief</h3><p>Re-fly only the questions you got wrong last time.</p><span class="tag">${missed} to review</span></button>
      </section>

      <section class="panel" style="margin-bottom:20px">
        <h2>Logbook</h2>
        <div class="stats">
          <div class="stat"><b>${S.answered}</b><span>Questions answered</span></div>
          <div class="stat"><b>${pct(S.correct, S.answered)}%</b><span>Accuracy</span></div>
          <div class="stat"><b>${S.bestStreak}</b><span>Best streak</span></div>
          <div class="stat"><b>${S.exams.length}</b><span>Checkrides flown</span></div>
        </div>
      </section>

      <section class="panel">
        <div class="row"><h2 style="margin:0">Badges</h2><span class="spacer"></span><span class="muted">${S.badges.length}/${BADGES.length}</span></div>
        <div class="badges" style="margin-top:12px">
          ${BADGES.map((b) => `<div class="badge ${S.badges.includes(b.id) ? "got" : ""}"><span class="ico">${b.ico}</span><strong>${esc(b.name)}</strong>${esc(b.desc)}</div>`).join("")}
        </div>
        <div class="row" style="margin-top:16px"><span class="spacer"></span><button class="btn ghost" id="reset">Reset progress</button></div>
      </section>`;
    document.getElementById("reset").onclick = () => {
      ask("Erase all XP, stars, badges and history?", "Erase progress").then((ok) => { if (ok) { S = fresh(); save(); home(); toast("Progress reset"); } });
    };
  }

  /* ───────────── Mission map ───────────── */
  const unlocked = (i) => i === 0 || S.stars[TOPICS[i - 1].id] > 0 || S.stars[TOPICS[i].id] > 0;

  function starsHtml(n) {
    return `<span class="stars-row" aria-label="${n || 0} of 3 stars">${[1, 2, 3].map((i) => `<span class="${(n || 0) >= i ? "" : "off"}">⭐</span>`).join("")}</span>`;
  }

  function missions() {
    hud();
    $app.innerHTML = `
      <p class="eyebrow">Flight plan</p>
      <h1>Missions</h1>
      <p class="lead">Each mission is ${MISSION_LEN} questions from one knowledge area. Clear a mission to unlock the next waypoint. Your battery holds ${BATTERY} cells — every miss drains one.</p>
      <div class="map"><div class="waypoints">
        ${TOPICS.map((t, i) => {
          const open = unlocked(i);
          const count = QUESTIONS.filter((q) => q.t === t.id).length;
          return `<button class="panel wp ${open ? "" : "locked"}" ${open ? `data-go="mission" data-arg="${t.id}"` : 'aria-disabled="true"'} aria-label="Mission ${i + 1}: ${esc(t.name)}${open ? "" : " (locked)"}">
            <span class="node">${open ? t.icon : "🔒"}</span>
            <span><h3>${i + 1}. ${esc(t.name)}</h3><p>${esc(t.blurb)} · ${count} questions in bank</p></span>
            ${starsHtml(S.stars[t.id])}
          </button>`;
        }).join("")}
      </div></div>
      <div class="actions"><button class="btn ghost" data-go="home">← Hangar</button></div>`;
  }

  /* ───────────── Quiz session (missions + debrief) ───────────── */
  let Q = null;

  function mission(topicId) {
    const pool = QUESTIONS.filter((q) => q.t === topicId);
    startQuiz({ mode: "mission", topic: topicId, items: pickQuestions(pool, MISSION_LEN).map(asItem), battery: BATTERY });
  }

  function review() {
    const ids = missedIds();
    if (!ids.length) { toast("Nothing to review — nice flying!"); return go("home"); }
    const pool = QUESTIONS.filter((q) => ids.includes(q.id));
    startQuiz({ mode: "review", items: shuffle(pool).slice(0, MISSION_LEN).map(asItem), battery: Infinity });
  }

  function startQuiz(opts) {
    Q = Object.assign({ i: 0, correct: 0, streak: 0, done: false, xp: 0 }, opts);
    renderQuestion();
  }

  function renderQuestion() {
    const it = Q.items[Q.i];
    const q = it.q, t = topicById[q.t];
    const isMission = Q.mode === "mission";
    const cells = isMission ? Array.from({ length: BATTERY }, (_, k) => `<i class="${k < Q.battery ? "" : "empty"}"></i>`).join("") : "";
    hud(isMission ? `<span class="chip" aria-label="Battery ${Q.battery} of ${BATTERY}"><span class="battery ${Q.battery === 1 ? "low" : ""}">${cells}</span></span>` : "");
    const progress = (Q.i / Q.items.length) * 100;
    $app.innerHTML = `
      <div class="flight-head">
        <div class="row">
          <div><p class="eyebrow" style="margin:0">${isMission ? "Mission · " + esc(t.name) : "Debrief · missed questions"}</p></div>
          <span class="spacer"></span>
          <span class="chip">🔥 Streak <b>${Q.streak}</b></span>
          <span class="chip">Q <b>${Q.i + 1}</b>/${Q.items.length}</span>
        </div>
        <div class="track" aria-hidden="true">
          <span class="ship" id="ship" style="left:calc(24px + (100% - 64px) * ${progress / 100})"><svg viewBox="0 0 64 64" width="40" height="40"><use href="#drone"/></svg></span>
          <span class="flag">🏁</span>
        </div>
      </div>
      ${questionCard(it, { reveal: false })}
      <div class="actions" id="actions"><button class="btn ghost" id="abort">Abort mission</button></div>`;
    bindAnswers(onQuizAnswer);
    document.getElementById("abort").onclick = () => { ask("Abort and return? Progress on this run is lost.", "Abort").then((ok) => { if (ok) go(isMission ? "missions" : "home"); }); };
  }

  function questionCard(it, { reveal, label }) {
    const q = it.q, t = topicById[q.t];
    return `<article class="panel qcard" aria-labelledby="qtext">
      <div class="qmeta"><span>${t.icon} ${esc(t.name)}</span>${label ? `<span>· ${label}</span>` : ""}</div>
      <p class="qtext" id="qtext">${esc(q.q)}</p>
      <div class="answers" role="group" aria-label="Answer choices">
        ${it.order.map((ai, k) => {
          let cls = "";
          if (reveal) { if (ai === q.c) cls = "correct"; else if (ai === it.pick) cls = "wrong"; }
          else if (it.pick === ai) cls = "picked";
          return `<button class="ans ${cls}" data-ai="${ai}" ${reveal ? "disabled" : ""}><span class="key">${LETTERS[k]}</span><span>${esc(q.a[ai])}</span></button>`;
        }).join("")}
      </div>
      <div id="explain"></div>
    </article>`;
  }

  function explainHtml(q, ok) {
    return `<div class="explain ${ok ? "" : "bad"}" role="status">
      <h4>${ok ? "✅ Correct" : "❌ Not quite — the answer is: " + esc(q.a[q.c])}</h4>
      <p>${esc(q.e)}</p><span class="ref">${esc(q.r)}</span></div>`;
  }

  function bindAnswers(cb) {
    const btns = [...$app.querySelectorAll(".ans")];
    btns.forEach((b) => (b.onclick = () => cb(Number(b.dataset.ai), b)));
    keyHandler = (e) => {
      const k = e.key.toUpperCase();
      let idx = "1234".indexOf(k);
      if (idx < 0) idx = LETTERS.indexOf(k);
      if (idx >= 0 && btns[idx] && !btns[idx].disabled) { e.preventDefault(); btns[idx].click(); }
    };
  }

  function onQuizAnswer(ai, btn) {
    const it = Q.items[Q.i], q = it.q;
    if (it.pick !== null) return;
    it.pick = ai;
    const ok = ai === q.c;
    record(q.id, ok);
    $app.querySelectorAll(".ans").forEach((b) => {
      b.disabled = true;
      const a = Number(b.dataset.ai);
      if (a === q.c) b.classList.add("correct");
      else if (a === ai) b.classList.add("wrong");
    });
    if (ok) {
      Q.correct++; Q.streak++;
      if (Q.streak > S.bestStreak) S.bestStreak = Q.streak;
      if (Q.streak >= 5) award("streak5");
      if (Q.streak >= 10) award("streak10");
      const gain = 10 + 2 * Math.min(Q.streak - 1, 5);
      Q.xp += gain; addXp(gain, btn);
    } else {
      Q.streak = 0;
      if (Q.mode === "mission") Q.battery--;
      const ship = document.getElementById("ship");
      if (ship) ship.classList.add("shake");
    }
    if (Q.mode === "mission") hud(`<span class="chip" aria-label="Battery ${Q.battery} of ${BATTERY}"><span class="battery ${Q.battery === 1 ? "low" : ""}">${Array.from({ length: BATTERY }, (_, k) => `<i class="${k < Q.battery ? "" : "empty"}"></i>`).join("")}</span></span>`);
    document.getElementById("explain").innerHTML = explainHtml(q, ok);
    const crashed = Q.mode === "mission" && Q.battery <= 0;
    const last = Q.i === Q.items.length - 1;
    const label = crashed ? "🔋 Battery dead — see debrief" : last ? "Land & debrief" : "Next question →";
    document.getElementById("actions").innerHTML = `<button class="btn primary" id="next">${label}</button>`;
    const next = document.getElementById("next");
    next.focus();
    next.onclick = () => {
      if (crashed || last) return finishQuiz(crashed);
      Q.i++; renderQuestion();
    };
    keyHandler = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next.click(); } };
    save();
  }

  function finishQuiz(crashed) {
    const answered = Q.items.filter((x) => x.pick !== null).length;
    let stars = 0, title, msg;
    if (Q.mode === "mission") {
      if (crashed) { title = "💥 Crash landing"; msg = "Your battery ran out. Review the misses below, then try again."; }
      else {
        stars = Q.correct >= 9 ? 3 : Q.correct >= 7 ? 2 : 1;
        title = stars === 3 ? "🏆 Flawless flight" : stars === 2 ? "✈️ Solid landing" : "🛬 Mission complete";
        msg = "Mission cleared! " + (stars < 3 ? "Get 9 or more right for three stars." : "Perfect form, pilot.");
        const prev = S.stars[Q.topic] || 0;
        if (stars > prev) S.stars[Q.topic] = stars;
        const bonus = 25 * stars; Q.xp += bonus; addXp(bonus);
        award("first");
        if (stars === 3) award("perfect");
        if (TOPICS.every((t) => S.stars[t.id] > 0)) award("allmissions");
        if (TOPICS.every((t) => S.stars[t.id] === 3)) award("ace");
        const idx = TOPICS.findIndex((t) => t.id === Q.topic);
        if (prev === 0 && TOPICS[idx + 1]) setTimeout(() => toast(`🔓 Unlocked: ${TOPICS[idx + 1].name}`), 900);
      }
    } else {
      title = "🛠️ Debrief complete";
      msg = "Questions you got right are cleared from your debrief list.";
    }
    save();
    hud();
    const misses = Q.items.filter((x) => x.pick !== null && x.pick !== x.q.c);
    const idx = TOPICS.findIndex((t) => t.id === Q.topic);
    const nextTopic = Q.mode === "mission" && !crashed && TOPICS[idx + 1];
    $app.innerHTML = `
      <section class="panel result">
        <p class="eyebrow">${Q.mode === "mission" ? esc(topicById[Q.topic].name) : "Debrief"}</p>
        <h1>${title}</h1>
        ${Q.mode === "mission" && !crashed ? starsHtml(stars) : ""}
        <p class="big ${crashed ? "fail" : "pass"}">${Q.correct}/${answered}</p>
        <p class="muted">${esc(msg)} · +${Q.xp} XP</p>
        <div class="row" style="justify-content:center;margin-top:16px">
          ${Q.mode === "mission" ? `<button class="btn amber" data-go="mission" data-arg="${Q.topic}">Fly again</button>` : `<button class="btn amber" data-go="review">Keep reviewing</button>`}
          ${nextTopic ? `<button class="btn primary" data-go="mission" data-arg="${nextTopic.id}">Next: ${esc(nextTopic.name)} →</button>` : ""}
          <button class="btn ghost" data-go="${Q.mode === "mission" ? "missions" : "home"}">${Q.mode === "mission" ? "Mission map" : "Hangar"}</button>
        </div>
      </section>
      ${misses.length ? `<h2 style="margin-top:24px">Review your misses</h2><div class="review">${misses.map(reviewItem).join("")}</div>` : ""}`;
  }

  function reviewItem(it) {
    const q = it.q;
    return `<div class="panel"><p><strong>${esc(q.q)}</strong></p>
      ${it.pick !== null ? `<p class="yours">Your answer: ${esc(q.a[it.pick])}</p>` : `<p class="yours">Not answered</p>`}
      <p class="right">Correct: ${esc(q.a[q.c])}</p><p class="muted">${esc(q.e)}</p><span class="ref">${esc(q.r)}</span></div>`;
  }

  /* ───────────── Flashcards ───────────── */
  function flash(filter) {
    filter = filter || "all";
    const cards = shuffle(FLASHCARDS.filter((c) => filter === "all" || c.t === filter));
    let i = 0;
    hud();
    $app.innerHTML = `
      <p class="eyebrow">Ground school</p>
      <h1>Flashcards</h1>
      <p class="lead">Tap the card (or press Space) to flip it. Use the arrow keys to move between cards.</p>
      <div class="filters" role="group" aria-label="Filter by topic">
        <button data-f="all" aria-pressed="${filter === "all"}">All</button>
        ${TOPICS.map((t) => `<button data-f="${t.id}" aria-pressed="${filter === t.id}">${t.icon} ${esc(t.short)}</button>`).join("")}
      </div>
      <div class="flash-wrap">
        <button class="flash" id="card" aria-live="polite"></button>
        <div class="row" style="margin-top:16px;justify-content:center">
          <button class="btn" id="prev" aria-label="Previous card">←</button>
          <span class="chip" id="count"></span>
          <button class="btn" id="nextc" aria-label="Next card">→</button>
        </div>
      </div>
      <div class="actions"><button class="btn ghost" data-go="home">← Hangar</button><button class="btn primary" data-go="missions">Test yourself →</button></div>`;
    $app.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => flash(b.dataset.f)));
    const $card = document.getElementById("card");
    function draw() {
      const c = cards[i], t = topicById[c.t];
      $card.classList.remove("flipped");
      $card.innerHTML = `<span class="face front"><small>${t.icon} ${esc(t.short)}</small>${esc(c.f)}</span><span class="face back"><small>Answer</small>${esc(c.b)}</span>`;
      $card.setAttribute("aria-label", `${c.f}. Press to reveal the answer.`);
      document.getElementById("count").textContent = `${i + 1} / ${cards.length}`;
    }
    function flip() {
      const now = $card.classList.toggle("flipped");
      $card.setAttribute("aria-label", now ? `${cards[i].f}: ${cards[i].b}` : `${cards[i].f}. Press to reveal the answer.`);
      if (now) { S.flips++; if (S.flips >= 25) award("flash"); if (S.flips % 5 === 0) addXp(5); save(); hud(); }
    }
    const move = (d) => { i = (i + d + cards.length) % cards.length; draw(); };
    $card.onclick = flip;
    document.getElementById("prev").onclick = () => move(-1);
    document.getElementById("nextc").onclick = () => move(1);
    keyHandler = (e) => {
      if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else if ((e.key === " " || e.key === "Enter") && document.activeElement !== $card && !document.activeElement.closest("button")) { e.preventDefault(); flip(); }
    };
    draw();
  }

  /* ───────────── Lightning round ───────────── */
  function lightning() {
    hud();
    $app.innerHTML = `
      <section class="panel result">
        <p class="eyebrow">Lightning round</p>
        <h1>⚡ Beat the clock</h1>
        <p class="lead" style="margin:0 auto 20px">${LIGHTNING_SECONDS} seconds on the clock, questions from every topic. A miss costs 5 seconds. Keys 1–4 answer instantly.</p>
        <p class="muted">Personal best: <strong>${S.bestLightning}</strong></p>
        <div class="row" style="justify-content:center;margin-top:12px"><button class="btn amber" id="startL">Start</button><button class="btn ghost" data-go="home">Hangar</button></div>
      </section>`;
    document.getElementById("startL").onclick = runLightning;
    document.getElementById("startL").focus();
  }

  function runLightning() {
    let left = LIGHTNING_SECONDS, score = 0, misses = [], queue = shuffle(QUESTIONS), qi = 0, locked = false;
    const end = Date.now() + left * 1000;
    let deadline = end;
    function draw() {
      if (qi >= queue.length) { queue = shuffle(QUESTIONS); qi = 0; }
      const it = asItem(queue[qi]);
      hud(`<span class="chip">⚡ <b>${score}</b></span>`);
      $app.innerHTML = `
        <div class="row" style="margin-bottom:14px"><p class="eyebrow" style="margin:0">Lightning round</p><span class="spacer"></span><span class="timer" id="clock">${fmtTime(left)}</span></div>
        ${questionCard(it, { reveal: false })}`;
      locked = false;
      bindAnswers((ai, btn) => {
        if (locked) return;
        locked = true;
        const ok = ai === it.q.c;
        record(it.q.id, ok);
        btn.classList.add(ok ? "correct" : "wrong");
        if (!ok) { deadline -= 5000; misses.push({ ...it, pick: ai }); $app.querySelector(`.ans[data-ai="${it.q.c}"]`).classList.add("correct"); }
        else score++;
        qi++;
        setTimeout(() => { if (timer) draw(); }, ok ? 350 : 900);
      });
    }
    timer = setInterval(() => {
      left = (deadline - Date.now()) / 1000;
      const c = document.getElementById("clock");
      if (c) { c.textContent = fmtTime(left); c.classList.toggle("low", left <= 10); }
      if (left <= 0) { stopTimer(); keyHandler = null; finish(); }
    }, 200);
    function finish() {
      const best = score > S.bestLightning;
      if (best) S.bestLightning = score;
      if (score >= 15) award("lightning");
      addXp(score * 5);
      save(); hud();
      $app.innerHTML = `
        <section class="panel result">
          <p class="eyebrow">Time!</p>
          <h1>${best ? "🏅 New personal best!" : "⚡ Round over"}</h1>
          <p class="big pass">${score}</p>
          <p class="muted">correct answers · +${score * 5} XP · best ${S.bestLightning}</p>
          <div class="row" style="justify-content:center;margin-top:16px"><button class="btn amber" id="again">Go again</button><button class="btn ghost" data-go="home">Hangar</button></div>
        </section>
        ${misses.length ? `<h2 style="margin-top:24px">Misses</h2><div class="review">${misses.map(reviewItem).join("")}</div>` : ""}`;
      document.getElementById("again").onclick = runLightning;
    }
    draw();
  }

  /* ───────────── Checkride (mock exam) ───────────── */
  let E = null;

  function exam() {
    hud();
    const last = S.exams.slice(-5).reverse();
    $app.innerHTML = `
      <section class="panel">
        <p class="eyebrow">Checkride</p>
        <h1>🎓 Mock knowledge test</h1>
        <p class="lead">Just like the real thing at a testing center: ${EXAM_LEN} multiple-choice questions, ${EXAM_MINUTES / 60} hours, and you need ${Math.round(PASS * 100)}% (${Math.ceil(EXAM_LEN * PASS)} correct) to pass. No feedback until you submit. Flag questions to come back to them.</p>
        <ul class="muted">
          <li>Questions are weighted across all six knowledge areas.</li>
          <li>The real test includes figures from the Airman Knowledge Testing Supplement (sectional charts, METARs). Practice those with the official supplement too.</li>
        </ul>
        <div class="row" style="margin-top:12px"><button class="btn amber" id="startE">Begin checkride</button><button class="btn ghost" data-go="home">Hangar</button></div>
        ${last.length ? `<h3 style="margin-top:24px">Recent attempts</h3><div class="stats">${last.map((x) => `<div class="stat"><b style="color:${x.score >= PASS * 100 ? "var(--green)" : "var(--red)"}">${x.score}%</b><span>${new Date(x.date).toLocaleDateString()} · ${x.score >= PASS * 100 ? "Pass" : "Fail"}</span></div>`).join("")}</div>` : ""}
      </section>`;
    document.getElementById("startE").onclick = startExam;
  }

  function startExam() {
    let items = [];
    for (const [t, n] of Object.entries(EXAM_MIX)) items = items.concat(shuffle(QUESTIONS.filter((q) => q.t === t)).slice(0, n));
    if (items.length < EXAM_LEN) {
      const used = new Set(items.map((q) => q.id));
      items = items.concat(shuffle(QUESTIONS.filter((q) => !used.has(q.id))).slice(0, EXAM_LEN - items.length));
    }
    E = { items: shuffle(items).map(asItem), i: 0, deadline: Date.now() + EXAM_MINUTES * 60000 };
    timer = setInterval(() => {
      const left = (E.deadline - Date.now()) / 1000;
      const c = document.getElementById("clock");
      if (c) { c.textContent = fmtTime(left); c.classList.toggle("low", left <= 300); }
      if (left <= 0) { stopTimer(); toast("⏰ Time is up — submitting"); gradeExam(); }
    }, 1000);
    window.onbeforeunload = () => "Your checkride is in progress.";
    drawExam();
  }

  function drawExam() {
    const it = E.items[E.i];
    const answered = E.items.filter((x) => x.pick !== null).length;
    hud(`<span class="chip">🎓 <b>${answered}</b>/${E.items.length} answered</span>`);
    $app.innerHTML = `
      <div class="row" style="margin-bottom:14px">
        <p class="eyebrow" style="margin:0">Checkride · question ${E.i + 1} of ${E.items.length}</p>
        <span class="spacer"></span><span class="timer" id="clock" aria-label="Time remaining">${fmtTime((E.deadline - Date.now()) / 1000)}</span>
      </div>
      ${questionCard(it, { reveal: false, label: it.flag ? "🚩 Flagged" : "" })}
      <div class="actions">
        <button class="btn ghost" id="flag" aria-pressed="${it.flag}">${it.flag ? "🚩 Unflag" : "🏳️ Flag"}</button>
        <span class="spacer"></span>
        <button class="btn" id="prevE" ${E.i === 0 ? "disabled" : ""}>← Back</button>
        ${E.i < E.items.length - 1 ? `<button class="btn primary" id="nextE">Next →</button>` : ""}
        <button class="btn amber" id="submit">Submit test</button>
      </div>
      <div class="panel" style="margin-top:16px">
        <div class="row"><strong>Question map</strong><span class="spacer"></span><span class="muted" style="font-size:13px">Outlined = answered · amber bar = flagged</span></div>
        <div class="qgrid">${E.items.map((x, k) => `<button data-j="${k}" class="${x.pick !== null ? "done" : ""} ${x.flag ? "flag" : ""} ${k === E.i ? "cur" : ""}" aria-label="Question ${k + 1}${x.pick !== null ? ", answered" : ""}${x.flag ? ", flagged" : ""}">${k + 1}</button>`).join("")}</div>
      </div>`;
    bindAnswers((ai) => {
      it.pick = ai;
      $app.querySelectorAll(".ans").forEach((b) => b.classList.toggle("picked", Number(b.dataset.ai) === ai));
      const cell = $app.querySelector(`.qgrid [data-j="${E.i}"]`);
      if (cell) cell.classList.add("done");
      hud(`<span class="chip">🎓 <b>${E.items.filter((x) => x.pick !== null).length}</b>/${E.items.length} answered</span>`);
    });
    const baseKeys = keyHandler;
    keyHandler = (e) => {
      if (e.key === "ArrowRight" && E.i < E.items.length - 1) { E.i++; drawExam(); }
      else if (e.key === "ArrowLeft" && E.i > 0) { E.i--; drawExam(); }
      else baseKeys(e);
    };
    document.getElementById("flag").onclick = () => { it.flag = !it.flag; drawExam(); };
    document.getElementById("prevE").onclick = () => { E.i--; drawExam(); };
    const n = document.getElementById("nextE");
    if (n) n.onclick = () => { E.i++; drawExam(); };
    $app.querySelectorAll("[data-j]").forEach((b) => (b.onclick = () => { E.i = Number(b.dataset.j); drawExam(); }));
    document.getElementById("submit").onclick = () => {
      const blank = E.items.filter((x) => x.pick === null).length;
      const flagged = E.items.filter((x) => x.flag).length;
      const warn = [blank && `${blank} unanswered`, flagged && `${flagged} flagged`].filter(Boolean).join(" and ");
      ask(warn ? `You have ${warn}. Submit anyway?` : "Submit your checkride for grading?", "Submit").then((ok) => { if (ok && E && timer) { stopTimer(); gradeExam(); } });
    };
  }

  function gradeExam() {
    window.onbeforeunload = null;
    keyHandler = null;
    const items = E.items;
    let correct = 0;
    const byTopic = {};
    items.forEach((it) => {
      const ok = it.pick === it.q.c;
      if (ok) correct++;
      if (it.pick !== null) record(it.q.id, ok);
      const b = byTopic[it.q.t] || (byTopic[it.q.t] = { n: 0, ok: 0 });
      b.n++; if (ok) b.ok++;
    });
    const score = pct(correct, items.length);
    const passed = correct / items.length >= PASS;
    S.exams.push({ score, date: Date.now() });
    const gain = correct * 2 + (passed ? 100 : 0);
    addXp(gain);
    if (passed) award("checkride");
    if (score >= 90) award("exam90");
    save(); hud();
    const weakest = Object.entries(byTopic).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n)[0];
    const wrong = items.filter((x) => x.pick !== x.q.c);
    $app.innerHTML = `
      <section class="panel result">
        <p class="eyebrow">Checkride results</p>
        <h1>${passed ? "🎉 You passed!" : "Not this time — keep training"}</h1>
        <p class="big ${passed ? "pass" : "fail"}">${score}%</p>
        <p class="muted">${correct} of ${items.length} correct · passing is ${Math.round(PASS * 100)}% · +${gain} XP</p>
        <div class="breakdown">
          ${TOPICS.filter((t) => byTopic[t.id]).map((t) => { const b = byTopic[t.id], p = pct(b.ok, b.n); return `<div class="line"><span>${t.icon} ${esc(t.name)}</span><div class="bar"><i style="width:${p}%;background:${p >= 70 ? "var(--green)" : "var(--red)"}"></i></div><span class="tabular">${b.ok}/${b.n}</span></div>`; }).join("")}
        </div>
        ${weakest ? `<p>Focus area: <strong>${esc(topicById[weakest[0]].name)}</strong></p>` : ""}
        <div class="row" style="justify-content:center;margin-top:12px">
          ${weakest ? `<button class="btn primary" data-go="mission" data-arg="${weakest[0]}">Train ${esc(topicById[weakest[0]].short)}</button>` : ""}
          <button class="btn amber" data-go="exam">Retake</button>
          <button class="btn ghost" data-go="home">Hangar</button>
        </div>
      </section>
      <div class="panel" style="margin-top:16px"><strong>Answer map</strong><div class="qgrid">${items.map((x, k) => `<button data-r="${k}" class="${x.pick === x.q.c ? "ok" : "no"}" aria-label="Question ${k + 1}, ${x.pick === x.q.c ? "correct" : "incorrect"}">${k + 1}</button>`).join("")}</div></div>
      ${wrong.length ? `<h2 style="margin-top:24px">Review (${wrong.length})</h2><div class="review">${wrong.map((it) => `<div id="r${items.indexOf(it)}">${reviewItem(it)}</div>`).join("")}</div>` : ""}`;
    $app.querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => {
      const el = document.getElementById("r" + b.dataset.r);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      else toast("You got that one right ✅");
    }));
  }

  go("home");
})();
