import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLANS = {
  free: { name: "Free", price: 0, generations: 3, period: "day", color: "#6B7280" },
  pro: { name: "Pro", price: 999, generations: 100, period: "month", color: "#F59E0B" },
  elite: { name: "Elite", price: 1299, generations: 300, period: "month", color: "#8B5CF6" },
};

const CATEGORIES = [
  "Fashion & Clothing","Electronics","Home & Kitchen","Beauty & Personal Care",
  "Toys & Games","Sports & Fitness","Books & Stationery","Jewellery & Accessories",
  "Baby Products","Health & Wellness","Bags & Luggage","Footwear",
];

const TONES = [
  { id: "premium", label: "Premium", icon: "✦", desc: "Luxury & exclusive feel" },
  { id: "budget", label: "Value", icon: "₹", desc: "Affordable & savings-focused" },
  { id: "sales", label: "Sales-Driven", icon: "⚡", desc: "Urgency & conversion" },
  { id: "emotional", label: "Emotional", icon: "♥", desc: "Story & connection" },
];

const PLATFORMS = ["meesho", "amazon", "flipkart"];

const TRENDING_DATA = [
  { name: "Ethnic Kurta Sets", cat: "Fashion", demand: 92, competition: 78, profit: 65, season: "Year-round" },
  { name: "Wireless Earbuds", cat: "Electronics", demand: 88, competition: 85, profit: 55, season: "Year-round" },
  { name: "Brass Pooja Items", cat: "Home", demand: 76, competition: 45, profit: 72, season: "Festival" },
  { name: "Yoga Mats & Sets", cat: "Sports", demand: 81, competition: 60, profit: 68, season: "Jan–Mar" },
  { name: "Steel Water Bottles", cat: "Kitchen", demand: 85, competition: 70, profit: 58, season: "Summer" },
  { name: "Kurtis & Dupattas", cat: "Fashion", demand: 94, competition: 80, profit: 62, season: "Year-round" },
];

// ─── MOCK AUTH ─────────────────────────────────────────────────────────────────
const mockUser = {
  name: "Rahul Sharma", email: "rahul@example.com", plan: "elite",
  avatar: "RS", creditsUsed: 47, totalCredits: 300, joinDate: "Jan 2024",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function callClaude(messages, systemPrompt) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.error) throw new Error(d.error.message);
      return d.content?.map((c) => c.text || "").join("\n") || "";
    });
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch { return null; }
}

function ProgressBar({ value, max, color = "#8B5CF6", height = 6 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%", background: color,
        borderRadius: 99, transition: "width 0.6s ease",
      }} />
    </div>
  );
}

function Badge({ children, color = "#8B5CF6", bg }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
      padding: "3px 10px", borderRadius: 99,
      background: bg || `${color}22`, color,
      border: `1px solid ${color}33`,
    }}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 18, height: 18, border: "2px solid rgba(139,92,246,0.3)",
        borderTop: "2px solid #8B5CF6", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
        border: copied ? "1px solid #10B981" : "1px solid rgba(139,92,246,0.4)",
        background: copied ? "rgba(16,185,129,0.1)" : "rgba(139,92,246,0.1)",
        color: copied ? "#10B981" : "#8B5CF6", cursor: "pointer", transition: "all 0.2s",
      }}
    >
      {copied ? "✓ Copied!" : label}
    </button>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "◈", label: "Dashboard" },
  { id: "generator", icon: "✦", label: "AI Generator" },
  { id: "history", icon: "◷", label: "History" },
  { id: "competitor", icon: "◎", label: "Competitor AI" },
  { id: "trending", icon: "↑", label: "Trending Finder" },
  { id: "pricing-ai", icon: "₹", label: "Price AI" },
  { id: "adcopy", icon: "▶", label: "Ad Copy" },
  { id: "extension", icon: "⬡", label: "Chrome Extension" },
  { id: "plans", icon: "★", label: "Upgrade" },
];

