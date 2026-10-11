import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

const fmt = (n) => Number(n).toLocaleString("en-PK", { minimumFractionDigits: 0 });
const API  = "http://localhost:8081/Loans";

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

const METHOD_PILL = {
  cash:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
  bank:   "bg-blue-100   text-blue-700   border border-blue-200",
  online: "bg-violet-100 text-violet-700 border border-violet-200",
};

const MODAL_OVERLAY = {
  position: "fixed", inset: 0, zIndex: 99999,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)",
  fontFamily: "'Inter', sans-serif",
};

// ============================
// 📅 DUE DATE BADGE HELPER
// ============================
const DueDateBadge = ({ due_date, isPaid }) => {
  if (!due_date) return <span className="text-slate-300 text-xs">—</span>;

  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const due      = new Date(due_date); due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  const formatted = due.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

  if (isPaid) {
    return (
      <span className="text-xs text-slate-400">
        📅 {formatted}
      </span>
    );
  }

  if (diffDays < 0) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
          🔴 {formatted}
        </span>
        <p className="text-[10px] text-red-400 mt-0.5 font-semibold">{Math.abs(diffDays)}d overdue</p>
      </div>
    );
  }

  if (diffDays === 0) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
          🟡 {formatted}
        </span>
        <p className="text-[10px] text-amber-500 mt-0.5 font-semibold">Due today!</p>
      </div>
    );
  }

  if (diffDays <= 7) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
          🟠 {formatted}
        </span>
        <p className="text-[10px] text-orange-400 mt-0.5 font-semibold">In {diffDays}d</p>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
      📅 {formatted}
    </span>
  );
};


