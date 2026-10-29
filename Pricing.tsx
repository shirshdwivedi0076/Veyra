"use client";
import React, { useState } from "react";

const PLANS = [
  { name: "Free", m: 0, y: 0, tag: "For trying VEYRA", feats: ["Demo workspace and sample data", "Operations dashboard", "Upload up to 500 tickets", "Basic insights"], cta: "Start free" },
  { name: "Pro", m: 499, y: 399, tag: "For small teams", pop: true, feats: ["Upload up to 10,000 tickets", "SLA risk with explanations", "Workload recommendations", "Impact reports (CSV / PDF)"], cta: "Choose Pro" },
  { name: "Business", m: 1499, y: 1199, tag: "For growing operations", feats: ["Everything in Pro", "Up to 5 team members", "Unlimited ticket uploads", "Priority email support"], cta: "Choose Business" },
];

export default function Pricing({ onStart }: { onStart: () => void }) {
  const [yearly, setYearly] = useState(false);
  return <section id="pricing" className="section-block pr-wrap">
    <div className="section-kicker">PRICING</div>
    <h2>Simple pricing,<br /><span>made for Indian businesses.</span></h2>
    <p className="section-intro">Start free. Upgrade when your team grows. Prices in ₹ per month, GST extra.</p>
    <div className="pr-toggle">
      <button className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>Monthly</button>
      <button className={yearly ? "on" : ""} onClick={() => setYearly(true)}>Yearly · save 20%</button>
    </div>
    <div className="pr-grid">
      {PLANS.map(p => <div key={p.name} className={`pr-card ${p.pop ? "pop" : ""}`}>
        {p.pop && <i className="pr-badge">MOST POPULAR</i>}
        <h3>{p.name}</h3><small>{p.tag}</small>
        <div className="pr-price"><b>{p.m === 0 ? "₹0" : `₹${(yearly ? p.y : p.m).toLocaleString("en-IN")}`}</b><span>{p.m === 0 ? "forever" : "/ month"}</span></div>
        {yearly && p.m > 0 && <small>Billed ₹{(p.y * 12).toLocaleString("en-IN")} per year</small>}
        <ul>{p.feats.map(f => <li key={f}>✓ {f}</li>)}</ul>
        <button className={p.pop ? "btn-primary" : "btn-secondary"} onClick={onStart}>{p.cta}</button>
      </div>)}
    </div>
    <p className="pr-foot">Need more users or custom integrations? <b>Enterprise</b> plans are available on request.<br />Demo pricing: online payments are not enabled in this prototype.</p>
  </section>;
}
