import axios from "axios";
import React, { useEffect, useState, useRef, useCallback } from "react";

const API = "http://localhost:8081";
const fmt = (n) => "Rs " + Number(n || 0).toLocaleString("en-PK");

const PurchaseProducts = () => {
  const [data,       setData]       = useState([]);
  const [cart,       setCart]       = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [suppliers,  setSuppliers]  = useState([]);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [placing,    setPlacing]    = useState(false);
  const [toast,      setToast]      = useState(null);
  const [rawQty,     setRawQty]     = useState({});
  const ITEMS_PER_PAGE = 8;
  const searchRef = useRef(null);

  // ── toast ──────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // ── load ───────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("AUTO_PURCHASE_CART");
    if (saved) { setCart(JSON.parse(saved)); localStorage.removeItem("AUTO_PURCHASE_CART"); }
    Promise.all([
      axios.get(`${API}/Products/getdata`),
      axios.get(`${API}/Supplier/suppliers`),
    ]).then(([prod, sup]) => {
      setData(prod.data.data || []);
      setSuppliers(sup.data || []);
    }).finally(() => setLoading(false));
  }, []);

  // ── filter / pagination ────────────────────────────────────
  const filtered   = data.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return p.Product_Name?.toLowerCase().includes(q) || p.Product_Key?.toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // ── search handler ─────────────────────────────────────────
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
    const exact = data.find((p) => p.Product_Key?.toLowerCase() === value.toLowerCase().trim());
    if (exact) addToCart(exact);
  };

  // ── add to cart ────────────────────────────────────────────
  const addToCart = (p) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product_id === p.Product_Id);
      if (exists) {
        showToast(`+1 · ${p.Product_Name}`);
        return prev.map((i) => i.product_id === p.Product_Id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      showToast(`Added · ${p.Product_Name}`);
      return [...prev, { product_id: p.Product_Id, name: p.Product_Name, price: p.Product_Price, quantity: 1 }];
    });
    if (search) setSearch("");
  };

  // ── qty controls ───────────────────────────────────────────
  const increaseQty = (id) =>
    setCart((prev) => prev.map((i) => i.product_id === id ? { ...i, quantity: i.quantity + 1 } : i));

  const decreaseQty = (id) =>
    setCart((prev) =>
      prev.map((i) => i.product_id === id ? { ...i, quantity: i.quantity - 1 } : i)
          .filter((i) => i.quantity > 0)
    );

  const handleQtyChange = (id, value) =>
    setRawQty((prev) => ({ ...prev, [id]: value }));

  const handleQtyBlur = (id) => {
    const raw = rawQty[id];
    if (raw === undefined) return;
    const qty = parseInt(raw, 10);
    if (!isNaN(qty) && qty > 0) {
      setCart((prev) => prev.map((i) => i.product_id === id ? { ...i, quantity: qty } : i));
    } else {
      setCart((prev) => prev.filter((i) => i.product_id !== id));
    }
    setRawQty((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.product_id !== id));

  const totalItems = cart.reduce((a, b) => a + b.quantity, 0);
  const totalCost  = cart.reduce((a, b) => a + b.quantity * Number(b.price), 0);
  const inCart     = new Set(cart.map((i) => i.product_id));

  // ── place order ────────────────────────────────────────────
  const placeOrder = async () => {
    if (!supplierId) { showToast("Please select a supplier", "err"); return; }
    if (!cart.length) { showToast("Cart is empty", "err"); return; }
    setPlacing(true);
    try {
      await axios.post(`${API}/Supplier/create-order`, { supplier_id: supplierId, items: cart });
      showToast("Order placed successfully ✓");
      setCart([]); setSupplierId("");
    } catch { showToast("Failed to place order", "err"); }
    setPlacing(false);
  };

  // ════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');

        .pur-root  { font-family:'DM Sans',sans-serif; background:#f4f6fb; min-height:100vh; }
        .pur-root * { box-sizing:border-box; }

        /* ── product card ──────────────────────────────── */
        /*  KEY FIX:
            1. overflow:visible  — so nothing clips the button
            2. ::before gets pointer-events:none  — so the gradient
               layer never intercepts clicks
            3. all direct children get position:relative + z-index:1
               so they always sit above the ::before layer          */
        .prod-card {
          background:#fff;
          border-radius:18px;
          border:1.5px solid #e8edf5;
          padding:18px;
          display:flex;
          flex-direction:column;
          gap:8px;
          transition:transform .18s, box-shadow .18s, border-color .18s;
          position:relative;
          overflow:visible;          /* ← was overflow:hidden — that was clipping clicks */
        }
        .prod-card::before {
          content:'';
          position:absolute;
          inset:0;
          border-radius:17px;
          background:linear-gradient(135deg,#f0f7ff 0%,transparent 60%);
          opacity:0;
          transition:opacity .2s;
          pointer-events:none;       /* ← pseudo-element must NEVER catch clicks */
          z-index:0;
        }
        /* every direct child floats above the ::before layer */
        .prod-card > * { position:relative; z-index:1; }

        .prod-card:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(30,80,200,.1); border-color:#c2d4f8; }
        .prod-card:hover::before { opacity:1; }
        .prod-card.in-cart { border-color:#22c55e; background:#f0fdf4; }
        .prod-card.in-cart::before { background:linear-gradient(135deg,#f0fdf4,transparent); opacity:1; }

        /* ── add button ────────────────────────────────── */
        .add-btn {
          margin-top:auto;
          padding:10px 0;
          border-radius:11px;
          border:none;
          background:linear-gradient(135deg,#2563eb,#3b82f6);
          color:#fff;
          font-weight:700;
          font-size:13px;
          cursor:pointer;
          font-family:inherit;
          transition:opacity .15s, transform .12s;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:5px;
          position:relative;
          z-index:2;               /* always on top */
          width:100%;
        }
        .add-btn:hover  { opacity:.88; transform:scale(1.02); }
        .add-btn:active { transform:scale(.97); }
        .add-btn.added  { background:linear-gradient(135deg,#16a34a,#22c55e); }

        /* ── in-cart badge ─────────────────────────────── */
        .cart-badge {
          position:absolute;
          top:10px; right:10px;
          background:#22c55e;
          color:#fff;
          font-size:10px;
          font-weight:800;
          padding:2px 8px;
          border-radius:99px;
          letter-spacing:.4px;
          pointer-events:none;
          z-index:2;
        }

        /* ── cart item ─────────────────────────────────── */
        .cart-item {
          background:#f8faff;
          border:1.5px solid #e8edf5;
          border-radius:14px;
          padding:12px 14px;
          margin-bottom:8px;
          transition:border-color .15s;
        }
        .cart-item:hover { border-color:#c2d4f8; }

        /* ── qty buttons ───────────────────────────────── */
        .qty-btn {
          width:28px; height:28px;
          border-radius:8px;
          border:none;
          font-size:16px;
          font-weight:700;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          transition:transform .1s;
          flex-shrink:0;
          line-height:1;
        }
        .qty-btn:active { transform:scale(.88); }
        .qty-btn.minus { background:#fee2e2; color:#dc2626; }
        .qty-btn.plus  { background:#dcfce7; color:#16a34a; }

        /* ── pagination ────────────────────────────────── */
        .pg-btn {
          width:36px; height:36px;
          border-radius:9px;
          border:1.5px solid #e2e8f0;
          background:#fff;
          font-size:13px;
          font-weight:700;
          cursor:pointer;
          font-family:inherit;
          transition:all .15s;
          display:flex; align-items:center; justify-content:center;
        }
        .pg-btn:hover:not(:disabled):not(.active) { background:#eff6ff; border-color:#93c5fd; color:#2563eb; }
        .pg-btn.active  { background:#2563eb; color:#fff; border-color:#2563eb; }
        .pg-btn:disabled { opacity:.35; cursor:not-allowed; }

        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(12px) scale(.95)} to{opacity:1;transform:none} }
        .fade-in { animation:slideUp .3s ease both; }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
        input:focus, select:focus { outline:none; }
      `}</style>

      {/* ── TOAST ──────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:99999,
          background: toast.type === "err" ? "#dc2626" : "#16a34a",
          color:"#fff", padding:"12px 22px", borderRadius:14,
          fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
          boxShadow:"0 6px 28px rgba(0,0,0,.18)",
          animation:"toastIn .28s cubic-bezier(.34,1.56,.64,1)",
          pointerEvents:"none",
        }}>{toast.msg}</div>
      )}

      <div className="pur-root" style={{ padding:"28px 28px 60px" }}>

        {/* ── HEADER ─────────────────────────────────────── */}
        <div style={{ marginBottom:26 }}>
          <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:32, fontWeight:400, color:"#0f172a", margin:0, letterSpacing:"-.5px" }}>
            Purchase System
          </h1>
          <p style={{ fontSize:13, color:"#64748b", marginTop:4 }}>
            {data.length} products available · {cart.length} item{cart.length !== 1 ? "s" : ""} in cart
          </p>
        </div>

        {/* ── SEARCH ─────────────────────────────────────── */}
        <div style={{ position:"relative", maxWidth:460, marginBottom:24 }}>
          <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#94a3b8", pointerEvents:"none" }}>🔍</span>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or scan QR code…"
            style={{
              width:"100%", padding:"11px 40px 11px 40px",
              borderRadius:14, border:"1.5px solid #e2e8f0",
              fontSize:13, background:"#fff", fontFamily:"inherit",
              boxShadow:"0 1px 4px rgba(0,0,0,.05)", transition:"border-color .15s",
            }}
            onFocus={(e) => e.target.style.borderColor="#3b82f6"}
            onBlur={(e)  => e.target.style.borderColor="#e2e8f0"}
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:16, lineHeight:1 }}>
              ✕
            </button>
          )}
        </div>

        {/* ── MAIN LAYOUT ────────────────────────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:22, alignItems:"start" }}>

          {/* ── PRODUCTS ───────────────────────────────────── */}
          <div>
            {loading ? (
              <div style={{ textAlign:"center", padding:"64px 0", color:"#94a3b8" }}>
                <div style={{ fontSize:32, marginBottom:10 }}>⏳</div>
                <p style={{ margin:0, fontSize:14 }}>Loading products…</p>
              </div>
            ) : paginated.length === 0 ? (
              <div style={{ textAlign:"center", padding:"64px 0", color:"#94a3b8" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📦</div>
                <p style={{ margin:0, fontSize:14 }}>No products found for "{search}"</p>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:14 }}>
                {paginated.map((p, idx) => {
                  const added    = inCart.has(p.Product_Id);
                  const cartItem = cart.find((i) => i.product_id === p.Product_Id);
                  return (
                    <div
                      key={p.Product_Id}
                      className={`prod-card fade-in${added ? " in-cart" : ""}`}
                      style={{ animationDelay:`${idx * 35}ms` }}
                    >
                      {/* badge — pointer-events:none so it never blocks button */}
                      {added && (
                        <span className="cart-badge">✓ {cartItem?.quantity}×</span>
                      )}

                      {/* icon */}
                      <div style={{
                        width:44, height:44, borderRadius:12, flexShrink:0,
                        background: added
                          ? "#dcfce7"
                          : "linear-gradient(135deg,#eff6ff,#dbeafe)",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
                      }}>📦</div>

                      <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:"#0f172a", lineHeight:1.35 }}>
                        {p.Product_Name}
                      </h3>

                      {p.Product_Key && (
                        <p style={{ margin:0, fontSize:11, color:"#94a3b8", fontWeight:500 }}>
                          🔑 {p.Product_Key}
                        </p>
                      )}

                      <p style={{ margin:"2px 0 4px", fontSize:15, fontWeight:700, color:"#2563eb" }}>
                        {fmt(p.Product_Price)}
                      </p>

                      {/* ↓ button — z-index:2 ensures it's always clickable */}
                      <button
                        className={`add-btn${added ? " added" : ""}`}
                        onClick={() => addToCart(p)}
                      >
                        {added ? "✓ Add More" : "+ Add to Cart"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* pagination */}
            {totalPages > 1 && (
              <>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:22, flexWrap:"wrap" }}>
                  <button className="pg-btn" disabled={page===1}
                    onClick={() => setPage((p) => Math.max(p-1,1))}
                    style={{ width:"auto", padding:"0 14px" }}>← Prev</button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let num;
                    if (totalPages <= 7)         num = i + 1;
                    else if (page <= 4)          num = i + 1;
                    else if (page >= totalPages-3) num = totalPages - 6 + i;
                    else                         num = page - 3 + i;
                    return (
                      <button key={num} className={`pg-btn${page===num?" active":""}`}
                        onClick={() => setPage(num)}>{num}</button>
                    );
                  })}

                  <button className="pg-btn" disabled={page===totalPages}
                    onClick={() => setPage((p) => Math.min(p+1,totalPages))}
                    style={{ width:"auto", padding:"0 14px" }}>Next →</button>
                </div>
                <p style={{ textAlign:"center", fontSize:11, color:"#94a3b8", marginTop:8 }}>
                  Page {page} of {totalPages} — {filtered.length} products
                </p>
              </>
            )}
          </div>

          {/* ── CART PANEL ─────────────────────────────────── */}
          <div style={{
            background:"#fff", borderRadius:22,
            border:"1.5px solid #e8edf5",
            boxShadow:"0 4px 24px rgba(0,0,0,.06)",
            overflow:"hidden",
            position:"sticky", top:20,
          }}>
            {/* header */}
            <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #f1f5f9", background:"linear-gradient(135deg,#f8faff,#fff)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a", fontFamily:"'Instrument Serif',serif", letterSpacing:"-.3px" }}>
                  🧾 Order Cart
                </h2>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])}
                    style={{ fontSize:11, color:"#ef4444", background:"#fef2f2", border:"none", padding:"4px 10px", borderRadius:8, cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>
                    Clear All
                  </button>
                )}
              </div>

              {/* supplier */}
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                style={{ marginTop:12, width:"100%", padding:"10px 12px", borderRadius:11, border:"1.5px solid #e2e8f0", fontSize:13, fontFamily:"inherit", background:"#f8fafc", color: supplierId ? "#0f172a" : "#94a3b8", cursor:"pointer" }}
                onFocus={(e) => e.target.style.borderColor="#3b82f6"}
                onBlur={(e)  => e.target.style.borderColor="#e2e8f0"}
              >
                <option value="">— Select Supplier —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* items */}
            <div style={{ padding:"14px 16px", maxHeight:"42vh", overflowY:"auto" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign:"center", padding:"28px 0", color:"#cbd5e1" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🛒</div>
                  <p style={{ margin:0, fontSize:12, fontWeight:600 }}>Cart is empty</p>
                  <p style={{ margin:"4px 0 0", fontSize:11 }}>Click a product to add it</p>
                </div>
              ) : (
                cart.map((item) => {
                  const displayVal = rawQty[item.product_id] !== undefined
                    ? rawQty[item.product_id]
                    : item.quantity;
                  return (
                    <div key={item.product_id} className="cart-item">
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                            {item.name}
                          </p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:"#3b82f6", fontWeight:600 }}>
                            {fmt(item.price)} × {item.quantity} = {fmt(item.price * item.quantity)}
                          </p>
                        </div>
                        <button onClick={() => removeFromCart(item.product_id)}
                          style={{ border:"none", background:"none", color:"#cbd5e1", cursor:"pointer", fontSize:15, padding:"0 0 0 8px", lineHeight:1 }}>
                          ✕
                        </button>
                      </div>

                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <button className="qty-btn minus" onClick={() => decreaseQty(item.product_id)}>−</button>
                        <input
                          type="number"
                          min={1}
                          value={displayVal}
                          onChange={(e) => handleQtyChange(item.product_id, e.target.value)}
                          onBlur={() => handleQtyBlur(item.product_id)}
                          onFocus={(e) => e.target.select()}
                          style={{ width:52, height:28, textAlign:"center", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, fontWeight:700, fontFamily:"inherit", background:"#fff" }}
                        />
                        <button className="qty-btn plus" onClick={() => increaseQty(item.product_id)}>+</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* footer */}
            {cart.length > 0 && (
              <div style={{ padding:"14px 16px 18px", borderTop:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:12, color:"#64748b" }}>Total Items</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{totalItems}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14, paddingBottom:12, borderBottom:"1px dashed #e8edf5" }}>
                  <span style={{ fontSize:12, color:"#64748b" }}>Est. Total Cost</span>
                  <span style={{ fontSize:16, fontWeight:800, color:"#2563eb" }}>{fmt(totalCost)}</span>
                </div>
                <button onClick={placeOrder} disabled={placing}
                  style={{
                    width:"100%", padding:"13px 0", borderRadius:14, border:"none",
                    background: placing ? "#d1d5db" : "linear-gradient(135deg,#16a34a,#22c55e)",
                    color:"#fff", fontWeight:800, fontSize:14,
                    cursor: placing ? "not-allowed" : "pointer", fontFamily:"inherit",
                    boxShadow: placing ? "none" : "0 4px 16px rgba(34,197,94,.3)",
                    transition:"all .2s",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}>
                  {placing ? "⏳ Placing Order…" : "✅ Place Order"}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default PurchaseProducts;