/* ═══════════════════════════════════════════════════════
   PAYMENT HISTORY MODAL
═══════════════════════════════════════════════════════ */
const HistoryModal = ({ loan, onClose }) => {
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 5;

  const fetchHistory = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/payments/${loan.loan_id}`, {
        params: { page: p, limit: LIMIT },
      });
      setHistory(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || 1);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [loan.loan_id]);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const isPaid = loan.status === "paid" || loan.status === "completed";

  return (
    <Portal>
      <div style={MODAL_OVERLAY} onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 mx-4"
        >
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
            <div className="flex items-start justify-between mr-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Payment History</p>
                <h2 className="text-xl font-bold text-white">{loan.customer_name}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{loan.phone}</p>
                {/* ✅ NEW: show due date in history modal header */}
                {loan.due_date && (
                  <div className="mt-2">
                    <DueDateBadge due_date={loan.due_date} isPaid={isPaid} />
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                <p className="text-2xl font-black text-red-400">Rs {fmt(loan.remaining_amount)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{total} payment{total !== 1 ? "s" : ""} recorded</p>
              </div>
            </div>
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-sm">✕</button>
          </div>

          <div className="px-6 py-4 min-h-[280px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
                <p className="text-sm text-slate-400">Loading payments…</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="text-5xl mb-3">🧾</span>
                <p className="text-sm font-semibold text-slate-500">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((p, idx) => (
                  <div key={p.id}
                    className="flex items-center gap-4 rounded-xl px-4 py-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(page - 1) * LIMIT + idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(p.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {p.received_by ? `Received by ${p.received_by}` : "—"}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${METHOD_PILL[p.payment_method] || "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                      {p.payment_method}
                    </span>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400">
                        <span className="text-red-500 font-medium">Rs {fmt(p.previous_remaining)}</span>
                        {" → "}
                        <span className="text-emerald-600 font-medium">Rs {fmt(p.new_remaining)}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-black text-emerald-600">+ Rs {fmt(p.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => fetchHistory(page - 1)} disabled={page === 1 || loading}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40">← Prev</button>
              <span className="text-sm text-slate-500">{page} / {totalPages}</span>
              <button onClick={() => fetchHistory(page + 1)} disabled={page === totalPages || loading}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40">Next →</button>
            </div>
            <button onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100">Close</button>
          </div>
        </div>
      </div>
    </Portal>
  );
};


/* ═══════════════════════════════════════════════════════
   PAY MODAL
═══════════════════════════════════════════════════════ */
const PayModal = ({ loan, onClose, onSuccess }) => {
  const [amount,      setAmount]      = useState(loan.remaining_amount);
  const [receivedBy,  setReceivedBy]  = useState("");
  const [payMethod,   setPayMethod]   = useState("cash");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  const validate = (val) => {
    const n = Number(val);
    if (!val || n <= 0)              { setError("Amount must be greater than 0"); return false; }
    if (n > loan.remaining_amount)   { setError(`Cannot exceed Rs ${fmt(loan.remaining_amount)}`); return false; }
    setError(""); return true;
  };

  const submit = async () => {
    if (!validate(amount)) return;
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/receive-payment`, {
        loan_id: loan.loan_id,
        amount: Number(amount),
        payment_method: payMethod,
        received_by: receivedBy || null,
      });
      onSuccess();
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err);
      setError(err.response?.data?.message || "Payment failed");
    }
    setLoading(false);
  };

  const pct     = Math.min(Math.round((Number(amount) / loan.remaining_amount) * 100) || 0, 100);
  const paidPct = Math.round((Number(loan.paid_amount) / Number(loan.total_amount)) * 100) || 0;
  const isPaid  = loan.status === "paid" || loan.status === "completed";

  return (
    <Portal>
      <div style={MODAL_OVERLAY} onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 mx-4"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Receive Payment</p>
            <h2 className="text-xl font-bold text-white">{loan.customer_name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{loan.phone}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                loan.loan_type === "product_loan"
                  ? "bg-violet-400/20 text-violet-200 border border-violet-400/30"
                  : "bg-blue-400/20 text-blue-200 border border-blue-400/30"
              }`}>
                {loan.loan_type === "product_loan" ? "📦 Product Loan" : "💵 Cash Loan"}
              </span>
              {/* ✅ NEW: due date badge in pay modal header */}
              {loan.due_date && (
                <div className="text-xs">
                  <DueDateBadge due_date={loan.due_date} isPaid={isPaid} />
                </div>
              )}
            </div>
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm">✕</button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Loan summary */}
            <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Total Loan</span><span>Remaining</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold text-slate-800">Rs {fmt(loan.total_amount)}</span>
                <span className="text-lg font-black text-red-500">Rs {fmt(loan.remaining_amount)}</span>
              </div>
              <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all"
                  style={{ width: `${paidPct}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{paidPct}% paid · Rs {fmt(loan.paid_amount)} collected</p>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Payment Amount (Rs)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rs</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); validate(e.target.value); }}
                  min="1"
                  max={loan.remaining_amount}
                  className="w-full rounded-xl pl-9 pr-4 py-3 text-base font-bold text-slate-800 outline-none transition-all border"
                  style={{ borderColor: error ? "#ef4444" : "#e2e8f0" }}
                />
              </div>
              {!error && Number(amount) > 0 && (
                <>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-emerald-600 font-semibold">✓ {pct}% of remaining balance</p>
                </>
              )}
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Payment Method
              </label>
              <div className="flex gap-2">
                {["cash", "bank", "online"].map((m) => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                      payMethod === m
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}>{m}</button>
                ))}
              </div>
            </div>

            {/* Received by */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Received By (optional)
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Staff name or leave blank"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 bg-slate-50 transition-all"
              />
            </div>

            {/* Error banner */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-semibold text-red-600">⚠ {error}</p>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={submit}
              disabled={!!error || !amount || Number(amount) <= 0 || loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Processing…" : "Confirm Payment"}
            </button>
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};


/* ═══════════════════════════════════════════════════════
   PRICE TOGGLE
═══════════════════════════════════════════════════════ */
const PriceToggle = ({ value, onChange, hasWholesale }) => (
  <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
    <button onClick={() => onChange("retail")}
      className={`px-2.5 py-1 transition-all ${value === "retail"
        ? "bg-blue-600 text-white"
        : "bg-white text-slate-500 hover:bg-slate-50"}`}>Retail</button>
    <button onClick={() => onChange("wholesale")} disabled={!hasWholesale}
      className={`px-2.5 py-1 border-l border-slate-200 transition-all ${value === "wholesale"
        ? "bg-violet-600 text-white"
        : "bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"}`}>Wholesale</button>
  </div>
);


/* ═══════════════════════════════════════════════════════
   ADD PRODUCT LOAN MODAL
═══════════════════════════════════════════════════════ */
const AddLoanModal = ({ onClose, onSuccess }) => {
  const [step,             setStep]             = useState(1);
  const [customer,         setCustomer]         = useState(null);
  const [custSearch,       setCustSearch]       = useState("");
  const [customers,        setCustomers]        = useState([]);
  const [custLoading,      setCustLoading]      = useState(false);
  const [existingLoan,     setExistingLoan]     = useState(null);
  const [existingChecking, setExistingChecking] = useState(false);
  const [prodSearch,       setProdSearch]       = useState("");
  const [products,         setProducts]         = useState([]);
  const [prodLoading,      setProdLoading]      = useState(false);
  const [barcodeInput,     setBarcodeInput]     = useState("");
  const [barcodeLoading,   setBarcodeLoading]   = useState(false);
  const [barcodeError,     setBarcodeError]     = useState("");
  const [cart,             setCart]             = useState([]);
  const [discount,         setDiscount]         = useState(0);
  const [downPayment,      setDownPayment]      = useState(0);
  const [notes,            setNotes]            = useState("");
  const [dueDate,          setDueDate]          = useState("");   // ✅ NEW
  const [submitting,       setSubmitting]       = useState(false);
  const [submitError,      setSubmitError]      = useState("");

  const custTimer = useRef(null);
  const prodTimer = useRef(null);

  // Today's date string for min attribute on date input
  const todayStr = new Date().toISOString().split("T")[0];  // ✅ NEW

  useEffect(() => {
    if (!custSearch.trim()) { setCustomers([]); return; }
    clearTimeout(custTimer.current);
    custTimer.current = setTimeout(async () => {
      setCustLoading(true);
      try {
        const res = await axios.get(`${API}/customers`, { params: { search: custSearch } });
        setCustomers(res.data.data || []);
      } catch { setCustomers([]); }
      setCustLoading(false);
    }, 350);
  }, [custSearch]);

  const selectCustomer = async (c) => {
    setCustomer(c); setStep(2); setExistingChecking(true);
    try {
      const res = await axios.get(`${API}/existing-loan/${c.customer_id}`);
      setExistingLoan(res.data.data || null);
    } catch { setExistingLoan(null); }
    setExistingChecking(false);
  };

  useEffect(() => {
    if (!prodSearch.trim()) { setProducts([]); return; }
    clearTimeout(prodTimer.current);
    prodTimer.current = setTimeout(async () => {
      setProdLoading(true);
      try {
        const res = await axios.get(`${API}/products`, { params: { search: prodSearch } });
        setProducts(res.data.data || []);
      } catch { setProducts([]); }
      setProdLoading(false);
    }, 350);
  }, [prodSearch]);

  const lookupBarcode = async (key) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setBarcodeLoading(true); setBarcodeError("");
    try {
      const res = await axios.get(`${API}/product-by-key`, { params: { key: trimmed } });
      addToCart(res.data.data);
      setBarcodeInput("");
    } catch (err) {
      setBarcodeError(err.response?.data?.message || "Product not found");
    }
    setBarcodeLoading(false);
  };

  const handleBarcodeKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); lookupBarcode(barcodeInput); }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      if (prev.find((i) => i.Ap_Id === product.Ap_Id)) return prev;
      return [...prev, { ...product, quantity: 1, priceMode: "retail", sale_price: Number(product.selling_Price) }];
    });
    setProdSearch(""); setProducts([]); setBarcodeError("");
  };

  const updatePriceMode = (Ap_Id, mode) =>
    setCart((prev) => prev.map((i) => {
      if (i.Ap_Id !== Ap_Id) return i;
      const price = mode === "wholesale" && i.Wholesale_Price ? Number(i.Wholesale_Price) : Number(i.selling_Price);
      return { ...i, priceMode: mode, sale_price: price };
    }));

  const updateQty       = (Ap_Id, val) => setCart((prev) => prev.map((i) => i.Ap_Id === Ap_Id ? { ...i, quantity: val } : i));
  const removeFromCart  = (Ap_Id)      => setCart((prev) => prev.filter((i) => i.Ap_Id !== Ap_Id));

  const totalAmount = cart.reduce((s, i) => s + i.sale_price * i.quantity, 0);
  const netAmount   = Math.max(0, totalAmount - Number(discount));
  const loanBalance = Math.max(0, netAmount - Number(downPayment));

  const canSubmit =
    cart.length > 0 &&
    cart.every((i) => i.quantity >= 1 && i.quantity <= i.stock) &&
    Number(downPayment) <= netAmount;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true); setSubmitError("");
    try {
      const res = await axios.post(`${API}/add-product-loan`, {
        customer_id: customer.customer_id,
        items: cart.map((i) => ({
          Ap_Id: i.Ap_Id, product_id: i.product_id, Product_Name: i.Product_Name,
          quantity: Number(i.quantity), sale_price: Number(i.sale_price),
          Wholesale_Price: i.Wholesale_Price, selling_Price: i.selling_Price,
        })),
        discount: Number(discount),
        paid_amount: Number(downPayment),
        notes,
        due_date: dueDate || null,   // ✅ NEW: send due_date to backend
      });
      onSuccess(res.data.merged);
    } catch (err) {
      console.error("Add loan error:", err);
      setSubmitError(err.response?.data?.message || "Failed to create loan.");
    }
    setSubmitting(false);
  };

  return (
    <Portal>
      <div style={MODAL_OVERLAY} onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col mx-4"
          style={{ maxHeight: "92vh" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-6 py-5 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between mr-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-1">New Product Loan</p>
                <h2 className="text-xl font-bold text-white">
                  {step === 1 ? "Select Customer" : customer?.name}
                </h2>
                {step === 2 && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-sm text-indigo-200">{customer?.phone}</p>
                    {existingChecking && <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-indigo-300 animate-spin" />}
                    {!existingChecking && existingLoan && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 font-semibold">
                        ⚡ Has pending loan — will merge
                      </span>
                    )}
                    {!existingChecking && !existingLoan && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 font-semibold">
                        ✦ New loan
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {[1, 2].map((s) => (
                  <div key={s} className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-all ${
                    step === s ? "bg-white text-indigo-700 border-white"
                    : step > s  ? "bg-indigo-400 text-white border-indigo-300"
                    : "bg-transparent text-indigo-300 border-indigo-400"
                  }`}>{s}</div>
                ))}
              </div>
            </div>
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm">✕</button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">

            {/* STEP 1 — customer search */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Search Customer</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input autoFocus
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-indigo-400 bg-slate-50 transition-all"
                      placeholder="Type customer name or phone…"
                      value={custSearch}
                      onChange={(e) => setCustSearch(e.target.value)}
                    />
                  </div>
                </div>
                {custLoading && <div className="flex justify-center py-6"><div className="w-6 h-6 rounded-full border-2 border-t-transparent border-indigo-500 animate-spin" /></div>}
                {customers.length > 0 && (
                  <div className="space-y-1.5">
                    {customers.map((c) => (
                      <button key={c.customer_id} onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.phone || "No phone"}</p>
                        </div>
                        <span className="ml-auto text-slate-300 text-lg">→</span>
                      </button>
                    ))}
                  </div>
                )}
                {custSearch && !custLoading && customers.length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-3xl block mb-2">👤</span>
                    <p className="text-sm text-slate-400">No customers found for "{custSearch}"</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 — add products */}
            {step === 2 && (
              <div className="space-y-5">
                {existingLoan && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">⚡</span>
                    <div>
                      <p className="text-sm font-bold text-amber-800">Existing pending loan found</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Invoice <span className="font-mono font-semibold">{existingLoan.invoice_no}</span> ·
                        Remaining <span className="font-semibold">Rs {fmt(existingLoan.remaining_amount)}</span>
                      </p>
                      <p className="text-xs text-amber-500 mt-1">New products will be added to this loan.</p>
                    </div>
                  </div>
                )}

                {/* Barcode */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Scan Barcode / QR</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base select-none">▦</span>
                      <input
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-mono text-slate-700 outline-none bg-slate-50 transition-all ${barcodeError ? "border-red-400" : "border-slate-200 focus:border-indigo-400"}`}
                        placeholder="Scan or type barcode, press Enter…"
                        value={barcodeInput}
                        onChange={(e) => { setBarcodeInput(e.target.value); setBarcodeError(""); }}
                        onKeyDown={handleBarcodeKey}
                      />
                    </div>
                    <button onClick={() => lookupBarcode(barcodeInput)} disabled={!barcodeInput.trim() || barcodeLoading}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40 flex-shrink-0 min-w-[56px] flex items-center justify-center">
                      {barcodeLoading ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin" /> : "Add"}
                    </button>
                  </div>
                  {barcodeError && <p className="mt-1.5 text-xs font-semibold text-red-500">⚠ {barcodeError}</p>}
                </div>

                {/* Product name search */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Search by Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📦</span>
                    <input
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-indigo-400 bg-slate-50 transition-all"
                      placeholder="Type product name…"
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                    />
                  </div>
                  {prodLoading && <div className="flex justify-center py-3"><div className="w-5 h-5 rounded-full border-2 border-t-transparent border-indigo-500 animate-spin" /></div>}
                  {products.length > 0 && (
                    <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      {products.map((p, idx) => {
                        const inCart = cart.some((c) => c.Ap_Id === p.Ap_Id);
                        return (
                          <button key={p.Ap_Id} onClick={() => !inCart && addToCart(p)} disabled={inCart}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${idx !== 0 ? "border-t border-slate-100" : ""} ${inCart ? "bg-slate-50 cursor-not-allowed opacity-60" : "hover:bg-indigo-50"}`}>
                            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {p.Product_Name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{p.Product_Name}</p>
                              <p className="text-xs text-slate-400 font-mono">{p.Product_Key} · Stock: {p.stock}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-slate-700">Rs {fmt(p.selling_Price)}</p>
                              {inCart && <p className="text-xs text-emerald-600 font-semibold">✓ Added</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cart */}
                {cart.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
                    <span className="text-3xl block mb-2">🛒</span>
                    <p className="text-sm text-slate-400">No products added yet</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Cart · {cart.length} item{cart.length !== 1 ? "s" : ""}</p>
                    <div className="space-y-2">
                      {cart.map((item) => {
                        const qtyErr = item.quantity < 1 || item.quantity > item.stock;
                        return (
                          <div key={item.Ap_Id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {item.Product_Name?.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{item.Product_Name}</p>
                                <p className="text-xs text-slate-400 font-mono">{item.Product_Key} · Stock: {item.stock}</p>
                              </div>
                              <button onClick={() => removeFromCart(item.Ap_Id)}
                                className="w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center text-xs flex-shrink-0">✕</button>
                            </div>
                            <div className="mt-3 flex items-end gap-3 flex-wrap">
                              <div className="w-24">
                                <label className="block text-xs text-slate-400 mb-1">Qty</label>
                                <input type="number" min="1" max={item.stock} value={item.quantity}
                                  onChange={(e) => updateQty(item.Ap_Id, Number(e.target.value))}
                                  className={`w-full rounded-lg border px-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 bg-white transition-all ${qtyErr ? "border-red-400" : "border-slate-200"}`}
                                />
                                {qtyErr && <p className="text-xs text-red-500 mt-0.5">Max {item.stock}</p>}
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Price Type</label>
                                <PriceToggle value={item.priceMode} onChange={(mode) => updatePriceMode(item.Ap_Id, mode)} hasWholesale={!!item.Wholesale_Price} />
                              </div>
                              <div className="flex-1 min-w-[130px]">
                                <label className="block text-xs text-slate-400 mb-1">Sale Price <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-500 font-semibold">read-only</span></label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Rs</span>
                                  <input readOnly value={item.sale_price}
                                    className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm font-bold text-slate-700 bg-slate-100 cursor-not-allowed outline-none" />
                                </div>
                              </div>
                              <div className="text-right ml-auto">
                                <label className="block text-xs text-slate-400 mb-1">Subtotal</label>
                                <p className="text-sm font-black text-slate-700">Rs {fmt(item.sale_price * item.quantity)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Financials */}
                {cart.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loan Summary</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Discount (Rs)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Rs</span>
                          <input type="number" min="0" max={totalAmount} value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 bg-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Down Payment (Rs)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Rs</span>
                          <input type="number" min="0" max={netAmount} value={downPayment}
                            onChange={(e) => setDownPayment(e.target.value)}
                            className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 bg-white ${Number(downPayment) > netAmount ? "border-red-400" : "border-slate-200"}`} />
                        </div>
                        {Number(downPayment) > netAmount && <p className="text-xs text-red-500 mt-0.5">Exceeds net amount</p>}
                      </div>
                    </div>

                    {/* ✅ NEW: Due Date field */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Due Date <span className="text-slate-300 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">📅</span>
                        <input
                          type="date"
                          value={dueDate}
                          min={todayStr}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400 bg-white transition-all"
                        />
                      </div>
                      {dueDate && (
                        <p className="mt-1 text-xs text-indigo-500 font-semibold">
                          📅 Due on {new Date(dueDate).toLocaleDateString("en-PK", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
                      <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 bg-white resize-none"
                        placeholder="Any notes about this loan…" />
                    </div>

                    <div className="border-t border-slate-200 pt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Total Amount</span>
                        <span className="font-semibold text-slate-700">Rs {fmt(totalAmount)}</span>
                      </div>
                      {Number(discount) > 0 && (
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Discount</span>
                          <span className="font-semibold text-red-500">− Rs {fmt(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Net Amount</span>
                        <span className="font-semibold text-slate-700">Rs {fmt(netAmount)}</span>
                      </div>
                      {Number(downPayment) > 0 && (
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Down Payment</span>
                          <span className="font-semibold text-emerald-600">− Rs {fmt(downPayment)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-1">
                        <span className="text-slate-700">{existingLoan ? "Added to Loan Balance" : "Loan Balance"}</span>
                        <span className="text-red-500">Rs {fmt(loanBalance)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                    <p className="text-sm font-semibold text-red-600">⚠ {submitError}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center gap-3 flex-shrink-0">
            {step === 2 && (
              <button onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">
                ← Back
              </button>
            )}
            <div className="flex-1" />
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">
              Cancel
            </button>
            {step === 2 && (
              <button onClick={submit} disabled={!canSubmit || submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting ? "Saving…" : existingLoan ? `⚡ Merge · Rs ${fmt(loanBalance)}` : `Create Loan · Rs ${fmt(loanBalance)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};


/* ═══════════════════════════════════════════════════════
   MAIN LOANS PAGE
═══════════════════════════════════════════════════════ */
const Loans = () => {
  const [data,         setData]         = useState([]);
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [filter,       setFilter]       = useState("all");
  const [loading,      setLoading]      = useState(false);
  const [payLoan,      setPayLoan]      = useState(null);
  const [historyLoan,  setHistoryLoan]  = useState(null);
  const [showAddLoan,  setShowAddLoan]  = useState(false);
  const [toast,        setToast]        = useState(null);
  const LIMIT = 5;

  const showToast = (msg, type = "success") => {
    const normalisedType = ["success", "error", "info"].includes(type) ? type : "info";
    setToast({ msg, type: normalisedType });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLoans = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/getloansdata`, {
        params: { page: p, limit: LIMIT, search },
      });
      setData(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || 1);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchLoans(1); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchLoans(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = data.filter((i) => {
    if (filter === "paid")    return i.status === "paid" || i.status === "completed";
    if (filter === "pending") return i.status !== "paid" && i.status !== "completed";
    return true;
  });

  const totalRemaining = data.reduce((s, i) => s + Number(i.remaining_amount), 0);
  const totalCollected = data.reduce((s, i) => s + Number(i.paid_amount), 0);
  const pendingCount   = data.filter((i) => i.status !== "paid" && i.status !== "completed").length;

  // ✅ NEW: count overdue loans
  const overdueCount = data.filter((i) => {
    if (!i.due_date) return false;
    const isPaid = i.status === "paid" || i.status === "completed";
    if (isPaid) return false;
    const due = new Date(i.due_date); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const toastBg = {
    success: "bg-emerald-600",
    error:   "bg-red-600",
    info:    "bg-amber-500",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toastBg[toast.type] || toastBg.info}`}>
          {toast.type === "success" ? "✓ " : toast.type === "error" ? "✕ " : "⚡ "}{toast.msg}
        </div>
      )}

      {/* Title */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">💳 Loan Management</h1>
          <p className="text-sm text-slate-400 mt-1">Track and manage all customer loans</p>
        </div>
        <button onClick={() => setShowAddLoan(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm">
          <span>📦</span> New Product Loan
        </button>
      </div>

      {/* Stat cards — ✅ NEW: 4th card for overdue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Outstanding",      value: `Rs ${fmt(totalRemaining)}`, color: "text-red-500",     icon: "📉", bg: "bg-red-50",     border: "border-red-100" },
          { label: "Collected (Page)", value: `Rs ${fmt(totalCollected)}`, color: "text-emerald-600", icon: "💰", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Pending Loans",    value: pendingCount,                color: "text-blue-600",    icon: "⏳", bg: "bg-blue-50",    border: "border-blue-100" },
          { label: "Overdue",          value: overdueCount,                color: overdueCount > 0 ? "text-red-600 font-black" : "text-slate-400", icon: "🔴", bg: "bg-red-50", border: "border-red-100" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg w-9 h-9 rounded-xl ${s.bg} ${s.border} border flex items-center justify-center`}>{s.icon}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{s.label}</span>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5 mb-5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-blue-400 w-64 bg-slate-50 transition-all"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all",     label: "All",     active: "bg-slate-800 text-white border-slate-800" },
            { key: "pending", label: "Pending", active: "bg-red-500 text-white border-red-500" },
            { key: "paid",    label: "Paid",    active: "bg-emerald-600 text-white border-emerald-600" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === f.key ? f.active : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800">
              {/* ✅ NEW: "Due Date" column added */}
              {["Customer", "Phone", "Type", "Total Loan", "Paid", "Remaining", "Due Date", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="9" className="text-center py-16">
                <div className="inline-block w-7 h-7 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-16">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-sm text-slate-400 font-medium">No loans found</p>
              </td></tr>
            ) : (
              filtered.map((item) => {
                const paidPct   = Math.round((Number(item.paid_amount) / Number(item.total_amount)) * 100) || 0;
                const isPaid    = item.status === "paid" || item.status === "completed";
                const isProduct = item.loan_type === "product_loan";
                return (
                  <tr key={`${item.loan_type}-${item.loan_id}`}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setHistoryLoan(item)}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {item.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{item.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{item.phone}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${isProduct ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                        {isProduct ? "📦 Product" : "💵 Cash"}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">Rs {fmt(item.total_amount)}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-emerald-600">Rs {fmt(item.paid_amount)}</span>
                      <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full w-20 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400" style={{ width: `${paidPct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-4 font-black text-red-500">Rs {fmt(item.remaining_amount)}</td>
                    {/* ✅ NEW: Due Date cell */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <DueDateBadge due_date={item.due_date} isPaid={isPaid} />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setHistoryLoan(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all">📜 History</button>
                        <button onClick={() => setPayLoan(item)} disabled={isPaid}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isPaid ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}>
                          💳 Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-5">
        <p className="text-sm text-slate-400">Page {page} of {totalPages} · {total} total records</p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => fetchLoans(page - 1)} disabled={page === 1 || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40">← Prev</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchLoans(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${p === page ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => fetchLoans(page + 1)} disabled={page === totalPages || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40">Next →</button>
        </div>
      </div>

      {/* Modals */}
      {historyLoan && <HistoryModal loan={historyLoan} onClose={() => setHistoryLoan(null)} />}
      {payLoan && (
        <PayModal
          loan={payLoan}
          onClose={() => setPayLoan(null)}
          onSuccess={() => {
            setPayLoan(null);
            fetchLoans(page);
            showToast("Payment recorded successfully", "success");
          }}
        />
      )}
      {showAddLoan && (
        <AddLoanModal
          onClose={() => setShowAddLoan(false)}
          onSuccess={(merged) => {
            setShowAddLoan(false);
            fetchLoans(1);
            showToast(
              merged ? "Products merged into existing loan" : "New product loan created",
              merged ? "info" : "success"
            );
          }}
        />
      )}
    </div>
  );
};

export default Loans;