function Sidebar({ active, setActive, user }) {
  return (
    <div style={{
      width: 220, minHeight: "100vh", background: "#0F0A1E",
      borderRight: "1px solid rgba(139,92,246,0.15)",
      display: "flex", flexDirection: "column", flexShrink: 0,
      fontFamily: "'Syne', 'Outfit', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#fff",
          }}>E</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>EcomAI</div>
            <div style={{ fontSize: 10, color: "#8B5CF6", fontWeight: 600, letterSpacing: "0.08em" }}>PRO ELITE</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflow: "auto" }}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, marginBottom: 2,
              background: active === item.id ? "rgba(139,92,246,0.18)" : "transparent",
              border: active === item.id ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
              color: active === item.id ? "#C4B5FD" : "rgba(255,255,255,0.5)",
              fontSize: 13, fontWeight: active === item.id ? 600 : 400,
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 15, opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>{user.avatar}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{user.name}</div>
            <div style={{ fontSize: 10, color: "#8B5CF6" }}>{PLANS[user.plan].name} Plan</div>
          </div>
        </div>
        <ProgressBar value={user.creditsUsed} max={user.totalCredits} />
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 5 }}>
          {user.creditsUsed} / {user.totalCredits} credits used
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, history, setActive }) {
  const stats = [
    { label: "Listings Generated", value: history.length + 47, color: "#8B5CF6" },
    { label: "Credits Remaining", value: user.totalCredits - user.creditsUsed, color: "#10B981" },
    { label: "Platforms Optimized", value: 3, color: "#F59E0B" },
    { label: "Avg. Quality Score", value: "94%", color: "#EC4899" },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 4, letterSpacing: "-0.03em" }}>
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
          Your AI-powered listing workspace · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.08))",
          border: "1px solid rgba(139,92,246,0.25)", borderRadius: 16, padding: 24,
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Generate New Listing</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 18, lineHeight: 1.6 }}>
            Upload your product image and let AI craft SEO-optimized listings for Meesho, Amazon & Flipkart in seconds.
          </p>
          <button onClick={() => setActive("generator")} style={{
            padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13,
            background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
            color: "#fff", border: "none", cursor: "pointer",
          }}>
            ✦ Start Generating →
          </button>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 14 }}>Plan Status</div>
          <Badge color="#8B5CF6">{PLANS[user.plan].name} Plan</Badge>
          <div style={{ marginTop: 14 }}>
            <ProgressBar value={user.creditsUsed} max={user.totalCredits} color="#8B5CF6" height={8} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              <span>{user.creditsUsed} used</span>
              <span>{user.totalCredits} total</span>
            </div>
          </div>
          <button onClick={() => setActive("plans")} style={{
            marginTop: 14, width: "100%", padding: "8px", borderRadius: 8,
            background: "transparent", border: "1px solid rgba(139,92,246,0.3)",
            color: "#8B5CF6", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>View Plans →</button>
        </div>
      </div>

      {/* Recent */}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 14 }}>Recent Listings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.slice(-3).reverse().map((h, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{h.productName || "Product Listing"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{h.category} · {h.timestamp}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {PLATFORMS.map((p) => <Badge key={p} color="#10B981">{p}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI GENERATOR ─────────────────────────────────────────────────────────────
function Generator({ user, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    productName: "", category: "", keywords: "", audience: "",
    priceMin: "", priceMax: "", tone: "sales", imageDesc: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [result, setResult] = useState(null);
  const [activePlatform, setActivePlatform] = useState("meesho");
  const [editMode, setEditMode] = useState(false);

  const loadMsgs = [
    "Analyzing your product details...",
    "Crafting SEO-optimized content...",
    "Generating platform variations...",
    "Polishing your listing...",
  ];

  const generate = async () => {
    if (!form.category || !form.keywords) return;
    setLoading(true);
    let mi = 0;
    setLoadMsg(loadMsgs[0]);
    const interval = setInterval(() => {
      mi = (mi + 1) % loadMsgs.length;
      setLoadMsg(loadMsgs[mi]);
    }, 1800);

    const prompt = `You are an expert Indian e-commerce listing specialist for Meesho, Amazon India, and Flipkart.

Generate a complete, SEO-optimized product listing based on:
- Product Name: ${form.productName || "Not specified"}
- Category: ${form.category}
- Keywords: ${form.keywords}
- Target Audience: ${form.audience || "General shoppers"}
- Price Range: ₹${form.priceMin || "100"} - ₹${form.priceMax || "1000"}
- Tone: ${form.tone}
- Product Description: ${form.imageDesc || "Standard product"}

Return ONLY valid JSON with this exact structure:
{
  "meesho": {
    "title": "...",
    "description": "...",
    "bullets": ["...","...","...","...","..."],
    "keywords": ["...","...","...","...","...","...","...","..."],
    "tags": ["...","...","...","...","..."],
    "hashtags": ["#...", "#...", "#...", "#...", "#..."]
  },
  "amazon": {
    "title": "...",
    "description": "...",
    "bullets": ["...","...","...","...","..."],
    "keywords": ["...","...","...","...","...","...","...","..."],
    "tags": ["...","...","...","...","..."],
    "hashtags": ["#...", "#...", "#...", "#...", "#..."]
  },
  "flipkart": {
    "title": "...",
    "description": "...",
    "bullets": ["...","...","...","...","..."],
    "keywords": ["...","...","...","...","...","...","...","..."],
    "tags": ["...","...","...","...","..."],
    "hashtags": ["#...", "#...", "#...", "#...", "#..."]
  }
}

Meesho: simple, keyword-rich, emotional. Amazon: structured, SEO-heavy, feature bullets starting with caps. Flipkart: clean, benefit-focused, concise.`;

    try {
      const raw = await callClaude([{ role: "user", content: prompt }],
        "You are a JSON-only responder. Return valid JSON only. No markdown, no explanation.");
      const parsed = parseJSON(raw);
      if (parsed) {
        setResult({ ...parsed, form: { ...form }, timestamp: new Date().toLocaleString("en-IN") });
        setStep(3);
      }
    } catch (e) {
      setResult({ error: e.message });
    }
    clearInterval(interval);
    setLoading(false);
  };

  const handleSave = () => {
    if (result) {
      onSave({ ...result, productName: form.productName || form.keywords, category: form.category });
    }
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", marginBottom: 6, display: "block" };

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>
          ✦ AI Product Listing Generator
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Generate SEO-optimized listings for all major Indian platforms
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28 }}>
        {["Product Details", "AI Generation", "Review & Export"].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 16px", borderRadius: 8,
              background: step === i + 1 ? "rgba(139,92,246,0.2)" : "transparent",
              border: step === i + 1 ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: step > i + 1 ? "#10B981" : step === i + 1 ? "#8B5CF6" : "rgba(255,255,255,0.1)",
                color: "#fff",
              }}>{step > i + 1 ? "✓" : i + 1}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: step === i + 1 ? "#C4B5FD" : "rgba(255,255,255,0.35)" }}>{s}</span>
            </div>
            {i < 2 && <div style={{ width: 24, height: 1, background: "rgba(255,255,255,0.1)" }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Form */}
      {step === 1 && (
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 28,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>PRODUCT NAME</label>
              <input style={inputStyle} value={form.productName} onChange={(e) => update("productName", e.target.value)} placeholder="e.g. Floral Cotton Kurti" />
            </div>
            <div>
              <label style={labelStyle}>CATEGORY *</label>
              <select style={inputStyle} value={form.category} onChange={(e) => update("category", e.target.value)}>
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>KEYWORDS * (comma-separated)</label>
            <input style={inputStyle} value={form.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="e.g. cotton kurti, women ethnic wear, floral print kurti" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>TARGET AUDIENCE</label>
              <input style={inputStyle} value={form.audience} onChange={(e) => update("audience", e.target.value)} placeholder="e.g. Women 25-45" />
            </div>
            <div>
              <label style={labelStyle}>MIN PRICE (₹)</label>
              <input style={inputStyle} type="number" value={form.priceMin} onChange={(e) => update("priceMin", e.target.value)} placeholder="499" />
            </div>
            <div>
              <label style={labelStyle}>MAX PRICE (₹)</label>
              <input style={inputStyle} type="number" value={form.priceMax} onChange={(e) => update("priceMax", e.target.value)} placeholder="1299" />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>PRODUCT DESCRIPTION / IMAGE DETAILS</label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
              value={form.imageDesc} onChange={(e) => update("imageDesc", e.target.value)}
              placeholder="Describe your product: color, material, size, features, unique selling points..." />
          </div>

          {/* Tone */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>TONE & STYLE</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {TONES.map((t) => (
                <button key={t.id} onClick={() => update("tone", t.id)} style={{
                  padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                  background: form.tone === t.id ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
                  border: form.tone === t.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: form.tone === t.id ? "#C4B5FD" : "rgba(255,255,255,0.6)" }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={!form.category || !form.keywords} style={{
            padding: "12px 32px", borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: !form.category || !form.keywords ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8B5CF6, #EC4899)",
            color: "#fff", border: "none", cursor: !form.category || !form.keywords ? "not-allowed" : "pointer",
          }}>
            Continue to Generate →
          </button>
        </div>
      )}

      {/* Step 2: Loading */}
      {step === 2 && (
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 48, textAlign: "center",
        }}>
          {!loading && !result?.error ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Ready to Generate</div>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
                AI will create optimized listings for Meesho, Amazon, and Flipkart simultaneously.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={() => setStep(1)} style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.6)", cursor: "pointer",
                }}>← Edit Details</button>
                <button onClick={generate} style={{
                  padding: "10px 28px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                  color: "#fff", border: "none", cursor: "pointer",
                }}>✦ Generate with AI</button>
              </div>
            </>
          ) : loading ? (
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  border: "3px solid rgba(139,92,246,0.2)",
                  borderTop: "3px solid #8B5CF6",
                  animation: "spin 1s linear infinite",
                }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Generating Your Listing...</div>
              <div style={{ fontSize: 13, color: "#8B5CF6" }}>{loadMsg}</div>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 6 }}>
                {PLATFORMS.map((p) => (
                  <div key={p} style={{
                    padding: "4px 12px", borderRadius: 99,
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                    fontSize: 11, color: "#8B5CF6", fontWeight: 600,
                  }}>{p}</div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ color: "#EF4444", fontSize: 14 }}>Error: {result?.error}</div>
              <button onClick={() => setStep(1)} style={{ marginTop: 12, color: "#8B5CF6", background: "transparent", border: "none", cursor: "pointer" }}>← Try Again</button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && !result.error && (
        <div>
          {/* Platform Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {PLATFORMS.map((p) => (
              <button key={p} onClick={() => setActivePlatform(p)} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: activePlatform === p ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
                border: activePlatform === p ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: activePlatform === p ? "#C4B5FD" : "rgba(255,255,255,0.5)",
                textTransform: "capitalize",
              }}>
                {p === "meesho" ? "🛍" : p === "amazon" ? "📦" : "🔶"} {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => setEditMode(!editMode)} style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: editMode ? "rgba(245,158,11,0.15)" : "transparent",
              border: `1px solid ${editMode ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: editMode ? "#F59E0B" : "rgba(255,255,255,0.5)",
            }}>{editMode ? "✓ Done Editing" : "✎ Edit"}</button>
            <button onClick={handleSave} style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
              color: "#10B981",
            }}>💾 Save</button>
          </div>

          {result[activePlatform] && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Title */}
              <ResultSection label="SEO TITLE" content={result[activePlatform].title} editMode={editMode}
                onEdit={(v) => setResult((r) => ({ ...r, [activePlatform]: { ...r[activePlatform], title: v } }))} />

              {/* Description */}
              <ResultSection label="DESCRIPTION" content={result[activePlatform].description} editMode={editMode} multiline
                onEdit={(v) => setResult((r) => ({ ...r, [activePlatform]: { ...r[activePlatform], description: v } }))} />

              {/* Bullets */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>KEY BULLET POINTS</span>
                  <CopyBtn text={result[activePlatform].bullets?.join("\n• ")} label="Copy All" />
                </div>
                {result[activePlatform].bullets?.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ color: "#8B5CF6", fontSize: 16, marginTop: 1, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>

              {/* Keywords, Tags, Hashtags */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[["KEYWORDS", result[activePlatform].keywords], ["TAGS", result[activePlatform].tags], ["HASHTAGS", result[activePlatform].hashtags]].map(([label, items]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>{label}</span>
                      <CopyBtn text={items?.join(", ")} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {items?.map((k, i) => <Badge key={i} color="#8B5CF6">{k}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Export */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => {
                  const p = result[activePlatform];
                  const txt = `TITLE:\n${p.title}\n\nDESCRIPTION:\n${p.description}\n\nBULLETS:\n• ${p.bullets?.join("\n• ")}\n\nKEYWORDS: ${p.keywords?.join(", ")}\n\nTAGS: ${p.tags?.join(", ")}\n\nHASHTAGS: ${p.hashtags?.join(" ")}`;
                  navigator.clipboard?.writeText(txt);
                }} style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                  color: "#8B5CF6", cursor: "pointer",
                }}>📋 Copy Full Listing</button>
                <button onClick={() => {
                  const json = JSON.stringify(result[activePlatform], null, 2);
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `listing-${activePlatform}.json`; a.click();
                }} style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                  color: "#10B981", cursor: "pointer",
                }}>↓ Export JSON</button>
                <button onClick={() => { setStep(1); setResult(null); setForm({ productName: "", category: "", keywords: "", audience: "", priceMin: "", priceMax: "", tone: "sales", imageDesc: "" }); }} style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)", cursor: "pointer",
                }}>+ New Listing</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ label, content, editMode, onEdit, multiline }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>{label}</span>
        <CopyBtn text={content} />
      </div>
      {editMode ? (
        multiline
          ? <textarea value={content} onChange={(e) => onEdit(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#fff", fontSize: 13, padding: "10px 12px", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
          : <input value={content} onChange={(e) => onEdit(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#fff", fontSize: 13, padding: "10px 12px", boxSizing: "border-box" }} />
      ) : (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>{content}</p>
      )}
    </div>
  );
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────
function History({ history }) {
  const [selected, setSelected] = useState(null);
  const [activePlatform, setActivePlatform] = useState("meesho");

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>◷ Listing History</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>All your generated listings saved here</p>

      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◷</div>
          <div>No listings yet. Generate your first one!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h, i) => (
              <button key={i} onClick={() => { setSelected(h); setActivePlatform("meesho"); }} style={{
                textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                background: selected === h ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
                border: selected === h ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{h.productName || "Product"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{h.category} · {h.timestamp}</div>
              </button>
            ))}
          </div>

          {selected ? (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => setActivePlatform(p)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: activePlatform === p ? "rgba(139,92,246,0.2)" : "transparent",
                    border: activePlatform === p ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    color: activePlatform === p ? "#C4B5FD" : "rgba(255,255,255,0.4)", textTransform: "capitalize",
                  }}>{p}</button>
                ))}
              </div>
              {selected[activePlatform] && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#C4B5FD", marginBottom: 6 }}>Title</div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 14 }}>{selected[activePlatform].title}</p>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#C4B5FD", marginBottom: 6 }}>Description</div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 14 }}>{selected[activePlatform].description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected[activePlatform].keywords?.map((k, i) => <Badge key={i} color="#8B5CF6">{k}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
              ← Select a listing to preview
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COMPETITOR ANALYSIS ──────────────────────────────────────────────────────
function CompetitorAI() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const raw = await callClaude([{ role: "user", content: `Analyze Indian e-commerce market patterns for the product keyword: "${keyword}". Based on your training knowledge of Indian marketplaces (Meesho, Amazon India, Flipkart), provide insights in JSON format:
{
  "titlePatterns": ["pattern 1", "pattern 2", "pattern 3"],
  "keywordSuggestions": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8"],
  "titleStructure": "Describe the ideal title structure",
  "contentGaps": ["gap 1", "gap 2", "gap 3"],
  "pricingTrend": "High/Medium/Low competition pricing notes",
  "marketInsight": "2-3 sentence market insight",
  "seasonality": "Seasonality notes",
  "quickWins": ["win 1", "win 2", "win 3"]
}` }],
        "Return only valid JSON, no markdown.");
      const parsed = parseJSON(raw);
      setResult(parsed || { error: "Could not parse response" });
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>◎ Competitor AI Analysis</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        AI-powered market insights based on trained patterns. No web scraping.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="Enter product keyword (e.g. cotton kurti, wireless earbuds)"
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 10, fontSize: 13,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", outline: "none",
          }} />
        <button onClick={analyze} disabled={loading || !keyword.trim()} style={{
          padding: "12px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
          color: "#fff", border: "none", cursor: "pointer",
        }}>
          {loading ? "Analyzing..." : "◎ Analyze"}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spinner />
          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Analyzing market patterns...</div>
        </div>
      )}

      {result && !result.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8B5CF6", letterSpacing: "0.06em", marginBottom: 8 }}>MARKET INSIGHT</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>{result.marketInsight}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InfoCard title="TITLE PATTERNS" items={result.titlePatterns} color="#8B5CF6" />
            <InfoCard title="KEYWORD SUGGESTIONS" items={result.keywordSuggestions} color="#10B981" badge />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InfoCard title="CONTENT GAPS TO FILL" items={result.contentGaps} color="#F59E0B" />
            <InfoCard title="QUICK WINS" items={result.quickWins} color="#EC4899" />
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 8 }}>TITLE STRUCTURE RECOMMENDATION</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>{result.titleStructure}</p>
            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Seasonality: {result.seasonality}</div>
          </div>
        </div>
      )}
      {result?.error && <div style={{ color: "#EF4444", fontSize: 13 }}>Error: {result.error}</div>}
    </div>
  );
}

