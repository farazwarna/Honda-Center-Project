import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8081";

const UpdateProductDialog = ({ productId, isOpen, onClose, onUpdated }) => {
  const [productkey,   setProductKey]   = useState("");
  const [productname,  setProductName]  = useState("");
  const [productprice, setProductPrice] = useState("");
  const [productdesc1, setProductDesc]  = useState("");
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API}/Products/productEdit/${productId}`);
      setProductKey(data.Product_Key ?? "");
      setProductName(data.Product_Name ?? "");
      setProductPrice(data.Product_Price ?? "");
      setProductDesc(data.Product_Description ?? "");
    } catch {
      setError("Could not load product data.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen) fetchProduct();
    else {
      setProductKey(""); setProductName("");
      setProductPrice(""); setProductDesc(""); setError("");
    }
  }, [isOpen, fetchProduct]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.put(`${API}/Products/updateProduct/${productId}`, {
        productkey, productname, productprice, productdesc1,
      });
      onUpdated?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        .upd-overlay { animation: upd-fade .18s ease; font-family:'DM Sans',sans-serif; }
        .upd-panel   { animation: upd-rise .22s cubic-bezier(.34,1.3,.64,1); }
        @keyframes upd-fade { from{opacity:0} to{opacity:1} }
        @keyframes upd-rise { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }

        .upd-field label {
          display:block; font-size:12px; font-weight:600;
          text-transform:uppercase; letter-spacing:.05em;
          color:#888; margin-bottom:5px;
        }
        .upd-field input, .upd-field textarea {
          width:100%; box-sizing:border-box;
          background:#f7f7f7; border:1.5px solid #e8e8e8;
          border-radius:10px; padding:9px 13px;
          font-size:14px; font-family:'DM Sans',sans-serif; color:#1a1a1a;
          outline:none; transition:border-color .15s,box-shadow .15s,background .15s;
          resize:vertical;
        }
        .upd-field input::placeholder, .upd-field textarea::placeholder { color:#bbb; }
        .upd-field input:focus, .upd-field textarea:focus {
          border-color:#e03030; background:#fff;
          box-shadow:0 0 0 3px rgba(224,48,48,.1);
        }
        .upd-btn-cancel {
          background:#f0f0f0; color:#555; border:none; border-radius:9px;
          padding:10px 20px; font-size:14px; font-weight:500;
          font-family:'DM Sans',sans-serif; cursor:pointer; transition:background .15s;
        }
        .upd-btn-cancel:hover { background:#e4e4e4; }
        .upd-btn-save {
          background:linear-gradient(135deg,#e03030,#b51c1c);
          color:#fff; border:none; border-radius:9px;
          padding:10px 26px; font-size:14px; font-weight:600;
          font-family:'DM Sans',sans-serif; cursor:pointer;
          transition:opacity .15s,transform .1s;
          box-shadow:0 4px 14px rgba(224,48,48,.28);
        }
        .upd-btn-save:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
        .upd-btn-save:disabled { opacity:.55; cursor:not-allowed; }
        .upd-spinner {
          width:14px; height:14px; display:inline-block; vertical-align:middle;
          border:2px solid rgba(255,255,255,.35); border-top-color:#fff;
          border-radius:50%; animation:upd-spin .6s linear infinite; margin-right:7px;
        }
        @keyframes upd-spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Backdrop */}
      <div
        className="upd-overlay"
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:9998,
          background:"rgba(10,10,10,.45)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:"16px",
        }}
      >
        {/* Panel */}
        <div
          className="upd-panel"
          onClick={(e) => e.stopPropagation()}
          style={{
            background:"#fff", borderRadius:"18px",
            width:"100%", maxWidth:"520px",
            boxShadow:"0 24px 60px rgba(0,0,0,.16), 0 0 0 1px rgba(0,0,0,.04)",
            overflow:"hidden",
          }}
        >
          {/* Red top bar */}
          <div style={{ height:"4px", background:"linear-gradient(90deg,#e03030,#ff7a7a,#e03030)" }} />

          <div style={{ padding:"28px 28px 26px" }}>

            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"22px" }}>
              <h2 style={{
                margin:0, fontSize:"20px",
                fontFamily:"'Syne',sans-serif", fontWeight:700, color:"#111",
              }}>
                Update Product
              </h2>
              <button
                onClick={onClose}
                style={{
                  background:"#f4f4f4", border:"none", borderRadius:"8px",
                  width:"30px", height:"30px", cursor:"pointer",
                  fontSize:"15px", color:"#888", lineHeight:1, transition:"background .15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e8e8e8"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f4f4f4"}
              >
                ✕
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background:"#fff4f4", border:"1px solid #ffd4d4", color:"#c00",
                borderRadius:"8px", padding:"8px 12px", fontSize:"13px", marginBottom:"16px",
              }}>
                ⚠ {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign:"center", padding:"32px 0", color:"#aaa", fontSize:"14px" }}>
                Loading…
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>

                  <div className="upd-field">
                    <label>Product Key</label>
                    <input
                      type="text"
                      value={productkey}
                      onChange={(e) => setProductKey(e.target.value)}
                      placeholder="Enter product key"
                      required
                    />
                  </div>

                  <div className="upd-field">
                    <label>Product Name</label>
                    <input
                      type="text"
                      value={productname}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="upd-field">
                    <label>Product Price</label>
                    <input
                      type="number"
                      value={productprice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Enter price"
                      required
                    />
                  </div>

                  {/* Description spans full width, matching original md:col-span-2 */}
                  <div className="upd-field" style={{ gridColumn:"1 / -1" }}>
                    <label>Product Description</label>
                    <textarea
                      rows={3}
                      value={productdesc1}
                      onChange={(e) => setProductDesc(e.target.value)}
                      placeholder="Enter description"
                      required
                    />
                  </div>

                </div>

                {/* Footer */}
                <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"24px" }}>
                  <button type="button" className="upd-btn-cancel" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="upd-btn-save" disabled={saving}>
                    {saving && <span className="upd-spinner" />}
                    {saving ? "Saving…" : "Update Product"}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateProductDialog;