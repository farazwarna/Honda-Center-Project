import React, { useState, useEffect } from "react";
import axios from "axios";

const SupplierPaymentModal = ({ open, onClose, supplier, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  // Reset form when supplier changes
  useEffect(() => {
    if (open) { setAmount(""); setMethod("cash"); }
  }, [open, supplier]);

  if (!open) return null;

  const balance     = Number(supplier?.balance || 0);
  const payAmount   = Number(amount || 0);
  const isAdvance   = payAmount > balance;
  const advanceAmt  = isAdvance ? payAmount - balance : 0;

  // Avatar (same logic as SupplierCredit)
  const initials = supplier?.name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const hue = [...(supplier?.name || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  const pay = async () => {
    if (!payAmount || payAmount <= 0) return alert("Enter a valid amount");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8081/Supplier/pay-supplier", {
        supplier_id: supplier.id,
        amount: payAmount,
        payment_method: method,
      });

      if (res.data.advance > 0) {
        alert(`Payment Successful 🎉\nAdvance Created: Rs ${res.data.advance}`);
      } else {
        alert("Payment Successful ✔");
      }

      setAmount("");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Payment failed");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Syne:wght@700;800&display=swap');

        .spm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 50;
          animation: spm-fade .18s ease;
        }
        @keyframes spm-fade { from { opacity: 0 } to { opacity: 1 } }

        .spm-modal {
          background: #fff;
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          padding: 28px;
          box-shadow: 0 24px 64px rgba(0,0,0,.18);
          font-family: 'DM Sans', sans-serif;
          animation: spm-slide .2s ease;
        }
        @keyframes spm-slide { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }

        .spm-avatar {
          width: 48px; height: 48px; border-radius: 13px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; font-family: 'Syne', sans-serif;
        }

        .spm-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: .7px; color: #aaa; margin: 0 0 6px;
        }

        .spm-input {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px; border: 1.5px solid #e8e8e8; border-radius: 10px;
          font-size: 15px; font-family: 'DM Sans', sans-serif;
          color: #111; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .spm-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .spm-input::placeholder { color: #ccc; }

        .spm-select {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px; border: 1.5px solid #e8e8e8; border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #111; background: #fff; outline: none; cursor: pointer;
          transition: border-color .15s, box-shadow .15s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        .spm-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }

        .spm-method-row {
          display: flex; gap: 8px;
        }
        .spm-method-btn {
          flex: 1; padding: 9px 0; border-radius: 10px;
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          border: 1.5px solid #e8e8e8; background: #fff; color: #666;
          cursor: pointer; transition: all .15s;
        }
        .spm-method-btn.active {
          background: #1a1a1a; color: #fff; border-color: #1a1a1a;
        }
        .spm-method-btn:hover:not(.active) { border-color: #bbb; color: #333; }

        .spm-pay-btn {
          flex: 1; padding: 12px 0; border-radius: 10px;
          font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          border: none; cursor: pointer;
          background: #EAF3DE; color: #3B6D11;
          transition: opacity .15s, transform .1s;
        }
        .spm-pay-btn:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
        .spm-pay-btn:active:not(:disabled) { transform: none; }
        .spm-pay-btn:disabled { opacity: .45; cursor: not-allowed; }

        .spm-cancel-btn {
          flex: 1; padding: 12px 0; border-radius: 10px;
          font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          border: 1.5px solid #e8e8e8; cursor: pointer;
          background: #fff; color: #666;
          transition: background .15s, border-color .15s;
        }
        .spm-cancel-btn:hover { background: #f5f5f5; border-color: #ddd; }

        .spm-advance-warn {
          background: #FFFBEB; border: 1px solid #FDE68A;
          border-radius: 10px; padding: 11px 14px;
          font-size: 13px; color: #92400E;
          display: flex; align-items: flex-start; gap: 8px;
        }
      `}</style>

      <div className="spm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="spm-modal">

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
            <div
              className="spm-avatar"
              style={{ background: `hsl(${hue},50%,88%)`, color: `hsl(${hue},50%,28%)` }}
            >
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontFamily: "'Syne', sans-serif", fontSize: "17px", fontWeight: 700, color: "#111" }}>
                {supplier?.name}
              </p>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#aaa" }}>
                {supplier?.phone || "No phone"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: "4px", lineHeight: 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* ── Balance summary ── */}
          <div style={{
            background: balance > 0 ? "#FEF2F2" : balance < 0 ? "#EAF3DE" : "#F3F4F6",
            border: `1px solid ${balance > 0 ? "#FECACA" : balance < 0 ? "#C0DD97" : "#E5E7EB"}`,
            borderRadius: "12px", padding: "14px 16px", marginBottom: "20px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: balance > 0 ? "#B91C1C" : balance < 0 ? "#3B6D11" : "#6B7280" }}>
              {balance > 0 ? "Outstanding Balance" : balance < 0 ? "Supplier Owes You" : "Settled"}
            </span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: balance > 0 ? "#B91C1C" : balance < 0 ? "#3B6D11" : "#6B7280" }}>
              Rs {Math.abs(balance).toLocaleString()}
            </span>
          </div>

          {/* ── Amount ── */}
          <div style={{ marginBottom: "14px" }}>
            <p className="spm-label">Payment Amount</p>
            <input
              className="spm-input"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
            />
          </div>

          {/* ── Advance warning ── */}
          {payAmount > 0 && isAdvance && (
            <div className="spm-advance-warn" style={{ marginBottom: "14px" }}>
              <span style={{ fontSize: "15px", flexShrink: 0 }}>⚠️</span>
              <span>
                Amount exceeds outstanding balance. An advance of{" "}
                <strong>Rs {advanceAmt.toLocaleString()}</strong> will be created for this supplier.
              </span>
            </div>
          )}

          {/* ── Payment method ── */}
          <div style={{ marginBottom: "22px" }}>
            <p className="spm-label">Payment Method</p>
            <div className="spm-method-row">
              {["cash", "bank", "online"].map((m) => (
                <button
                  key={m}
                  className={`spm-method-btn ${method === m ? "active" : ""}`}
                  onClick={() => setMethod(m)}
                >
                  {m === "cash" ? "💵 Cash" : m === "bank" ? "🏦 Bank" : "📱 Online"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="spm-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="spm-pay-btn" onClick={pay} disabled={loading || !payAmount || payAmount <= 0}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Processing…
                </span>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: "6px" }}>
                    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  {isAdvance && payAmount > 0 ? "Pay + Create Advance" : "Pay Supplier"}
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
};

export default SupplierPaymentModal;