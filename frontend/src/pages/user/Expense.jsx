

import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8081/Expenses";

const CATEGORIES = [
  "Food & Dining","Transport","Shopping","Entertainment",
  "Health","Utilities","Education","Travel","Other"
];

const CAT_COLORS = {
  "Food & Dining" : { bg:"#FFF0E6", text:"#C0521A", icon:"🍽️" },
  "Transport"     : { bg:"#E6F0FF", text:"#1A4FC0", icon:"🚗" },
  "Shopping"      : { bg:"#FFF0FA", text:"#C01A8A", icon:"🛍️" },
  "Entertainment" : { bg:"#F5E6FF", text:"#7A1AC0", icon:"🎬" },
  "Health"        : { bg:"#E6FFF4", text:"#1AC070", icon:"💊" },
  "Utilities"     : { bg:"#E6FAFF", text:"#1AA8C0", icon:"💡" },
  "Education"     : { bg:"#FFFBE6", text:"#C09A1A", icon:"📚" },
  "Travel"        : { bg:"#E6FFF9", text:"#1AC0A0", icon:"✈️" },
  "Other"         : { bg:"#F4F4F4", text:"#666666", icon:"📌" },
};

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" }).format(n ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

// ── Toast (inline, no extra lib) ──────────────────────────────
let _setToasts;
function Toast({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#FF4444" : "#1DB85C",
          color:"#fff", padding:"12px 20px", borderRadius:12, fontSize:14,
          fontWeight:500, boxShadow:"0 4px 24px rgba(0,0,0,0.15)",
          animation:"slideIn .25s ease"
        }}>{t.msg}</div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;
  const toast = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, toast };
}

// ── Modal ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(10,10,20,.55)",
      backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
      justifyContent:"center", zIndex:1000, padding:20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:24, width:"100%", maxWidth:520,
        boxShadow:"0 32px 80px rgba(0,0,0,.25)", overflow:"hidden"
      }}>
        <div style={{
          padding:"24px 28px 20px", borderBottom:"1px solid #F0F0F0",
          display:"flex", justifyContent:"space-between", alignItems:"center"
        }}>
          <span style={{ fontWeight:700, fontSize:18, color:"#0A0A14" }}>{title}</span>
          <button onClick={onClose} style={{
            border:"none", background:"#F5F5F5", borderRadius:10,
            width:34, height:34, cursor:"pointer", fontSize:18, color:"#666"
          }}>✕</button>
        </div>
        <div style={{ padding:"24px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Expense Form ───────────────────────────────────────────────
function ExpenseForm({ initial, onSave, onClose }) {
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({
    title: "", amount: "", category: "Food & Dining",
    description: "", date: today, ...initial
  });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title || !form.amount || !form.date) return;
    setLoading(true);
    try {
      const method = initial?.id ? "PUT" : "POST";
      const url    = initial?.id ? `${API_BASE}/expenses/${initial.id}` : `${API_BASE}/expenses`;
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) { onSave(data.data); onClose(); }
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width:"100%", padding:"11px 14px", borderRadius:12,
    border:"1.5px solid #E8E8EE", fontSize:14, outline:"none",
    transition:"border-color .2s", boxSizing:"border-box", fontFamily:"inherit"
  };
  const label = { fontSize:13, fontWeight:600, color:"#444", marginBottom:6, display:"block" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <span style={label}>Title</span>
        <input style={inputStyle} placeholder="e.g. Grocery run" value={form.title} onChange={set("title")} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div>
          <span style={label}>Amount ($)</span>
          <input style={inputStyle} type="number" step="0.01" placeholder="0.00"
            value={form.amount} onChange={set("amount")} />
        </div>
        <div>
          <span style={label}>Date</span>
          <input style={inputStyle} type="date" value={form.date} onChange={set("date")} />
        </div>
      </div>
      <div>
        <span style={label}>Category</span>
        <select style={inputStyle} value={form.category} onChange={set("category")}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <span style={label}>Description (optional)</span>
        <textarea style={{ ...inputStyle, resize:"vertical", minHeight:72 }}
          placeholder="Add a note…" value={form.description} onChange={set("description")} />
      </div>
      <div style={{ display:"flex", gap:12, marginTop:4 }}>
        <button onClick={onClose} style={{
          flex:1, padding:"12px 0", borderRadius:12, border:"1.5px solid #E8E8EE",
          background:"transparent", cursor:"pointer", fontWeight:600, fontSize:14, color:"#666"
        }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{
          flex:2, padding:"12px 0", borderRadius:12, border:"none",
          background: loading ? "#ccc" : "linear-gradient(135deg,#6C63FF,#A78BFA)",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight:700, fontSize:14, color:"#fff", letterSpacing:.3
        }}>{loading ? "Saving…" : initial?.id ? "Update Expense" : "Add Expense"}</button>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, accent, icon }) {
  return (
    <div style={{
      background:"#fff", borderRadius:20, padding:"22px 24px",
      border:"1.5px solid #F0F0F5", display:"flex", alignItems:"center", gap:16
    }}>
      <div style={{
        width:52, height:52, borderRadius:14, background:accent+"18",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:24
      }}>{icon}</div>
      <div>
        <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#999", textTransform:"uppercase", letterSpacing:.8 }}>{label}</p>
        <p style={{ margin:"4px 0 0", fontSize:22, fontWeight:800, color:"#0A0A14" }}>{value}</p>
      </div>
    </div>
  );
}

