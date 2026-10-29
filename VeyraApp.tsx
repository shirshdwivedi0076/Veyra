"use client";

import { useEffect, useMemo, useRef, useState, ChangeEvent, FormEvent } from "react";
import { getOpsSummary } from "../lib/opsStore";
import Papa from "papaparse";
import OperationsEngine from "./OperationsEngine";
import { z } from "zod";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BrainCircuit, BriefcaseBusiness,
  CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, CloudUpload,
  Command, CreditCard, Download, Eye, EyeOff, FileBarChart, FileSpreadsheet, Filter,
  Gauge, Globe2, LayoutDashboard, Lightbulb, LockKeyhole, LogOut, Menu, MessageCircle,
  MoreHorizontal, Package, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings, ShieldCheck, Sparkles, Sun, Moon,
  Target, TrendingDown, TrendingUp, Upload, Users, Wallet, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

type Page = "Overview" | "Operations" | "Sales & Revenue" | "Expenses" | "Products" | "Customers" | "Inventory" | "AI Insights" | "Reports" | "Goals" | "Settings" | "Admin Console";
type UserRole = "user" | "admin";
type Tx = { date: string; order_id: string; product: string; category: string; quantity: number; revenue: number; cost: number; customer?: string; region?: string };

const seedTransactions: Tx[] = [
  {date:"2025-10-01",order_id:"ORD-1001",product:"Wireless Earbuds",category:"Electronics",quantity:12,revenue:68420,cost:39800,customer:"Aarav Mehta",region:"North"},
  {date:"2025-10-03",order_id:"ORD-1002",product:"Smart Watch",category:"Electronics",quantity:8,revenue:52310,cost:33200,customer:"Isha Sharma",region:"West"},
  {date:"2025-10-05",order_id:"ORD-1003",product:"Phone Cover",category:"Accessories",quantity:42,revenue:34280,cost:17100,customer:"Kabir Singh",region:"North"},
  {date:"2025-10-08",order_id:"ORD-1004",product:"Power Bank",category:"Electronics",quantity:15,revenue:27190,cost:20600,customer:"Anaya Gupta",region:"South"},
  {date:"2025-10-10",order_id:"ORD-1005",product:"TWS Headphones",category:"Audio",quantity:10,revenue:18430,cost:11100,customer:"Reyansh Verma",region:"East"},
  {date:"2025-10-12",order_id:"ORD-1006",product:"Laptop Stand",category:"Accessories",quantity:18,revenue:24900,cost:12600,customer:"Sara Khan",region:"West"},
  {date:"2025-10-15",order_id:"ORD-1007",product:"Smart Watch",category:"Electronics",quantity:7,revenue:46800,cost:29800,customer:"Vihaan Patel",region:"North"},
  {date:"2025-10-18",order_id:"ORD-1008",product:"Wireless Earbuds",category:"Electronics",quantity:14,revenue:79800,cost:45500,customer:"Diya Joshi",region:"South"},
  {date:"2025-10-21",order_id:"ORD-1009",product:"Phone Cover",category:"Accessories",quantity:55,revenue:44900,cost:21400,customer:"Arjun Rao",region:"East"},
  {date:"2025-10-24",order_id:"ORD-1010",product:"Power Bank",category:"Electronics",quantity:11,revenue:20100,cost:15300,customer:"Myra Das",region:"West"},
  {date:"2025-10-27",order_id:"ORD-1011",product:"Laptop Stand",category:"Accessories",quantity:20,revenue:28900,cost:14600,customer:"Advik Nair",region:"North"},
  {date:"2025-10-30",order_id:"ORD-1012",product:"TWS Headphones",category:"Audio",quantity:13,revenue:24600,cost:14100,customer:"Aanya Roy",region:"South"}
];
const monthly = [
  {month:"May",revenue:148,profit:48,expenses:77},{month:"Jun",revenue:172,profit:57,expenses:86},
  {month:"Jul",revenue:158,profit:51,expenses:82},{month:"Aug",revenue:201,profit:69,expenses:97},
  {month:"Sep",revenue:218,profit:73,expenses:104},{month:"Oct",revenue:248,profit:76,expenses:117}
];
const categoryData = [{name:"Electronics",value:48,color:"#F5C542"},{name:"Accessories",value:31,color:"#8E7CFF"},{name:"Audio",value:21,color:"#46D9B0"}];
const money = (n:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const compactMoney = (n:number) => n >= 100000 ? `₹${(n/100000).toFixed(2)}L` : money(n);
const navItems: {label:Page; icon:any; group:string}[] = [
  {label:"Overview",icon:LayoutDashboard,group:"WORKSPACE"},
  {label:"Operations",icon:Activity,group:"WORKSPACE"},
  {label:"Sales & Revenue",icon:TrendingUp,group:"WORKSPACE"},
  {label:"Expenses",icon:Wallet,group:"WORKSPACE"},
  {label:"Products",icon:Package,group:"WORKSPACE"},
  {label:"Customers",icon:Users,group:"WORKSPACE"},
  {label:"Inventory",icon:BriefcaseBusiness,group:"WORKSPACE"},
  {label:"AI Insights",icon:BrainCircuit,group:"INTELLIGENCE"},
  {label:"Reports",icon:FileBarChart,group:"INTELLIGENCE"},
  {label:"Goals",icon:Target,group:"MANAGE"},
  {label:"Settings",icon:Settings,group:"MANAGE"},
  {label:"Admin Console",icon:ShieldCheck,group:"MANAGE"}
];

function Logo({small=false}:{small?:boolean}) {
  return <div className={`brand ${small?"brand-small":""}`}><img src="/veyra-icon.svg" alt="" /><span>VEYRA</span><i>✦</i></div>;
}
function formatNumber(n:number) { return new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(n); }
function indiaNow() { return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })); }
function greetingForNow() { const hour = indiaNow().getHours(); return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"; }
function dateForNow() { return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()).toUpperCase(); }

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0, frame = 0, mouse = { x: -9999, y: -9999, active: false }, particles: {x:number;y:number;size:number;phase:number;speed:number;color:string;alpha:number}[] = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    const makeParticles = () => {
      width = host.clientWidth; height = host.clientHeight;
      canvas.width = Math.max(1, Math.floor(width*dpr)); canvas.height = Math.max(1, Math.floor(height*dpr));
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = Math.min(1150, Math.max(360, Math.floor(width*height/900)));
      particles = Array.from({length:count},(_,i) => {
        const warm = Math.random() < .19;
        let x:number, y:number;
        if (Math.random() < .78) {
          const a = Math.random()*Math.PI*2;
          const r = Math.sqrt(Math.random());
          x = width*(.79 + Math.cos(a)*.43*r);
          y = height*(.48 + Math.sin(a)*.69*r);
          // A gentle swept-back tail gives the cloud its flowing, sculptural shape.
          x += width*.07*Math.sin(y/Math.max(1,height)*5.4) * (1-r);
        } else {
          x = width*(.12 + Math.random()*.9);
          y = height*(Math.random()*.28 - .12);
        }
        return {x,y,size:.45+Math.random()*2.1,phase:Math.random()*Math.PI*2,speed:.25+Math.random()*.9,color:warm?(Math.random()>.5?"#ff805d":"#ffb05e"):(Math.random()>.55?"#6bbcff":"#3288d8"),alpha:.22+Math.random()*.72};
      });
    };
    const draw = (time:number) => {
      ctx.clearRect(0,0,width,height);
      // A subtle navy vignette keeps the copy readable while the particle field glows on the right.
      const shade = ctx.createLinearGradient(0,0,width,0);
      shade.addColorStop(0,"rgba(4,12,20,.98)"); shade.addColorStop(.28,"rgba(4,12,20,.68)"); shade.addColorStop(.58,"rgba(4,12,20,.10)"); shade.addColorStop(1,"rgba(4,12,20,0)");
      ctx.fillStyle=shade; ctx.fillRect(0,0,width,height);
      // Soft cursor aura follows the pointer and gives the particles a subtle interactive glow.
      if (mouse.active) {
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 190);
        aura.addColorStop(0, "rgba(79,170,255,.13)");
        aura.addColorStop(.45, "rgba(64,133,225,.055)");
        aura.addColorStop(1, "rgba(64,133,225,0)");
        ctx.fillStyle = aura; ctx.fillRect(0, 0, width, height);
      }
      for (const p of particles) {
        // Slow, continuous ambient movement keeps the particle field alive even
        // when the pointer is still. The mouse interaction layers on top of it.
        const drift = reducedMotion ? 0 : time*.00022*p.speed;
        let px = p.x + Math.sin(p.phase+drift)*10 + Math.sin(time*.00009*p.speed+p.phase)*3;
        let py = p.y + Math.cos(p.phase*.8+drift*1.25)*8 + Math.cos(time*.00008*p.speed+p.phase)*2.5;
        let cursorBoost = 0;
        if (mouse.active) {
          const dx = px - mouse.x, dy = py - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const radius = 125;
          if (dist > 0 && dist < radius) {
            const force = (1 - dist/radius);
            // A gentle, smooth ripple pushes nearby particles away from the pointer.
            px += (dx/dist) * force * 22;
            py += (dy/dist) * force * 22;
            cursorBoost = force * .7;
          }
        }
        const twinkle = .66 + .34*Math.sin(p.phase+time*.0007*p.speed);
        ctx.globalAlpha=Math.min(1, p.alpha*twinkle + cursorBoost);
        ctx.fillStyle=p.color;
        ctx.beginPath(); ctx.arc(px,py,p.size + cursorBoost*.65,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
      if (!reducedMotion) frame=requestAnimationFrame(draw);
    };
    makeParticles();
    if (reducedMotion) draw(0); else frame=requestAnimationFrame(draw);
    const onResize=()=>{dpr=Math.min(window.devicePixelRatio||1,1.6);makeParticles();};
    const onPointerMove=(event:PointerEvent)=>{
      const rect=host.getBoundingClientRect();
      mouse.x=event.clientX-rect.left; mouse.y=event.clientY-rect.top; mouse.active=true;
    };
    const onPointerLeave=()=>{mouse.active=false;mouse.x=-9999;mouse.y=-9999;};
    window.addEventListener("resize",onResize);
    window.addEventListener("pointermove",onPointerMove,{passive:true});
    document.addEventListener("pointerleave",onPointerLeave);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener("resize",onResize);window.removeEventListener("pointermove",onPointerMove);document.removeEventListener("pointerleave",onPointerLeave);};
  },[]);
  return <div className="hero-particles" aria-hidden="true"><canvas ref={canvasRef}/><div className="particle-vignette"/></div>;
}