function InfoCard({ title, items, color, badge }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items?.map((item, i) => badge ? (
          <Badge key={i} color={color}>{item}</Badge>
        ) : (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", width: "100%", marginBottom: 4 }}>
            <span style={{ color, fontSize: 14, flexShrink: 0 }}>→</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TRENDING ─────────────────────────────────────────────────────────────────
function TrendingFinder() {
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showDefault, setShowDefault] = useState(true);

  const search = async () => {
    setLoading(true);
    setShowDefault(false);
    try {
      const raw = await callClaude([{ role: "user", content: `Based on Indian e-commerce market knowledge (Meesho, Amazon India, Flipkart, seasonal trends, Indian consumer behavior), suggest trending products for: ${category || "all categories"}.

Return JSON:
{
  "trending": [
    {
      "name": "Product name",
      "category": "Category",
      "demand": 85,
      "competition": 60,
      "profit": 70,
      "season": "When it sells best",
      "reason": "Why it's trending",
      "priceRange": "₹xxx - ₹xxx",
      "platforms": ["meesho", "amazon", "flipkart"]
    }
  ]
}
Include 6 products. Demand/competition/profit are 0-100 scores.` }],
        "Return valid JSON only.");
      const parsed = parseJSON(raw);
      setResults(parsed?.trending || TRENDING_DATA);
    } catch { setResults(TRENDING_DATA); }
    setLoading(false);
  };

  const data = showDefault ? TRENDING_DATA : results;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>↑ Trending Product Finder</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Discover high-demand products based on Indian market behavior</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{
          flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", outline: "none",
        }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={search} disabled={loading} style={{
          padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
          color: "#fff", border: "none", cursor: "pointer",
        }}>{loading ? "Finding..." : "↑ Find Trends"}</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 32 }}><Spinner /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {(data || TRENDING_DATA).map((item, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: 18,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{item.name}</div>
                  <Badge color="#8B5CF6">{item.category}</Badge>
                </div>
                <Badge color="#10B981" bg="rgba(16,185,129,0.1)">{item.season}</Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Demand", value: item.demand, color: "#10B981" },
                  { label: "Competition", value: item.competition, color: "#F59E0B" },
                  { label: "Profit Potential", value: item.profit, color: "#8B5CF6" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
                      <span style={{ color, fontWeight: 700 }}>{value}%</span>
                    </div>
                    <ProgressBar value={value} max={100} color={color} height={4} />
                  </div>
                ))}
              </div>

              {item.reason && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 10, lineHeight: 1.5 }}>{item.reason}</p>
              )}
              {item.priceRange && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#F59E0B" }}>{item.priceRange}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRICE AI ─────────────────────────────────────────────────────────────────
function PriceAI() {
  const [form, setForm] = useState({ product: "", category: "", cost: "", positioning: "mid" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const raw = await callClaude([{ role: "user", content: `Provide price strategy for Indian e-commerce:
Product: ${form.product}
Category: ${form.category}
Cost/Purchase Price: ₹${form.cost || "unknown"}
Positioning: ${form.positioning}

Return JSON:
{
  "suggestedPrices": [{"label": "...", "price": 999, "reason": "..."}],
  "psychologicalPricing": {"recommended": 999, "explanation": "..."},
  "discountStrategy": {"originalMRP": 1499, "salePrice": 999, "discount": "33%", "tip": "..."},
  "competitiveInsight": "...",
  "profitEstimate": {"marginPercent": 40, "note": "..."},
  "platformTips": {"meesho": "...", "amazon": "...", "flipkart": "..."}
}` }],
        "Return valid JSON only.");
      setResult(parseJSON(raw));
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>₹ Price Suggestion AI</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Optimal pricing strategy with psychological pricing tricks</p>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { key: "product", label: "PRODUCT NAME", placeholder: "e.g. Silk Saree" },
            { key: "cost", label: "YOUR COST PRICE (₹)", placeholder: "e.g. 350" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>{label}</label>
              <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>CATEGORY</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }}>
              <option value="">Select...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>POSITIONING</label>
            <select value={form.positioning} onChange={(e) => setForm((f) => ({ ...f, positioning: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }}>
              <option value="budget">Budget / Value</option>
              <option value="mid">Mid-range</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
        <button onClick={analyze} disabled={loading} style={{ marginTop: 18, padding: "11px 28px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, #8B5CF6, #EC4899)", color: "#fff", border: "none", cursor: "pointer" }}>
          {loading ? "Analyzing..." : "₹ Get Price Suggestions"}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 24 }}><Spinner /></div>}

      {result && !result.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Suggested prices */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 14 }}>PRICE OPTIONS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {result.suggestedPrices?.map((p, i) => (
                <div key={i} style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#C4B5FD" }}>₹{p.price}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6, lineHeight: 1.5 }}>{p.reason}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Psychological */}
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.06em", marginBottom: 10 }}>PSYCHOLOGICAL PRICING</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#F59E0B" }}>₹{result.psychologicalPricing?.recommended}</div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, lineHeight: 1.6 }}>{result.psychologicalPricing?.explanation}</p>
            </div>

            {/* Discount */}
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.06em", marginBottom: 10 }}>DISCOUNT STRATEGY</div>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "line-through" }}>MRP ₹{result.discountStrategy?.originalMRP}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#10B981" }}>₹{result.discountStrategy?.salePrice}</div>
                </div>
                <Badge color="#10B981">{result.discountStrategy?.discount} OFF</Badge>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8, lineHeight: 1.5 }}>{result.discountStrategy?.tip}</p>
            </div>
          </div>

          {/* Platform tips */}
          {result.platformTips && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 12 }}>PLATFORM-SPECIFIC TIPS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(result.platformTips).map(([platform, tip]) => (
                  <div key={platform} style={{ display: "flex", gap: 10 }}>
                    <Badge color="#8B5CF6">{platform}</Badge>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AD COPY ──────────────────────────────────────────────────────────────────
function AdCopy() {
  const [form, setForm] = useState({ product: "", platform: "instagram", audience: "", usp: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const raw = await callClaude([{ role: "user", content: `Create ad copy for Indian market:
Product: ${form.product}
Platform: ${form.platform}
Target Audience: ${form.audience || "General Indian shoppers"}
USP: ${form.usp || "Quality and value"}

Return JSON:
{
  "headlines": ["h1", "h2", "h3"],
  "hooks": ["hook1", "hook2", "hook3"],
  "primaryText": "Main ad copy paragraph",
  "cta": ["CTA 1", "CTA 2", "CTA 3"],
  "shortAd": "Short version (for Stories/Reels)",
  "hashtagSet": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8"]
}` }],
        "Return valid JSON only.");
      setResult(parseJSON(raw));
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  const platforms = ["instagram", "facebook", "google", "youtube"];

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>▶ Ad Copy Generator</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Create high-converting ads for all major platforms</p>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>PLATFORM</label>
          <div style={{ display: "flex", gap: 8 }}>
            {platforms.map((p) => (
              <button key={p} onClick={() => setForm((f) => ({ ...f, platform: p }))} style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                background: form.platform === p ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                border: form.platform === p ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: form.platform === p ? "#C4B5FD" : "rgba(255,255,255,0.5)",
              }}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { key: "product", label: "PRODUCT / OFFER", placeholder: "e.g. Buy 2 Get 1 Free on Kurtis" },
            { key: "audience", label: "TARGET AUDIENCE", placeholder: "e.g. Women 20-40, fashion lovers" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>{label}</label>
              <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>UNIQUE SELLING POINT</label>
            <input value={form.usp} onChange={(e) => setForm((f) => ({ ...f, usp: e.target.value }))} placeholder="e.g. Fastest delivery, best quality, lowest price" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <button onClick={generate} disabled={loading || !form.product} style={{ marginTop: 18, padding: "11px 28px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, #8B5CF6, #EC4899)", color: "#fff", border: "none", cursor: "pointer" }}>
          {loading ? "Generating..." : "▶ Generate Ad Copy"}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 24 }}><Spinner /></div>}

      {result && !result.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Headlines */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>HEADLINES</span>
              <CopyBtn text={result.headlines?.join("\n")} label="Copy All" />
            </div>
            {result.headlines?.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < result.headlines.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{h}</span>
                <CopyBtn text={h} />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 10 }}>HOOKS (ATTENTION GRABBERS)</div>
              {result.hooks?.map((h, i) => (
                <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 8, padding: "6px 10px", background: "rgba(139,92,246,0.08)", borderRadius: 8, borderLeft: "3px solid #8B5CF6" }}>{h}</div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 10 }}>CALL TO ACTION</div>
              {result.cta?.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>{c}</span>
                  <CopyBtn text={c} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>PRIMARY AD TEXT</span>
              <CopyBtn text={result.primaryText} />
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>{result.primaryText}</p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {result.hashtagSet?.map((t, i) => <Badge key={i} color="#EC4899">{t}</Badge>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHROME EXTENSION ─────────────────────────────────────────────────────────
function ExtensionPage() {
  return (
    <div style={{ padding: 32, maxWidth: 700 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>⬡ Chrome Extension Support</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>User-triggered autofill for seller panels. No background automation.</p>

      <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>Safe & Compliant by Design</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>
          Our extension only acts when you click the "Fill" button. No background processes, no automated actions, no policy violations. Fully compliant with Meesho, Amazon, and Flipkart seller policies.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        {[
          { step: "1", title: "Generate your listing in EcomAI Pro", desc: "Use the AI Generator to create optimized content for your product." },
          { step: "2", title: "Open your seller panel", desc: "Navigate to Meesho Supplier Hub, Amazon Seller Central, or Flipkart Seller Hub." },
          { step: "3", title: "Click the EcomAI Extension icon", desc: "The extension icon will appear in your Chrome toolbar." },
          { step: "4", title: "Select listing and click Fill", desc: "Choose the listing to autofill and click the Fill button. Content is pasted only where you click." },
        ].map((s) => (
          <div key={s.step} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#8B5CF6", flexShrink: 0 }}>{s.step}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Extension Manifest (manifest.json)</div>
        <pre style={{ fontSize: 11, color: "#10B981", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 14, overflow: "auto", margin: 0 }}>{`{
  "manifest_version": 3,
  "name": "EcomAI Pro Elite Autofill",
  "version": "1.0",
  "description": "User-triggered listing autofill",
  "permissions": ["activeTab", "storage"],
  "action": { "default_popup": "popup.html" },
  "content_scripts": [{
    "matches": [
      "*://*.meesho.com/*",
      "*://*.amazon.in/*",
      "*://*.flipkart.com/*"
    ],
    "js": ["content.js"],
    "run_at": "document_idle"
  }]
}`}</pre>
      </div>

      <button style={{
        padding: "12px 28px", borderRadius: 10, fontSize: 13, fontWeight: 700,
        background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
        color: "#fff", border: "none", cursor: "pointer",
      }}>↓ Download Extension Files</button>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>Extension files include popup.html, content.js, background.js, and manifest.json</div>
    </div>
  );
}

// ─── PLANS ────────────────────────────────────────────────────────────────────
function Plans({ currentPlan }) {
  const planDetails = [
    {
      id: "free", name: "Free", price: "₹0", period: "/month", color: "#6B7280",
      features: ["3 listings/day", "All 3 platforms", "Basic AI generation", "Copy & export", "History (7 days)"],
      cta: "Current Plan",
    },
    {
      id: "pro", name: "Pro", price: "₹999", period: "/month", color: "#F59E0B",
      features: ["100 listings/month", "All 3 platforms", "Competitor AI analysis", "Trending Finder", "Price AI", "Ad Copy Generator", "Unlimited history", "Priority support"],
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      id: "elite", name: "Elite", price: "₹1,299", period: "/month", color: "#8B5CF6",
      features: ["300 listings/month", "Everything in Pro", "Chrome extension", "Advanced AI tools", "Bulk generation", "API access", "White-label export", "Dedicated support"],
      cta: "Upgrade to Elite",
    },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8 }}>Choose Your Plan</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>Scale your e-commerce business with AI-powered listings</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
        {planDetails.map((plan) => (
          <div key={plan.id} style={{
            background: currentPlan === plan.id ? `rgba(${plan.id === "elite" ? "139,92,246" : plan.id === "pro" ? "245,158,11" : "107,114,128"},0.12)` : "rgba(255,255,255,0.03)",
            border: `1px solid ${currentPlan === plan.id || plan.popular ? plan.color + "44" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 16, padding: 24, position: "relative",
            transform: plan.popular ? "scale(1.03)" : "scale(1)",
          }}>
            {plan.popular && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 99 }}>
                MOST POPULAR
              </div>
            )}
            {currentPlan === plan.id && (
              <div style={{ position: "absolute", top: -12, right: 16, background: "#10B981", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>
                CURRENT
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: "#fff" }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{plan.period}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {plan.features.map((f) => (
                <div key={f} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: plan.color, fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{f}</span>
                </div>
              ))}
            </div>

            <button style={{
              width: "100%", padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: currentPlan === plan.id ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
              color: currentPlan === plan.id ? "rgba(255,255,255,0.4)" : "#fff",
              border: "none", cursor: currentPlan === plan.id ? "default" : "pointer",
            }}>
              {plan.cta}
            </button>

            {plan.id !== "free" && (
              <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
                Billed via Razorpay · Cancel anytime
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [history, setHistory] = useState([]);
  const [user] = useState(mockUser);
  const [darkMode] = useState(true);

  const handleSave = (listing) => {
    setHistory((h) => [...h, listing]);
  };

  const renderPage = () => {
    switch (active) {
      case "dashboard": return <Dashboard user={user} history={history} setActive={setActive} />;
      case "generator": return <Generator user={user} onSave={handleSave} />;
      case "history": return <History history={history} />;
      case "competitor": return <CompetitorAI />;
      case "trending": return <TrendingFinder />;
      case "pricing-ai": return <PriceAI />;
      case "adcopy": return <AdCopy />;
      case "extension": return <ExtensionPage />;
      case "plans": return <Plans currentPlan={user.plan} />;
      default: return <Dashboard user={user} history={history} setActive={setActive} />;
    }
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#080613",
      fontFamily: "'Outfit', 'Syne', system-ui, sans-serif",
      color: "#fff",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 99px; }
        select option { background: #1a1040; color: #fff; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      <Sidebar active={active} setActive={setActive} user={user} />

      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        {renderPage()}
      </main>
    </div>
  );
}
