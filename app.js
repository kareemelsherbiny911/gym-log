/* app.js — Gym Log UI: state, storage, screens, interactions. Depends on core.js (Core) and library.js (GYM_LIB). */
(function () {
  'use strict';
  const VERSION = '1.0.0';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
  const kgFmt = n => Number(n).toLocaleString('en');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  // ---------- Storage ----------
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('gym.v1.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gym.v1.' + k, JSON.stringify(v)); } catch (e) { toast('Could not save: storage is full or blocked'); } },
    del(k) { localStorage.removeItem('gym.v1.' + k); },
  };
  const DEFAULT_SETTINGS = { schemaVersion: 1, activeRoutineId: null, nextDayIndex: 0, barKg: 20, restCompound: 120, restIsolation: 60, lastExport: null, restOverrides: {} };
  const state = {
    settings: Object.assign({}, DEFAULT_SETTINGS, LS.get('settings', {})),
    custom: LS.get('custom', []),
    routines: LS.get('routines', null),
    sessions: LS.get('sessions', []),
    draft: LS.get('draft', null),
    view: { name: 'home', params: {} },
    depth: 0,
    libFilter: { q: '', muscle: '', equipment: '' },
  };
  if (!state.routines) { state.routines = clone(GYM_LIB.routines); state.settings.activeRoutineId = state.routines[0].id; saveRoutines(); saveSettings(); }
  function saveSettings() { LS.set('settings', state.settings); }
  function saveRoutines() { LS.set('routines', state.routines); }
  function saveSessions() { LS.set('sessions', state.sessions); }
  function saveCustom() { LS.set('custom', state.custom); }
  function saveDraft() { if (state.draft) LS.set('draft', state.draft); else LS.del('draft'); }

  // ---------- Lookups ----------
  const allExercises = () => GYM_LIB.exercises.concat(state.custom);
  function exById(id) {
    return allExercises().find(e => e.id === id) || { id, name: 'Deleted exercise', muscle: '', pattern: '', equipment: '', rest: 60, compound: false, secondary: [], missing: true };
  }
  const activeRoutine = () => state.routines.find(r => r.id === state.settings.activeRoutineId) || null;
  const routineById = id => state.routines.find(r => r.id === id);
  function restFor(ex) {
    const o = state.settings.restOverrides[ex.id];
    if (o) return o;
    if (ex.rest) return ex.rest;
    return ex.compound ? state.settings.restCompound : state.settings.restIsolation;
  }
  function lastSetsFor(exId) {
    for (const s of state.sessions) for (const it of s.items) if (it.exId === exId && it.sets.length) return { sets: it.sets, date: s.date };
    return null;
  }
  const backupDue = () => state.sessions.length > 0 && (!state.settings.lastExport || Date.now() - state.settings.lastExport > 30 * 86400000);
  function ago(ms) {
    const m = Math.round((Date.now() - ms) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60); if (h < 48) return h + ' h ago';
    return Math.round(h / 24) + ' days ago';
  }
  const shortDate = iso => { const d = new Date(iso); return d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]; };

  // ---------- Icons ----------
  const I = {
    back: '<svg class="icon" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    chev: '<svg class="icon chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    swap: '<svg class="icon" viewBox="0 0 24 24"><path d="M7 20V4M7 4L3 8M7 4l4 4M17 4v16m0 0l4-4m-4 4l-4-4"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12l4 4L19 7"/></svg>',
    plus: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    close: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    up: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    trash: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    search: '<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  };

  // ---------- Plate stack ----------
  const PCOL = { 25: 'var(--p25)', 20: 'var(--p20)', 15: 'var(--p15)', 10: 'var(--p10)', 5: 'var(--p5)', 2.5: 'var(--p2)', 1.25: 'var(--p1)' };
  const PH = { 25: 48, 20: 44, 15: 40, 10: 34, 5: 28, 2.5: 22, 1.25: 18 };
  function plateBox(total) {
    const bar = state.settings.barKg, r = Core.platesPerSide(total, bar);
    let x = 46, rects = '';
    if (r) for (const p of r.plates) { const h = PH[p], y = (56 - h) / 2; rects += `<rect x="${x}" y="${y}" width="13" height="${h}" rx="2" fill="${PCOL[p]}" stroke="var(--ink)" stroke-opacity=".35"/>`; x += 15; if (x > 230) break; }
    let cap;
    if (!r) cap = `Below the ${bar} kg bar`;
    else if (!r.plates.length) cap = `Empty bar, ${bar} kg`;
    else { cap = `Per side <b>${r.plates.join(' + ')}</b>`; if (r.leftover > 0) cap += ` (${r.leftover} kg not loadable)`; }
    return `<svg viewBox="0 0 240 56" aria-hidden="true"><rect x="0" y="25" width="240" height="6" rx="1" fill="#8A9097"/><rect x="34" y="17" width="10" height="22" rx="2" fill="#5B6470"/>${rects}</svg><p class="cap">${cap}</p>`;
  }

  // ---------- Navigation ----------
  function go(name, params = {}, replace = false) {
    closeSheet();
    state.view = { name, params };
    if (replace) history.replaceState(state.view, '', '#' + name); else { history.pushState(state.view, '', '#' + name); state.depth++; }
    window.scrollTo(0, 0);
    render();
  }
  window.addEventListener('popstate', e => { state.depth = Math.max(0, state.depth - 1); state.view = e.state || { name: 'home', params: {} }; render(); });
  function back(parent, params) { if (state.depth > 0) history.back(); else go(parent, params, true); }

  // ---------- Render ----------
  const PARENT = { workout: 'home', routine: 'routines', day: 'routine', exercise: 'library', session: 'history' };
  function render() {
    const v = state.view, fn = screens[v.name] || screens.home;
    if (v.name === 'workout' && !state.draft) { state.view = { name: 'home', params: {} }; return render(); }
    const s = fn(v.params);
    const top = $('#top');
    top.className = 'top' + (s.back ? '' : ' no-back');
    top.innerHTML = (s.back ? `<button class="back" data-a="back" data-parent="${s.back.parent || ''}" data-pid="${s.back.id || ''}" aria-label="Back">${I.back}</button>` : '') +
      `<div><h1>${s.title}</h1>${s.sub ? `<p class="sub">${s.sub}</p>` : ''}</div><div class="right">${s.right || ''}</div>`;
    $('#screen').innerHTML = s.html;
    const nav = $('#nav'); const showNav = s.nav !== false;
    nav.classList.toggle('hide', !showNav); document.body.classList.toggle('no-nav', !showNav);
    nav.querySelectorAll('button').forEach(b => { if (b.dataset.to === (s.tab || v.name)) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    document.title = 'Gym Log';
  }

  const screens = {};

  // ---------- Home ----------
  screens.home = () => {
    const d = state.draft, r = activeRoutine(), today = Core.fmtDate(new Date().toISOString());
    let hero;
    if (d) {
      const { done, total } = Core.sessionDoneSets(d);
      hero = `<section class="hero"><p class="date">${today}</p><h2>Workout in progress</h2>
        <p class="lead">${esc(d.dayName)}${d.routineName ? ', ' + esc(d.routineName) : ''}. Started ${ago(d.startedAt)}, ${done} of ${total} sets done.</p>
        <div class="btns"><button class="btn primary" data-a="resume">Resume workout</button><button class="btn ghost danger" data-a="discard-draft">Discard workout</button></div></section>`;
    } else if (r && r.days.length) {
      const idx = Math.min(state.settings.nextDayIndex || 0, r.days.length - 1), day = r.days[idx];
      hero = `<section class="hero"><p class="date">${today}</p><h2>${esc(day.name)}</h2><p class="lead">${esc(r.name)}, day ${idx + 1} of ${r.days.length}</p>
        <ul class="ex-preview">${day.items.map(i => `<li>${esc(exById(i.exId).name)}</li>`).join('') || '<li>No exercises in this day yet</li>'}</ul>
        <div class="btns"><button class="btn primary" data-a="start-day" data-r="${r.id}" data-d="${day.id}">Start ${esc(day.name)}</button>
        <button class="btn" data-a="choose-day">Choose another day</button><button class="btn ghost" data-a="quick">Quick workout</button></div></section>`;
    } else {
      hero = `<section class="hero"><p class="date">${today}</p><h2>No active routine</h2><p class="lead">Pick one of the templates or build your own.</p>
        <div class="btns"><button class="btn primary" data-a="nav" data-to="routines">Choose a routine</button><button class="btn ghost" data-a="quick">Quick workout</button></div></section>`;
    }
    const banner = backupDue() ? `<div class="banner"><span>${state.settings.lastExport ? 'Your last backup is over 30 days old.' : 'You have workouts saved but no backup yet.'}</span><button class="btn" data-a="export">Export</button></div>` : '';
    const recent = state.sessions.slice(0, 5);
    const list = recent.length ? `<div class="list">${recent.map(sessionRow).join('')}</div>` : `<p class="empty">Finished workouts will appear here.</p>`;
    return { title: 'Gym Log', html: hero + banner + `<h2 class="section-title">Recent workouts</h2>` + list };
  };
  function sessionRow(s) {
    const { done } = Core.sessionDoneSets(s);
    return `<button class="row" data-a="open-session" data-id="${s.id}"><span><span class="t">${esc(s.dayName)}</span><span class="s" style="display:block">${Core.fmtDate(s.date)}</span></span><span class="v"><b>${done}</b> sets, <b>${kgFmt(Core.sessionVolume(s))}</b> kg</span></button>`;
  }

  // ---------- Workout ----------
  function draftFromDay(r, day) {
    return { id: Core.uid(), startedAt: Date.now(), routineId: r ? r.id : null, dayId: day ? day.id : null, dayName: day ? day.name : 'Quick workout', routineName: r ? r.name : '',
      items: (day ? day.items : []).map(i => draftItem(i.exId, i.sets, i.reps)), rest: null };
  }
  function draftItem(exId, targetSets = 3, targetReps = 10) {
    const last = lastSetsFor(exId);
    let sets;
    if (last) { sets = last.sets.map(s => ({ kg: s.kg, reps: s.reps, done: false })); while (sets.length < targetSets) sets.push({ ...sets[sets.length - 1], done: false }); }
    else { const ex = exById(exId), kg0 = (ex.equipment === 'Barbell' || ex.equipment === 'Smith machine') ? state.settings.barKg : 0; sets = Array.from({ length: targetSets }, () => ({ kg: kg0, reps: targetReps, done: false })); }
    return { exId, targetSets, targetReps, sets };
  }
  function startWorkout(draft) { state.draft = draft; saveDraft(); go('workout'); }

  screens.workout = () => {
    const d = state.draft;
    const cards = d.items.map((item, i) => {
      const ex = exById(item.exId), showPlates = ex.equipment === 'Barbell' || ex.equipment === 'Smith machine';
      const last = lastSetsFor(item.exId); const lb = last ? Core.bestSet(last.sets) : null;
      const lastLine = lb ? `Last time <b>${lb.kg} × ${lb.reps}</b>, ${shortDate(last.date)}` : 'First time';
      return `<section class="ex" data-i="${i}">
        <div class="ex-head"><div class="name"><h2>${esc(ex.name)}</h2><p class="meta">${esc(ex.muscle)}, ${esc(ex.equipment.toLowerCase())}</p><p class="meta">${lastLine}</p></div>
          <button class="btn-icon" data-a="swap" data-i="${i}" aria-label="Swap ${esc(ex.name)} for a similar exercise">${I.swap}</button></div>
        ${showPlates ? `<div class="plates" data-plates="${i}">${plateBox(item.sets[0] ? item.sets[0].kg : 0)}</div>` : ''}
        <div class="sets"><div class="h">Set</div><div class="h">kg</div><div class="h">Reps</div><div class="h"></div>
          ${item.sets.map((s, si) => `<div style="display:contents" class="${s.done ? 'row-done' : ''}"><div class="n">${si + 1}</div>${stepper(i, si, 'kg', s.kg)}${stepper(i, si, 'reps', s.reps)}
            <button class="done" data-a="done" data-i="${i}" data-s="${si}" aria-pressed="${s.done}" aria-label="Set ${si + 1} done">${I.check}</button></div>`).join('')}
        </div>
        <div class="set-ctl"><button class="add-set" data-a="add-set" data-i="${i}">${I.plus} Add set</button>${item.sets.length > 1 ? `<button class="add-set narrow" data-a="remove-set" data-i="${i}" aria-label="Remove last set">${I.minus} Remove</button>` : ''}
          <button class="add-set narrow" data-a="remove-ex" data-i="${i}" aria-label="Remove exercise">${I.trash}</button></div>
      </section>`;
    }).join('');
    const empty = d.items.length ? '' : `<p class="empty">No exercises yet. Add one to start logging.</p>`;
    return { title: esc(d.dayName), sub: esc(d.routineName || 'Quick workout'), right: `<span id="elapsed">${Core.fmtClock((Date.now() - d.startedAt) / 1000)}</span>`, back: { parent: 'home' }, nav: false,
      html: cards + empty + `<button class="btn block" data-a="add-ex">${I.plus} Add exercise</button><button class="btn primary block" data-a="finish">Finish workout</button>` };
  };
  function stepper(i, s, f, val, compact) {
    return `<div class="stepper${compact ? ' compact' : ''}"><button data-a="dec" data-i="${i}" data-s="${s}" data-f="${f}" aria-label="Decrease ${f}">${I.minus}</button>
      <input inputmode="decimal" value="${val}" data-in="set" data-i="${i}" data-s="${s}" data-f="${f}" aria-label="${f}">
      <button data-a="inc" data-i="${i}" data-s="${s}" data-f="${f}" aria-label="Increase ${f}">${I.plus}</button></div>`;
  }
  function refreshPlates(i) { const box = $(`[data-plates="${i}"]`); if (box) box.innerHTML = plateBox(state.draft.items[i].sets[0].kg); }
  setInterval(() => { const el = $('#elapsed'); if (el && state.draft) el.textContent = Core.fmtClock((Date.now() - state.draft.startedAt) / 1000); }, 1000);

  function openSwap(i) {
    const item = state.draft.items[i], ex = exById(item.exId), sim = Core.similarExercises(ex, allExercises());
    const canSaveToRoutine = !!(state.draft.routineId && state.draft.dayId && routineById(state.draft.routineId));
    sheet(`<div class="sheet-head"><div><h3>Swap ${esc(ex.name)}</h3><p>Same muscle and movement: ${esc(ex.muscle.toLowerCase())}, ${esc(ex.pattern.toLowerCase())}</p></div><button class="btn-icon plain" data-a="close-sheet" aria-label="Close">${I.close}</button></div>
      ${canSaveToRoutine ? `<div class="sheet-body" style="padding-bottom:0"><label class="check"><input type="checkbox" id="swapSave"> Also update the routine</label></div>` : ''}
      <ul class="opts">${sim.map(o => `<li class="${o.equipment === ex.equipment ? 'same' : ''}"><button data-a="pick-swap" data-i="${i}" data-id="${o.id}"><span>${esc(o.name)}</span><span class="eq">${esc(o.equipment)}</span></button></li>`).join('') || '<li class="group">No similar exercise in the library. Add a custom one from Library.</li>'}</ul>`);
  }
  function openPicker(onPick, title = 'Add exercise') {
    pickerCb = onPick;
    sheet(`<div class="sheet-head"><div><h3>${title}</h3></div><button class="btn-icon plain" data-a="close-sheet" aria-label="Close">${I.close}</button></div>
      <div class="search"><span class="icon">${I.search}</span><input type="text" placeholder="Search exercises" data-in="picker-q" autocomplete="off"></div><ul class="opts" id="pickerList"></ul>`);
    fillPicker('');
    setTimeout(() => { const inp = $('#sheet input'); if (inp) inp.focus(); }, 50);
  }
  let pickerCb = null;
  function fillPicker(q) {
    q = q.trim().toLowerCase();
    const list = allExercises().filter(e => !q || e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q)).slice(0, 60);
    $('#pickerList').innerHTML = list.map(e => `<li><button data-a="pick-ex" data-id="${e.id}"><span>${esc(e.name)}<span class="sub">${esc(e.muscle)}, ${esc(e.equipment.toLowerCase())}</span></span></button></li>`).join('') || '<li class="group">No match.</li>';
  }
  function openFinish() {
    const d = state.draft, { done, total } = Core.sessionDoneSets(d), vol = Core.sessionVolume(d), dur = Core.fmtClock((Date.now() - d.startedAt) / 1000);
    const prs = Core.computePRs({ items: d.items }, state.sessions);
    const prList = Object.entries(prs).filter(([, p]) => p.kg || p.e1rm).map(([id, p]) => `<div>${esc(exById(id).name)}<span class="tag pr">${p.kg ? 'Weight PR' : 'Est. 1RM PR'}</span></div>`).join('');
    const body = done === 0
      ? `<p class="muted" style="margin-bottom:12px">No sets are marked done yet. Tick the sets you completed, or discard this workout.</p><button class="btn block" style="margin:0 0 8px;width:100%" data-a="close-sheet">Keep going</button><button class="btn danger" style="width:100%" data-a="discard-draft">Discard workout</button>`
      : `<dl><dt>Duration</dt><dd>${dur}</dd><dt>Sets done</dt><dd>${done} of ${total}</dd><dt>Volume</dt><dd>${kgFmt(vol)} kg</dd><dt>Exercises</dt><dd>${d.items.length}</dd></dl>
         ${prList ? `<div class="kv" style="margin:0 0 12px">${prList}</div>` : ''}
         <button class="btn primary" data-a="save-workout">Save workout</button><button class="btn ghost" data-a="close-sheet">Keep going</button>`;
    sheet(`<div class="sheet-head"><div><h3>Finish ${esc(d.dayName)}</h3></div><button class="btn-icon plain" data-a="close-sheet" aria-label="Close">${I.close}</button></div><div class="sheet-body summary">${body}</div>`);
  }
  function saveWorkout() {
    const d = state.draft;
    const items = d.items.map(it => ({ exId: it.exId, sets: it.sets.filter(s => s.done).map(s => ({ kg: num(s.kg), reps: Math.round(num(s.reps)), done: true })) })).filter(it => it.sets.length);
    const now = Date.now();
    const session = { id: d.id, date: new Date(now).toISOString(), routineId: d.routineId, dayId: d.dayId, dayName: d.dayName, routineName: d.routineName, startedAt: d.startedAt, finishedAt: now, durationSec: Math.round((now - d.startedAt) / 1000), items };
    state.sessions.unshift(session); saveSessions();
    const r = d.routineId && routineById(d.routineId);
    if (r && r.id === state.settings.activeRoutineId) { const idx = r.days.findIndex(x => x.id === d.dayId); if (idx >= 0) { state.settings.nextDayIndex = Core.nextDayIndex(r, idx); saveSettings(); } }
    state.draft = null; saveDraft(); stopRest(); closeSheet();
    go('session', { id: session.id }, true); toast('Workout saved');
  }

  // ---------- Rest timer ----------
  const restEl = $('#rest'), restTime = $('#restTime'), restFill = $('#restFill'), restExEl = $('#restEx');
  let hideTimer = null, actx = null;
  function startRest(ex) {
    clearTimeout(hideTimer);
    const sec = restFor(ex);
    state.draft.rest = { end: Date.now() + sec * 1000, total: sec, name: ex.name, fired: false }; saveDraft();
    restExEl.textContent = ex.name; restEl.classList.remove('finished'); restEl.classList.add('on'); tick();
  }
  function stopRest() { clearTimeout(hideTimer); restEl.classList.remove('on'); if (state.draft) { state.draft.rest = null; saveDraft(); } }
  function tick() {
    const r = state.draft && state.draft.rest; if (!r) return;
    if (state.view.name !== 'workout') { restEl.classList.remove('on'); return; }
    if (!restEl.classList.contains('on')) { restExEl.textContent = r.name; restEl.classList.add('on'); }
    const leftMs = r.end - Date.now(), left = Math.max(0, Math.ceil(leftMs / 1000));
    restTime.textContent = Core.fmtClock(left);
    restFill.style.width = Math.max(0, Math.min(100, leftMs / (r.total * 1000) * 100)) + '%';
    if (left === 0 && !r.fired) { r.fired = true; saveDraft(); restEl.classList.add('finished'); restTime.textContent = 'Go'; if (navigator.vibrate) navigator.vibrate([200, 100, 200]); beep(); hideTimer = setTimeout(stopRest, 2500); }
  }
  setInterval(tick, 250);
  document.addEventListener('visibilitychange', tick);
  function beep() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25].forEach(t => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.0001, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.4, actx.currentTime + t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.18);
        o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.2); });
    } catch (e) { /* audio not available */ }
  }

  // ---------- Routines ----------
  screens.routines = () => {
    const rows = state.routines.map(r => `<button class="row" data-a="open-routine" data-id="${r.id}"><span><span class="t">${esc(r.name)}${r.id === state.settings.activeRoutineId ? ' <span class="tag">Active</span>' : ''}</span><span class="s" style="display:block">${r.days.length} day${r.days.length === 1 ? '' : 's'}</span></span>${I.chev}</button>`).join('');
    return { title: 'Routines', html: `<div class="list" style="margin-top:12px">${rows}</div><button class="btn block" data-a="new-routine">${I.plus} New routine</button>` };
  };
  screens.routine = ({ id }) => {
    const r = routineById(id); if (!r) return screens.routines();
    const active = r.id === state.settings.activeRoutineId;
    const days = r.days.map((d, i) => `<button class="row" data-a="open-day" data-r="${r.id}" data-d="${d.id}"><span><span class="t">${esc(d.name)}</span><span class="s" style="display:block">${d.items.length} exercise${d.items.length === 1 ? '' : 's'}${active && i === state.settings.nextDayIndex ? ', up next' : ''}</span></span>${I.chev}</button>`).join('');
    return { title: esc(r.name), back: { parent: 'routines' }, tab: 'routines',
      html: `${active ? `<p class="banner" style="display:block">This is your active routine. Home always proposes its next day.</p>` : `<button class="btn primary block" style="margin-top:12px" data-a="set-active" data-id="${r.id}">Set as active routine</button>`}
        <h2 class="section-title">Days</h2><div class="list">${days || '<p class="empty">No days yet.</p>'}</div>
        <button class="btn block" data-a="add-day" data-id="${r.id}">${I.plus} Add day</button>
        <div class="actions"><button class="btn sm" data-a="rename-routine" data-id="${r.id}">Rename</button><button class="btn sm" data-a="duplicate-routine" data-id="${r.id}">Duplicate</button><button class="btn sm danger" data-a="delete-routine" data-id="${r.id}">Delete</button></div>` };
  };
  screens.day = ({ r: rid, d: did }) => {
    const r = routineById(rid); const day = r && r.days.find(x => x.id === did); if (!day) return screens.routines();
    const items = day.items.map((it, i) => { const ex = exById(it.exId); return `<div class="day-item"><div><div class="t">${esc(ex.name)}</div><div class="s">${esc(ex.muscle)}, ${esc(ex.equipment.toLowerCase())}</div></div>
        <button class="btn-icon plain" data-a="day-remove" data-i="${i}" aria-label="Remove ${esc(ex.name)}">${I.trash}</button>
        <div class="ctls"><div><div class="lbl">Sets</div>${dayStepper(i, 'sets', it.sets)}</div><div><div class="lbl">Reps</div>${dayStepper(i, 'reps', it.reps)}</div>
          <button class="btn-icon" data-a="day-up" data-i="${i}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${I.up}</button><button class="btn-icon" data-a="day-down" data-i="${i}" aria-label="Move down" ${i === day.items.length - 1 ? 'disabled' : ''}>${I.down}</button></div></div>`; }).join('');
    return { title: esc(day.name), sub: esc(r.name), back: { parent: 'routine', id: r.id }, tab: 'routines',
      html: `<div class="list" style="margin-top:12px">${items || '<p class="empty">No exercises yet.</p>'}</div>
        <button class="btn block" data-a="day-add-ex">${I.plus} Add exercise</button>
        <button class="btn primary block" data-a="start-day" data-r="${r.id}" data-d="${day.id}">Start this day now</button>
        <div class="actions"><button class="btn sm" data-a="rename-day">Rename day</button><button class="btn sm danger" data-a="delete-day">Delete day</button></div>` };
  };
  function dayStepper(i, f, v) {
    return `<div class="stepper compact"><button data-a="day-dec" data-i="${i}" data-f="${f}" aria-label="Decrease ${f}">${I.minus}</button><input inputmode="numeric" value="${v}" data-in="day-set" data-i="${i}" data-f="${f}" aria-label="${f}"><button data-a="day-inc" data-i="${i}" data-f="${f}" aria-label="Increase ${f}">${I.plus}</button></div>`;
  }
  const curDay = () => { const r = routineById(state.view.params.r); return { r, day: r && r.days.find(x => x.id === state.view.params.d) }; };

  // ---------- Library ----------
  screens.library = () => {
    const f = state.libFilter, q = f.q.trim().toLowerCase();
    let list = allExercises().filter(e => (!f.muscle || e.muscle === f.muscle) && (!f.equipment || e.equipment === f.equipment) && (!q || e.name.toLowerCase().includes(q) || e.pattern.toLowerCase().includes(q)));
    const groups = GYM_LIB.MUSCLES.map(m => [m, list.filter(e => e.muscle === m)]).filter(([, l]) => l.length);
    const others = list.filter(e => !GYM_LIB.MUSCLES.includes(e.muscle)); if (others.length) groups.push(['Other', others]);
    const chip = (label, key, val) => `<button class="chip" data-a="lib-filter" data-k="${key}" data-v="${esc(val)}" aria-pressed="${f[key] === val}">${label}</button>`;
    return { title: 'Library', sub: `${allExercises().length} exercises`,
      html: `<div class="search"><span class="icon">${I.search}</span><input type="text" placeholder="Search" value="${esc(f.q)}" data-in="lib-q" autocomplete="off"></div>
        <div class="chips">${chip('All muscles', 'muscle', '')}${GYM_LIB.MUSCLES.map(m => chip(m, 'muscle', m)).join('')}</div>
        <div class="chips">${chip('All equipment', 'equipment', '')}${GYM_LIB.EQUIPMENT.map(m => chip(m, 'equipment', m)).join('')}</div>
        ${groups.map(([m, l]) => `<h2 class="group-title">${m} (${l.length})</h2><div class="list">${l.map(e => `<button class="row" data-a="open-ex" data-id="${e.id}"><span><span class="t">${esc(e.name)}${e.builtin ? '' : ' <span class="tag custom">Custom</span>'}</span><span class="s" style="display:block">${esc(e.pattern)}, ${esc(e.equipment.toLowerCase())}</span></span>${I.chev}</button>`).join('')}</div>`).join('') || '<p class="empty">No exercise matches.</p>'}
        <button class="btn block" style="margin-top:16px" data-a="new-custom">${I.plus} Add custom exercise</button>` };
  };
  screens.exercise = ({ id }) => {
    const ex = exById(id); const hist = Core.exerciseHistory(id, state.sessions, 10);
    const best = hist.reduce((b, h) => (!b || h.bestSet.kg > b.bestSet.kg || (h.bestSet.kg === b.bestSet.kg && h.bestSet.reps > b.bestSet.reps)) ? h : b, null);
    const bestE1 = hist.reduce((m, h) => Math.max(m, h.e1rm), 0);
    const sim = Core.similarExercises(ex, allExercises());
    return { title: esc(ex.name), back: { parent: 'library' }, tab: 'library',
      html: `<div class="kv" style="margin-top:12px"><div><span>Muscle</span><b>${esc(ex.muscle)}${ex.secondary && ex.secondary.length ? ` <span class="muted small">+ ${esc(ex.secondary.join(', '))}</span>` : ''}</b></div><div><span>Movement</span><b>${esc(ex.pattern)}</b></div><div><span>Equipment</span><b>${esc(ex.equipment)}</b></div><div><span>Type</span><b>${ex.compound ? 'Compound' : 'Isolation'}</b></div>
          <div class="inline-stepper"><span>Rest between sets</span><div class="stepper compact"><button data-a="rest-dec" data-id="${id}" aria-label="Less rest">${I.minus}</button><input value="${restFor(ex)}" inputmode="numeric" data-in="rest-in" data-id="${id}" aria-label="Rest seconds"><button data-a="rest-inc" data-id="${id}" aria-label="More rest">${I.plus}</button></div></div></div>
        <h2 class="section-title">Progress</h2>
        ${hist.length ? `<div class="kv"><div><span>Best set</span><b>${best.bestSet.kg} kg × ${best.bestSet.reps}, ${shortDate(best.date)}</b></div><div><span>Best estimated 1RM</span><b>${bestE1} kg</b></div></div>
          <div class="chart" style="margin-top:12px">${volumeChart(hist)}</div>
          <table class="hist" style="margin-top:12px"><thead><tr><th>Date</th><th>Sets</th><th class="num">Volume</th></tr></thead><tbody>${hist.map(h => `<tr><td>${shortDate(h.date)}</td><td>${h.sets.map(s => `${s.kg}×${s.reps}`).join(', ')}</td><td class="num">${kgFmt(h.volume)} kg</td></tr>`).join('')}</tbody></table>`
        : `<p class="empty">No logged sets yet.</p>`}
        ${sim.length ? `<h2 class="section-title">Similar exercises</h2><div class="list">${sim.map(o => `<button class="row" data-a="open-ex" data-id="${o.id}"><span class="t">${esc(o.name)}</span><span class="v">${esc(o.equipment)}</span></button>`).join('')}</div>` : ''}
        ${ex.builtin ? '' : `<button class="btn block danger" style="margin-top:16px" data-a="delete-custom" data-id="${id}">Delete this custom exercise</button>`}` };
  };
  function volumeChart(hist) {
    const rows = hist.slice().reverse(), n = rows.length, max = Math.max(...rows.map(r => r.volume), 1);
    const W = 320, H = 150, top = 22, base = 122, bw = Math.min(40, (W - 20) / n - 6);
    const bars = rows.map((r, i) => { const x = 10 + i * ((W - 20) / n) + ((W - 20) / n - bw) / 2, h = Math.max(2, (r.volume / max) * (base - top)); return `<rect x="${x}" y="${base - h}" width="${bw}" height="${h}" rx="3" fill="var(--blue)"/><text x="${x + bw / 2}" y="${base - h - 5}" font-size="10" text-anchor="middle" fill="var(--ink-2)">${r.bestSet.kg}×${r.bestSet.reps}</text><text x="${x + bw / 2}" y="${base + 14}" font-size="10" text-anchor="middle" fill="var(--ink-2)">${shortDate(r.date)}</text>`; }).join('');
    return `<p class="lbl">Volume per workout (kg), label = best set</p><svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><line x1="10" y1="${base}" x2="${W - 10}" y2="${base}" stroke="var(--line)"/>${bars}</svg>`;
  }
  function openCustomForm() {
    const opt = (list, sel) => list.map(v => `<option${v === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');
    sheet(`<div class="sheet-head"><div><h3>Add custom exercise</h3></div><button class="btn-icon plain" data-a="close-sheet" aria-label="Close">${I.close}</button></div>
      <div class="sheet-body"><label class="field"><span>Name</span><input type="text" id="cfName" placeholder="e.g. Iso-Lateral Row"></label>
      <label class="field"><span>Muscle</span><select id="cfMuscle">${opt(GYM_LIB.MUSCLES, 'Chest')}</select></label>
      <label class="field"><span>Movement (used to find similar exercises)</span><select id="cfPattern">${opt(GYM_LIB.PATTERNS, 'Horizontal press')}</select></label>
      <label class="field"><span>Equipment</span><select id="cfEquip">${opt(GYM_LIB.EQUIPMENT, 'Machine')}</select></label>
      <label class="check"><input type="checkbox" id="cfCompound"> Compound movement (longer default rest)</label>
      <button class="btn primary" style="width:100%;margin-top:8px" data-a="save-custom">Save exercise</button></div>`);
    setTimeout(() => $('#cfName').focus(), 50);
  }

  // ---------- History ----------
  screens.history = () => {
    if (!state.sessions.length) return { title: 'History', html: `<p class="empty">No workouts yet. Finish one and it will show up here.</p>` };
    const groups = [];
    for (const s of state.sessions) { const k = s.date.slice(0, 7); let g = groups.find(x => x.k === k); if (!g) { const d = new Date(s.date); g = { k, label: ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()] + ' ' + d.getFullYear(), list: [] }; groups.push(g); } g.list.push(s); }
    return { title: 'History', sub: `${state.sessions.length} workout${state.sessions.length === 1 ? '' : 's'}`, html: groups.map(g => `<h2 class="group-title">${g.label} (${g.list.length})</h2><div class="list">${g.list.map(sessionRow).join('')}</div>`).join('') };
  };
  screens.session = ({ id }) => {
    const s = state.sessions.find(x => x.id === id); if (!s) return screens.history();
    const prior = state.sessions.filter(x => x.date < s.date), prs = Core.computePRs(s, prior), { done } = Core.sessionDoneSets(s);
    const cards = s.items.map(it => { const ex = exById(it.exId), p = prs[it.exId] || {}; const b = Core.bestSet(it.sets); return `<div class="card"><h2>${esc(ex.name)} ${p.kg ? '<span class="tag pr">Weight PR</span>' : p.e1rm ? '<span class="tag pr">Est. 1RM PR</span>' : ''}</h2>
        <p class="sets-line" style="margin-top:6px">${it.sets.map((x, i) => `<b>${x.kg}</b>×${x.reps}`).join(', ')}</p>
        <p class="muted small" style="margin-top:4px">Best ${b ? `${b.kg} kg × ${b.reps}` : ''}${b && Core.e1rm(b.kg, b.reps) ? `, est. 1RM ${Core.e1rm(b.kg, b.reps).value} kg` : ''}</p></div>`; }).join('');
    return { title: Core.fmtDate(s.date), sub: `${esc(s.dayName)}${s.routineName ? ', ' + esc(s.routineName) : ''}`, back: { parent: 'history' }, tab: 'history',
      html: `<div class="kv" style="margin-top:12px"><div><span>Duration</span><b>${Core.fmtClock(s.durationSec)}</b></div><div><span>Sets</span><b>${done}</b></div><div><span>Volume</span><b>${kgFmt(Core.sessionVolume(s))} kg</b></div></div>${cards}
        <button class="btn block" data-a="repeat-session" data-id="${s.id}">Repeat this workout</button><button class="btn block ghost danger" data-a="delete-session" data-id="${s.id}">Delete workout</button>` };
  };

  // ---------- Settings ----------
  screens.settings = () => {
    const st = state.settings, used = ['settings','custom','routines','sessions','draft'].reduce((n, k) => n + (localStorage.getItem('gym.v1.' + k) || '').length, 0);
    const stp = (label, key, step, unit) => `<div class="inline-stepper"><span>${label}</span><div class="stepper compact"><button data-a="set-dec" data-k="${key}" data-step="${step}" aria-label="Decrease">${I.minus}</button><input value="${st[key]}" inputmode="decimal" data-in="setting" data-k="${key}" aria-label="${label}"><button data-a="set-inc" data-k="${key}" data-step="${step}" aria-label="Increase">${I.plus}</button></div></div>`;
    return { title: 'Settings',
      html: `<h2 class="section-title">Defaults</h2><div class="kv">${stp('Bar weight (kg)', 'barKg', 2.5)}${stp('Rest, compound (s)', 'restCompound', 15)}${stp('Rest, isolation (s)', 'restIsolation', 15)}</div>
        <h2 class="section-title">Backup</h2><div class="kv"><div><span>Last backup</span><b>${st.lastExport ? Core.fmtDate(new Date(st.lastExport).toISOString()) : 'Never'}</b></div><div><span>Data size</span><b>${(used / 1024).toFixed(0)} KB of about 5,000 KB</b></div></div>
        <button class="btn primary block" data-a="export">Export backup file</button><button class="btn block" data-a="import">Import backup file</button>
        <p class="muted small" style="margin:8px 16px 0">Export downloads one JSON file with everything. Keep a copy in Google Drive: clearing Chrome data or changing phone wipes the app's storage.</p>
        <h2 class="section-title">Data</h2><button class="btn block" data-a="restore-templates">Restore built-in routine templates</button><button class="btn block danger" data-a="wipe">Delete all data</button>
        <p class="muted small" style="margin:16px 16px 0">Gym Log ${VERSION}. Data stays on this phone.</p>` };
  };
  function exportBackup() {
    const data = { schemaVersion: 1, exportedAt: new Date().toISOString(), app: 'Gym Log ' + VERSION, settings: state.settings, custom: state.custom, routines: state.routines, sessions: state.sessions };
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `gym-log-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    state.settings.lastExport = Date.now(); saveSettings(); toast('Backup file downloaded'); render();
  }
  let pendingImport = null;
  $('#importFile').addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let obj; try { obj = JSON.parse(rd.result); } catch (err) { return toast('That file is not valid JSON'); }
      const v = Core.validateBackup(obj); if (!v.ok) return toast(v.errors[0]);
      pendingImport = obj;
      sheet(`<div class="sheet-head"><div><h3>Import backup</h3><p>${plural((obj.sessions || []).length, 'workout')}, ${plural((obj.routines || []).length, 'routine')}, ${plural((obj.custom || []).length, 'custom exercise')}${obj.exportedAt ? ', exported ' + Core.fmtDate(obj.exportedAt) : ''}</p></div><button class="btn-icon plain" data-a="close-sheet" aria-label="Close">${I.close}</button></div>
        <div class="sheet-body summary"><button class="btn primary" data-a="import-merge">Merge into my data</button><button class="btn" data-a="import-replace">Replace everything</button><button class="btn ghost" data-a="close-sheet">Cancel</button></div>`);
    };
    rd.readAsText(f);
  });
  function applyImport(mode) {
    const o = pendingImport; if (!o) return;
    if (mode === 'replace') {
      state.sessions = o.sessions || []; state.routines = (o.routines && o.routines.length) ? o.routines : clone(GYM_LIB.routines); state.custom = o.custom || [];
      state.settings = Object.assign({}, DEFAULT_SETTINGS, o.settings || {}, { lastExport: state.settings.lastExport });
    } else {
      state.sessions = Core.mergeSessions(state.sessions, o.sessions || []);
      for (const c of o.custom || []) if (!state.custom.some(x => x.id === c.id)) state.custom.push(c);
      for (const r of o.routines || []) if (!state.routines.some(x => x.id === r.id)) state.routines.push(r);
    }
    if (!routineById(state.settings.activeRoutineId)) state.settings.activeRoutineId = state.routines[0] ? state.routines[0].id : null;
    saveSessions(); saveRoutines(); saveCustom(); saveSettings(); pendingImport = null; closeSheet(); toast('Backup imported'); render();
  }

  // ---------- Sheets, toasts, prompts ----------
  const sheetEl = $('#sheet');
  function sheet(html) { sheetEl.innerHTML = html; if (!sheetEl.open) sheetEl.showModal(); }
  function closeSheet() { if (sheetEl.open) sheetEl.close(); sheetEl.innerHTML = ''; }
  sheetEl.addEventListener('click', e => { if (e.target === sheetEl) closeSheet(); });
  let toastTimer = null;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2200); }
  function confirmSheet(title, text, okLabel, onOk, danger = true) {
    confirmCb = onOk;
    sheet(`<div class="sheet-head"><div><h3>${title}</h3><p>${text}</p></div></div><div class="sheet-body summary"><button class="btn ${danger ? 'danger' : 'primary'}" data-a="confirm-ok">${okLabel}</button><button class="btn ghost" data-a="close-sheet">Cancel</button></div>`);
  }
  let confirmCb = null, promptCb = null;
  function promptSheet(title, value, okLabel, onOk) {
    promptCb = onOk;
    sheet(`<div class="sheet-head"><div><h3>${title}</h3></div><button class="btn-icon plain" data-a="close-sheet" aria-label="Close">${I.close}</button></div><div class="sheet-body summary"><label class="field"><span>Name</span><input type="text" id="promptVal" value="${esc(value)}"></label><button class="btn primary" data-a="prompt-ok">${okLabel}</button></div>`);
    setTimeout(() => { const i = $('#promptVal'); if (i) { i.focus(); i.select(); } }, 50);
  }

  // ---------- Actions ----------
  const actions = {
    nav: el => go(el.dataset.to, {}, true),
    back: el => back(el.dataset.parent || 'home', el.dataset.pid ? { id: el.dataset.pid } : {}),
    'close-sheet': () => closeSheet(),
    'confirm-ok': () => { const cb = confirmCb; confirmCb = null; closeSheet(); if (cb) cb(); },
    'prompt-ok': () => { const v = ($('#promptVal') || {}).value || ''; const cb = promptCb; promptCb = null; if (!v.trim()) return toast('Please enter a name'); closeSheet(); if (cb) cb(v.trim()); },
    // Home
    'start-day': el => { const r = routineById(el.dataset.r), day = r && r.days.find(d => d.id === el.dataset.d); if (!day) return; if (state.draft) return confirmSheet('Replace current workout?', 'A workout is already in progress. Starting a new one discards it.', 'Discard and start', () => { startWorkout(draftFromDay(r, day)); }); startWorkout(draftFromDay(r, day)); },
    'choose-day': () => { const r = activeRoutine(); if (!r) return; sheet(`<div class="sheet-head"><div><h3>Choose a day</h3><p>${esc(r.name)}</p></div><button class="btn-icon plain" data-a="close-sheet" aria-label="Close">${I.close}</button></div><ul class="opts">${r.days.map(d => `<li><button data-a="start-day" data-r="${r.id}" data-d="${d.id}"><span>${esc(d.name)}<span class="sub">${d.items.map(i => exById(i.exId).name).slice(0, 4).map(esc).join(', ')}${d.items.length > 4 ? '…' : ''}</span></span></button></li>`).join('')}</ul>`); },
    quick: () => { if (state.draft) return confirmSheet('Replace current workout?', 'A workout is already in progress.', 'Discard and start', () => startWorkout(draftFromDay(null, null))); startWorkout(draftFromDay(null, null)); },
    resume: () => go('workout'),
    'discard-draft': () => confirmSheet('Discard this workout?', 'Sets you logged in it will not be saved.', 'Discard', () => { state.draft = null; saveDraft(); stopRest(); go('home', {}, true); toast('Workout discarded'); }),
    'open-session': el => go('session', { id: el.dataset.id }),
    export: exportBackup,
    import: () => $('#importFile').click(),
    'import-merge': () => applyImport('merge'),
    'import-replace': () => confirmSheet('Replace everything?', 'All workouts, routines and custom exercises on this phone will be replaced by the file.', 'Replace', () => applyImport('replace')),
    // Workout
    dec: el => stepSet(el, -1), inc: el => stepSet(el, 1),
    done: el => { const it = state.draft.items[+el.dataset.i], s = it.sets[+el.dataset.s]; s.done = !s.done; el.setAttribute('aria-pressed', s.done); el.closest('[style]').classList.toggle('row-done', s.done); saveDraft(); if (s.done) startRest(exById(it.exId)); },
    'add-set': el => { const it = state.draft.items[+el.dataset.i], p = it.sets[it.sets.length - 1] || { kg: 0, reps: it.targetReps || 10 }; it.sets.push({ kg: p.kg, reps: p.reps, done: false }); saveDraft(); render(); },
    'remove-set': el => { const it = state.draft.items[+el.dataset.i]; if (it.sets.length > 1) it.sets.pop(); saveDraft(); render(); },
    'remove-ex': el => { const i = +el.dataset.i, ex = exById(state.draft.items[i].exId); confirmSheet(`Remove ${esc(ex.name)}?`, 'Only from this workout. Your routine is not changed.', 'Remove', () => { state.draft.items.splice(i, 1); saveDraft(); render(); }); },
    swap: el => openSwap(+el.dataset.i),
    'pick-swap': el => { const i = +el.dataset.i, it = state.draft.items[i], newId = el.dataset.id, save = $('#swapSave') && $('#swapSave').checked; const oldId = it.exId;
      const fresh = draftItem(newId, it.sets.length, it.targetReps || 10); it.exId = newId; it.sets = fresh.sets;
      if (save) { const r = routineById(state.draft.routineId), day = r && r.days.find(d => d.id === state.draft.dayId); const di = day && day.items.find(x => x.exId === oldId); if (di) { di.exId = newId; saveRoutines(); } }
      saveDraft(); closeSheet(); render(); toast(`Swapped to ${exById(newId).name}${save ? ' and routine updated' : ''}`); },
    'add-ex': () => openPicker(id => { state.draft.items.push(draftItem(id, 3, 10)); saveDraft(); closeSheet(); render(); }),
    'pick-ex': el => { const cb = pickerCb; pickerCb = null; if (cb) cb(el.dataset.id); },
    finish: openFinish,
    'save-workout': saveWorkout,
    'rest-plus': () => { const r = state.draft && state.draft.rest; if (!r) return; clearTimeout(hideTimer); r.end += 30000; r.total += 30; r.fired = false; restEl.classList.remove('finished'); saveDraft(); tick(); },
    'rest-skip': stopRest,
    // Routines
    'open-routine': el => go('routine', { id: el.dataset.id }),
    'new-routine': () => promptSheet('New routine', '', 'Create', name => { const r = { id: 'r-' + Core.uid(), name, builtin: false, days: [{ id: 'd-' + Core.uid(), name: 'Day 1', items: [] }] }; state.routines.push(r); saveRoutines(); go('routine', { id: r.id }); }),
    'set-active': el => { state.settings.activeRoutineId = el.dataset.id; state.settings.nextDayIndex = 0; saveSettings(); render(); toast('Active routine updated'); },
    'open-day': el => go('day', { r: el.dataset.r, d: el.dataset.d }),
    'add-day': el => { const r = routineById(el.dataset.id); promptSheet('New day', 'Day ' + (r.days.length + 1), 'Add', name => { const d = { id: 'd-' + Core.uid(), name, items: [] }; r.days.push(d); saveRoutines(); go('day', { r: r.id, d: d.id }); }); },
    'rename-routine': el => { const r = routineById(el.dataset.id); promptSheet('Rename routine', r.name, 'Save', name => { r.name = name; saveRoutines(); render(); }); },
    'duplicate-routine': el => { const r = routineById(el.dataset.id), c = clone(r); c.id = 'r-' + Core.uid(); c.name = r.name + ' (copy)'; c.builtin = false; c.days.forEach(d => d.id = 'd-' + Core.uid()); state.routines.push(c); saveRoutines(); go('routine', { id: c.id }, true); toast('Routine duplicated'); },
    'delete-routine': el => { const r = routineById(el.dataset.id); confirmSheet(`Delete ${esc(r.name)}?`, 'Past workouts are kept. You can restore built-in templates from Settings.', 'Delete', () => { state.routines = state.routines.filter(x => x.id !== r.id); if (state.settings.activeRoutineId === r.id) { state.settings.activeRoutineId = state.routines[0] ? state.routines[0].id : null; state.settings.nextDayIndex = 0; saveSettings(); } saveRoutines(); go('routines', {}, true); }); },
    'day-dec': el => stepDay(el, -1), 'day-inc': el => stepDay(el, 1),
    'day-up': el => { const { day } = curDay(), i = +el.dataset.i; if (i > 0) { [day.items[i - 1], day.items[i]] = [day.items[i], day.items[i - 1]]; saveRoutines(); render(); } },
    'day-down': el => { const { day } = curDay(), i = +el.dataset.i; if (i < day.items.length - 1) { [day.items[i + 1], day.items[i]] = [day.items[i], day.items[i + 1]]; saveRoutines(); render(); } },
    'day-remove': el => { const { day } = curDay(); day.items.splice(+el.dataset.i, 1); saveRoutines(); render(); },
    'day-add-ex': () => openPicker(id => { const { day } = curDay(); day.items.push({ exId: id, sets: 3, reps: 10 }); saveRoutines(); closeSheet(); render(); }),
    'rename-day': () => { const { day } = curDay(); promptSheet('Rename day', day.name, 'Save', name => { day.name = name; saveRoutines(); render(); }); },
    'delete-day': () => { const { r, day } = curDay(); confirmSheet(`Delete ${esc(day.name)}?`, 'The exercises in it are removed from the routine.', 'Delete', () => { r.days = r.days.filter(d => d.id !== day.id); if (state.settings.nextDayIndex >= r.days.length) { state.settings.nextDayIndex = 0; saveSettings(); } saveRoutines(); go('routine', { id: r.id }, true); }); },
    // Library
    'lib-filter': el => { state.libFilter[el.dataset.k] = el.dataset.v; render(); },
    'open-ex': el => go('exercise', { id: el.dataset.id }),
    'new-custom': openCustomForm,
    'save-custom': () => { const name = $('#cfName').value.trim(); if (!name) return toast('Please enter a name'); const ex = { id: 'c-' + Core.uid(), name, muscle: $('#cfMuscle').value, pattern: $('#cfPattern').value, equipment: $('#cfEquip').value, compound: $('#cfCompound').checked, rest: $('#cfCompound').checked ? state.settings.restCompound : state.settings.restIsolation, secondary: [], builtin: false }; state.custom.push(ex); saveCustom(); closeSheet(); toast('Exercise added'); go('exercise', { id: ex.id }); },
    'delete-custom': el => confirmSheet('Delete this exercise?', 'Workouts that used it keep their sets but show "Deleted exercise".', 'Delete', () => { state.custom = state.custom.filter(x => x.id !== el.dataset.id); saveCustom(); go('library', {}, true); }),
    'rest-dec': el => stepRest(el, -15), 'rest-inc': el => stepRest(el, 15),
    // History
    'repeat-session': el => { const s = state.sessions.find(x => x.id === el.dataset.id); const d = draftFromDay(routineById(s.routineId), null); d.dayName = s.dayName; d.routineName = s.routineName; d.dayId = s.dayId; d.items = s.items.map(it => draftItem(it.exId, it.sets.length, it.sets[0] ? it.sets[0].reps : 10)); if (state.draft) return confirmSheet('Replace current workout?', 'A workout is already in progress.', 'Discard and start', () => startWorkout(d)); startWorkout(d); },
    'delete-session': el => confirmSheet('Delete this workout?', 'This cannot be undone unless you have a backup.', 'Delete', () => { state.sessions = state.sessions.filter(x => x.id !== el.dataset.id); saveSessions(); go('history', {}, true); toast('Workout deleted'); }),
    // Settings
    'set-dec': el => stepSetting(el, -1), 'set-inc': el => stepSetting(el, 1),
    'restore-templates': () => { let n = 0; for (const t of GYM_LIB.routines) if (!routineById(t.id)) { state.routines.push(clone(t)); n++; } saveRoutines(); if (!state.settings.activeRoutineId && state.routines[0]) { state.settings.activeRoutineId = state.routines[0].id; saveSettings(); } render(); toast(n ? `${n} template${n === 1 ? '' : 's'} restored` : 'All templates are already present'); },
    wipe: () => confirmSheet('Delete all data?', 'Every workout, routine and custom exercise on this phone. Export a backup first if you want to keep them.', 'Delete everything', () => { ['settings','custom','routines','sessions','draft'].forEach(LS.del); location.reload(); }),
  };
  function stepSet(el, dir) {
    const it = state.draft.items[+el.dataset.i], s = it.sets[+el.dataset.s], f = el.dataset.f, step = f === 'kg' ? 2.5 : 1;
    const v = Math.max(0, num(s[f]) + dir * step); s[f] = f === 'kg' ? Math.round(v * 100) / 100 : Math.round(v);
    el.parentElement.querySelector('input').value = s[f]; saveDraft(); if (+el.dataset.s === 0 && f === 'kg') refreshPlates(+el.dataset.i);
  }
  function stepDay(el, dir) { const { day } = curDay(), it = day.items[+el.dataset.i], f = el.dataset.f; it[f] = Math.max(1, Math.round(num(it[f]) + dir)); el.parentElement.querySelector('input').value = it[f]; saveRoutines(); }
  function stepRest(el, delta) { const id = el.dataset.id, ex = exById(id), v = Math.max(15, restFor(ex) + delta); state.settings.restOverrides[id] = v; saveSettings(); el.parentElement.querySelector('input').value = v; }
  function stepSetting(el, dir) { const k = el.dataset.k, step = num(el.dataset.step), v = Math.max(k === 'barKg' ? 0 : 15, Math.round((num(state.settings[k]) + dir * step) * 100) / 100); state.settings[k] = v; saveSettings(); el.parentElement.querySelector('input').value = v; }

  const inputs = {
    set: el => { const it = state.draft.items[+el.dataset.i], s = it.sets[+el.dataset.s], f = el.dataset.f; s[f] = f === 'kg' ? num(el.value) : Math.round(num(el.value)); saveDraft(); if (+el.dataset.s === 0 && f === 'kg') refreshPlates(+el.dataset.i); },
    'day-set': el => { const { day } = curDay(), it = day.items[+el.dataset.i]; it[el.dataset.f] = Math.max(1, Math.round(num(el.value))); saveRoutines(); },
    'picker-q': el => fillPicker(el.value),
    'lib-q': el => { state.libFilter.q = el.value; const y = window.scrollY; render(); const inp = $('[data-in="lib-q"]'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } window.scrollTo(0, y); },
    'rest-in': el => { const v = Math.max(15, Math.round(num(el.value))); state.settings.restOverrides[el.dataset.id] = v; saveSettings(); },
    setting: el => { const k = el.dataset.k, v = num(el.value); if (v >= 0) { state.settings[k] = v; saveSettings(); } },
  };
  document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const fn = actions[el.dataset.a]; if (fn) { e.preventDefault(); fn(el, e); } });
  document.addEventListener('input', e => { const el = e.target.closest('[data-in]'); if (!el) return; const fn = inputs[el.dataset.in]; if (fn) fn(el, e); });
  document.addEventListener('focusin', e => { if (e.target.matches('.stepper input')) e.target.select(); });

  // ---------- Boot ----------
  history.replaceState(state.view, '', '#home');
  render();
})();
