export type Ticket = { id: string; created: number; due: number; priority: string; category: string; status: string; assignee: string; team: string; resolved?: number; impact: string; description?: string; firstResponse?: number; csat?: number };
export type AnalysisSettings = { capacityHours?: number };
const H = 3600000, M = 60000;
export const SLA_H: Record<string, number> = { Critical: 2, High: 4, Medium: 8, Low: 24 };
export const PW: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const pct = (a: number[], p: number) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// [category, team, base handling minutes, share of volume, customer impact]
const CATS: [string, string, number, number, string][] = [
  ["Refund", "Billing", 40, .18, "Refund requested"], ["Billing Query", "Billing", 25, .14, "Payment pending"],
  ["Delivery Delay", "Logistics", 30, .22, "Order delayed"], ["Order Tracking", "Logistics", 12, .10, "Tracking unclear"],
  ["Login Issue", "Technical", 20, .12, "Cannot access account"], ["Product Defect", "Support", 35, .14, "Faulty product"],
  ["General Query", "Support", 10, .10, "Information needed"]];
const AGENTS: Record<string, string[]> = { Billing: ["Asha", "Ravi", "Meera"], Logistics: ["Kabir", "Neha", "Imran", "Pooja"], Technical: ["Arjun", "Sana", "Dev"], Support: ["Priya", "Vikram", "Anita", "Rohan"] };

/** Reproducible synthetic dataset: 1,000 tickets over 14 days, FIFO agents, uneven assignment and a refund surge today. */
export function generate() {
  const r = rng(42), now = new Date(2026, 9, 29, 15, 0).getTime();
  const HW = [1, 1, 2, 3, 3, 2, 2, 3, 3, 2, 1, 1];
  const mk = (forceCat: number, today: boolean) => {
    let created = 0;
    do {
      const d = today ? 0 : Math.floor(r() * 14), hw = HW.slice(0, d === 0 ? 6 : 12);
      let x = r() * hw.reduce((a, b) => a + b, 0), h = 0; while (x > hw[h]) { x -= hw[h]; h++; }
      created = new Date(now).setHours(9 + h, Math.floor(r() * 60), 0, 0) - d * 24 * H;
    } while (created >= now - 5 * M);
    let ci = forceCat, y = r(); if (ci < 0) { ci = 0; let c = CATS[0][3]; while (y > c && ci < CATS.length - 1) { ci++; c += CATS[ci][3]; } }
    const q = r(), pr = q < .08 ? "Critical" : q < .30 ? "High" : q < .75 ? "Medium" : "Low";
    const ag = AGENTS[CATS[ci][1]], agent = ag[r() < .45 ? 0 : Math.floor(r() * ag.length)];
    return { created, ci, pr, agent, description: ["Customer says order is delayed and tracking has not updated", "Customer requests a refund for a recent order", "Unable to sign in after resetting the password", "Payment was charged twice and invoice is missing", "Product arrived damaged and customer wants a replacement", "Customer asks where the shipment is", "Need help understanding account settings"][ci] };
  };
  const L = [...Array.from({ length: 960 }, () => mk(-1, false)), ...Array.from({ length: 40 }, () => mk(0, true))].sort((a, b) => a.created - b.created);
  const free: Record<string, number> = {};
  const tickets: Ticket[] = L.map((l, i) => {
    const c = CATS[l.ci], start = Math.max(l.created, free[l.agent] || 0), end = start + c[2] * 1.5 * (0.7 + r() * 0.6) * M; free[l.agent] = end;
    return { id: `TK-${1001 + i}`, created: l.created, due: l.created + SLA_H[l.pr] * H, priority: l.pr, category: c[0], status: end <= now ? "Resolved" : "Open", assignee: l.agent, team: c[1], resolved: end <= now ? end : undefined, impact: c[4], description: l.description, firstResponse: l.created + Math.min(180, 5 + r() * 70) * M, csat: end <= now ? Math.max(1, Math.min(5, Math.round(4.3 - (end > l.created + SLA_H[l.pr] * H ? 1.2 : 0) + (r() - .5)))) : undefined };
  });
  return { tickets, now };
}

