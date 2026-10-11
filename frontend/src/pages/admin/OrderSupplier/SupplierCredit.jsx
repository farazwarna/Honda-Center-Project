import React, { useEffect, useState } from "react";
import axios from "axios";
import SupplierPaymentModal from "../../../components/dialogs/SupplierPaymentDialog";
import SupplierLedgerModal from "../../../components/dialogs/Orders/SupplierPaymentsHistoryDialog";
import AddSupplierDialog from "../../../components/dialogs/AddSupplierDialog";

const API = "http://localhost:8081";

/*
  BALANCE CONVENTION
  ──────────────────
  balance > 0  →  you OWE the supplier money          → red / amber
  balance < 0  →  supplier OWES you money (credit)    → green
  balance = 0  →  settled                             → grey
*/

// ── Balance helpers ───────────────────────────────────────────────────────────
const getBalanceStyle = (balance) => {
  if (balance > 0) return { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA", bar: "linear-gradient(90deg,#FCA5A5,#EF4444)", label: "You Owe" };
  if (balance < 0) return { bg: "#EAF3DE", color: "#3B6D11", border: "#C0DD97", bar: "linear-gradient(90deg,#86EFAC,#22C55E)", label: "They Owe" };
  return        { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", bar: "linear-gradient(90deg,#D1D5DB,#9CA3AF)", label: "Settled" };
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name }) => {
  const initials = name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const hue = [...(name || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 52, height: 52, borderRadius: "14px", flexShrink: 0,
      background: `hsl(${hue},50%,88%)`, color: `hsl(${hue},50%,28%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "16px", fontWeight: 700, fontFamily: "'Syne', sans-serif",
    }}>
      {initials}
    </div>
  );
};

// ── Status chip ───────────────────────────────────────────────────────────────
const StatusChip = ({ balance }) => {
  const s = getBalanceStyle(balance);
  const dot = balance > 0 ? "▲" : balance < 0 ? "▼" : "✓";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "5px 13px", borderRadius: "99px", fontSize: "11.5px", fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: "8px" }}>{dot}</span>
      {s.label}
    </span>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div style={{
    background: "#fff", border: "1px solid #ebebeb", borderRadius: "16px",
    padding: "22px 24px", position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, width: "4px", height: "100%",
      background: accent, borderRadius: "16px 0 0 16px",
    }} />
    <p style={{ margin: "0 0 5px", fontSize: "11px", color: "#aaa", fontWeight: 600, letterSpacing: ".6px", textTransform: "uppercase" }}>
      {label}
    </p>
    <p style={{ margin: "0 0 3px", fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 700, color: "#111" }}>
      {value}
    </p>
    {sub && <p style={{ margin: 0, fontSize: "12px", color: "#bbb" }}>{sub}</p>}
  </div>
);

// ── Supplier card ─────────────────────────────────────────────────────────────
const SupplierCard = ({ supplier, onPay, onLedger, index }) => {
  const balance = Number(supplier.balance) || 0;
  const s = getBalanceStyle(balance);
  const absBalance = Math.abs(balance);

  return (
    <div className="sc-card" style={{ animationDelay: `${index * 55}ms` }}>

      {/* Top: avatar + name + chip */}
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "18px" }}>
        <Avatar name={supplier.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: "0 0 5px",
            fontFamily: "'Syne', sans-serif",
            fontSize: "17px", fontWeight: 700, color: "#111",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {supplier.name}
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#aaa" }}>
            {supplier.phone || "No phone"}
          </p>
        </div>
        <StatusChip balance={balance} />
      </div>

      {/* Balance amount + bar */}
      <div style={{
        background: s.bg, border: `1px solid ${s.border}`,
        borderRadius: "12px", padding: "14px 16px", marginBottom: "16px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", color: s.color, fontWeight: 600, opacity: 0.75 }}>
            {balance > 0 ? "You owe supplier" : balance < 0 ? "Supplier owes you" : "Settled — no balance"}
          </span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: s.color }}>
            Rs {absBalance.toLocaleString()}
          </span>
        </div>
        <div style={{ height: "5px", background: "rgba(0,0,0,0.08)", borderRadius: "99px" }}>
          <div style={{ height: "100%", width: "100%", borderRadius: "99px", background: s.bar }} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          className="sc-btn sc-btn-pay"
          onClick={() => onPay(supplier)}
          title="Record payment or advance to supplier"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Pay Supplier
        </button>
        <button className="sc-btn sc-btn-ledger" onClick={() => onLedger(supplier)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          History
        </button>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const SupplierCredit = () => {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [open, setOpen]                   = useState(false);
  const [selectedSupplier, setSelected]   = useState(null);
  const [addOpen, setAddOpen]             = useState(false);
  const [ledgerOpen, setLedgerOpen]       = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/Supplier/supplier-credit`);
      setData(res.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openPayment = (s) => { setSelected(s); setOpen(true); };
  const openLedger  = (s) => { setSelected(s); setLedgerOpen(true); };

  const iOweTotal    = data.filter((s) => Number(s.balance) > 0).reduce((a, s) => a + Number(s.balance), 0);
  const theyOweTotal = data.filter((s) => Number(s.balance) < 0).reduce((a, s) => a + Math.abs(Number(s.balance)), 0);
  const settled      = data.filter((s) => Number(s.balance) === 0).length;

  const filtered = data.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Syne:wght@700;800&display=swap');

        .sc-root {
          padding: 28px;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #f7f7f5;
        }

        .sc-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .sc-toolbar {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .sc-search-wrap { position: relative; flex: 1; min-width: 200px; }
        .sc-search-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%); color: #bbb; pointer-events: none;
        }
        .sc-search {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px 11px 40px;
          border: 1.5px solid #e8e8e8; border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #1a1a1a; background: #fff; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .sc-search:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }

        .sc-add-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 11px 20px; background: #1a1a1a; color: #fff;
          border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; white-space: nowrap;
          transition: background .15s, transform .1s;
        }
        .sc-add-btn:hover { background: #333; transform: translateY(-1px); }
        .sc-add-btn:active { transform: none; }

        .sc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }

        .sc-card {
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 20px;
          padding: 24px;
          transition: box-shadow .2s, border-color .2s, transform .2s;
          animation: sc-fadein .35s ease both;
        }
        .sc-card:hover {
          box-shadow: 0 10px 36px rgba(0,0,0,.09);
          border-color: #ddd;
          transform: translateY(-2px);
        }
        @keyframes sc-fadein {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sc-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 11px 0; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          border: none; cursor: pointer;
          transition: opacity .15s, transform .1s;
        }
        .sc-btn:hover { opacity: .82; transform: translateY(-1px); }
        .sc-btn:active { transform: none; }
        .sc-btn-pay    { background: #EAF3DE; color: #3B6D11; }
        .sc-btn-ledger { background: #E6F1FB; color: #185FA5; }

        .sc-shimmer {
          background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
          background-size: 200% 100%;
          animation: sc-shimmer 1.2s infinite;
          border-radius: 20px; height: 220px;
        }
        @keyframes sc-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .sc-empty {
          grid-column: 1/-1; text-align: center;
          padding: 64px 24px; color: #bbb; font-size: 14px;
        }

        @media (max-width: 700px) {
          .sc-root { padding: 16px; }
          .sc-stats { grid-template-columns: 1fr; }
          .sc-grid  { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sc-root">

        {/* ── Header ── */}
        <div style={{ marginBottom: "26px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11.5px", color: "#bbb", textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600 }}>
            Finance
          </p>
          <h1 style={{ margin: "0 0 5px", fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "#111" }}>
            Supplier Credit
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#aaa" }}>
            Track outstanding balances and record payments
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="sc-stats">
          <StatCard
            label="I Owe Suppliers"
            value={`Rs ${iOweTotal.toLocaleString()}`}
            sub={`${data.filter((s) => Number(s.balance) > 0).length} supplier${data.filter((s) => Number(s.balance) > 0).length !== 1 ? "s" : ""} pending`}
            accent="#EF4444"
          />
          <StatCard
            label="Suppliers Owe Me"
            value={`Rs ${theyOweTotal.toLocaleString()}`}
            sub={`${data.filter((s) => Number(s.balance) < 0).length} supplier${data.filter((s) => Number(s.balance) < 0).length !== 1 ? "s" : ""} in credit`}
            accent="#22C55E"
          />
          <StatCard
            label="Settled"
            value={settled}
            sub={`of ${data.length} total suppliers`}
            accent="#6366F1"
          />
        </div>

        {/* ── Toolbar ── */}
        <div className="sc-toolbar">
          <div className="sc-search-wrap">
            <svg className="sc-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="sc-search"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="sc-add-btn" onClick={() => setAddOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Supplier
          </button>
        </div>

        {/* ── Grid ── */}
        <div className="sc-grid">
          {loading ? (
            [1,2,3,4,5,6].map((k) => <div key={k} className="sc-shimmer" />)
          ) : filtered.length === 0 ? (
            <div className="sc-empty">
              {search ? `No suppliers matching "${search}"` : "No suppliers yet"}
            </div>
          ) : (
            filtered.map((s, i) => (
              <SupplierCard
                key={s.id}
                supplier={s}
                index={i}
                onPay={openPayment}
                onLedger={openLedger}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <SupplierPaymentModal
        open={open}
        supplier={selectedSupplier}
        onClose={() => setOpen(false)}
        onSuccess={load}
      />
      <SupplierLedgerModal
        open={ledgerOpen}
        supplier={selectedSupplier}
        onClose={() => setLedgerOpen(false)}
      />
      <AddSupplierDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={load}
      />
    </>
  );
};

export default SupplierCredit;