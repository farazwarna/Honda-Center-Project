import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ── Field component ───────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div className="rpd-field">
    <label className="rpd-label">
      {label}
      {required && <span className="rpd-req">*</span>}
    </label>
    {children}
  </div>
);

// ── Section heading ───────────────────────────────────────────────────────────
const Section = ({ icon, title }) => (
  <div className="rpd-section">
    <span className="rpd-section-icon">{icon}</span>
    <span className="rpd-section-title">{title}</span>
    <div className="rpd-section-line" />
  </div>
);

// ── Main dialog ───────────────────────────────────────────────────────────────
export default function RegisterProductDialog({ isOpen, onClose, load }) {
  const [productkey,            setProductKey]           = useState("");
  const [productminstock,       setProductMinStock]      = useState(10);
  const [productmodel,          setProductModel]         = useState("");
  const [product_id,            setProduct_Id]           = useState("");
  const [productname,           setProductName]          = useState("");
  const [productprice,          setProductPrice]         = useState("");
  const [productunit,           setProductUnit]          = useState("");
  const [productretailprice,    setProductRetailPrice]   = useState("");
  const [productwholesaleprice, setProductWholeSalePrice]= useState("");
  const [productdesc1,          setProductDesc]          = useState("");
  const [saving,                setSaving]               = useState(false);
  const [error,                 setError]                = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.post("http://localhost:8081/Products/addProduct", {
        product_id, productkey, productname, productmodel,
        productprice, productdesc1, productunit,
        productretailprice, productwholesaleprice, productminstock,
      });
      await load();
      onClose();
      navigate("/Admin");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

        .rpd-backdrop {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          backdrop-filter: blur(3px);
          animation: rpd-bg-in .2s ease;
        }
        @keyframes rpd-bg-in { from { opacity: 0; } to { opacity: 1; } }

        .rpd-modal {
          width: 100%; max-width: 720px;
          background: #fff;
          border-radius: 24px;
          max-height: 92vh;
          overflow-y: auto;
          display: flex; flex-direction: column;
          animation: rpd-slide-in .25s cubic-bezier(.16,1,.3,1);
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes rpd-slide-in {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Header */
        .rpd-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid #f0f0f0;
          display: flex; justify-content: space-between; align-items: flex-start;
          position: sticky; top: 0; background: #fff; z-index: 2;
          border-radius: 24px 24px 0 0;
        }
        .rpd-header-left { display: flex; align-items: center; gap: 14px; }
        .rpd-icon-box {
          width: 48px; height: 48px; border-radius: 14px;
          background: #FEF2F2; display: flex; align-items: center; justify-content: center;
        }
        .rpd-title {
          font-family: 'Syne', sans-serif; font-size: 20px;
          font-weight: 800; color: #111; margin: 0 0 3px;
        }
        .rpd-subtitle { font-size: 13px; color: #aaa; margin: 0; }
        .rpd-close {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid #ebebeb; background: #fafafa;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #888; font-size: 18px; line-height: 1;
          transition: background .15s, color .15s;
        }
        .rpd-close:hover { background: #fee2e2; color: #CC0000; border-color: #fca5a5; }

        /* Body */
        .rpd-body { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }

        /* Section divider */
        .rpd-section {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 4px;
        }
        .rpd-section-icon { font-size: 15px; }
        .rpd-section-title {
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          color: #aaa; text-transform: uppercase; letter-spacing: 1px;
          white-space: nowrap;
        }
        .rpd-section-line { flex: 1; height: 1px; background: #f0f0f0; }

        /* Grid */
        .rpd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        /* Field */
        .rpd-field { display: flex; flex-direction: column; gap: 6px; }
        .rpd-label { font-size: 12px; font-weight: 600; color: #555; letter-spacing: .3px; }
        .rpd-req { color: #CC0000; margin-left: 2px; }

        /* Inputs */
        .rpd-input {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px;
          border: 1.5px solid #e8e8e8;
          border-radius: 12px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #1a1a1a; background: #fff; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .rpd-input:focus {
          border-color: #CC0000;
          box-shadow: 0 0 0 3px rgba(204,0,0,.08);
        }
        .rpd-input::placeholder { color: #ccc; }

        .rpd-textarea {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px;
          border: 1.5px solid #e8e8e8;
          border-radius: 12px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #1a1a1a; background: #fff; outline: none;
          resize: vertical; min-height: 90px;
          transition: border-color .15s, box-shadow .15s;
        }
        .rpd-textarea:focus {
          border-color: #CC0000;
          box-shadow: 0 0 0 3px rgba(204,0,0,.08);
        }
        .rpd-textarea::placeholder { color: #ccc; }

        /* Min stock slider */
        .rpd-slider-row {
          display: flex; align-items: center; gap: 16px;
        }
        .rpd-slider {
          flex: 1; accent-color: #CC0000; height: 4px; cursor: pointer;
        }
        .rpd-slider-val {
          min-width: 44px; text-align: center;
          background: #FEF2F2; color: #CC0000;
          font-weight: 700; font-size: 14px;
          padding: 4px 10px; border-radius: 8px;
          border: 1px solid #fecaca;
        }

        /* Error banner */
        .rpd-error {
          background: #FEF2F2; border: 1px solid #fecaca;
          color: #B91C1C; border-radius: 10px;
          padding: 10px 14px; font-size: 13px;
          display: flex; align-items: center; gap: 8px;
        }

        /* Footer */
        .rpd-footer {
          padding: 20px 32px 28px;
          border-top: 1px solid #f0f0f0;
          display: flex; justify-content: flex-end; gap: 10px;
          position: sticky; bottom: 0; background: #fff;
          border-radius: 0 0 24px 24px;
        }
        .rpd-btn {
          padding: 11px 24px; border-radius: 12px;
          font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border: none; cursor: pointer;
          transition: opacity .15s, transform .1s;
          display: flex; align-items: center; gap: 7px;
        }
        .rpd-btn:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
        .rpd-btn:active:not(:disabled) { transform: none; }
        .rpd-btn:disabled { opacity: .5; cursor: not-allowed; }
        .rpd-btn-cancel { background: #f3f4f6; color: #555; }
        .rpd-btn-save   { background: #CC0000; color: #fff; }

        /* Spinner */
        .rpd-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: rpd-spin .6s linear infinite;
        }
        @keyframes rpd-spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .rpd-grid { grid-template-columns: 1fr; }
          .rpd-header, .rpd-body, .rpd-footer { padding-left: 20px; padding-right: 20px; }
        }
      `}</style>

      <div className="rpd-backdrop" onClick={handleBackdrop}>
        <div className="rpd-modal">

          {/* ── Header ── */}
          <div className="rpd-header">
            <div className="rpd-header-left">
              <div className="rpd-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div>
                <p className="rpd-title">Register New Product</p>
                <p className="rpd-subtitle">Fill all required fields carefully</p>
              </div>
            </div>
            <button className="rpd-close" onClick={onClose} type="button">×</button>
          </div>

          {/* ── Body ── */}
          <form onSubmit={handleSubmit}>
            <div className="rpd-body">

              {/* Error */}
              {error && (
                <div className="rpd-error">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Identity */}
              <div>
                <Section icon="🏷️" title="Product Identity" />
                <div className="rpd-grid">
                  <Field label="Product ID" required>
                    <input className="rpd-input" placeholder="e.g. PRD-0042" value={product_id} onChange={(e) => setProduct_Id(e.target.value)} required />
                  </Field>
                  <Field label="Product Name" required>
                    <input className="rpd-input" placeholder="e.g. Clutch Cable" value={productname} onChange={(e) => setProductName(e.target.value)} required />
                  </Field>
                  <Field label="Part Number" required>
                    <input className="rpd-input" placeholder="e.g. 22870-KPH-900" value={productkey} onChange={(e) => setProductKey(e.target.value)} required />
                  </Field>
                  <Field label="Compatible Model" required>
                    <input className="rpd-input" placeholder="e.g. CD70, CG125" value={productmodel} onChange={(e) => setProductModel(e.target.value)} required />
                  </Field>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <Section icon="💰" title="Pricing" />
                <div className="rpd-grid">
                  <Field label="Purchase Price (Rs)" required>
                    <input className="rpd-input" type="number" placeholder="0.00" value={productprice} onChange={(e) => setProductPrice(e.target.value)} required />
                  </Field>
                  <Field label="Unit" required>
                    <input className="rpd-input" placeholder="pcs / box / set" value={productunit} onChange={(e) => setProductUnit(e.target.value)} required />
                  </Field>
                  <Field label="Retail Price (Rs)" required>
                    <input className="rpd-input" type="number" placeholder="0.00" value={productretailprice} onChange={(e) => setProductRetailPrice(e.target.value)} required />
                  </Field>
                  <Field label="Wholesale Price (Rs)" required>
                    <input className="rpd-input" type="number" placeholder="0.00" value={productwholesaleprice} onChange={(e) => setProductWholeSalePrice(e.target.value)} required />
                  </Field>
                </div>
              </div>

              {/* Stock & Description */}
              <div>
                <Section icon="📦" title="Stock & Details" />
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <Field label={`Minimum Stock Level — reorder alert at ${productminstock} units`}>
                    <div className="rpd-slider-row">
                      <span style={{ fontSize: "12px", color: "#bbb" }}>1</span>
                      <input
                        className="rpd-slider"
                        type="range" min="1" max="100"
                        value={productminstock}
                        onChange={(e) => setProductMinStock(e.target.value)}
                      />
                      <span style={{ fontSize: "12px", color: "#bbb" }}>100</span>
                      <span className="rpd-slider-val">{productminstock}</span>
                    </div>
                  </Field>
                  <Field label="Description" required>
                    <textarea
                      className="rpd-textarea"
                      placeholder="Briefly describe the product, compatibility, or special notes…"
                      value={productdesc1}
                      onChange={(e) => setProductDesc(e.target.value)}
                      rows="3"
                      required
                    />
                  </Field>
                </div>
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="rpd-footer">
              <button type="button" className="rpd-btn rpd-btn-cancel" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="rpd-btn rpd-btn-save" disabled={saving}>
                {saving ? (
                  <>
                    <span className="rpd-spinner" />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Save Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}