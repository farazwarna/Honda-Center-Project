import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { printSaleItemsInvoice } from "../../utils/salesInvoice";

const API = "http://localhost:8081";

// ── Status configs ────────────────────────────────────────────
const SALE_STATUS = {
  completed: { label: "Completed", dot: "#10b981", bg: "#ecfdf5", color: "#065f46" },
  pending:   { label: "Pending",   dot: "#f59e0b", bg: "#fffbeb", color: "#92400e" },
  partial:   { label: "Partial",   dot: "#3b82f6", bg: "#eff6ff", color: "#1e40af" },
};
const RETURN_STATUS = {
  approved: { label: "Approved", bg: "#ecfdf5", color: "#065f46" },
  pending:  { label: "Pending",  bg: "#fffbeb", color: "#92400e" },
  rejected: { label: "Rejected", bg: "#fef2f2", color: "#991b1b" },
};

const getSaleStatus   = (s) => SALE_STATUS[s]  || { label: s, dot: "#9ca3af", bg: "#f9fafb", color: "#374151" };
const getReturnStatus = (s) => RETURN_STATUS[s] || { label: s, bg: "#f9fafb", color: "#374151" };
const fmt = (n) => "Rs " + Number(n || 0).toLocaleString("en-PK");

// ── Portal — mounts children into document.body ───────────────
// This bypasses ANY parent overflow/transform/z-index issue.
const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

// ── Status pill ───────────────────────────────────────────────
const StatusPill = ({ status, map }) => {
  const cfg = map(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999, fontSize: 11,
      fontWeight: 700, letterSpacing: ".3px",
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />}
      {cfg.label.toUpperCase()}
    </span>
  );
};

// ── Modal shell ───────────────────────────────────────────────
const ModalShell = ({ onClose, children, maxWidth = 580 }) => (
  <Portal>
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 99999, padding: 20,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth,
          maxHeight: "90vh", overflowY: "auto", borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,.22)",
          animation: "salesModalIn .22s cubic-bezier(.34,1.4,.64,1)",
        }}
      >
        {children}
      </div>
    </div>
  </Portal>
);