const iso = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * M).toISOString().slice(0, 19);
export function toCSV(T: Ticket[]) {
  return ["ticket_id,created_at,due_at,priority,category,status,assignee,team,resolved_at,customer_impact,description,first_response_at,csat", ...T.map(t => [t.id, iso(t.created), iso(t.due), t.priority, t.category, t.status, t.assignee, t.team, t.resolved ? iso(t.resolved) : "", t.impact, (t.description || "").replaceAll(",", ";"), t.firstResponse ? iso(t.firstResponse) : "", t.csat ?? ""].join(","))].join("\n");
}

/** Reads rows using the ticket template headers. Returns null if fewer than 5 valid tickets. */
function durationMs(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return n * H; // common public datasets express resolution time as hours
  const m = value.match(/([0-9.]+)\s*(minutes?|mins?|m|hours?|hrs?|h|days?|d)/i);
  if (!m) return undefined;
  const amount = Number(m[1]), unit = m[2].toLowerCase();
  return amount * (unit.startsWith("d") ? 24 * H : unit.startsWith("h") ? H : M);
}

export function parseTickets(rows: Record<string, unknown>[]) {
  const out: Ticket[] = [];
  for (const row of rows) {
    const k: Record<string, string> = {}; for (const key in row) k[key.trim().toLowerCase()] = String(row[key] ?? "").trim();
    const id = k.ticket_id || k.id || k.case_id || k.ticketid; const created = Date.parse(k.created_at || k.opened_at || k.created || k.creation_date || k.timestamp || k.date || k.date_of_purchase); if (!id || isNaN(created)) continue;
    const priority = ["Critical", "High", "Medium", "Low"].find(p => p.toLowerCase() === (k.priority || "").toLowerCase()) || "Medium";
    const d = Date.parse(k.due_at || k.sla_deadline || k.deadline); let rs = Date.parse(k.resolved_at || k.resolution_date || k.closed_at); const rawResolution = k.time_to_resolution || k.resolution_time || k.resolution_hours; if (isNaN(rs) && rawResolution) { const duration = durationMs(rawResolution); if (duration !== undefined) rs = created + duration; } let fr = Date.parse(k.first_response_at || k.first_response_timestamp); if (isNaN(fr)) { const responseDuration = k.first_response_minutes && Number.isFinite(Number(k.first_response_minutes)) ? Number(k.first_response_minutes) * M : durationMs(k.first_response_time || ""); if (responseDuration !== undefined) fr = created + responseDuration; }
    const rawPriority = k.priority || k.urgency || k.ticket_priority || "Medium";
    const mappedPriority = /urgent|critical|emergency/i.test(rawPriority) ? "Critical" : /high|important/i.test(rawPriority) ? "High" : /low/i.test(rawPriority) ? "Low" : priority;
    const description = [k.subject || k.ticket_subject || "", k.description || k.ticket_description || k.issue_description || k.text || k.body || k.issue || ""].filter(Boolean).join(" — ");
    const rawCsat = Number(k.csat || k.satisfaction_rating || k.customer_satisfaction || k.satisfaction_score || k.rating);
    out.push({ id, created, due: isNaN(d) ? created + SLA_H[mappedPriority] * H : d, priority: mappedPriority, category: k.category || k.ticket_type || k.type || k.queue || "Unclassified", status: (!isNaN(rs) || /resolved|closed|complete|solved/i.test(k.status || "")) ? "Resolved" : "Open", assignee: k.assignee || k.agent || k.agent_name || "Unassigned", team: k.team || k.department || k.queue || k.category || "General", resolved: isNaN(rs) ? undefined : rs, impact: k.customer_impact || k.impact || "", description, firstResponse: isNaN(fr) ? undefined : fr, csat: Number.isFinite(rawCsat) && rawCsat > 0 ? rawCsat : undefined });
  }
  if (out.length < 5) return null;
  return { tickets: out, now: Math.max(...out.map(t => Math.max(t.created, t.resolved ?? 0))) };
}

type Sim = Record<string, { finish: number; agent: string }>;
export function analyze(T: Ticket[], now: number, settings: AnalysisSettings = {}) {
  const capacityHours = Math.max(1, Math.min(24, Number(settings.capacityHours) || 8));
  const done = T.filter(t => t.resolved !== undefined), open = T.filter(t => t.resolved === undefined);
  const cats = Array.from(new Set(T.map(t => t.category))), teams = Array.from(new Set(T.map(t => t.team)));

  // 1) Patterns: handling time per category = fastest-quartile turnaround (proxy for work time without queueing)
  const handle: Record<string, number> = {};
  const issues = cats.map(c => {
    const all = T.filter(t => t.category === c), d = all.filter(t => t.resolved !== undefined), tat = d.map(t => (t.resolved! - t.created) / H);
    handle[c] = Math.min(3, Math.max(10 / 60, d.length ? pct(tat, .25) : .5));
    const breached = all.filter(t => (t.resolved ?? now) > t.due).length;
    return { category: c, team: all[0].team, count: all.length, open: all.length - d.length, avgTat: tat.length ? tat.reduce((a, b) => a + b, 0) / tat.length : 0, breached, rate: breached / all.length };
  }).sort((a, b) => b.breached - a.breached);
  const hh = (t: Ticket) => (handle[t.category] ?? .5) * H;
  const ab: Record<string, string[]> = {}; teams.forEach(tm => { ab[tm] = Array.from(new Set(T.filter(t => t.team === tm).map(t => t.assignee))); });

  // 2) Baseline: each agent works their own queue first-in-first-out
  const base: Sim = {}, ahead: Record<string, number> = {}, byAg: Record<string, Ticket[]> = {};
  open.forEach(t => (byAg[t.assignee] = byAg[t.assignee] || []).push(t));
  Object.values(byAg).forEach(Q => { Q.sort((a, b) => a.created - b.created); let c = now; Q.forEach((t, i) => { c += hh(t); base[t.id] = { finish: c, agent: t.assignee }; ahead[t.id] = i; }); });

  // 3) Optimised: earliest-deadline-first within each team, always giving the next ticket to the agent who frees up first.
  //    Tickets that can no longer meet their SLA are handled last, so capacity is spent on tickets that can still be saved.
  const opt: Sim = {};
  teams.forEach(tm => {
    const Q = open.filter(t => t.team === tm), impactWeight = (t: Ticket) => /refund|payment|charged|cannot|unable|damaged|defect|medical|urgent|cancel/i.test(`${t.impact} ${t.description || ""}`) ? 2.5 : /delay|late|delivery|shipping/i.test(`${t.impact} ${t.description || ""}`) ? 1.8 : 1, live = Q.filter(t => t.due > now).sort((a, b) => (a.due - now) / (PW[a.priority] * impactWeight(a)) - (b.due - now) / (PW[b.priority] * impactWeight(b)) || PW[b.priority] - PW[a.priority]);
    const late = Q.filter(t => t.due <= now), free: Record<string, number> = {}; ab[tm].forEach(a => free[a] = now);
    const put = (t: Ticket) => { let best = ab[tm][0], bestCost = Infinity; ab[tm].forEach(a => { const finish = free[a] + hh(t), weight = PW[t.priority] * impactWeight(t), weightedLateness = weight * Math.max(0, finish - t.due) / H, tieBreak = finish / H * 0.001, cost = weightedLateness + tieBreak; if (cost < bestCost) { bestCost = cost; best = a; } }); free[best] += hh(t); opt[t.id] = { finish: free[best], agent: best }; };
    const lost: Ticket[] = [];
    live.forEach(t => { let f = Infinity; ab[tm].forEach(a => { f = Math.min(f, free[a]); }); if (f + hh(t) <= t.due) put(t); else lost.push(t); });
    [...late, ...lost].sort((a, b) => (PW[b.priority] * impactWeight(b)) - (PW[a.priority] * impactWeight(a)) || a.due - b.due).forEach(put);
  });
  const met = (S: Sim) => {
    const br = open.filter(t => S[t.id].finish > t.due), lf: Record<string, number> = {}; Object.values(S).forEach(x => lf[x.agent] = Math.max(lf[x.agent] || now, x.finish));
    const loads = Object.values(ab).flat().map(a => ((lf[a] || now) - now) / H), mean = loads.reduce((a, b) => a + b, 0) / Math.max(1, loads.length);
    const byTeam: Record<string, number> = {}; br.forEach(t => byTeam[t.team] = (byTeam[t.team] || 0) + 1);
    return { breaches: br.length, rate: open.length ? br.length / open.length : 0, tat: open.length ? open.reduce((a, t) => a + (S[t.id].finish - t.created) / H, 0) / open.length : 0, clear: open.length ? (Math.max(...open.map(t => S[t.id].finish)) - now) / H : 0, imbalance: Math.sqrt(loads.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, loads.length)), byTeam };
  };
  const mb = met(base), mo = met(opt);

  // 4) Explainable risk list (baseline)
  const risk = open.map(t => {
    const s = base[t.id], slack = (t.due - s.finish) / H, p = t.due <= now ? 1 : 1 / (1 + Math.exp(slack / .75));
    return { t, p, score: p * (1 + PW[t.priority] / 4), slack, ahead: ahead[t.id], finish: (s.finish - now) / H, dueIn: (t.due - now) / H, h: handle[t.category], optFinish: (opt[t.id].finish - now) / H, optTo: opt[t.id].agent, catRate: issues.find(i => i.category === t.category)!.rate, agentOpen: byAg[t.assignee].length };
  }).sort((a, b) => b.score - a.score);
  const moves = risk.filter(x => x.optTo !== x.t.assignee || x.finish - x.optFinish > .5).slice(0, 8);

  // 5) Workload forecasting: fit a least-squares linear trend to the last 72 hourly buckets.
  // This is a transparent lightweight regression baseline, not a claim of a trained deep-learning model.
  const nd = Math.max(1, Math.ceil((now - Math.min(...T.map(t => t.created))) / (24 * H)));
  const hourMs = H, firstBucket = Math.floor((now - 72 * H) / hourMs) * hourMs;
  const hourly = Array.from({ length: 72 }, (_, i) => T.filter(t => t.created >= firstBucket + i * H && t.created < firstBucket + (i + 1) * H).length);
  const regression = (ys: number[]) => {
    const n = ys.length, mx = (n - 1) / 2, my = ys.reduce((a, b) => a + b, 0) / Math.max(1, n);
    const denom = ys.reduce((a, _, i) => a + (i - mx) ** 2, 0);
    const slope = denom ? ys.reduce((a, y, i) => a + (i - mx) * (y - my), 0) / denom : 0;
    return { intercept: my - slope * mx, slope, predict: (x: number) => Math.max(0, my - slope * mx + slope * x) };
  };
  const model = regression(hourly);
  // Rolling-origin backtest: forecast each of the last 12 observed hours from prior hourly counts.
  const errors: number[] = [];
  for (let i = 48; i < 60; i++) { const m = regression(hourly.slice(0, i)); errors.push(hourly[i] - m.predict(i)); }
  const forecastMAE = errors.length ? errors.reduce((a, e) => a + Math.abs(e), 0) / errors.length : 0;
  const forecastRMSE = errors.length ? Math.sqrt(errors.reduce((a, e) => a + e * e, 0) / errors.length) : 0;
  const nh = new Date(now).getHours();
  const recentMean = hourly.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const priorMean = hourly.slice(-12, -3).reduce((a, b) => a + b, 0) / 9;
  const trend = Math.min(2.5, Math.max(.6, priorMean > 0 ? recentMean / priorMean : 1));
  const th: Record<string, number> = {}; teams.forEach(tm => { const q = T.filter(t => t.team === tm); th[tm] = q.reduce((a, t) => a + (handle[t.category] ?? .5), 0) / Math.max(1, q.length); });
  const capHr = teams.reduce((a, tm) => a + ab[tm].length / th[tm], 0);
  const series = Array.from({ length: 8 }, (_, k) => { const prediction = model.predict(72 + k) * trend; const h = (nh + 1 + k) % 24; return { hour: `${String(h).padStart(2, "0")}:00`, arrivals: +prediction.toFixed(1), capacity: +capHr.toFixed(1) }; });
  const fcTotal = series.reduce((a, s) => a + s.arrivals, 0), wk = T.filter(t => t.created > now - 7 * 24 * H);
  const teamRows = teams.map(tm => {
    const share = wk.filter(t => t.team === tm).length / Math.max(1, wk.length), work = open.filter(t => t.team === tm).reduce((a, t) => a + hh(t) / H, 0) + fcTotal * share * th[tm], cap = ab[tm].length * capacityHours, util = work / cap;
    return { team: tm, agents: ab[tm].length, open: open.filter(t => t.team === tm).length, work, cap, util, status: util > 1 ? "Bottleneck" : util > .8 ? "Watch" : "OK" };
  }).sort((a, b) => b.util - a.util);

  // 6) Anomalies: last 6 hours vs the same window on previous days (z-score)
  const anomalies = cats.map(c => {
    const w = (d: number) => T.filter(t => t.category === c && t.created > now - d * 24 * H - 6 * H && t.created <= now - d * 24 * H).length;
    const x = w(0), prev = Array.from({ length: Math.max(0, nd - 1) }, (_, i) => w(i + 1)), m = prev.reduce((a, b) => a + b, 0) / Math.max(1, prev.length), sd = Math.sqrt(prev.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, prev.length));
    return { category: c, today: x, mean: m, z: (x - m) / Math.max(sd, 1) };
  }).filter(a => a.z > 2).sort((a, b) => b.z - a.z);

  const actuals = errors.map((e, i) => hourly[48 + i]);
  const forecastMAPE = actuals.length ? actuals.reduce((sum, actual, i) => sum + (actual === 0 ? 0 : Math.abs(errors[i]) / actual), 0) / Math.max(1, actuals.filter(x => x > 0).length) : 0;
  // Chronological holdout diagnostic: learn category breach rates on the earlier 80%, evaluate the last 20%.
  const labelled = [...done].sort((a, b) => a.resolved! - b.resolved!);
  const splitAt = Math.max(1, Math.floor(labelled.length * .8));
  const train = labelled.slice(0, splitAt), holdout = labelled.slice(splitAt);
  const trainRates: Record<string, { late: number; total: number }> = {};
  train.forEach(t => { const r = trainRates[t.category] || (trainRates[t.category] = { late: 0, total: 0 }); r.total++; if (t.resolved! > t.due) r.late++; });
  const trainOverallRate = train.length ? train.filter(t => t.resolved! > t.due).length / train.length : 0;
  const confusion = { tp: 0, fp: 0, fn: 0, tn: 0 };
  holdout.forEach(t => {
    const actualLate = t.resolved! > t.due;
    const rate = trainRates[t.category];
    const predictedRisk = rate ? rate.late / Math.max(1, rate.total) > trainOverallRate : false;
    if (predictedRisk && actualLate) confusion.tp++; else if (predictedRisk) confusion.fp++; else if (actualLate) confusion.fn++; else confusion.tn++;
  });
  const riskPrecision = confusion.tp / Math.max(1, confusion.tp + confusion.fp), riskRecall = confusion.tp / Math.max(1, confusion.tp + confusion.fn);
  const qualityTickets = done.filter(t => t.firstResponse !== undefined);
  const avgFirstResponseMins = qualityTickets.length ? qualityTickets.reduce((sum, t) => sum + (t.firstResponse! - t.created) / M, 0) / qualityTickets.length : null;
  const csatTickets = done.filter(t => t.csat !== undefined);
  const avgCSAT = csatTickets.length ? csatTickets.reduce((sum, t) => sum + t.csat!, 0) / csatTickets.length : null;
  const teamImpact = teams.map(tm => ({ team: tm, baseline: mb.byTeam[tm] || 0, optimised: mo.byTeam[tm] || 0 }));
  return { total: T.length, open: open.length, done: done.length, issues, risk, moves, series, teamRows, anomalies, base: mb, opt: mo, teamImpact, trend, forecastMAE, forecastRMSE, forecastMAPE, backtestHours: errors.length, forecastModel: "Hourly least-squares regression + recent-trend adjustment", riskPrecision, riskRecall, labelledRiskTickets: holdout.length, avgFirstResponseMins, avgCSAT, qualitySample: csatTickets.length, capacityHours };
}