export default function VeyraApp() {
  const [mode,setMode] = useState<"landing"|"login"|"signup"|"app">("landing");
  const [role,setRole] = useState<UserRole>("user");
  const [sessionReady,setSessionReady] = useState(false);
  const [page,setPage] = useState<Page>("Overview");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [name,setName] = useState("Shirsh");
  const [showPassword,setShowPassword] = useState(false);
  const [mobileNav,setMobileNav] = useState(false);
  const [sidebarCollapsed,setSidebarCollapsed] = useState(false);
  const [theme,setTheme] = useState<"dark"|"light">("dark");
  const [transactions,setTransactions] = useState<Tx[]>(seedTransactions);
  const [fileName,setFileName] = useState("");
  const [notice,setNotice] = useState("");
  const [search,setSearch] = useState("");
  const [debouncedSearch,setDebouncedSearch] = useState("");
  const [categoryFilter,setCategoryFilter] = useState("All categories");
  const [statusFilter,setStatusFilter] = useState("All status");
  const [dateFrom,setDateFrom] = useState("");
  const [dateTo,setDateTo] = useState("");
  const [minRevenue,setMinRevenue] = useState("");
  const [maxRevenue,setMaxRevenue] = useState("");
  const [uploading,setUploading] = useState(false);
  const [uploadWarnings,setUploadWarnings] = useState<string[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search), 250); return () => window.clearTimeout(timer); }, [search]);
  const [period,setPeriod] = useState("Last 6 months");
  const [question,setQuestion] = useState("");
  const [chat,setChat] = useState<{role:"user"|"assistant";text:string;live?:boolean}[]>([]);
  const [thinking,setThinking] = useState(false);
  const [aiNote,setAiNote] = useState<{live:boolean;model?:string;msg?:string}|null>(null);
  const [showUpload,setShowUpload] = useState(false);
  const [showNotif,setShowNotif] = useState(false);
  const [inventory,setInventory] = useState([
    {name:"Rose Oud Perfume 50ml",category:"Fragrance",stock:4,reorder:10,expiry:"2026-11-05",status:"sell"},
    {name:"Vanilla Mist 100ml",category:"Fragrance",stock:3,reorder:8,expiry:"2027-06-18",status:"refill"},
    {name:"Gift Box — Premium",category:"Packaging",stock:0,reorder:6,expiry:"",status:"out"},
    {name:"Amber Nights 30ml",category:"Fragrance",stock:16,reorder:5,expiry:"2026-11-12",status:"sell"},
    {name:"Travel Spray 10ml",category:"Fragrance",stock:22,reorder:8,expiry:"2027-12-01",status:"ok"},
  ]);
  const [goal,setGoal] = useState(300000);
  const [goalInput,setGoalInput] = useState("300000");
  const [simPrice,setSimPrice] = useState(5);
  const [showSimulator,setShowSimulator] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const skipHistoryPush = useRef(false);

  useEffect(() => { try { const savedTheme = localStorage.getItem("veyra-theme"); if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("veyra-theme", theme); } catch {} }, [theme]);

  // Landing-page scroll reveals: content glides gently in from alternating sides as it enters view.
  useEffect(() => {
    if (mode !== "landing") return;
    const root = document.querySelector(".landing");
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>(
      ".hero-copy, .hero-visual, .trust-strip > *, .section-block > .section-kicker, .section-block > h2, .section-block > .section-intro, .feature-card, .how-section > .section-kicker, .how-section > h2, .step, .cta-section > :not(.cta-glow), .site-footer > *"
    );
    targets.forEach((el, index) => {
      el.classList.add("scroll-side-reveal");
      el.classList.remove("scroll-side-left", "scroll-side-right");
      el.classList.add(index % 2 === 0 ? "scroll-side-left" : "scroll-side-right");
    });
    if (!("IntersectionObserver" in window)) {
      targets.forEach(el => el.classList.add("scroll-side-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-side-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [mode]);

  // Restore the demo workspace after refresh instead of always returning to the landing page.
  useEffect(() => {
    // Restore the saved workspace before showing the app, preventing a landing-page flash on refresh.
    try {
      const saved = localStorage.getItem("veyra-demo-session");
      if (saved) {
        const session = JSON.parse(saved) as { email?: string; name?: string; role?: UserRole; page?: Page };
        setEmail(session.email || "demo@veyra.app");
        setName(session.name || "Business Owner");
        setRole(session.role === "admin" ? "admin" : "user");
        setPage(session.role === "admin" && session.page === "Admin Console" ? "Admin Console" : (session.page || "Overview"));
        setMode("app");
      }
    } catch { localStorage.removeItem("veyra-demo-session"); }
    // Keep the branded boot animation visible briefly so refresh feels intentional.
    const bootTimer = window.setTimeout(() => setSessionReady(true), 700);
    return () => window.clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    if (!sessionReady || mode !== "app") return;
    localStorage.setItem("veyra-demo-session", JSON.stringify({ email, name, role, page }));
  }, [sessionReady, mode, email, name, role, page]);

  // Keep browser Back inside the app: it navigates between workspace pages instead of
  // accidentally leaving the SPA. If the history reaches the page before login, return to Overview.
  useEffect(() => {
    if (!sessionReady || mode !== "app") return;
    if (skipHistoryPush.current) {
      skipHistoryPush.current = false;
      return;
    }
    window.history.pushState({ veyraApp: true, page }, "", `#${page.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
  }, [sessionReady, mode, page]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (mode !== "app") return;
      if (event.state?.veyraApp && event.state.page) {
        skipHistoryPush.current = true;
        setPage(event.state.page as Page);
      } else {
        // Prevent browser Back from blanking/closing the workspace.
        window.history.pushState({ veyraApp: true, page: "Overview" }, "", "#overview");
        setPage("Overview");
        setMobileNav(false);
        setShowNotif(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mode]);

  const totals = useMemo(() => {
    const revenue = transactions.reduce((s,t)=>s+Number(t.revenue||0),0);
    const costs = transactions.reduce((s,t)=>s+Number(t.cost||0),0);
    const profit = revenue-costs;
    return { revenue, costs, profit, margin:revenue?profit/revenue*100:0, orders:transactions.length, units:transactions.reduce((s,t)=>s+Number(t.quantity||0),0) };
  },[transactions]);
  const products = useMemo(() => {
    const map = new Map<string,{name:string;revenue:number;cost:number;units:number;category:string}>();
    transactions.forEach(t=>{const p=map.get(t.product)||{name:t.product,revenue:0,cost:0,units:0,category:t.category};p.revenue+=Number(t.revenue||0);p.cost+=Number(t.cost||0);p.units+=Number(t.quantity||0);map.set(t.product,p);});
    return Array.from(map.values()).sort((a,b)=>b.revenue-a.revenue);
  },[transactions]);
  const customers = useMemo(()=>Array.from(new Set(transactions.map(t=>t.customer).filter(Boolean))),[transactions]);
  const revenueTrendPct = useMemo(() => {
    if (transactions.length < 2) return 0;
    const split = Math.ceil(transactions.length / 2);
    const earlier = transactions.slice(0, split).reduce((sum,t)=>sum+t.revenue,0);
    const later = transactions.slice(split).reduce((sum,t)=>sum+t.revenue,0);
    return earlier ? ((later - earlier) / earlier) * 100 : 0;
  }, [transactions]);
  const costTrendPct = useMemo(() => {
    if (transactions.length < 2) return 0;
    const split = Math.ceil(transactions.length / 2);
    const earlier = transactions.slice(0, split).reduce((sum,t)=>sum+t.cost,0);
    const later = transactions.slice(split).reduce((sum,t)=>sum+t.cost,0);
    return earlier ? ((later - earlier) / earlier) * 100 : 0;
  }, [transactions]);
  const trend = useMemo(()=>{
    if(transactions===seedTransactions) return monthly;
    const map = new Map<string,{month:string;revenue:number;profit:number;expenses:number}>();
    transactions.forEach(t=>{const d=new Date(t.date);const month=d.toLocaleString("en-US",{month:"short"});const row=map.get(month)||{month,revenue:0,profit:0,expenses:0};row.revenue+=t.revenue/1000;row.profit+=(t.revenue-t.cost)/1000;row.expenses+=t.cost/1000;map.set(month,row);});
    return Array.from(map.values()).slice(-8);
  },[transactions]);
  const filteredTransactions = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return transactions.filter(t => {
      const matchesSearch = !q || [t.product,t.order_id,t.customer||"",t.category,t.region||""].join(" ").toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "All categories" || t.category === categoryFilter;
      const matchesDate = (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo);
      const matchesRevenue = (!minRevenue || t.revenue >= Number(minRevenue)) && (!maxRevenue || t.revenue <= Number(maxRevenue));
      const status = t.revenue - t.cost < 0 ? "Loss-making" : t.revenue > 0 ? "Revenue recorded" : "No revenue";
      const matchesStatus = statusFilter === "All status" || status === statusFilter;
      return matchesSearch && matchesCategory && matchesDate && matchesRevenue && matchesStatus;
    });
  }, [transactions,debouncedSearch,categoryFilter,dateFrom,dateTo,minRevenue,maxRevenue,statusFilter]);
  const notify = (msg:string) => {setNotice(msg);setTimeout(()=>setNotice(""),3200);};
  const enterApp = (e?:FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) { notify("Enter your email and password to continue."); return; }
    if (role === "admin" && (email.trim().toLowerCase() !== "admin@veyra.app" || password !== "admin1234")) {
      notify("Demo admin login: admin@veyra.app / admin1234"); return;
    }
    if (role === "user" && email.trim().toLowerCase() === "admin@veyra.app") {
      notify("Choose Admin login for the admin demo account."); return;
    }
    setName(role === "admin" ? "VEYRA Admin" : (name.trim() && mode === "signup" ? name.trim() : email.split("@")[0].replace(/[._-]/g," ").replace(/\b\w/g,c=>c.toUpperCase()) || "Business Owner"));
    setPage(role === "admin" ? "Admin Console" : "Operations");
    setMode("app");
    notify(role === "admin" ? "Admin demo session started." : "Demo session started. Production authentication is not configured.");
  };
  const openDemo = () => {setRole("user");setEmail("demo@veyra.app");setPassword("demo1234");setName("Shirsh");setPage("Operations");setMode("app");notify("Welcome to the VEYRA operations demo.");};
  const logout = () => { localStorage.removeItem("veyra-demo-session"); setRole("user"); setMode("landing"); setPage("Overview"); setChat([]); notify("You have left the demo workspace."); };
  const headerSchema = z.array(z.string()).superRefine((headers, ctx) => {
    const aliases = ["revenue","sales","amount","total","total_revenue"];
    if (!headers.some(h => aliases.includes(h))) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required revenue column missing. Add a column named revenue or sales." });
  });
  const onFile = (e:ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file)return;
    if(!file.name.toLowerCase().endsWith(".csv")){notify("Please choose a CSV file. Export your spreadsheet as CSV first.");return;}
    setUploading(true); setUploadWarnings([]);
    const allRows:string[][]=[]; let csvErrorCount=0;
    Papa.parse<string[]>(file, {
      worker: true, skipEmptyLines: "greedy", chunkSize: 1024 * 1024,
      chunk: (results) => { results.data.forEach(row => allRows.push(row)); csvErrorCount += results.errors?.length || 0; },
      complete: () => {
        try {
          const rows = allRows;
          if (rows.length < 2) throw new Error("Your file needs a header row and at least one data row.");
          const headers = (rows[0] || []).map(h => String(h ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g,"_"));
          const validation = headerSchema.safeParse(headers);
          if (!validation.success) throw new Error(validation.error.issues.map(i=>i.message).join(" "));
          const pick=(r:string[],keys:string[],fallback="")=>{const i=headers.findIndex(h=>keys.includes(h));return i>=0?String(r[i]??fallback).trim():fallback;};
          const parsed:Tx[]=[]; const rowWarnings:string[]=[];
          if (!headers.some(h => ["product","item","product_name"].includes(h))) rowWarnings.push("Product column missing; rows will use Imported product, so product-level insights may be limited.");
          rows.slice(1).forEach((r,idx)=>{
            const line=idx+2;
            const rawRevenue=pick(r,["revenue","sales","amount","total","total_revenue"]);
            const rawCost=pick(r,["cost","expense","cogs","total_cost","expenses"],"0");
            const rawQuantity=pick(r,["quantity","qty","units"],"1");
            const revenue=Number(rawRevenue.replace(/[₹$,\s]/g,""));
            const cost=rawCost===""?0:Number(rawCost.replace(/[₹$,\s]/g,""));
            const quantity=rawQuantity===""?1:Number(rawQuantity.replace(/[,\s]/g,""));
            if (!Number.isFinite(revenue) || !Number.isFinite(cost) || !Number.isFinite(quantity) || revenue < 0 || cost < 0 || quantity < 0) { rowWarnings.push(`Row ${line} skipped: revenue, cost, or quantity is not a valid non-negative number.`); return; }
            const product=pick(r,["product","item","product_name"]);
            if (!product) rowWarnings.push(`Row ${line}: product name is blank; displayed as Imported product.`);
            parsed.push({date:pick(r,["date","order_date","transaction_date"],new Date().toISOString().slice(0,10)),order_id:pick(r,["order_id","order","invoice_id","id"],`IMP-${line-1}`),product:product||"Imported product",category:pick(r,["category","product_category"],"Uncategorised"),quantity,revenue,cost,customer:pick(r,["customer","customer_name"],""),region:pick(r,["region","location"],"")});
          });
          if (!parsed.length) throw new Error("No valid transaction rows were found. Check the revenue, cost, and quantity columns.");
          if (csvErrorCount) rowWarnings.unshift(`${csvErrorCount} CSV formatting issue(s) detected; review the imported results.`);
          setTransactions(parsed); setFileName(file.name); setShowUpload(false); setSearch(""); setCategoryFilter("All categories"); setStatusFilter("All status"); setDateFrom(""); setDateTo(""); setMinRevenue(""); setMaxRevenue(""); setUploadWarnings(rowWarnings.slice(0,8));
          notify(`Imported ${parsed.length} rows from ${file.name}${rowWarnings.length?` with ${rowWarnings.length} warning(s)`:""}.`);
        } catch(err) { notify(err instanceof Error?err.message:"Could not read this file."); }
        finally { setUploading(false); }
      },
      error: (err) => { setUploading(false); notify(`CSV import failed: ${err.message}`); }
    });
    e.target.value="";
  };
  const sendQuestion = async (e?:FormEvent) => {
    e?.preventDefault();
    if(!question.trim()||thinking) return;
    const q=question.trim();
    const next:{role:"user"|"assistant";text:string;live?:boolean}[]=[...chat,{role:"user" as const,text:q}];
    const lower=q.toLowerCase();
    const sortedByProfit=[...products].sort((a,b)=>(b.revenue-b.cost)-(a.revenue-a.cost));
    const topProfit=sortedByProfit[0];
    const worstProfit=sortedByProfit[sortedByProfit.length-1];
    const topRegionMap=new Map<string,number>();
    transactions.forEach(t=>{if(t.region)topRegionMap.set(t.region,(topRegionMap.get(t.region)||0)+Number(t.revenue||0));});
    const topRegion=[...topRegionMap.entries()].sort((a,b)=>b[1]-a[1])[0];
    let answer="";
    if(/hello|hi\b|hey\b|namaste/.test(lower)) answer=`Hey! I'm VEYRA, your operational decision engine. I can analyse the ${transactions.length} business records currently loaded, and the Operations page contains an explicitly illustrative ticket queue. Ask about urgent issues, SLA risk, workload, revenue, profit, costs, or recommendations.`;
    else if(/sla|ticket|bottleneck|workload|urgent|operational issue|delay|priority|capacity/.test(lower)) answer=`Operational triage (illustrative sample only):

1. **Protect the nearest SLA first:** the sample queue flags TK-1042 (refund pending) with 18 minutes to breach. Assign it to a qualified available billing agent if capacity allows.
2. **Investigate recurring billing issues:** the sample contains multiple billing-related tickets. Check whether one shared payment/refund problem is creating repeat contacts.
3. **Balance by skill and capacity:** route high-priority work using agent availability, skill fit, current queue size and business impact.
4. **Measure impact:** compare baseline time-to-resolution, SLA breach rate and backlog against results after the intervention.

Important: these tickets and times are fabricated examples, not live data or a validated prediction. Upload operational records with ticket created time, due/SLA time, priority, category, status, assignee and resolution time to make evidence-based analysis possible.`;
    else if(lower.includes("profit")||lower.includes("margin")||lower.includes("profitable")) {
      answer=`Here is the current profitability snapshot from ${transactions.length} loaded records:

• Revenue: ${money(totals.revenue)}
• Recorded costs: ${money(totals.costs)}
• Revenue minus recorded costs: ${money(totals.profit)}
• Contribution margin: ${totals.margin.toFixed(1)}%

${topProfit?`Highest recorded contribution: ${topProfit.name} (${money(topProfit.revenue-topProfit.cost)}).`:"Product-level contribution is not available yet."} ${worstProfit?`Review ${worstProfit.name} first: it has the lowest total contribution in this dataset (${money(worstProfit.revenue-worstProfit.cost)}).`:""}

Next move: check whether shipping, returns, advertising, and other overheads are included. This is contribution before any costs not present in your file, not guaranteed net profit.`;
    } else if(lower.includes("product")||lower.includes("sell")||lower.includes("best seller")||lower.includes("best-performing")||lower.includes("best performing")) {
      const p=products[0];
      answer=p?`Product performance, ranked by recorded revenue:

${products.slice(0,5).map((x,i)=>`${i+1}. ${x.name} — ${money(x.revenue)} revenue, ${x.units} units, ${money(x.revenue-x.cost)} contribution, ${x.revenue?(((x.revenue-x.cost)/x.revenue)*100).toFixed(1):"0.0"}% contribution margin`).join("\n")}

Recommendation: don't choose a product based on revenue alone. Compare contribution margin, available stock, repeat purchases, and marketing cost before scaling it.`:"There is not enough product data yet. Import a CSV with product, revenue, and cost columns to get product-level insights.";
    } else if(lower.includes("expense")||lower.includes("cost")||lower.includes("spend")) {
      const costRatio=totals.revenue?totals.costs/totals.revenue*100:0;
      answer=`Recorded costs are ${money(totals.costs)}, equal to ${costRatio.toFixed(1)}% of recorded revenue. The remaining contribution is ${money(totals.profit)} (${totals.margin.toFixed(1)}%).\n\nWhat to review:
• Compare cost and contribution by product, not just total spend.
• Check high-volume items with thin margins.
• Make sure shipping, returns, discounts, advertising, and operating expenses are represented.
\nThe current file only shows the costs you imported; I won't assume missing expense categories are zero in your real business.`;
    } else if(lower.includes("customer")||lower.includes("repeat")||lower.includes("loyal")) {
      const count=customers.length;
      const spend=new Map<string,number>();
      transactions.forEach(t=>{if(t.customer)spend.set(t.customer,(spend.get(t.customer)||0)+Number(t.revenue||0));});
      const top=[...spend.entries()].sort((a,b)=>b[1]-a[1])[0];
      answer=`The dataset contains ${count} distinct named customers. ${top?`${top[0]} has the highest recorded spend at ${money(top[1])}.`:"Customer names are missing from the imported records."}\n\nUseful next steps: segment customers by total spend, identify repeat buyers by counting orders per customer, and compare average order value across segments. This dataset may not cover the full customer history, so avoid treating it as a complete retention analysis.`;
    } else if(lower.includes("region")||lower.includes("location")||lower.includes("city")) {
      answer=topRegion?`${topRegion[0]} is the highest-revenue region in the current dataset at ${money(topRegion[1])}. Regional results are based only on rows with a region/location value. Compare order count and margin by region before shifting budget; high revenue alone doesn't prove a region is more profitable.`:"I can't compare regions yet because the loaded records don't include region/location values. Add a region column to your CSV and import it again.";
    } else if(lower.includes("forecast")||lower.includes("predict")||lower.includes("next month")||lower.includes("future")) {
      answer=`I can prepare a directional scenario, but this dataset alone is not enough for a reliable forecast. It contains ${transactions.length} records with ${money(totals.revenue)} recorded revenue. For a stronger forecast, import consistent dated transactions across several months and include promotions, stock-outs, refunds, and seasonality where possible. Any projection should show assumptions and a range, not a guaranteed result.`;
    } else if(lower.includes("grow")||lower.includes("increase")||lower.includes("improve")||lower.includes("recommend")||lower.includes("what should")||lower.includes("action")) {
      answer=`Here are the most practical actions based on the loaded data:

1. **Protect contribution:** current contribution is ${money(totals.profit)} (${totals.margin.toFixed(1)}% of recorded revenue). Track unrecorded overheads before calling it net profit.
2. **Prioritise evidence:** ${topProfit?`${topProfit.name} has the highest recorded contribution (${money(topProfit.revenue-topProfit.cost)}).`:"Import product and cost data to rank contribution."}
3. **Review weak performers:** ${worstProfit?`${worstProfit.name} has the lowest total contribution among listed products (${money(worstProfit.revenue-worstProfit.cost)}). Check its pricing, discounts, and unit costs.`:"Product-level costs are needed to identify weak performers."}
4. **Improve data quality:** include dates, product, quantity, revenue, cost, customer, and region where available.

These are data-backed checks, not guaranteed growth promises.`;
    } else if(lower.includes("revenue")||lower.includes("sales")||lower.includes("earning")) {
      answer=`Recorded revenue is ${money(totals.revenue)} across ${totals.orders} rows and ${totals.units} units. Average recorded revenue per row is ${money(totals.orders?totals.revenue/totals.orders:0)}. ${topRegion?`${topRegion[0]} is the leading region at ${money(topRegion[1])}.`:"Region data is not available for comparison."}\n\nFor a meaningful growth comparison, import dates covering multiple comparable periods. The current total alone does not establish whether sales are rising or falling.`;
    } else {
      answer=`I checked the current workspace: ${money(totals.revenue)} recorded revenue, ${money(totals.costs)} recorded costs, ${money(totals.profit)} revenue minus recorded costs, ${totals.orders} transaction rows, and ${products.length} distinct products.\n\nI can help with:
• Profit and contribution margins
• Best-selling and low-contribution products
• Expense review and pricing opportunities
• Customer and regional performance
• Forecast requirements and growth actions

Ask a specific question and I'll use the available records. This local demo uses a deterministic analysis engine, not a connected live AI model.`;
    }
    setQuestion("");
    setChat(next);
    setThinking(true);
    try{
      const context={
        business:{dataset:fileName||"demo sample",currency:"INR",rows:transactions.length,revenue:totals.revenue,recordedCosts:totals.costs,contribution:totals.profit,marginPct:Number(totals.margin.toFixed(1)),units:totals.units,distinctCustomers:customers.length,monthlyRevenueGoal:goal,topProducts:products.slice(0,8).map(p=>({name:p.name,category:p.category,revenue:p.revenue,cost:p.cost,units:p.units})),regionRevenue:Object.fromEntries(topRegionMap),importWarnings:uploadWarnings.slice(0,3)},
        operations:getOpsSummary()||"Operations analysis has not been opened yet in this session."
      };
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:next.slice(-10).map(m=>({role:m.role,content:m.text})),context})});
      const raw=await res.text();
      let data:any={};
      try { data=raw ? JSON.parse(raw) : {}; } catch { /* preserve raw response for diagnostics */ }
      if(!res.ok||!data.content) throw Object.assign(new Error(data.error||`AI request failed (HTTP ${res.status}). ${raw.slice(0,240)||"The server returned an empty response."}`),{notConfigured:res.status===503});
      setAiNote({live:true,model:data.model});
      setChat([...next,{role:"assistant",text:data.content,live:true}]);
    }catch(err){
      const e2=err as Error&{notConfigured?:boolean};
      setAiNote({live:false,msg:e2.notConfigured?"Live AI is not configured. Using the built-in local engine.":`Live AI unavailable (${e2.message}). Used the built-in local engine instead.`});
      setChat([...next,{role:"assistant",text:answer,live:false}]);
    }finally{setThinking(false);}
  };
  const exportCSV = () => {const header=["date","order_id","product","category","quantity","revenue","cost","customer","region"];const csv=[header.join(","),...filteredTransactions.map(t=>header.map(k=>JSON.stringify((t as any)[k]??"")).join(","))].join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="veyra-filtered-business-report.csv";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`Exported ${filteredTransactions.length} filtered rows.`);};
  const exportSummaryCSV = () => {const lines=[["VEYRA business summary"],["Rows analysed",filteredTransactions.length],["Revenue",filteredTransactions.reduce((s,t)=>s+t.revenue,0)],["Recorded costs",filteredTransactions.reduce((s,t)=>s+t.cost,0)],["Contribution",filteredTransactions.reduce((s,t)=>s+t.revenue-t.cost,0)],["Generated at",new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})]];const csv=lines.map(row=>row.map(v=>JSON.stringify(v)).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="veyra-key-takeaways.csv";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);notify("Summary report exported.");};
  const titleSub:Record<Page,string> = {"Overview":"Find the operational issues that need your attention first.","Operations":"Spot workload pressure, SLA risk and the next best operational action.","Sales & Revenue":"Understand your revenue engine and sales momentum.","Expenses":"See where your money goes and what deserves attention.","Products":"Discover your strongest products and margin opportunities.","Customers":"Understand the customers represented in your records.","Inventory":"Monitor inventory signals when stock data is available.","AI Insights":"Turn business data into your next best move.","Reports":"Build and export a business performance snapshot.","Goals":"Keep your team focused on measurable outcomes.","Settings":"Make VEYRA work the way your business does.","Admin Console":"Manage the VEYRA demo workspace and review account access."};

  if(mode==="landing") return <main className="landing">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="site-nav"><Logo/><nav><a href="#platform">Platform</a><a href="#features">Features</a><a href="#how">How it works</a></nav><div className="nav-actions"><button className="btn-ghost" onClick={()=>{setRole("user");setMode("login");}}>User Login</button><button className="btn-primary" onClick={()=>{setRole("user");setMode("signup");}}>Get started <ArrowRight size={15}/></button></div></header>
    <section className="cora-hero">
      <div className="cora-wave cora-wave-left"/><div className="cora-wave cora-wave-right"/><div className="cora-horizon"/>
      <div className="cora-hero-copy">
        <div className="cora-overline"><span className="pulse-dot"/> BUSINESS INTELLIGENCE · AI POWERED</div>
        <h1>Modular Intelligence<br/>Powered By <span>VEYRA Engine.</span></h1>
        <p>Voice-ready. Context-aware. Built to scale.</p>
        <div className="cora-hero-actions"><button className="cora-pill" onClick={()=>setMode("signup")}>Enter the VEYRA Engine <ArrowRight size={15}/></button><button className="cora-text-link" onClick={openDemo}>Explore live demo <span>↗</span></button></div>
      </div>
      <div className="cora-core-wrap"><div className="cora-core-halo"/><div className="cora-core"><Logo small/></div><span className="cora-core-caption">INTELLIGENCE CORE / 01</span></div>
      <div className="cora-trust-logos"><span>Google</span><span>◈</span><span>◉ OpenAI</span><span>✣</span><span>△ data</span><span>◉ GitHub</span><span>Microsoft</span></div>
    </section>
    <section className="trust-strip cora-trust-strip"><span>BUILT FOR CLARITY AT EVERY SCALE</span><div><span><BriefcaseBusiness size={16}/> Small business</span><span><Globe2 size={16}/> Growing teams</span><span><Activity size={16}/> Data-driven founders</span><span><Zap size={16}/> Faster decisions</span></div></section>
    <section id="platform" className="section-block"><div className="section-kicker">INTRODUCTION</div><h2>What is <span>VEYRA?</span></h2><p className="section-intro">A modular intelligence platform that connects your business data, detects meaningful patterns, and turns signals into clear next steps.</p><div id="features" className="feature-grid"><article className="feature-card feature-large"><div className="feature-icon gold"><BrainCircuit/></div><div className="feature-number">01 / INTELLIGENCE</div><h3>Know the why, not just the what.</h3><p>Understand the signals behind your performance with context-rich insights that connect the numbers to practical next steps.</p><div className="feature-visual insight-visual"><div className="visual-label"><span className="pulse-dot"/> INSIGHT DETECTED</div><b>Revenue is growing.<br/>Margin needs attention.</b><div className="visual-line"><span/><span/><span/><span/><span/><span/><span/></div><small>Illustrative insight preview</small></div></article><article className="feature-card"><div className="feature-icon purple"><TrendingUp/></div><div className="feature-number">02 / CLARITY</div><h3>Your whole business, in focus.</h3><p>See recurring issues, workload pressure, delayed work and performance gaps in one clear workspace.</p><div className="mini-bars">{[32,48,39,63,53,77,66,90,72,100,82,112].map((h,i)=><i key={i} style={{height:h}}/>)}</div></article><article className="feature-card"><div className="feature-icon mint"><Target/></div><div className="feature-number">03 / ACTION</div><h3>Turn insight into momentum.</h3><p>Prioritise work based on urgency, capacity and business impact, then compare baseline metrics with outcomes.</p><div className="goal-visual"><div className="goal-ring"><span>72<small>%</small></span></div><div><b>Monthly target</b><small>Illustrative goal progress</small><div className="goal-bar"><i/></div></div></div></article></div></section>
    <section id="how" className="how-section"><div className="dot-field-animation" aria-hidden="true">{Array.from({length:42},(_,i)=><i key={i} style={{"--dot-index":i,"--dot-delay":`${(i%9)*-0.19}s`} as React.CSSProperties}/>)}</div><div className="section-kicker">CHOOSE · DEPLOY · COMMAND · ITERATE</div><h2>How it <span>Works</span></h2><div className="steps-grid"><div className="step"><span>01</span><CloudUpload/><h3>Bring your data</h3><p>Start with a CSV export. No complicated setup or data warehouse required for the demo.</p></div><div className="step-connector">→</div><div className="step"><span>02</span><Gauge/><h3>See the full picture</h3><p>Review operational signals, identify what is falling behind, and understand what is changing.</p></div><div className="step-connector">→</div><div className="step"><span>03</span><Sparkles/><h3>Choose your next move</h3><p>Review the evidence, get an explainable recommendation, and turn analysis into a focused action plan.</p></div></div></section>
    <section className="cta-section"><div className="cta-glow"/><div className="section-kicker">YOUR INTELLIGENCE LAYER</div><h2>What we <span>provide?</span></h2><p>Meet a clearer way to run your business.</p><button className="btn-primary btn-large" onClick={()=>setMode("signup")}>Get started with VEYRA <ArrowRight size={17}/></button><small>No credit card required for this demo experience.</small></section>
    <footer className="site-footer"><Logo/><span>© 2025 VEYRA Intelligence. Demo experience.</span><div><a href="#platform">Platform</a><a href="#features">Features</a><button onClick={()=>setMode("login")}>Sign in</button></div></footer>
  </main>;

  if(mode==="login"||mode==="signup") return <main className="auth-shell"><div className="auth-backdrop"/><button className="auth-back" onClick={()=>setMode("landing")}><ChevronLeft size={16}/> Back to website</button><div className="auth-layout"><div className="auth-story"><Logo/><div className="auth-story-content"><div className="eyebrow"><span className="pulse-dot"/> CLARITY, BUILT IN</div><h1>{mode==="login"?"Welcome back to a clearer view.":"Make your next move a smarter one."}</h1><p>Your business has a story in its numbers. VEYRA helps you read it, understand it, and act on it.</p><div className="auth-mini-dashboard"><div className="auth-mini-head"><span>BUSINESS SNAPSHOT</span><span className="preview-status"><span/> DEMO</span></div><div className="auth-mini-metrics"><div><small>Revenue</small><b>₹2.48L</b><em>↗ 12.5%</em></div><div><small>Profit margin</small><b>30.7%</b><em>↗ 6.2%</em></div></div><div className="auth-mini-chart"><svg viewBox="0 0 380 90" preserveAspectRatio="none"><path d="M0 75 C30 60 40 68 70 52 S110 65 135 42 S175 56 205 31 S245 49 270 25 S320 37 380 6" fill="none" stroke="#F5C542" strokeWidth="2.5"/><path d="M0 86 C40 80 65 84 100 68 S150 80 180 61 S230 73 265 53 S320 62 380 40" fill="none" stroke="#8E7CFF" strokeWidth="2"/></svg></div></div><div className="auth-quote"><Sparkles size={16}/><span>“The best business decisions begin with a clearer picture.”</span></div></div><div className="auth-story-foot"><span><ShieldCheck size={14}/> Built with privacy in mind</span><span>VEYRA / 01</span></div></div><div className="auth-form-side"><form className="auth-form" onSubmit={enterApp}><div className="mobile-auth-logo"><Logo/></div><div className="auth-form-top"><div className="auth-form-mark"><LockKeyhole size={19}/></div><span className="auth-label">{mode==="login"?"YOUR WORKSPACE AWAITS":"START YOUR WORKSPACE"}</span></div><h2>{mode==="login"?"Sign in to VEYRA":"Create your account"}</h2><p className="auth-form-desc">{mode==="login"?"Pick up where your business left off.":"A clearer view of your business starts here."}</p>
    {mode==="signup"&&<label className="field-label">Full name<div className="field-wrap"><Users size={16}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/></div></label>}
    <label className="field-label">Work email<div className="field-wrap"><span className="field-at">@</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required/></div></label>
    <label className="field-label">Password<div className="field-wrap"><LockKeyhole size={16}/><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" minLength={4} required/><button type="button" className="reveal-btn" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
    {mode==="login"&&<div className="auth-options"><label><input type="checkbox"/> Remember me</label><button type="button" onClick={()=>notify("Password recovery needs a configured authentication provider.")}>Forgot password?</button></div>}
    {mode==="signup"&&<label className="terms-row"><input type="checkbox" required/> <span>I agree to the terms and privacy policy for this demo.</span></label>}
    <button className="btn-primary auth-submit" type="submit">{mode==="login"?"Sign in to workspace":"Create account"} <ArrowRight size={16}/></button>
    <div className="auth-switch"><span>{mode==="login"?"New to VEYRA?":"Already have an account?"}</span><button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setRole("user");}}>{mode==="login"?"Create account":"Sign in"}</button></div>
    <div className="auth-divider"><span/> <small>OR TRY IT OUT</small> <span/></div>
    <button className="demo-login" type="button" onClick={openDemo}><Sparkles size={16}/> Explore the demo workspace <ArrowRight size={15}/></button>
    <p className="auth-disclaimer">Demo mode is for exploration only. Production authentication is not configured in this starter.</p>
  </form></div></div>{notice&&<div className="toast"><Check size={16}/>{notice}</div>}</main>;

  const renderOverview = () => <><section className="panel key-takeaways"><div className="panel-heading"><div><h3><Sparkles size={16}/> Key takeaways & action items</h3><p>Automatically derived from the records currently loaded</p></div><button className="btn-secondary" onClick={exportSummaryCSV}><Download size={14}/> Export summary</button></div><div className="takeaway-grid"><div><span className="takeaway-label">TOP REVENUE PRODUCT</span><b>{products[0]?.name || "No product data yet"}</b><small>{products[0] ? `${money(products[0].revenue)} recorded revenue` : "Upload a CSV or load demo data to begin."}</small></div><div><span className="takeaway-label">MARGIN TO REVIEW</span><b>{[...products].sort((a,b)=>(a.revenue?((a.revenue-a.cost)/a.revenue):0)-(b.revenue?((b.revenue-b.cost)/b.revenue):0))[0]?.name || "Awaiting data"}</b><small>{products.length ? "Review contribution and unit costs before changing price." : "Add product, revenue, and cost columns."}</small></div><div><span className="takeaway-label">NEXT ACTION</span><b>{totals.margin < 20 ? "Review costs & pricing" : "Validate your strongest products"}</b><small>{totals.margin < 20 ? `Recorded contribution margin is ${totals.margin.toFixed(1)}%.` : "Compare margins and demand before increasing stock."}</small></div></div>{uploadWarnings.length>0&&<div className="upload-warnings dashboard-warnings"><b>Import review</b>{uploadWarnings.map((w,i)=><p key={i}>{w}</p>)}</div>}</section><div className="kpi-grid">
    <Kpi title="Total revenue" value={compactMoney(totals.revenue)} delta={`${revenueTrendPct>=0?"+":""}${revenueTrendPct.toFixed(1)}%`} icon={<TrendingUp/>} color="gold" caption="later vs earlier rows (proxy)" />
    <Kpi title="Recorded profit" value={compactMoney(totals.profit)} delta={`${costTrendPct>=0?"+":""}${costTrendPct.toFixed(1)}% cost trend`} icon={<Wallet/>} color="mint" caption="later vs earlier rows (proxy)"/>
    <Kpi title="Recorded costs" value={compactMoney(totals.costs)} delta="Tracked" icon={<CreditCard/>} color="purple" caption="cost column total"/>
    <Kpi title="Profit margin" value={`${totals.margin.toFixed(1)}%`} delta={totals.margin>=25?"Healthy":"Review"} icon={<Gauge/>} color="blue" caption="based on recorded costs"/>
  </div>
  <div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h3>Performance overview</h3><p>Revenue, profit and cost trends</p></div><div className="panel-actions"><span className="legend"><i className="legend-gold"/> Revenue</span><span className="legend"><i className="legend-purple"/> Profit</span><select value={period} onChange={e=>setPeriod(e.target.value)}><option>Last 6 months</option><option>Last 30 days</option><option>This year</option></select></div></div><div className="main-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{top:12,right:5,left:0,bottom:0}}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F5C542" stopOpacity={.2}/><stop offset="100%" stopColor="#F5C542" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#242B35" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="month" tick={{fill:"#7F8A9B",fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#7F8A9B",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}k`} width={44}/><Tooltip contentStyle={{background:"#151B24",border:"1px solid #303845",borderRadius:12,color:"#F5F7FA"}} formatter={(v:any,n:any)=>[`₹${Number(v).toFixed(1)}k`,n==="revenue"?"Revenue":n==="profit"?"Profit":"Costs"]}/><Area type="monotone" dataKey="revenue" stroke="#F5C542" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{r:5,fill:"#F5C542",stroke:"#111"}}/><Line type="monotone" dataKey="profit" stroke="#9B8AFF" strokeWidth={2.2} dot={false} activeDot={{r:4}}/></AreaChart></ResponsiveContainer></div><div className="chart-footer"><span><span className="live-dot"/> Data refreshed from current workspace</span><button onClick={()=>setPage("Reports")}>View report <ArrowRight size={14}/></button></div></section>
  <section className="panel category-panel"><div className="panel-heading"><div><h3>Revenue mix</h3><p>By product category · illustrative split</p></div><button className="icon-btn"><MoreHorizontal size={17}/></button></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={67} outerRadius={91} paddingAngle={5} stroke="none"><Cell fill="#F5C542"/><Cell fill="#8E7CFF"/><Cell fill="#46D9B0"/></Pie><Tooltip contentStyle={{background:"#151B24",border:"1px solid #303845",borderRadius:10}} formatter={(v:any)=>[`${v}%`,"Mix"]}/></PieChart></ResponsiveContainer><div className="donut-center"><small>TOP CATEGORY</small><strong>Electronics</strong><span>48% mix</span></div></div><div className="category-legend">{categoryData.map(c=><div key={c.name}><span><i style={{background:c.color}}/>{c.name}</span><b>{c.value}%</b></div>)}</div></section>
  <section className="panel products-panel"><div className="panel-heading"><div><h3>Top products</h3><p>Ranked by recorded revenue</p></div><button className="text-action" onClick={()=>setPage("Products")}>View all <ArrowRight size={14}/></button></div><div className="product-table"><div className="table-row table-head"><span>PRODUCT</span><span>REVENUE</span><span>MARGIN*</span></div>{products.slice(0,5).map((p,i)=><div className="table-row" key={p.name}><span className="product-name"><i className={`product-swatch swatch-${i%4}`}>{p.name.slice(0,1)}</i><span><b>{p.name}</b><small>{p.category}</small></span></span><b>{compactMoney(p.revenue)}</b><span className="margin-pill">{p.revenue?((p.revenue-p.cost)/p.revenue*100).toFixed(0):0}%</span></div>)}</div><small className="table-note">*Calculated from recorded revenue and cost only.</small></section>
  <section className="panel insight-panel"><div className="panel-heading"><div className="insight-title"><div className="feature-icon gold"><Sparkles size={17}/></div><div><h3>VEYRA intelligence</h3><p>Signals worth your attention</p></div></div><span className="beta-tag">DEMO AI</span></div><div className="insight-main"><div className="insight-badge"><Lightbulb size={16}/></div><div><span className="priority-label">OPPORTUNITY · MEDIUM</span><h4>Protect margin as sales grow</h4><p>Your top-revenue products may not be your top-margin products. Compare contribution margins before putting more budget behind a bestseller.</p><button onClick={()=>setPage("AI Insights")}>Explore this insight <ArrowRight size={14}/></button></div></div><div className="insight-bottom"><span><ShieldCheck size={14}/> Based on available records</span><button onClick={()=>setPage("AI Insights")}>Ask VEYRA <ArrowRight size={13}/></button></div></section>
  <section className="panel transactions-panel"><div className="panel-heading"><div><h3>Recent transactions</h3><p>Latest rows in your dataset</p></div><button className="icon-btn" onClick={()=>setSearch("")}><Filter size={16}/></button></div><div className="transaction-table"><div className="table-row transaction-head"><span>ORDER</span><span>PRODUCT</span><span>DATE</span><span>AMOUNT</span></div>{filteredTransactions.length ? filteredTransactions.slice(-5).reverse().map(t=><div className="table-row" key={t.order_id}><span className="order-id">{t.order_id}</span><span>{t.product}</span><span>{t.date}</span><b>{money(t.revenue)}</b></div>) : <div className="empty-state"><FileSpreadsheet size={20}/><b>No transactions match</b><span>Try clearing search or import a CSV.</span></div>}</div><div className="transaction-footer"><span>{filteredTransactions.length} of {transactions.length} rows shown</span><button onClick={()=>setPage("Sales & Revenue")}>All transactions <ArrowRight size={13}/></button></div></section>
  <section className="panel goal-panel"><div className="panel-heading"><div><h3>Monthly revenue goal</h3><p>Keep your next milestone in view</p></div><button className="icon-btn" onClick={()=>setPage("Goals")}><ArrowUpRight size={17}/></button></div><div className="goal-total"><strong>{compactMoney(totals.revenue)}</strong><span>of {compactMoney(goal)}</span></div><div className="progress-track"><i style={{width:`${Math.min(100,totals.revenue/Math.max(goal,1)*100)}%`}}/></div><div className="goal-progress-label"><span>{Math.min(100,Math.round(totals.revenue/Math.max(goal,1)*100))}% achieved</span><span>{compactMoney(Math.max(0,goal-totals.revenue))} to go</span></div><button className="goal-edit" onClick={()=>setPage("Goals")}><Target size={14}/> Manage goals</button></section></div></>;
  const renderSection = () => {
    if(page==="Overview") return renderOverview();
    if(page==="Operations") return <OperationsEngine/>;
    if(page==="Sales & Revenue") return <><div className="kpi-grid"><Kpi title="Revenue" value={compactMoney(totals.revenue)} delta={`${transactions.length} rows`} icon={<TrendingUp/>} color="gold" caption="in current dataset"/><Kpi title="Orders / rows" value={String(totals.orders)} delta="Imported" icon={<FileSpreadsheet/>} color="blue" caption="transaction records"/><Kpi title="Units sold" value={formatNumber(totals.units)} delta="Tracked" icon={<Package/>} color="mint" caption="sum of quantity column"/><Kpi title="Average row value" value={money(totals.orders?totals.revenue/totals.orders:0)} delta="Calculated" icon={<Activity/>} color="purple" caption="revenue / rows"/></div><div className="panel full-panel"><div className="panel-heading"><div><h3>Sales ledger</h3><p>Search and filter imported transaction records</p></div><div className="search-box"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product, order, customer..."/></div></div><div className="data-filter-bar"><label>Category<select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All categories</option>{Array.from(new Set(transactions.map(t=>t.category))).sort().map(c=><option key={c}>{c}</option>)}</select></label><label>Status<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All status</option><option>Revenue recorded</option><option>Loss-making</option><option>No revenue</option></select></label><label>From<input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></label><label>To<input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></label><label>Min ₹<input type="number" min="0" value={minRevenue} onChange={e=>setMinRevenue(e.target.value)} placeholder="0"/></label><label>Max ₹<input type="number" min="0" value={maxRevenue} onChange={e=>setMaxRevenue(e.target.value)} placeholder="Any"/></label><button className="btn-secondary" onClick={()=>{setSearch("");setCategoryFilter("All categories");setStatusFilter("All status");setDateFrom("");setDateTo("");setMinRevenue("");setMaxRevenue("");}}>Clear filters</button></div><div className="wide-table"><div className="table-row wide-head"><span>ORDER ID</span><span>DATE</span><span>PRODUCT</span><span>CATEGORY</span><span>UNITS</span><span>REVENUE</span><span>COST</span></div>{filteredTransactions.length ? filteredTransactions.map(t=><div className="table-row" key={t.order_id}><span className="order-id">{t.order_id}</span><span>{t.date}</span><span>{t.product}</span><span>{t.category}</span><span>{t.quantity}</span><b>{money(t.revenue)}</b><span>{money(t.cost)}</span></div>) : <div className="empty-state"><FileSpreadsheet size={22}/><b>No matching records</b><span>Adjust filters or clear them to see your data.</span></div>}</div><div className="panel-bottom"><span>{filteredTransactions.length} records shown</span><button className="btn-secondary" onClick={exportCSV}><Download size={14}/> Export CSV</button></div></div></>;
    if(page==="Expenses") return <><div className="kpi-grid"><Kpi title="Recorded costs" value={compactMoney(totals.costs)} delta="Current data" icon={<Wallet/>} color="purple" caption="cost column total"/><Kpi title="Cost / revenue" value={`${totals.revenue?(totals.costs/totals.revenue*100).toFixed(1):0}%`} delta="Calculated" icon={<Activity/>} color="gold" caption="recorded cost ratio"/><Kpi title="Gross contribution" value={compactMoney(totals.profit)} delta="Revenue − costs" icon={<TrendingUp/>} color="mint" caption="not net profit unless all costs included"/><Kpi title="Rows analysed" value={String(transactions.length)} delta="Dataset" icon={<FileSpreadsheet/>} color="blue" caption="records available"/></div><div className="panel full-panel"><div className="panel-heading"><div><h3>Cost by product</h3><p>Recorded costs grouped by product</p></div></div><div className="bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={products} margin={{top:10,right:15,left:0,bottom:10}}><CartesianGrid stroke="#242B35" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="name" tick={{fill:"#9CA6B5",fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#7F8A9B",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${Math.round(v/1000)}k`}/><Tooltip cursor={false} contentStyle={{background:"#151B24",border:"1px solid #303845",borderRadius:10}} formatter={(v:any)=>[money(Number(v)),"Recorded cost"]}/><Bar dataKey="cost" fill="#8E7CFF" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div><p className="disclaimer">Cost categorisation is limited to the fields present in your data. This page does not infer unrecorded operating expenses.</p></div></>;
    if(page==="Products") return <div className="panel full-panel"><div className="panel-heading"><div><h3>Product performance</h3><p>Revenue, recorded costs and contribution by product</p></div><button className="btn-secondary" onClick={()=>setShowUpload(true)}><Upload size={14}/> Import data</button></div><div className="product-cards">{products.map((p,i)=><article className="product-detail-card" key={p.name}><div className={`product-avatar swatch-${i%4}`}>{p.name.slice(0,1)}</div><div className="product-detail-top"><span>{p.category}</span><span className="status-dot">● Tracked</span></div><h3>{p.name}</h3><div className="product-revenue">{money(p.revenue)}</div><small>Recorded revenue</small><div className="product-stat-row"><span>Units sold</span><b>{p.units}</b></div><div className="product-stat-row"><span>Recorded costs</span><b>{money(p.cost)}</b></div><div className="product-stat-row"><span>Contribution margin</span><b>{p.revenue?((p.revenue-p.cost)/p.revenue*100).toFixed(1):0}%</b></div><div className="product-progress"><i style={{width:`${Math.max(0,Math.min(100,p.revenue?((p.revenue-p.cost)/p.revenue*100):0))}%`}}/></div></article>)}</div></div>;
    if(page==="Customers") return <div className="panel full-panel"><div className="panel-heading"><div><h3>Customer records</h3><p>Customers present in the imported transaction data</p></div><span className="beta-tag">DATA-BASED</span></div><div className="kpi-grid compact-kpis"><Kpi title="Unique customers" value={String(customers.length)} delta="In records" icon={<Users/>} color="gold" caption="distinct non-empty names"/><Kpi title="Average row value" value={money(totals.orders?totals.revenue/totals.orders:0)} delta="Calculated" icon={<Wallet/>} color="mint" caption="not customer lifetime value"/><Kpi title="Repeat customers" value="—" delta="Needs history" icon={<Activity/>} color="purple" caption="requires reliable customer IDs"/></div><div className="wide-table"><div className="table-row customer-head"><span>CUSTOMER</span><span>REGION</span><span>ORDERS / ROWS</span><span>RECORDED REVENUE</span></div>{customers.map(c=>{const rows=transactions.filter(t=>t.customer===c);return <div className="table-row" key={c}><span className="customer-name"><i>{c?.split(" ").map(x=>x[0]).join("").slice(0,2)}</i>{c}</span><span>{rows[0]?.region||"—"}</span><span>{rows.length}</span><b>{money(rows.reduce((s,t)=>s+t.revenue,0))}</b></div>})}</div><p className="disclaimer">No demographic or lifetime-value assumptions are made. Only names and transactions in your dataset are shown.</p></div>;
    if(page==="Inventory") return <div className="inventory-page">
      <div className="inventory-hero panel"><div><span className="section-kicker">INVENTORY INTELLIGENCE</span><h2>Know what’s on your shelves.</h2><p>Track available products, spot stockouts, move near-expiry items, and plan your next refill.</p></div><button className="btn-primary" onClick={()=>notify("Demo inventory shown. Import a CSV with product, stock_quantity, reorder_level and expiry_date to use your own stock.")}><Upload size={15}/> Import stock data</button></div>
      <div className="kpi-grid inventory-kpis"><Kpi title="Products tracked" value={String(inventory.length)} delta="Demo inventory" icon={<Package/>} color="gold" caption="items in this example"/><Kpi title="Out of stock" value={String(inventory.filter(x=>x.stock===0).length)} delta="Needs restock" icon={<Activity/>} color="purple" caption="products unavailable"/><Kpi title="Refill soon" value={String(inventory.filter(x=>x.stock>0&&x.stock<=x.reorder).length)} delta="At or below reorder level" icon={<TrendingDown/>} color="blue" caption="check supplier lead time"/><Kpi title="Near expiry" value={String(inventory.filter(x=>x.expiry&&new Date(x.expiry).getTime()-Date.now()<30*86400000&&new Date(x.expiry).getTime()>=Date.now()).length)} delta="Next 30 days" icon={<CalendarDays/>} color="mint" caption="review and sell early"/></div>
      <div className="inventory-layout"><section className="panel inventory-table-panel"><div className="panel-heading"><div><h3>Shop stockroom</h3><p>Availability, quantity, expiry and next action</p></div><span className="beta-tag">SAMPLE DATA</span></div><div className="inventory-table"><div className="inventory-row inventory-head"><span>PRODUCT</span><span>STOCK</span><span>BEST BEFORE</span><span>STATUS / ACTION</span></div>{inventory.map((item,i)=>{const days=item.expiry?Math.ceil((new Date(item.expiry).getTime()-Date.now())/86400000):999;const expired=days<0;const near=days>=0&&days<=30;const out=item.stock===0;const low=!out&&item.stock<=item.reorder;return <div className="inventory-row" key={item.name}><span className="inventory-product"><i className={`product-swatch swatch-${i%4}`}>{item.name.slice(0,1)}</i><span><b>{item.name}</b><small>{item.category}</small></span></span><b className={out?"stock-zero":low?"stock-low":""}>{item.stock} units</b><span>{item.expiry||"Not provided"}{near&&<small className="expiry-note"> · {days} days left</small>}{expired&&<small className="expiry-note"> · Expired</small>}</span><span><em className={`stock-status ${out||expired?"danger":low||near?"warning":"healthy"}`}>{out?"Out of stock":expired?"Expired":near?"Near expiry":low?"Refill soon":"In stock"}</em><small className="stock-action">{out?"Reorder now":expired?"Remove from sale":near?"Promote / discount":low?"Contact supplier":"Stock looks healthy"}</small></span></div>})}</div><p className="disclaimer">Inventory shown here is illustrative demo data, not your real shop stock. Replace it with your own inventory CSV to make decisions from your actual records.</p></section>
      <aside className="panel inventory-advisor"><div className="advisor-heading"><div className="feature-icon gold"><Sparkles size={17}/></div><div><h3>VEYRA shop advisor</h3><p>Suggestions based on this sample stock</p></div></div><div className="advisor-item urgent"><span>01 · ACT NOW</span><b>Refill Gift Box — Premium</b><p>Stock is zero. Reorder at least 6 units or temporarily mark it unavailable to avoid disappointing customers.</p></div><div className="advisor-item warning"><span>02 · SELL QUICKLY</span><b>Review near-expiry fragrances</b><p>Rose Oud and Amber Nights are approaching their sample expiry dates. Verify the actual batch dates, then consider a bundle or limited discount.</p></div><div className="advisor-item idea"><span>03 · PRODUCT IDEA</span><b>Add a discovery sampler set</b><p>Bundle 3–5 mini fragrances so customers can test scents before buying full-size bottles. Validate demand before ordering stock.</p></div><button className="btn-secondary full-button" onClick={()=>setShowNotif(true)}><Bell size={14}/> View stock alerts</button></aside></div>
    </div>;
    if(page==="AI Insights") return <><div className="ai-welcome panel"><div className="ai-orb"><BrainCircuit size={27}/><span/></div><div><span className="section-kicker">YOUR BUSINESS COPILOT</span><h2>Good decisions start with good questions.</h2><p>Ask about your business and operations data in English, Hindi or Hinglish. Answers come from a live AI model when a server API key is configured, otherwise from the built-in local engine.</p></div><span className="beta-tag">{aiNote?(aiNote.live?"LIVE AI":"LOCAL ENGINE"):"AI COPILOT"}</span></div><div className="ai-layout"><section className="panel chat-panel"><div className="chat-top"><div><h3><span className="ai-status"/> Ask VEYRA</h3><p>Operational decision support · demo data</p></div><button className="icon-btn" onClick={()=>setChat([])} title="Clear chat"><X size={16}/></button></div><div className="chat-messages">{chat.length===0?<div className="chat-empty"><div className="chat-empty-icon"><Sparkles/></div><h3>What would you like to understand?</h3><p>Ask a question to get started. VEYRA will use the current workspace records.</p><div className="prompt-chips">{["Which issues are most urgent?","Where is workload at risk?","What could miss its SLA?","What action should we take first?"].map(q=><button key={q} onClick={()=>setQuestion(q)}>{q}<ArrowUpRight size={13}/></button>)}</div></div>:chat.map((m,i)=><div className={`chat-message ${m.role}`} key={i}><div className="chat-avatar">{m.role==="assistant"?<Sparkles size={15}/>:name.slice(0,1).toUpperCase()}</div><div><small>{m.role==="assistant"?(m.live?"VEYRA · LIVE AI":"VEYRA · LOCAL ENGINE"):"YOU"}</small><p style={{whiteSpace:"pre-wrap"}}>{m.text}</p></div></div>)}</div><form className="chat-composer" onSubmit={sendQuestion}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about your business data..." /><button className="btn-primary" type="submit" aria-label="Send message" disabled={thinking}><ArrowRight size={17}/></button></form><p className="chat-footnote">{thinking?"VEYRA is thinking…":aiNote?(aiNote.live?`Live AI${aiNote.model?` · ${aiNote.model}`:""} · aggregate metrics and ticket IDs from your workspace are sent to the provider.`:aiNote.msg):"Questions plus aggregate workspace metrics are sent to your configured AI provider; with no key, answers use the local engine."}</p></section><aside className="panel ai-context"><h3>Current context</h3><p>These are the metrics available to VEYRA right now.</p><div className="context-row"><span>Revenue</span><b>{money(totals.revenue)}</b></div><div className="context-row"><span>Recorded costs</span><b>{money(totals.costs)}</b></div><div className="context-row"><span>Contribution</span><b>{money(totals.profit)}</b></div><div className="context-row"><span>Rows</span><b>{transactions.length}</b></div><div className="context-warning"><ShieldCheck size={15}/><span>Responses are based only on the loaded records and may omit untracked costs.</span></div></aside></div></>;
    if(page==="Reports") return <div className="panel full-panel"><div className="panel-heading"><div><h3>Business report center</h3><p>Export a snapshot of the current workspace data</p></div><span className="beta-tag">LIVE DATASET</span></div><div className="report-summary"><div><span>REVENUE</span><b>{money(totals.revenue)}</b></div><div><span>RECORDED COSTS</span><b>{money(totals.costs)}</b></div><div><span>CONTRIBUTION</span><b>{money(totals.profit)}</b></div><div><span>ROWS</span><b>{transactions.length}</b></div></div><div className="report-options"><div className="report-icon"><FileSpreadsheet/></div><div><h3>Transaction data export</h3><p>Download the currently loaded records as a CSV file that opens in Excel or Google Sheets.</p></div><button className="btn-primary" onClick={exportCSV}><Download size={15}/> Export CSV</button></div><div className="report-options"><div className="report-icon purple"><FileBarChart/></div><div><h3>Printable summary</h3><p>Open your browser's print dialog to save this summary as a PDF.</p></div><button className="btn-secondary" onClick={()=>window.print()}><Download size={15}/> Print / Save PDF</button></div><p className="disclaimer">This is a basic export centre. It does not generate a signed financial statement or certified accounting report.</p></div>;
    if(page==="Goals") return <div className="goal-page-grid"><section className="panel goal-editor"><div className="panel-heading"><div><h3>Revenue target</h3><p>Set a goal for your current workspace</p></div><div className="feature-icon gold"><Target/></div></div><label className="field-label">Monthly revenue target (INR)<div className="field-wrap"><span className="field-at">₹</span><input type="number" min="1" value={goalInput} onChange={e=>setGoalInput(e.target.value)}/></div></label><button className="btn-primary" onClick={()=>{const v=Number(goalInput);if(v>0){setGoal(v);notify("Revenue target updated.");}else notify("Enter a target greater than zero.");}}>Save target <Check size={15}/></button><div className="goal-big"><strong>{compactMoney(totals.revenue)}</strong><span>current recorded revenue</span></div><div className="progress-track"><i style={{width:`${Math.min(100,totals.revenue/Math.max(goal,1)*100)}%`}}/></div><div className="goal-progress-label"><span>{Math.min(100,Math.round(totals.revenue/Math.max(goal,1)*100))}% achieved</span><span>{compactMoney(Math.max(0,goal-totals.revenue))} remaining</span></div></section><section className="panel goal-editor"><div className="panel-heading"><div><h3>Decision scorecard</h3><p>Signals from the available data</p></div><Gauge/></div>{[{label:"Data completeness",value:fileName?"Imported file":"Demo dataset",desc:fileName||"Sample transactions are loaded"},{label:"Profitability",value:`${totals.margin.toFixed(1)}%`,desc:"Revenue less recorded costs"},{label:"Product coverage",value:`${products.length} products`,desc:"Distinct product names found"},{label:"Customer coverage",value:`${customers.length} customers`,desc:"Non-empty customer names"}].map(r=><div className="score-row" key={r.label}><div><b>{r.label}</b><small>{r.desc}</small></div><span>{r.value}</span></div>)}</section></div>;
    if(page==="Admin Console") return role !== "admin" ? <div className="panel full-panel"><h2>Admin access required</h2><p>Sign in with an administrator demo account to open this area.</p><button className="btn-primary" onClick={logout}>Return to landing page</button></div> : <div className="admin-console-grid"><div className="kpi-grid"><Kpi title="Demo users" value="24" delta="Illustrative" icon={<Users/>} color="gold" caption="sample admin metric"/><Kpi title="Active workspaces" value="18" delta="Illustrative" icon={<BriefcaseBusiness/>} color="mint" caption="sample admin metric"/><Kpi title="Data imports" value="136" delta="Illustrative" icon={<FileSpreadsheet/>} color="purple" caption="sample admin metric"/><Kpi title="System status" value="Demo" delta="Local only" icon={<Activity/>} color="blue" caption="no backend connected"/></div><section className="panel full-panel"><div className="panel-heading"><div><h3>Admin control center</h3><p>Demo-only overview of users and workspace status</p></div><span className="beta-tag">ADMIN DEMO</span></div><div className="admin-notice"><ShieldCheck size={20}/><div><b>Administrator session</b><p>This is a front-end demo. These sample accounts and metrics are not connected to a database and do not control real users.</p></div></div><div className="admin-table"><div className="admin-row admin-head"><span>ACCOUNT</span><span>ROLE</span><span>STATUS</span><span>WORKSPACE</span></div><div className="admin-row"><span><b>admin@veyra.app</b><small>VEYRA Admin</small></span><span>Administrator</span><span><i className="live-dot"/> Demo session</span><span>Platform</span></div><div className="admin-row"><span><b>demo@veyra.app</b><small>Shirsh</small></span><span>User</span><span><i className="live-dot"/> Demo available</span><span>Veyra workspace</span></div><div className="admin-row"><span><b>owner@example.com</b><small>Business Owner</small></span><span>User</span><span>Sample</span><span>Sample workspace</span></div></div><button className="btn-secondary" onClick={()=>{setRole("user");setEmail("demo@veyra.app");setName("Shirsh");setPage("Overview");notify("Switched to the user demo workspace.");}}>Preview user workspace <ArrowRight size={14}/></button></section></div>;
    return <div className="panel settings-panel"><div className="panel-heading"><div><h3>Workspace settings</h3><p>Manage your local demo experience</p></div></div><div className="settings-profile"><div className="profile-avatar large">{name.slice(0,1).toUpperCase()}</div><div><h3>{name}</h3><p>{email||"demo@veyra.app"}</p><span className="beta-tag">DEMO WORKSPACE</span></div></div><div className="settings-row"><div><b>Business profile</b><small>Workspace name and owner profile</small></div><button className="btn-secondary" onClick={()=>notify("Profile settings are local in this demo.")}>Edit profile</button></div><div className="settings-row"><div><b>Data management</b><small>{fileName?`Current file: ${fileName}`:"Sample dataset loaded"} · {transactions.length} rows</small></div><button className="btn-secondary" onClick={()=>setShowUpload(true)}><Upload size={14}/> Import data</button></div><div className="settings-row"><div><b>Export current dataset</b><small>Download transaction rows as CSV</small></div><button className="btn-secondary" onClick={exportCSV}><Download size={14}/> Export</button></div><div className="settings-row"><div><b>Authentication</b><small>Demo session only; connect Supabase Auth for production.</small></div><span className="beta-tag">NOT CONFIGURED</span></div><button className="btn-danger" onClick={logout}><LogOut size={15}/> Exit workspace</button></div>;
  };

  if (!sessionReady) return <main className="veyra-boot-screen" aria-label="Loading VEYRA workspace"><div className="boot-orbit boot-orbit-one"/><div className="boot-orbit boot-orbit-two"/><div className="boot-core"><span>V</span></div><div className="boot-brand">VEYRA<span>.</span></div><p>Restoring your workspace</p><div className="boot-progress"><i/></div><small>BUSINESS INTELLIGENCE · READYING</small></main>;

  return <main className={`app-shell ${theme === "light" ? "light-mode" : ""} ${page === "Operations" ? "page-operations" : ""}`} data-theme={theme}><div className="app-ambient"/><aside className={`sidebar ${sidebarCollapsed?"collapsed":""} ${mobileNav?"mobile-open":""}`}><div className="sidebar-brand"><button className="sidebar-home-brand" aria-label="Go to VEYRA home dashboard" title="Go to Overview" onClick={()=>{setPage("Overview");setMobileNav(false);}}><Logo/></button><button className="collapse-btn" aria-label={sidebarCollapsed?"Expand sidebar":"Collapse sidebar"} title={sidebarCollapsed?"Expand sidebar":"Collapse sidebar"} onClick={()=>setSidebarCollapsed(v=>!v)}>{sidebarCollapsed?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>}</button><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div><button className="workspace-switch"><div className="workspace-mark">V</div><div><b>Veyra workspace</b><small>{role === "admin" ? "Administrator demo" : "Free demo plan"}</small></div><ChevronDown size={14}/></button><div className="nav-scroll">{["WORKSPACE","INTELLIGENCE","MANAGE"].filter(group=>navItems.some(n=>["Overview","Operations","AI Insights","Reports","Admin Console"].includes(n.label) && n.group===group && (n.label!=="Admin Console" || role==="admin"))).map(group=><div className="nav-group" key={group}><span className="nav-group-label">{group}</span>{navItems.filter(n=>["Overview","Operations","AI Insights","Reports","Admin Console"].includes(n.label) && n.group===group && (n.label!=="Admin Console" || role==="admin")).map(item=>{const Icon=item.icon;return <button key={item.label} className={`nav-item ${page===item.label?"active":""}`} onClick={()=>{setPage(item.label);setMobileNav(false);}} title={sidebarCollapsed?item.label:undefined}><Icon size={17}/><span>{item.label==="AI Insights"?"Decision Engine":item.label}</span>{item.label==="AI Insights"&&<i className="nav-new">CORE</i>}</button>})}</div>)}</div><div className="sidebar-bottom"><div className="plan-card"><div className="plan-icon"><Zap size={15}/></div><b>Make smarter moves</b><p>Connect your data sources to unlock more of VEYRA.</p><button onClick={()=>setShowUpload(true)}>Add data source <ArrowRight size={13}/></button></div><button className="user-profile" onClick={()=>setPage("Settings")}><div className="profile-avatar">{name.slice(0,1).toUpperCase()}</div><div><b>{name}</b><small>{email||"demo@veyra.app"}</small></div><MoreHorizontal size={17}/></button></div></aside>
  <section className="app-main"><header className="app-topbar"><div className="topbar-left"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={19}/></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={13}/><b>{page}</b></div></div><div className="topbar-right"><div className="top-search"><Search size={15}/><input placeholder="Search anything..." value={search} onChange={e=>setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><button className="topbar-icon theme-toggle" onClick={()=>setTheme(t=>t === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button><div className="topbar-divider"/><button className="top-user" onClick={()=>setPage("Settings")}><div className="profile-avatar">{name.slice(0,1).toUpperCase()}</div><ChevronDown size={13}/></button></div></header>
  <div className="page-content"><div className="page-heading"><div><div className="section-kicker">{page==="Overview"?dateForNow():page.toUpperCase()}</div><h1>{page==="AI Insights"?"Decision Engine":page==="Overview"?<>{greetingForNow()}, {name.split(" ")[0]} <span className="wave">✦</span></>:page}</h1><p>{titleSub[page]}</p></div><div className="heading-actions"><button className="btn-secondary" onClick={()=>setShowUpload(true)}><Upload size={15}/> Upload data</button><button className="btn-primary" onClick={()=>{setPage("AI Insights");setChat([]);}}><Sparkles size={15}/> Ask VEYRA</button></div></div>{renderSection()}<footer className="app-footer"><span>© 2025 VEYRA Intelligence</span><span><i className="live-dot"/> {fileName?`Dataset: ${fileName}`:"Demo data active"} · Demo experience</span><button onClick={logout}>Sign out <LogOut size={13}/></button></footer></div></section>
  {showUpload&&<div className="modal-backdrop" onClick={()=>setShowUpload(false)}><div className="upload-modal" onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><div className="feature-icon gold"><CloudUpload/></div><h2>Bring your data into VEYRA</h2><p>Import a CSV and your dashboard will update with its contents.</p></div><button className="icon-btn" onClick={()=>setShowUpload(false)}><X size={17}/></button></div>{uploading&&<div className="upload-progress"><div className="skeleton-line"/><b>Processing CSV in a background worker…</b><span>Large files may take a moment. Keep this window open.</span></div>}{uploadWarnings.length>0&&<div className="upload-warnings"><b>Import warnings</b>{uploadWarnings.map((w,i)=><p key={i}>{w}</p>)}</div>}<button className="drop-zone" disabled={uploading} onClick={()=>fileRef.current?.click()}><div className="upload-icon"><Upload size={24}/></div><b>Choose a CSV file to upload</b><span>Click to browse · CSV up to your browser's available memory</span><span className="file-tag"><FileSpreadsheet size={14}/> CSV format</span></button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile}/><div className="modal-help"><b>Recommended columns</b><p><code>date, order_id, product, category, quantity, revenue, cost, customer, region</code></p><p>Minimum required: a header and a <code>revenue</code> or <code>sales</code> column. Missing cost values are treated as zero, so check your data before interpreting profit.</p></div><div className="modal-footer"><button className="btn-secondary" onClick={()=>{setTransactions(seedTransactions);setFileName("");setShowUpload(false);notify("Sample dataset restored.");}}>Restore demo data</button><button className="btn-primary" disabled={uploading} onClick={()=>fileRef.current?.click()}>{uploading?"Importing…":"Select file"} <ArrowRight size={14}/></button></div></div></div>}
  {showSimulator&&<div className="modal-backdrop" onClick={()=>setShowSimulator(false)}><div className="upload-modal simulator-modal" onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><div className="feature-icon gold"><Target/></div><h2>What-if simulator</h2><p>Explore a hypothetical price adjustment.</p></div><button className="icon-btn" onClick={()=>setShowSimulator(false)}><X size={17}/></button></div><div className="sim-number"><strong>{simPrice>0?"+":""}{simPrice}%</strong><label className="sim-manual-input"><span>New selling price (₹)</span><div><b>₹</b><input aria-label="Manually enter new selling price in rupees" type="number" min="0" step="1" value={Math.max(0,Math.round((totals.revenue/Math.max(totals.units,1))*(1+simPrice/100)))} onChange={e=>{const entered=Number(e.target.value);const base=totals.revenue/Math.max(totals.units,1);if(e.target.value!==""&&base>0)setSimPrice((entered/base-1)*100);}}/></div></label></div><input className="range-input" type="range" min={-20} max={20} value={Math.max(-20,Math.min(20,simPrice))} onChange={e=>setSimPrice(Number(e.target.value))}/><div className="range-labels"><span>-20%</span><span>0%</span><span>+20%</span></div><div className="sim-results"><div><small>Projected revenue*</small><b>{money(totals.revenue*(1+simPrice/100))}</b></div><div><small>Projected contribution*</small><b>{money(totals.revenue*(1+simPrice/100)-totals.costs)}</b></div></div><p className="disclaimer">*Assumes unit volume and costs remain unchanged. This is a simple scenario, not a demand forecast or guarantee.</p><button className="btn-primary full-button" onClick={()=>setShowSimulator(false)}>Done <Check size={15}/></button></div></div>}
  {notice&&<div className="toast"><Check size={16}/>{notice}</div>}<button className="floating-sim" onClick={()=>setShowSimulator(true)}><Target size={16}/> What-if simulator</button></main>;
}

function Kpi({title,value,delta,icon,color,caption}:{title:string;value:string;delta:string;icon:React.ReactNode;color:string;caption:string}) {
  return <article className="kpi-card"><div className="kpi-top"><span>{title}</span><i className={`kpi-icon ${color}`}>{icon}</i></div><div className="kpi-value">{value}</div><div className="kpi-bottom"><span className={delta==="Review"?"delta-neutral":"delta-positive"}>{delta==="Review"?<TrendingDown size={13}/>:<ArrowUpRight size={13}/>} {delta}</span><small>{caption}</small></div><div className={`kpi-spark ${color}`}><svg viewBox="0 0 100 26" preserveAspectRatio="none"><path d="M0 22 C12 18 12 23 24 14 S39 20 49 12 S65 17 76 7 S89 11 100 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div></article>;
}