// ── Main component ────────────────────────────────────────────
const Sales = () => {
  const [data,       setData]       = useState([]);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit]                     = useState(10);
  const [filter,     setFilter]     = useState("all");
  const [fromDate,   setFromDate]   = useState("");
  const [toDate,     setToDate]     = useState("");
  const [loading,    setLoading]    = useState(false);

  // sale-items modal
  const [showModal,       setShowModal]       = useState(false);
  const [items,           setItems]           = useState([]);
  const [selectedSale,    setSelectedSale]    = useState(null);
  const [existingReturns, setExistingReturns] = useState([]);

  // return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems,     setReturnItems]     = useState([]);
  const [returnReason,    setReturnReason]    = useState("");
  const [returnNotes,     setReturnNotes]     = useState("");
  const [returnLoading,   setReturnLoading]   = useState(false);
  const [returnSuccess,   setReturnSuccess]   = useState("");
  const [returnError,     setReturnError]     = useState("");

  // ── fetch sales ──────────────────────────────────────────────
  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/Sales/getAllSales`, {
        params: { page: p, limit, search, filter, from: fromDate, to: toDate },
      });
      setData(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || 1);
    } catch { setData([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(1); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchData(1), 400);
    return () => clearTimeout(t);
  }, [search, filter, fromDate, toDate]);

  // ── open sale items modal ────────────────────────────────────
  const openSaleItems = async (sale) => {
    try {
      const [itemsRes, returnsRes] = await Promise.all([
        axios.get(`${API}/Sales/getSaleItems/${sale.id}`),
        axios.get(`${API}/Return/getBySale/${sale.id}`).catch(() => ({ data: [] })),
      ]);
      setItems(itemsRes.data || []);
      setExistingReturns(returnsRes.data || []);
      setSelectedSale(sale);
      setShowModal(true);
    } catch (err) { console.error(err); }
  };

  // ── open return modal ────────────────────────────────────────
  const openReturnModal = () => {
    setReturnItems(items.map((it) => ({ ...it, returnQty: 0, condition: "good", selected: false })));
    setReturnReason(""); setReturnNotes("");
    setReturnSuccess(""); setReturnError("");
    setShowReturnModal(true);
  };

  const toggleItem      = (idx) => setReturnItems((p) => p.map((r, i) => i === idx ? { ...r, selected: !r.selected, returnQty: !r.selected ? 1 : 0 } : r));
  const changeQty       = (idx, v) => setReturnItems((p) => p.map((r, i) => i === idx ? { ...r, returnQty: Math.min(Math.max(1, Number(v)), r.quantity) } : r));
  const changeCondition = (idx, v) => setReturnItems((p) => p.map((r, i) => i === idx ? { ...r, condition: v } : r));

  // ── submit return ────────────────────────────────────────────
  const submitReturn = async () => {
    const selected = returnItems.filter((r) => r.selected && r.returnQty > 0);
    if (!selected.length) { setReturnError("Select at least one item to return."); return; }
    setReturnLoading(true); setReturnError("");
    try {
      const { data: ret } = await axios.post(`${API}/Return/create`, {
        sale_id: selectedSale.id, customer_id: selectedSale.customer_id || null,
        reason: returnReason, notes: returnNotes,
      });
      await axios.post(`${API}/Return/addItems`, {
        return_id: ret.return_id,
        items: selected.map((r) => ({
          product_id:   r.Product_Id ?? r.product_id,
          product_name: r.Product_Name,
          quantity:     r.returnQty,
          sale_price:   r.price ?? r.sale_price,
          condition:    r.condition,
        })),
      });
      await axios.put(`${API}/Return/approve/${ret.return_id}`);
      setReturnSuccess(`Return #${ret.return_id} approved. Good-condition items restocked.`);
      const rr = await axios.get(`${API}/Return/getBySale/${selectedSale.id}`).catch(() => ({ data: [] }));
      setExistingReturns(rr.data || []);
    } catch (err) {
      setReturnError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
    setReturnLoading(false);
  };

  // ── render ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .sales-root { font-family: 'DM Sans', sans-serif; }
        .sales-root h1, .sales-root h2, .sales-root h3 { font-family: 'Bricolage Grotesque', sans-serif; }
        @keyframes salesModalIn {
          from { opacity: 0; transform: translateY(16px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sale-row { transition: background .12s; cursor: pointer; }
        .sale-row:hover { background: #f0f4ff !important; }
        .sale-row:hover .row-name { color: #4f46e5 !important; }
        .filter-chip { transition: all .15s; border: 1.5px solid; font-family: 'DM Sans', sans-serif; cursor: pointer; }
        .filter-chip:hover:not(.on) { background: #f1f5f9 !important; }
        .pg-btn { transition: all .15s; font-family: 'DM Sans', sans-serif; }
        .pg-btn:not(:disabled):hover { background: #4f46e5 !important; color: #fff !important; border-color: #4f46e5 !important; }
        .pg-btn:disabled { opacity: .35; cursor: not-allowed; }
        .ret-row { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: border-color .12s, background .12s; }
        .ret-row.on { border-color: #f97316 !important; background: #fff7ed !important; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,.12); }
      `}</style>

      <div className="sales-root" style={{ padding: "28px 32px", background: "#f8fafc", minHeight: "100vh" }}>

        {/* PAGE TITLE */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>Sales</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Browse, filter and manage all customer transactions</p>
        </div>

        {/* FILTER BAR */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "16px 20px",
          boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e2e8f0",
          display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20,
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#94a3b8", pointerEvents: "none" }}>🔍</span>
            <input
              type="text" placeholder="Search customer…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "#f8fafc", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {/* Quick filters */}
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "all",   label: "All",   col: "#0f172a" },
              { id: "today", label: "Today", col: "#3b82f6" },
              { id: "month", label: "Month", col: "#10b981" },
            ].map(({ id, label, col }) => (
              <button key={id} onClick={() => setFilter(id)}
                className={`filter-chip ${filter === id ? "on" : ""}`}
                style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  borderColor: filter === id ? col : "#e2e8f0",
                  background:  filter === id ? col : "#fff",
                  color:       filter === id ? "#fff" : "#475569",
                }}
              >{label}</button>
            ))}
          </div>

          {/* Date range */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>FROM</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontFamily: "inherit", background: "#f8fafc" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>TO</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontFamily: "inherit", background: "#f8fafc" }} />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); setFilter("all"); }}
                style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >✕ Clear</button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {[
                  { label: "Customer", align: "left"   },
                  { label: "Invoice",  align: "left"   },
                  { label: "Total",    align: "center" },
                  { label: "Discount", align: "center" },
                  { label: "Paid",     align: "center" },
                  { label: "Method",   align: "center" },
                  { label: "Status",   align: "center" },
                  { label: "Date",     align: "center" },
                ].map(({ label, align }) => (
                  <th key={label} style={{ padding: "12px 16px", textAlign: align, fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".5px", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                  <p style={{ margin: 0, fontSize: 13 }}>Loading sales…</p>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
                  <p style={{ margin: 0, fontSize: 13 }}>No sales found</p>
                </td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="sale-row" onClick={() => openSaleItems(item)}
                    style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "13px 16px" }}>
                      <span className="row-name" style={{ fontWeight: 700, color: "#0f172a", transition: "color .12s" }}>
                        {item.name || <span style={{ color: "#94a3b8", fontWeight: 500 }}>Walk-in</span>}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <code style={{ fontSize: 11, background: "#f1f5f9", padding: "3px 7px", borderRadius: 6, color: "#475569" }}>
                        {item.invoice_no || "—"}
                      </code>
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "center", fontWeight: 600, color: "#0f172a" }}>{fmt(item.total_amount)}</td>
                    <td style={{ padding: "13px 16px", textAlign: "center", color: "#dc2626", fontWeight: 600 }}>{fmt(item.discount)}</td>
                    <td style={{ padding: "13px 16px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>{fmt(item.paid_amount)}</td>
                    <td style={{ padding: "13px 16px", textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "#f1f5f9", color: "#475569", textTransform: "capitalize" }}>
                        {item.payment_type}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "center" }}>
                      <StatusPill status={item.status} map={getSaleStatus} />
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                      {new Date(item.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                      <br />
                      <span style={{ fontSize: 11 }}>
                        {new Date(item.created_at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Page <b style={{ color: "#0f172a" }}>{page}</b> of <b style={{ color: "#0f172a" }}>{totalPages}</b>
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button disabled={page === 1} onClick={() => fetchData(page - 1)} className="pg-btn"
                  style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#475569" }}>
                  ‹ Prev
                </button>
                <button disabled={page === totalPages} onClick={() => fetchData(page + 1)} className="pg-btn"
                  style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#475569" }}>
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SALE ITEMS MODAL  — rendered via Portal into body
      ══════════════════════════════════════════════════════ */}
      {showModal && selectedSale && (
        <ModalShell onClose={() => setShowModal(false)} maxWidth={580}>
          {/* Sticky header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "20px 20px 0 0" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Sale Details</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>Click "Return Items" to process a refund</p>
            </div>
            <button onClick={() => setShowModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 17, color: "#475569" }}>✕</button>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {/* Info cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Customer", value: selectedSale.name || "Walk-in" },
                { label: "Invoice",  value: <code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 7px", borderRadius: 5 }}>{selectedSale.invoice_no}</code> },
                { label: "Total",    value: fmt(selectedSale.total_amount) },
                { label: "Paid",     value: <span style={{ color: "#10b981", fontWeight: 700 }}>{fmt(selectedSale.paid_amount)}</span> },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Status:</span>
              <StatusPill status={selectedSale.status} map={getSaleStatus} />
            </div>

            {/* Items table */}
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: 18 }}>
              <div style={{ background: "#f8fafc", padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".5px" }}>Items ({items.length})</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Product", "Qty", "Unit Price", "Total"].map((h) => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: h === "Product" ? "left" : "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".4px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: i < items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{it.Product_Name}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#475569" }}>{it.quantity}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#475569" }}>{fmt(it.price)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#0f172a" }}>{fmt(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Existing returns */}
            {existingReturns.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".5px" }}>Previous Returns</p>
                {existingReturns.map((r) => (
                  <div key={r.return_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 6, fontSize: 13 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>Return #{r.return_id}</span>
                      {r.reason && <span style={{ color: "#94a3b8", marginLeft: 8 }}>— {r.reason}</span>}
                    </div>
                    <StatusPill status={r.status} map={getReturnStatus} />
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => printSaleItemsInvoice(selectedSale, items)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
              >🖨 Print Invoice</button>
              <button
                onClick={openReturnModal}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ea580c,#f97316)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
              >↩ Return Items</button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ══════════════════════════════════════════════════════
          RETURN MODAL — rendered via Portal into body
      ══════════════════════════════════════════════════════ */}
      {showReturnModal && selectedSale && (
        <ModalShell onClose={() => setShowReturnModal(false)} maxWidth={620}>
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "20px 20px 0 0" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Return Items</h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>{selectedSale.invoice_no} · {selectedSale.name || "Walk-in"}</p>
            </div>
            <button onClick={() => setShowReturnModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 17, color: "#475569" }}>✕</button>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {returnSuccess && (
              <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", color: "#065f46", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{returnSuccess}</p>
              </div>
            )}
            {returnError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{returnError}</p>
              </div>
            )}

            {!returnSuccess && (
              <>
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <p style={{ margin: 0, fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
                    Select items to return, set quantity and condition. <b>Good-condition</b> items will be automatically restocked.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                  {returnItems.map((r, idx) => (
                    <div key={idx} className={`ret-row${r.selected ? " on" : ""}`} onClick={() => toggleItem(idx)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: r.selected ? "2px solid #f97316" : "2px solid #cbd5e1", background: r.selected ? "#f97316" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .12s" }}>
                          {r.selected && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{r.Product_Name}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>Sold: {r.quantity} units · {fmt(r.price)} each</p>
                        </div>
                        {r.selected && (
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                            <div>
                              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textAlign: "center" }}>QTY</p>
                              <input type="number" min={1} max={r.quantity} value={r.returnQty}
                                onChange={(e) => changeQty(idx, e.target.value)}
                                style={{ width: 60, textAlign: "center", padding: "7px 6px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }} />
                            </div>
                            <div>
                              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textAlign: "center" }}>CONDITION</p>
                              <select value={r.condition} onChange={(e) => changeCondition(idx, e.target.value)}
                                style={{ padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, fontFamily: "inherit", background: r.condition === "good" ? "#ecfdf5" : "#fef2f2", color: r.condition === "good" ? "#065f46" : "#991b1b", fontWeight: 700 }}>
                                <option value="good">✅ Good</option>
                                <option value="damaged">❌ Damaged</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {returnItems.some((r) => r.selected) && (
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 24, border: "1px solid #e2e8f0" }}>
                    {[
                      { label: "Selected", value: returnItems.filter((r) => r.selected).length, color: "#0f172a" },
                      { label: "Restock",  value: returnItems.filter((r) => r.selected && r.condition === "good").length, color: "#10b981" },
                      { label: "Damaged",  value: returnItems.filter((r) => r.selected && r.condition === "damaged").length, color: "#ef4444" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{label}</p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                  <input type="text" placeholder="Return reason (e.g. defective, wrong item…)" value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", background: "#f8fafc" }} />
                  <textarea placeholder="Additional notes (optional)" value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)} rows={2}
                    style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", resize: "vertical", background: "#f8fafc" }} />
                </div>

                <button onClick={submitReturn} disabled={returnLoading}
                  style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: returnLoading ? "#e2e8f0" : "linear-gradient(135deg,#ea580c,#f97316)", color: returnLoading ? "#94a3b8" : "#fff", fontWeight: 800, fontSize: 15, cursor: returnLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {returnLoading ? "⏳ Processing…" : "↩ Submit Return & Restock"}
                </button>
              </>
            )}
          </div>
        </ModalShell>
      )}
    </>
  );
};

export default Sales;