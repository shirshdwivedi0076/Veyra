"use client";
import React, { useEffect, useMemo, useState, ChangeEvent } from "react";
import Papa from "papaparse";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line } from "recharts";
import { generate, parseTickets, analyze, toCSV } from "../lib/opsEngine";
import { setOpsSummary } from "../lib/opsStore";

const pc = (n: number) => `${Math.round(n * 100)}%`, f1 = (n: number) => n.toFixed(1);
const gain = (b: number, o: number) => (b > 0 ? Math.max(0, Math.round(((b - o) / b) * 100)) : 0);
const tone = (p: number) => (p >= .7 ? "#e5604d" : p >= .4 ? "#d4a24c" : "#5fb37c");

export default function OperationsEngine() {
  const [data, setData] = useState(() => generate());
  const [src, setSrc] = useState("Synthetic demo dataset: 1,000 tickets over 14 days");
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [aiError, setAiError] = useState("");
  const [capacityHours, setCapacityHours] = useState(8);
  const [ticketText, setTicketText] = useState("");
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [classification, setClassification] = useState("");
  const [classResult, setClassResult] = useState<null | { category: string; urgency: string; sentiment: string; customer_impact: string; confidence: number; rationale: string; suggested_next_action: string }>(null);
  const [classifyError, setClassifyError] = useState("");
  const A = useMemo(() => analyze(data.tickets, data.now, { capacityHours }), [data, capacityHours]);
  const atRisk = A.risk.filter(r => r.p >= .5).length;
  useEffect(() => {
    const r1 = (n: number) => Math.round(n * 10) / 10;
    setOpsSummary({
      dataSource: src, ticketsAnalysed: A.total, resolved: A.done, openNow: A.open, atSlaRisk: atRisk, capacityHoursPerAgent: capacityHours,
      recurringIssues: A.issues.slice(0, 10).map(i => ({ category: i.category, team: i.team, tickets: i.count, open: i.open, avgTurnaroundH: r1(i.avgTat), breached: i.breached, breachRate: r1(i.rate * 100) + "%" })),
      teams: A.teamRows.map(t => ({ team: t.team, agents: t.agents, open: t.open, workH: r1(t.work), capacityH: t.cap, utilisation: Math.round(t.util * 100) + "%", status: t.status })),
      volumeAnomalies: A.anomalies.slice(0, 5).map(a => ({ category: a.category, last6h: a.today, normal: r1(a.mean), z: r1(a.z) })),
      topRiskTickets: A.risk.slice(0, 8).map(r => ({ id: r.t.id, category: r.t.category, priority: r.t.priority, agent: r.t.assignee, team: r.t.team, dueInH: r1(r.dueIn), riskPct: Math.round(r.p * 100), ticketsAhead: r.ahead })),
      recommendedMoves: A.moves.slice(0, 8).map(m => ({ id: m.t.id, from: m.t.assignee, to: m.optTo, finishBeforeH: r1(m.finish), finishAfterH: r1(m.optFinish) })),
      impactSimulation: { baseline: { breaches: A.base.breaches, avgTurnaroundH: r1(A.base.tat), backlogClearH: r1(A.base.clear), imbalance: r1(A.base.imbalance) }, withVeyra: { breaches: A.opt.breaches, avgTurnaroundH: r1(A.opt.tat), backlogClearH: r1(A.opt.clear), imbalance: r1(A.opt.imbalance) }, note: "simulation on the same open tickets, not a guarantee" },
      forecast: { model: A.forecastModel, trendFactor: r1(A.trend), backtestMAE: r1(A.forecastMAE), backtestRMSE: r1(A.forecastRMSE), backtestMAPEPct: r1(A.forecastMAPE * 100) },
    });
  }, [A, src, atRisk, capacityHours]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    Papa.parse<Record<string, unknown>>(file, { header: true, skipEmptyLines: true, complete: res => {
      const p = parseTickets(res.data);
      if (!p) { setErr("Could not read tickets. Use the template columns: ticket_id, created_at, due_at, priority, category, status, assignee, team, resolved_at, customer_impact."); return; }
      setErr(""); setData(p); setSrc(`${file.name}: ${p.tickets.length} tickets`); setOpenId(null); setAiReport(""); setAiError("");
    }, error: () => setErr("File could not be read.") });
    e.target.value = "";
  };
  const download = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([toCSV(generate().tickets)], { type: "text/csv" })); a.download = "veyra-sample-tickets.csv"; a.click(); };
  const KPI = ({ l, v, s, c }: { l: string; v: string; s: string; c?: string }) => <div className="ops-kpi"><small>{l}</small><b style={{ color: c }}>{v}</b><span>{s}</span></div>;
  const B = A.base, O = A.opt;
  const runAIAnalysis = async () => {
    setAiLoading(true); setAiError(""); setAiReport("");
    try {
      const response = await fetch("/api/operations-insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary: { total: A.total, open: A.open, done: A.done, trend: A.trend, forecastMAE: A.forecastMAE, forecastRMSE: A.forecastRMSE, issues: A.issues, teams: A.teamRows, issueExamples: A.issues.slice(0, 5).map(issue => ({ category: issue.category, examples: data.tickets.filter(t => t.category === issue.category && t.description).slice(0, 3).map(t => (t.description || "").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]").replace(/(?:\+?\d[\d .()\-]{7,}\d)/g, "[phone]").slice(0, 240)) })), topRisks: A.risk.slice(0, 8).map(r => ({ category: r.t.category, priority: r.t.priority, risk: r.p, dueIn: r.dueIn, team: r.t.team })) } }) });
      const raw = await response.text();
      let result: any = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch { /* report the actual response below */ }
      if (!response.ok) throw new Error(result.error || `AI analysis request failed (HTTP ${response.status}). Response: ${raw.slice(0, 240) || "<empty>"}`);
      if (!raw || !Object.keys(result).length) throw new Error("The API returned an empty or invalid JSON response. Check the /api/operations-insights route and terminal output.");
      setAiReport(result.content || "No analysis was returned.");
    } catch (e) { setAiError(e instanceof Error ? e.message : "Could not run AI analysis."); }
    finally { setAiLoading(false); }
  };

  const classifyTicket = async () => {
    if (!ticketText.trim()) { setClassifyError("Enter a ticket description first."); return; }
    setClassifyLoading(true); setClassifyError(""); setClassification(""); setClassResult(null);
    try {
      const response = await fetch("/api/operations-insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "classify", text: ticketText.slice(0, 3000) }) });
      const raw = await response.text();
      let result: any = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch { /* report the actual response below */ }
      if (!response.ok) throw new Error(result.error || `Classification request failed (HTTP ${response.status}). Response: ${raw.slice(0, 240) || "<empty>"}`);
      if (!raw || !Object.keys(result).length) throw new Error("The API returned an empty or invalid JSON response. Check the /api/operations-insights route and terminal output.");
      if (result.result) setClassResult(result.result); else setClassification(result.content || "No classification returned.");
    } catch (e) { setClassifyError(e instanceof Error ? e.message : "Could not classify ticket."); }
    finally { setClassifyLoading(false); }
  };

  return <div className="ops-page">
    <section className="panel ops-sec">
      <span className="section-kicker">OPERATIONS INTELLIGENCE ENGINE</span>
      <h2>Find the delays, predict the breaches, fix the queue.</h2>
      <p className="ops-note">Data source: <b>{src}</b>. All numbers below are calculated from this data: no hard-coded values.</p>
      <div className="ops-actions">
        <button className="btn-primary" onClick={() => { setData(generate()); setSrc("Synthetic demo dataset: 1,000 tickets over 14 days"); setErr(""); setAiReport(""); setAiError(""); }}>Load demo dataset</button>
        <label className="btn-secondary ops-file">Upload ticket CSV<input type="file" accept=".csv" onChange={onFile} hidden /></label>
        <button className="btn-secondary" onClick={download}>Download sample CSV</button>
        <a className="btn-secondary" href="/sample-data/operations-tickets-template.csv" download>Download import template</a>
      </div>
      {err && <p className="ops-err">{err}</p>}
      <p className="ops-note">Public dataset option: <a href="https://datanemics.com/datasets/support-tickets/" target="_blank" rel="noreferrer" style={{textDecoration:"underline"}}>Support Tickets dataset (CC0)</a>. Download its CSV and upload it here; common headers such as opened_at, subject, issue_description, queue, priority, first_response_time and time_to_resolution are mapped where available. This is a public synthetic benchmark, not real customer data.</p>
    </section>

    <div className="ops-kpis">
      <KPI l="Tickets analysed" v={A.total.toLocaleString()} s={`${A.done} resolved`} />
      <KPI l="Open now" v={String(A.open)} s="current backlog" />
      <KPI l="At SLA risk" v={String(atRisk)} s="risk score 50% or more" c="#e5604d" />
      <KPI l="Predicted breaches" v={String(B.breaches)} s={`of ${A.open} open (${pc(B.rate)}) if nothing changes`} c="#e5604d" />
    </div>

    <section className="panel ops-sec">
      <h3>1. Recurring issues and performance gaps</h3>
      <p className="ops-note">Categories ranked by SLA breaches (resolved late, or open and already overdue).</p>
      <div className="ops-scroll"><table className="ops-table"><thead><tr><th>Category</th><th>Team</th><th>Tickets</th><th>Open</th><th>Avg turnaround</th><th>SLA breach rate</th></tr></thead>
        <tbody>{A.issues.map(i => <tr key={i.category}><td>{i.category}</td><td>{i.team}</td><td>{i.count}</td><td>{i.open}</td><td>{f1(i.avgTat)}h</td><td><b style={{ color: tone(i.rate * 4) }}>{pc(i.rate)}</b> ({i.breached})</td></tr>)}</tbody></table></div>
      {A.anomalies.length > 0 && <div className="ops-alert"><b>Volume anomalies (last 6 hours vs the same window on earlier days):</b> {A.anomalies.slice(0, 3).map(a => `${a.category}: ${a.today} tickets vs ${f1(a.mean)} normal (z = ${f1(a.z)})`).join(" · ")}</div>}
    </section>

    <section className="panel ops-sec">
      <h3>2. Predicted bottlenecks (next 8 hours)</h3>
      <p className="ops-note">Forecast model: {A.forecastModel}. It fits a least-squares trend to the last 72 hourly buckets, with a recent-trend adjustment ({f1(A.trend)}x). This is a lightweight baseline, not a trained deep-learning model.</p>
      <div className="ops-kpis">
        <KPI l="Backtest MAE" v={`${f1(A.forecastMAE)} tickets/hr`} s={`rolling test · ${A.backtestHours} hours`} />
        <KPI l="Backtest RMSE" v={`${f1(A.forecastRMSE)} tickets/hr`} s="lower is better" />
        <KPI l="Backtest MAPE" v={`${f1(A.forecastMAPE * 100)}%`} s="zero-count hours excluded" />
        <KPI l="SLA risk precision / recall" v={`${pc(A.riskPrecision)} / ${pc(A.riskRecall)}`} s={`${A.labelledRiskTickets} historical resolved tickets · heuristic proxy`} />
        <KPI l="Forecast horizon" v="8 hours" s="hourly predictions" />
        <KPI l="Model type" v="Regression" s="lightweight baseline" />
      </div>
      <div className="ops-chart"><ResponsiveContainer width="100%" height={230}><ComposedChart data={A.series}><CartesianGrid strokeDasharray="3 3" opacity={.25} /><XAxis dataKey="hour" /><YAxis /><Tooltip /><Legend /><Bar dataKey="arrivals" name="Forecast arrivals/hr" fill="#d4a24c" /><Line dataKey="capacity" name="Team capacity (tickets/hr)" stroke="#5fb37c" dot={false} strokeWidth={2} /></ComposedChart></ResponsiveContainer></div>
      <div className="ops-actions" style={{alignItems:"center",margin:"8px 0 14px"}}><label>Capacity per agent (hours per planning window): <b>{capacityHours}h</b></label><input type="range" min="1" max="16" value={capacityHours} onChange={e => setCapacityHours(Number(e.target.value))} aria-label="Capacity hours per agent" /></div>
      <div className="ops-scroll"><table className="ops-table"><thead><tr><th>Team</th><th>Agents</th><th>Open</th><th>Work (h)</th><th>Capacity (h)</th><th>Utilisation</th><th>Status</th></tr></thead>
        <tbody>{A.teamRows.map(t => <tr key={t.team}><td>{t.team}</td><td>{t.agents}</td><td>{t.open}</td><td>{f1(t.work)}</td><td>{t.cap}</td><td><b style={{ color: tone(t.util - .3) }}>{pc(t.util)}</b></td><td>{t.status}</td></tr>)}</tbody></table></div>
    </section>

    <section className="panel ops-sec">
      <h3>AI ticket classifier</h3>
      <p className="ops-note">Paste a ticket description to request LLM-based category, urgency, sentiment, customer impact and rationale. Text is sent to your configured AI provider only when you click Classify.</p>
      <textarea value={ticketText} onChange={e => setTicketText(e.target.value)} rows={3} maxLength={3000} placeholder="Example: I was charged twice for my order and still have not received the refund…" style={{width:"100%",padding:12,borderRadius:10,border:"1px solid rgba(128,128,128,.35)",background:"transparent",color:"inherit",font:"inherit",marginBottom:10}} />
      <div className="ops-actions"><button className="btn-primary" onClick={classifyTicket} disabled={classifyLoading}>{classifyLoading ? "Classifying…" : "Classify ticket with AI"}</button></div>
      {classifyError && <div className="ops-alert">{classifyError}</div>}
      {classResult && <div className="ops-ai-report"><div className="ops-kpis">
        <KPI l="Category" v={classResult.category} s={classResult.customer_impact || "—"} />
        <KPI l="Urgency" v={classResult.urgency} s="suggested priority" c={classResult.urgency === "Critical" || classResult.urgency === "High" ? "#e5604d" : undefined} />
        <KPI l="Sentiment" v={classResult.sentiment} s="customer tone" />
        <KPI l="Confidence" v={pc(classResult.confidence)} s="model self-estimate" />
      </div><p style={{margin:"10px 0 4px"}}><b>Why:</b> {classResult.rationale}</p><p style={{margin:0}}><b>Next action:</b> {classResult.suggested_next_action}</p></div>}
      {classification && <div className="ops-ai-report"><pre style={{whiteSpace:"pre-wrap",font:"inherit",margin:0}}>{classification}</pre></div>}
    </section>

    <section className="panel ops-sec">
      <div className="panel-heading"><div><h3>AI operations analyst</h3><p className="ops-note">Generate a natural-language report from aggregate metrics plus up to three short ticket-description snippets per top category. IDs and email/phone-like strings are omitted or redacted; the snippets are sent to your configured AI provider only when you click Generate AI report.</p></div><button className="btn-primary" disabled={aiLoading} onClick={runAIAnalysis}>{aiLoading ? "Analysing…" : "Generate AI report"}</button></div>
      {aiError && <div className="ops-alert"><b>AI report unavailable:</b> {aiError}<p>To enable live LLM analysis, add GEMINI_API_KEY to .env.local (or configure another supported provider), then restart the app. Local forecasting and recommendations remain available without the key.</p></div>}
      {aiReport && <div className="ops-ai-report"><pre style={{ whiteSpace: "pre-wrap", font: "inherit", lineHeight: 1.65, margin: 0 }}>{aiReport}</pre></div>}
      {!aiReport && !aiError && <p className="ops-note">AI report is optional and requires a server-side API key. The built-in engine continues to calculate risk scores and recommendations locally.</p>}
    </section>

    <section className="panel ops-sec">
      <h3>3. Tickets at risk, with the evidence</h3>
      <p className="ops-note">Risk = chance of missing the SLA given who is working it and how many tickets are ahead. Click a row to see why it was flagged.</p>
      <div className="ops-scroll"><table className="ops-table"><thead><tr><th>Ticket</th><th>Category</th><th>Priority</th><th>Agent</th><th>Due in</th><th>Risk</th></tr></thead>
        <tbody>{A.risk.slice(0, 12).map(r => <React.Fragment key={r.t.id}>
          <tr className="ops-click" onClick={() => setOpenId(openId === r.t.id ? null : r.t.id)}><td>{r.t.id}</td><td>{r.t.category}</td><td>{r.t.priority}</td><td>{r.t.assignee}</td><td>{r.dueIn <= 0 ? "Overdue" : `${f1(r.dueIn)}h`}</td><td><span className="ops-bar"><i style={{ width: pc(r.p), background: tone(r.p) }} /></span> {pc(r.p)}</td></tr>
          {openId === r.t.id && <tr><td colSpan={6} className="ops-why"><b>Why flagged:</b> {r.t.id} is {r.dueIn <= 0 ? "already past its SLA" : `due in ${f1(r.dueIn)}h`}. {r.t.assignee} has {r.ahead} ticket(s) ahead of it ({r.agentOpen} open in total) and each {r.t.category} ticket needs about {f1(r.h)}h, so the projected finish is {f1(r.finish)}h from now, {r.slack < 0 ? `${f1(-r.slack)}h after` : `${f1(r.slack)}h before`} the deadline. {r.t.category} tickets have missed their SLA {pc(r.catRate)} of the time. Customer impact: {r.t.impact || "not specified"}. {r.t.description ? `Description: ${r.t.description}.` : "No ticket description available."}<br /><b>Recommended:</b> {r.optTo !== r.t.assignee ? `reassign to ${r.optTo}` : `keep with ${r.t.assignee} but work it earlier`}; projected finish becomes {f1(r.optFinish)}h from now.</td></tr>}
        </React.Fragment>)}</tbody></table></div>
    </section>

    <section className="panel ops-sec">
      <h3>4. Recommended actions</h3>
      <p className="ops-note">Method: priority-weighted deadline urgency and customer-impact keywords influence ordering; work is assigned to the earliest-free agent. This is a transparent greedy heuristic, not a guaranteed global optimum.</p>
      <div className="ops-scroll"><table className="ops-table"><thead><tr><th>Ticket</th><th>Priority</th><th>Action</th><th>Finish before</th><th>Finish after</th></tr></thead>
        <tbody>{A.moves.map(m => <tr key={m.t.id}><td>{m.t.id} ({m.t.category})</td><td>{m.t.priority}</td><td>{m.optTo !== m.t.assignee ? `Move ${m.t.assignee} → ${m.optTo}` : `Pull forward for ${m.t.assignee}`}</td><td>{f1(m.finish)}h</td><td><b style={{ color: "#5fb37c" }}>{f1(m.optFinish)}h</b></td></tr>)}</tbody></table></div>
    </section>

    <section className="panel ops-sec">
      <h3>5. Impact: baseline vs VEYRA recommendations</h3>
      <p className="ops-note">Both scenarios replay the same open tickets with the same handling times. Baseline = every agent keeps their own queue, first come first served.</p>
      <div className="ops-kpis">
        <KPI l="SLA breaches" v={`${B.breaches} → ${O.breaches}`} s={`${gain(B.breaches, O.breaches)}% fewer`} c="#5fb37c" />
        <KPI l="Avg turnaround" v={`${f1(B.tat)}h → ${f1(O.tat)}h`} s={`${gain(B.tat, O.tat)}% faster`} c="#5fb37c" />
        <KPI l="Backlog cleared in" v={`${f1(B.clear)}h → ${f1(O.clear)}h`} s={`${gain(B.clear, O.clear)}% sooner (productivity)`} c="#5fb37c" />
        <KPI l="Workload imbalance" v={`${f1(B.imbalance)} → ${f1(O.imbalance)}`} s="std. dev. of agent hours" c="#5fb37c" />
        <KPI l="Avg first response" v={A.avgFirstResponseMins === null ? "Not supplied" : `${f1(A.avgFirstResponseMins)} min`} s="measured from imported timestamps / synthetic demo" />
        <KPI l="Average CSAT" v={A.avgCSAT === null ? "Not supplied" : `${f1(A.avgCSAT)} / 5`} s={`${A.qualitySample} records with ratings`} />
      </div>
      <div className="ops-chart"><ResponsiveContainer width="100%" height={220}><BarChart data={A.teamImpact}><CartesianGrid strokeDasharray="3 3" opacity={.25} /><XAxis dataKey="team" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="baseline" name="Predicted breaches: baseline" fill="#e5604d" /><Bar dataKey="optimised" name="With VEYRA actions" fill="#5fb37c" /></BarChart></ResponsiveContainer></div>
      <p className="ops-note">These are simulated estimates from the loaded data, not guarantees. Handling time is estimated from the fastest quarter of past turnaround per category. First-response time and CSAT are observed averages when those fields exist; they are not simulated as improved by the assignment plan.</p>
    </section>
  </div>;
}
