import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import UpdateAvailableProducts from "../../../components/dialogs/UpdateAvailableStock";

const API = import.meta.env.VITE_API_URL || "http://localhost:8081";
const LIMIT = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

const StockBadge = ({ qty }) => {
  if (qty === 0)   return <span style={badge("out")}>Out of stock</span>;
  if (qty <= 5)    return <span style={badge("low")}>{qty} low</span>;
  return               <span style={badge("in")}>{qty}</span>;
};

const badge = (type) => ({
  display: "inline-block",
  padding: "2px 9px",
  borderRadius: "99px",
  fontSize: "11px",
  fontWeight: 500,
  background: type === "in"  ? "#EAF3DE" : type === "out" ? "#FCEBEB" : "#FAEEDA",
  color:      type === "in"  ? "#3B6D11" : type === "out" ? "#A32D2D" : "#854F0B",
});

const buildPageRange = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  return Array.from({ length: total }, (_, i) => i + 1).reduce((acc, p, i, arr) => {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) {
      acc.push(p);
    } else if (Math.abs(p - current) === 2) {
      acc.push("...");
    }
    return acc;
  }, []);
};

// ── Component ─────────────────────────────────────────────────────────────────

const AvailableProducts = () => {
  const [data, setData]               = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Edit dialog state
  const [open, setOpen]                     = useState(false);
  const [editProduct, setEditProduct]       = useState({});

  const searchRef = useRef(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const load = useCallback(async (page = 1, searchText = "") => {
    setLoading(true);
    try {
      const { data: res } = await axios.get(`${API}/AvailableProducts/getAvailableProducts`, {
        params: { page, limit: LIMIT, search: searchText },
      });
      setData(res.data);
      setTotalPages(res.totalPages);
      setCurrentPage(res.currentPage);
      setTotal(res.total ?? res.data.length);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); load(1, search); }, 300);
    return () => clearTimeout(t);
  }, [search, load]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const id = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(id);
    try {
      await axios.delete(`${API}/AvailableProducts/DeleteProduct/${id}`);
      toast.success("Deleted successfully");
      load(currentPage, search);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const inStock  = data.filter((d) => d.Quantity > 5).length;
  const outStock = data.filter((d) => d.Quantity === 0).length;
  const lowStock = data.filter((d) => d.Quantity > 0 && d.Quantity <= 5).length;

  const pageRange = buildPageRange(currentPage, totalPages);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        .av-root { padding: 24px; max-width: 1100px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }

        /* stats */
        .av-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
        .av-stat { background: #f7f7f7; border-radius: 12px; padding: 14px 16px; }
        .av-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #999; margin: 0 0 4px; }
        .av-stat-value { font-size: 22px; font-weight: 600; margin: 0; color: #111; }
        .av-stat-value.green  { color: #3B6D11; }
        .av-stat-value.red    { color: #A32D2D; }
        .av-stat-value.amber  { color: #854F0B; }

        /* table card */
        .av-card { background: #fff; border: 1px solid #ebebeb; border-radius: 16px; overflow: hidden; }
        .av-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .av-table th { padding: 11px 16px; font-size: 11px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: .06em; text-align: left; border-bottom: 1px solid #f0f0f0; background: #fafafa; }
        .av-table td { padding: 12px 16px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; color: #222; }
        .av-table tr:last-child td { border-bottom: none; }
        .av-table tbody tr { transition: background .12s; }
        .av-table tbody tr:hover td { background: #fafafa; }

        .av-id   { font-family: monospace; font-size: 12px; color: #bbb; }
        .av-name { font-weight: 600; color: #1a1a1a; }
        .av-price       { color: #444; }
        .av-price.blue  { color: #185FA5; font-weight: 500; }
        .av-price.purple{ color: #534AB7; font-weight: 500; }

        .av-btn { padding: 5px 13px; border-radius: 8px; font-size: 12px; font-weight: 500; border: 1px solid; cursor: pointer; transition: opacity .15s, transform .1s; font-family: 'DM Sans', sans-serif; }
        .av-btn:hover { opacity: .8; transform: translateY(-1px); }
        .av-btn:active { transform: translateY(0); }
        .av-btn.edit { background: #E6F1FB; color: #185FA5; border-color: #B5D4F4; }
        .av-btn.del  { background: #FCEBEB; color: #A32D2D; border-color: #F7C1C1; }
        .av-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

        /* search */
        .av-search-wrap { position: relative; }
        .av-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #bbb; font-size: 14px; pointer-events: none; }
        .av-search { padding: 9px 14px 9px 34px; border-radius: 10px; border: 1.5px solid #e8e8e8; font-size: 13.5px; background: #f8f8f8; color: #1a1a1a; font-family: 'DM Sans', sans-serif; width: 230px; outline: none; transition: border-color .15s, box-shadow .15s; }
        .av-search::placeholder { color: #bbb; }
        .av-search:focus { border-color: #e03030; background: #fff; box-shadow: 0 0 0 3px rgba(224,48,48,.1); }

        /* pagination */
        .av-pgbtn { padding: 6px 11px; border-radius: 8px; font-size: 12.5px; font-family: 'DM Sans', sans-serif; border: 1px solid #e8e8e8; background: #fff; color: #444; cursor: pointer; transition: background .12s; }
        .av-pgbtn:hover:not(:disabled) { background: #f5f5f5; }
        .av-pgbtn.active { background: #e03030; color: #fff; border-color: #e03030; font-weight: 600; }
        .av-pgbtn:disabled { opacity: .4; cursor: not-allowed; }

        /* delete modal */
        .av-modal-backdrop { position: fixed; inset: 0; background: rgba(10,10,10,.45); backdrop-filter: blur(4px); z-index: 9998; display: flex; align-items: center; justify-content: center; animation: av-fade .16s ease; }
        .av-modal { background: #fff; border-radius: 18px; width: 320px; overflow: hidden; animation: av-rise .2s cubic-bezier(.34,1.3,.64,1); box-shadow: 0 24px 60px rgba(0,0,0,.16); }
        @keyframes av-fade { from{opacity:0} to{opacity:1} }
        @keyframes av-rise { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }

        .av-empty { text-align: center; padding: 48px; color: #bbb; font-size: 14px; }

        @media (max-width: 600px) {
          .av-stats { grid-template-columns: 1fr 1fr; }
          .av-search { width: 100%; }
        }
      `}</style>

      <div className="av-root">

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#111" }}>
              Available Products
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#999" }}>
              {total} product{total !== 1 ? "s" : ""} in inventory
            </p>
          </div>
          <div className="av-search-wrap">
            <span className="av-search-icon">⌕</span>
            <input
              ref={searchRef}
              className="av-search"
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="av-stats">
          {[
            { label: "Total products", value: data.length,  cls: "" },
            { label: "In stock",       value: inStock,      cls: "green" },
            { label: "Out of stock",   value: outStock,     cls: "red" },
            { label: "Low stock",      value: lowStock,     cls: "amber" },
          ].map((s) => (
            <div key={s.label} className="av-stat">
              <p className="av-stat-label">{s.label}</p>
              <p className={`av-stat-value ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="av-card">
          <table className="av-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>ID</th>
                <th>Product</th>
                <th style={{ width: 90 }}>Stock</th>
                <th style={{ width: 110 }}>Purchase</th>
                <th style={{ width: 100 }}>Retail</th>
                <th style={{ width: 110 }}>Wholesale</th>
                <th style={{ width: 130, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "#bbb" }}>
                    <span style={{ display: "inline-block", animation: "av-pulse 1s ease-in-out infinite" }}>
                      Loading…
                    </span>
                    <style>{`@keyframes av-pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="av-empty">No products found</td>
                </tr>
              ) : (
                data.map((d) => (
                  <tr key={d.Product_Id}>
                    <td><span className="av-id">#{d.Product_Id}</span></td>
                    <td><span className="av-name">{d.Product_Name}</span></td>
                    <td><StockBadge qty={d.Quantity} /></td>
                    <td><span className="av-price">Rs {Number(d.Product_Price).toLocaleString()}</span></td>
                    <td><span className="av-price blue">Rs {Number(d.selling_Price).toLocaleString()}</span></td>
                    <td><span className="av-price purple">Rs {Number(d.Wholesale_Price).toLocaleString()}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          className="av-btn edit"
                          onClick={() => {
                            setEditProduct({
                              productname:    d.Product_Name,
                              sellingprice:   d.selling_Price,
                              wholesaleprice: d.Wholesale_Price,
                              purchasedprice: d.Product_Price,
                              productid:      d.Product_Id,
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="av-btn del"
                          onClick={() => setDeleteConfirm(d.Product_Id)}
                          disabled={deletingId === d.Product_Id}
                        >
                          {deletingId === d.Product_Id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: "12px", color: "#aaa" }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                <button className="av-pgbtn" disabled={currentPage === 1} onClick={() => load(currentPage - 1, search)}>
                  ←
                </button>
                {pageRange.map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} style={{ padding: "6px 4px", fontSize: "12px", color: "#ccc" }}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`av-pgbtn ${currentPage === p ? "active" : ""}`}
                      onClick={() => load(p, search)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button className="av-pgbtn" disabled={currentPage === totalPages} onClick={() => load(currentPage + 1, search)}>
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Delete confirmation ── */}
        {deleteConfirm && (
          <div className="av-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
            <div className="av-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ height: "4px", background: "linear-gradient(90deg,#e03030,#ff7a7a,#e03030)" }} />
              <div style={{ padding: "24px 24px 20px" }}>
                <h2 style={{ margin: "0 0 8px", fontSize: "17px", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#111" }}>
                  Delete Product?
                </h2>
                <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#888" }}>
                  This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{ padding: "9px 18px", borderRadius: "9px", border: "1px solid #e8e8e8", background: "#f5f5f5", color: "#555", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{ padding: "9px 18px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#e03030,#b51c1c)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit dialog ── */}
        <UpdateAvailableProducts
          isOpen={open}
          onClose={() => setOpen(false)}
          load={() => load(currentPage, search)}
          productname={editProduct.productname}
          sellingprice={editProduct.sellingprice}
          wholesaleprice={editProduct.wholesaleprice}
          purchasedprice={editProduct.purchasedprice}
          productid={editProduct.productid}
        />
      </div>
    </>
  );
};

export default AvailableProducts;