/* core.js — pure logic for Gym Log. No DOM, no storage. Works in the browser (window.Core) and in Node (module.exports). */
(function (root) {
  'use strict';

  const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
  const round2 = n => Math.round(n * 100) / 100;

  function platesPerSide(totalKg, barKg = 20, plates = PLATES) {
    const total = Number(totalKg);
    if (!Number.isFinite(total)) return null;
    let side = (total - barKg) / 2;
    if (side < 0) return null;
    const out = [];
    for (const p of plates) while (side >= p - 1e-9) { out.push(p); side -= p; }
    return { plates: out, leftover: round2(side) };
  }

  function similarExercises(ex, all) {
    return all
      .filter(o => o.id !== ex.id && o.muscle === ex.muscle && o.pattern === ex.pattern)
      .sort((a, b) => ((b.equipment === ex.equipment) - (a.equipment === ex.equipment)) || a.name.localeCompare(b.name));
  }

  function e1rm(kg, reps) {
    kg = Number(kg); reps = Number(reps);
    if (!(kg > 0) || !(reps > 0)) return null;
    const v = reps === 1 ? kg : kg * (1 + reps / 30);
    return { value: Math.round(v * 10) / 10, reliable: reps <= 12 };
  }

  const isDone = s => s && s.done && Number(s.kg) >= 0 && Number(s.reps) > 0;
  const setVolume = s => (Number(s.kg) || 0) * (Number(s.reps) || 0);

  function sessionVolume(session) {
    let v = 0;
    for (const it of session.items || []) for (const s of it.sets || []) if (isDone(s)) v += setVolume(s);
    return v;
  }

  function sessionDoneSets(session) {
    let done = 0, total = 0;
    for (const it of session.items || []) for (const s of it.sets || []) { total++; if (s.done) done++; }
    return { done, total };
  }

  function bestSet(sets) {
    let best = null;
    for (const s of sets || []) {
      if (!isDone(s)) continue;
      if (!best || Number(s.kg) > Number(best.kg) || (Number(s.kg) === Number(best.kg) && Number(s.reps) > Number(best.reps))) best = s;
    }
    return best;
  }

  function bestE1rm(sets) {
    let best = 0;
    for (const s of sets || []) { if (!isDone(s)) continue; const r = e1rm(s.kg, s.reps); if (r && r.value > best) best = r.value; }
    return best;
  }

  function computePRs(session, priorSessions) {
    const out = {};
    for (const it of session.items || []) {
      const b = bestSet(it.sets); if (!b) continue;
      let prevKg = 0, prevE1 = 0;
      for (const p of priorSessions || []) for (const pit of p.items || []) {
        if (pit.exId !== it.exId) continue;
        const pb = bestSet(pit.sets);
        if (pb) prevKg = Math.max(prevKg, Number(pb.kg));
        prevE1 = Math.max(prevE1, bestE1rm(pit.sets));
      }
      out[it.exId] = { kg: Number(b.kg) > prevKg, e1rm: bestE1rm(it.sets) > prevE1 };
    }
    return out;
  }

  function exerciseHistory(exId, sessions, n = 10) {
    const rows = [];
    for (const s of sessions || []) {
      for (const it of s.items || []) {
        if (it.exId !== exId) continue;
        const b = bestSet(it.sets); if (!b) continue;
        let vol = 0; for (const st of it.sets) if (isDone(st)) vol += setVolume(st);
        rows.push({ date: s.date, bestSet: b, volume: vol, e1rm: bestE1rm(it.sets), sets: it.sets.filter(isDone) });
      }
    }
    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return rows.slice(0, n);
  }

  function validateBackup(obj) {
    const errors = [];
    if (!obj || typeof obj !== 'object') return { ok: false, errors: ['File is not a Gym Log backup.'] };
    if (obj.schemaVersion !== 1) errors.push('Unsupported schema version: ' + obj.schemaVersion);
    for (const k of ['custom', 'routines', 'sessions']) if (k in obj && !Array.isArray(obj[k])) errors.push(k + ' must be a list.');
    if ('settings' in obj && (typeof obj.settings !== 'object' || obj.settings === null)) errors.push('settings must be an object.');
    return { ok: errors.length === 0, errors };
  }

  function mergeSessions(existing, incoming) {
    const map = new Map();
    for (const s of existing || []) map.set(s.id, s);
    for (const s of incoming || []) if (!map.has(s.id)) map.set(s.id, s);
    return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  function nextDayIndex(routine, currentIndex) {
    const n = routine && routine.days ? routine.days.length : 0;
    if (!n) return 0;
    return (Number(currentIndex) + 1) % n;
  }

  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  const Core = { PLATES, platesPerSide, similarExercises, e1rm, setVolume, sessionVolume, sessionDoneSets, bestSet, bestE1rm,
    computePRs, exerciseHistory, validateBackup, mergeSessions, nextDayIndex, fmtClock, fmtDate, uid };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core; else root.Core = Core;
})(typeof window !== 'undefined' ? window : globalThis);