// ── Category Bar ───────────────────────────────────────────────
function CategoryBar({ byCategory }) {
  if (!byCategory?.length) return null;
  const max = Math.max(...byCategory.map(c => c.total));
  return (
    <div style={{ background:"#fff", borderRadius:20, padding:"24px 28px", border:"1.5px solid #F0F0F5" }}>
      <h3 style={{ margin:"0 0 20px", fontSize:15, fontWeight:700, color:"#0A0A14" }}>Spending by Category</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {byCategory.map(c => {
          const col = CAT_COLORS[c.category] || CAT_COLORS.Other;
          return (
            <div key={c.category}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"#333" }}>{col.icon} {c.category}</span>
                <span style={{ fontSize:13, fontWeight:700, color:col.text }}>{fmt(c.total)}</span>
              </div>
              <div style={{ height:8, background:"#F5F5F8", borderRadius:99, overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:99,
                  width: `${(c.total / max) * 100}%`,
                  background: `linear-gradient(90deg, ${col.text}88, ${col.text})`,
                  transition:"width .6s ease"
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Expense Row ────────────────────────────────────────────────
function ExpenseRow({ exp, onEdit, onDelete }) {
  const col = CAT_COLORS[exp.category] || CAT_COLORS.Other;
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"auto 1fr auto auto",
      alignItems:"center", gap:16, padding:"16px 24px",
      borderBottom:"1px solid #F5F5F8", transition:"background .15s"
    }}
      onMouseEnter={e => e.currentTarget.style.background="#FAFAFE"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}
    >
      <div style={{
        width:44, height:44, borderRadius:13, background:col.bg,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0
      }}>{col.icon}</div>

      <div style={{ minWidth:0 }}>
        <p style={{ margin:0, fontWeight:700, fontSize:15, color:"#0A0A14", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {exp.title}
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
          <span style={{
            fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99,
            background:col.bg, color:col.text, letterSpacing:.3
          }}>{exp.category}</span>
          <span style={{ fontSize:12, color:"#AAA" }}>{fmtDate(exp.date)}</span>
        </div>
      </div>

      <span style={{ fontWeight:800, fontSize:17, color:"#0A0A14", whiteSpace:"nowrap" }}>
        {fmt(exp.amount)}
      </span>

      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => onEdit(exp)} style={{
          border:"1.5px solid #E8E8EE", background:"transparent",
          borderRadius:10, width:34, height:34, cursor:"pointer", fontSize:15
        }} title="Edit">✏️</button>
        <button onClick={() => onDelete(exp.id)} style={{
          border:"1.5px solid #FFD0D0", background:"transparent",
          borderRadius:10, width:34, height:34, cursor:"pointer", fontSize:15
        }} title="Delete">🗑️</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function Expenses() {
  const { toasts, toast } = useToast();
  const [expenses, setExpenses]     = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | "add" | expense obj
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [tab, setTab]               = useState("list"); // "list" | "overview"

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)    params.set("search", search);
      if (filterCat) params.set("category", filterCat);
      const res  = await fetch(`${API_BASE}/expenses?${params}`);
      const data = await res.json();
      if (data.success) setExpenses(data.data);
    } finally { setLoading(false); }
  }, [search, filterCat]);

  const fetchSummary = useCallback(async () => {
    const res  = await fetch(`${API_BASE}/expenses/summary`);
    const data = await res.json();
    if (data.success) setSummary(data.data);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleSave = (saved) => {
    fetchExpenses();
    fetchSummary();
    toast(modal?.id ? "Expense updated!" : "Expense added!");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await fetch(`${API_BASE}/expenses/${id}`, { method:"DELETE" });
    fetchExpenses();
    fetchSummary();
    toast("Deleted.", "success");
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; background:#F6F6FB; font-family:'Plus Jakarta Sans',sans-serif; }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-thumb { background:#DDD; border-radius:99px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background:"#fff", borderBottom:"1px solid #EEEEEE",
        padding:"0 32px", position:"sticky", top:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between", height:68
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:38, height:38, background:"linear-gradient(135deg,#6C63FF,#A78BFA)",
            borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20
          }}>💸</div>
          <span style={{ fontWeight:800, fontSize:20, color:"#0A0A14", letterSpacing:-.4 }}>SpendWise</span>
        </div>

        <div style={{ display:"flex", gap:6 }}>
          {["list","overview"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:"8px 18px", borderRadius:10, border:"none", cursor:"pointer",
              fontWeight:700, fontSize:13, letterSpacing:.2,
              background: tab===t ? "#6C63FF" : "transparent",
              color: tab===t ? "#fff" : "#888"
            }}>{t === "list" ? "📋 Expenses" : "📊 Overview"}</button>
          ))}
        </div>

        <button onClick={() => setModal("add")} style={{
          padding:"10px 22px", borderRadius:12, border:"none",
          background:"linear-gradient(135deg,#6C63FF,#A78BFA)",
          color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer",
          boxShadow:"0 4px 16px rgba(108,99,255,.35)"
        }}>+ Add Expense</button>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px" }}>

        {tab === "overview" && summary && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16 }}>
              <StatCard label="Total Spent"   value={fmt(summary.total)}   accent="#6C63FF" icon="💰" />
              <StatCard label="Transactions"  value={summary.count}         accent="#1DB85C" icon="📈" />
              <StatCard label="Largest"       value={fmt(summary.largest)}  accent="#F77F00" icon="⬆️" />
              <StatCard label="Average"       value={fmt(summary.average)}  accent="#E91E8C" icon="📐" />
            </div>
            <CategoryBar byCategory={summary.byCategory} />
          </div>
        )}

        {tab === "list" && (
          <>
            {/* Filters */}
            <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search expenses…"
                style={{
                  flex:1, minWidth:200, padding:"11px 16px", borderRadius:14,
                  border:"1.5px solid #E8E8EE", fontSize:14, outline:"none",
                  fontFamily:"inherit", background:"#fff"
                }}
              />
              <select
                value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{
                  padding:"11px 16px", borderRadius:14, border:"1.5px solid #E8E8EE",
                  fontSize:14, outline:"none", fontFamily:"inherit",
                  background:"#fff", color: filterCat ? "#333" : "#999"
                }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_COLORS[c]?.icon} {c}</option>)}
              </select>
            </div>

            {/* Table */}
            <div style={{ background:"#fff", borderRadius:24, border:"1.5px solid #F0F0F5", overflow:"hidden" }}>
              <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #F5F5F8", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:700, fontSize:16, color:"#0A0A14" }}>All Expenses</span>
                <span style={{ fontSize:13, color:"#999", fontWeight:600 }}>{expenses.length} records</span>
              </div>

              {loading ? (
                <div style={{ padding:64, textAlign:"center", color:"#AAA", fontSize:15 }}>Loading…</div>
              ) : expenses.length === 0 ? (
                <div style={{ padding:64, textAlign:"center" }}>
                  <div style={{ fontSize:48 }}>🧾</div>
                  <p style={{ color:"#AAA", marginTop:12, fontWeight:600 }}>No expenses found</p>
                </div>
              ) : (
                expenses.map(exp => (
                  <ExpenseRow key={exp.id} exp={exp}
                    onEdit={setModal}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === "add" ? "New Expense" : "Edit Expense"}
          onClose={() => setModal(null)}
        >
          <ExpenseForm
            initial={modal === "add" ? undefined : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      <Toast toasts={toasts} />
    </>
  );
}
