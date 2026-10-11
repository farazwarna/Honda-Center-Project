import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";

/* ─── Utilities ─── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

/* ─── Static Tailwind-safe color maps ─── */
const STATUS_STYLES = {
  received:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial:   "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  ordered:   "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_ICONS = {
  received:  "✓",
  partial:   "◐",
  cancelled: "✕",
  ordered:   "○",
};

const ORDER_CARD_COLORS = {
  amber: {
    bg: "bg-amber-50", border: "border-amber-100",
    text: "text-amber-600", label: "text-amber-700",
    iconBg: "bg-amber-100", icon: "text-amber-600",
  },
  sky: {
    bg: "bg-sky-50", border: "border-sky-100",
    text: "text-sky-600", label: "text-sky-700",
    iconBg: "bg-sky-100", icon: "text-sky-600",
  },
  emerald: {
    bg: "bg-emerald-50", border: "border-emerald-100",
    text: "text-emerald-600", label: "text-emerald-700",
    iconBg: "bg-emerald-100", icon: "text-emerald-600",
  },
  rose: {
    bg: "bg-rose-50", border: "border-rose-100",
    text: "text-rose-600", label: "text-rose-700",
    iconBg: "bg-rose-100", icon: "text-rose-600",
  },
};

const ORDER_CARD_META = [
  { key: "ordered",   label: "Pending",   color: "amber",
    path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "partial",   label: "Partial",   color: "sky",
    path: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { key: "received",  label: "Completed", color: "emerald",
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "cancelled", label: "Cancelled", color: "rose",
    path: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
];

/* ─── Sub-components ─── */

const SparkLine = ({ colorClass = "bg-blue-400" }) => (
  <div className="flex items-end gap-0.5 h-8 mt-2 opacity-60">
    {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75].map((h, i) => (
      <div key={i} className={`w-1.5 rounded-sm ${colorClass}`} style={{ height: `${h}%` }} />
    ))}
  </div>
);

const IconBox = ({ children, className }) => (
  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${className}`}>
    {children}
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, iconClass = "text-slate-500" }) => (
  <div className="p-5 border-b border-slate-100 flex items-center gap-2">
    <IconBox className={iconClass}>{icon}</IconBox>
    <h2 className="font-bold text-slate-700">{title}</h2>
  </div>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="text-center py-10">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
      {icon}
    </div>
    <p className="text-slate-500 font-medium">{title}</p>
    {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
  </div>
);

const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

/* ─── Main Dashboard ─── */

const AdminDashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:8081/Admin/dashboard-stats");
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ─── Derived values ─── */
  const {
    kpi,
    orders,
    lowStockProducts,
    supplierBalances,
    recentOrders,
    ledger,
    stockValue,
  } = data || {};

  const owedToSuppliers = useMemo(
    () => (supplierBalances || [])
      .filter((s) => Number(s.balance) > 0)
      .reduce((sum, s) => sum + Number(s.balance), 0),
    [supplierBalances]
  );

  const receivableFromSuppliers = useMemo(
    () => (supplierBalances || [])
      .filter((s) => Number(s.balance) < 0)
      .reduce((sum, s) => sum + Math.abs(Number(s.balance)), 0),
    [supplierBalances]
  );

  const margin = useMemo(
    () => Number(stockValue?.selling_value || 0) - Number(stockValue?.product_cost || 0),
    [stockValue]
  );

  const wholesaleDiff = useMemo(
    () => Number(stockValue?.wholesale_value || 0) - Number(stockValue?.product_cost || 0),
    [stockValue]
  );

  /* ─── Loading Skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="space-y-2">
              <SkeletonPulse className="h-8 w-56" />
              <SkeletonPulse className="h-4 w-72" />
            </div>
            <SkeletonPulse className="h-10 w-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <SkeletonPulse className="h-4 w-28 mb-3" />
                <SkeletonPulse className="h-8 w-24" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <SkeletonPulse className="h-4 w-24 mb-3" />
                <SkeletonPulse className="h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 h-80 p-6">
                <SkeletonPulse className="h-5 w-40 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => <SkeletonPulse key={j} className="h-10 w-full" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-500 mb-6 text-sm">{error || "We couldn't fetch your dashboard data."}</p>
          <button onClick={load}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-lg active:scale-95">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ═══════ HEADER ═══════ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time overview of inventory, suppliers &amp; orders
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ═══════ KPI CARDS ═══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Products",  value: fmt(kpi?.totalProducts), icon: "cube",   color: "blue"   },
            { label: "Total Stock Qty", value: fmt(kpi?.totalStock),    icon: "layers", color: "indigo" },
            { label: "Low Stock Alerts", value: fmt(kpi?.lowStock), isAlert: true, alertValue: kpi?.lowStock },
            { label: "Supplier Balance", value: `Owe: Rs ${fmt(owedToSuppliers)}`,
              sub: `Receive: Rs ${fmt(receivableFromSuppliers)}`, icon: "wallet", color: "orange" },
          ].map((item, i) => (
            <Card key={i} className="p-5 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className={`text-2xl md:text-3xl font-bold mt-1 ${
                    item.isAlert
                      ? item.alertValue > 0 ? "text-rose-500" : "text-emerald-500"
                      : "text-slate-800"
                  }`}>
                    {item.value}
                  </p>
                  {item.sub && <p className="text-sm font-semibold text-emerald-600 mt-0.5">{item.sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  item.isAlert
                    ? item.alertValue > 0 ? "bg-rose-50" : "bg-emerald-50"
                    : item.color === "blue" ? "bg-blue-50" : item.color === "indigo" ? "bg-indigo-50" : "bg-orange-50"
                }`}>
                  {item.isAlert ? (
                    <svg className={`w-5 h-5 ${item.alertValue > 0 ? "text-rose-500" : "text-emerald-500"}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className={`w-5 h-5 ${
                      item.color === "blue" ? "text-blue-600" :
                      item.color === "indigo" ? "text-indigo-600" : "text-orange-600"
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        item.icon === "cube"
                          ? "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          : item.icon === "layers"
                          ? "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          : "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      } />
                    </svg>
                  )}
                </div>
              </div>
              {!item.isAlert && (
                <SparkLine colorClass={
                  item.color === "blue" ? "bg-blue-400" :
                  item.color === "indigo" ? "bg-indigo-400" : "bg-orange-400"
                } />
              )}
              {item.isAlert && (
                <p className="mt-2 text-xs text-slate-400">
                  {item.alertValue > 0 ? `${item.alertValue} items need attention` : "All stocked up"}
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* ═══════ ORDER STATUS ═══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {ORDER_CARD_META.map((item) => {
            const c = ORDER_CARD_COLORS[item.color];
            return (
              <div key={item.key}
                className={`${c.bg} border ${c.border} rounded-2xl p-5 hover:shadow-md transition-all duration-200`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 ${c.iconBg} rounded-lg flex items-center justify-center`}>
                    <svg className={`w-4 h-4 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.path} />
                    </svg>
                  </div>
                  <p className={`text-sm font-medium ${c.label}`}>{item.label} Orders</p>
                </div>
                <p className={`text-3xl font-bold ${c.text}`}>{fmt(orders?.[item.key])}</p>
              </div>
            );
          })}
        </div>

        {/* ═══════ MAIN CONTENT GRID ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* ─── LOW STOCK PRODUCTS ─── */}
          <Card>
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <IconBox className="bg-rose-50">
                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </IconBox>
                <h2 className="font-bold text-slate-700">Low Stock Products</h2>
              </div>

              {(lowStockProducts || []).length > 0 && (
                <button
                  onClick={() => {
                    /*
                     * ✅ ROOT CAUSE WAS IN THE BACKEND SQL — now fixed in Admin.js:
                     *    The old query only selected Product_Name, Quantity, Min_Stock.
                     *    Product_Id and Product_Price were never fetched → both undefined → 0.
                     *
                     *    Now the backend returns all 5 fields, so this mapping is correct:
                     *      p.Product_Id    → cart item key  (matches Purchase page's product_id)
                     *      p.Product_Price → cart item price (pre-fills the unit price)
                     *      quantity        → deficit = Min_Stock - Quantity, clamped ≥ 1
                     */
                    const autoCart = (lowStockProducts || []).map((p) => ({
                      product_id: p.Product_Id,
                      name:       p.Product_Name,
                      price:      Number(p.Product_Price) || 0,
                      quantity:   Math.max(1, (p.Min_Stock || 0) - (p.Quantity || 0)),
                    }));
                    localStorage.setItem("AUTO_PURCHASE_CART", JSON.stringify(autoCart));
                    window.location.href = "/Admin/Purchase";
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:shadow transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reorder All
                </button>
              )}
            </div>

            <div className="p-5">
              {(lowStockProducts || []).length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                  title="All products are well stocked!"
                  subtitle="No items below minimum threshold"
                />
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {(lowStockProducts || []).map((p, i) => {
                    const qty = Number(p.Quantity || 0);
                    const min = Number(p.Min_Stock || 1);
                    const pct = Math.round((qty / min) * 100);
                    const isCritical = pct < 25;
                    return (
                      <div key={p.Product_Id || i}>
                        <div className="flex justify-between items-center text-sm mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isCritical ? "bg-rose-500 animate-pulse" : "bg-amber-400"
                            }`} />
                            <span className="truncate font-medium text-slate-700" title={p.Product_Name}>
                              {p.Product_Name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className={`font-semibold ${isCritical ? "text-rose-500" : "text-amber-600"}`}>
                              {qty} / {min}
                            </span>
                            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                              Rs {fmt(p.Product_Price)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical ? "bg-rose-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isCritical
                            ? "Critical — reorder immediately"
                            : `Needs ${Math.max(0, min - qty)} more units`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* ─── SUPPLIER BALANCES ─── */}
          <Card>
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              title="Supplier Balances"
              iconClass="bg-orange-50"
            />
            <div className="p-5 pt-0">
              {(supplierBalances || []).length === 0 ? (
                <EmptyState icon={<span className="text-2xl">🏦</span>} title="No supplier data available" />
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {supplierBalances.map((s, i) => {
                    const bal = Number(s.balance || 0);
                    const isOwed = bal > 0;
                    const isReceivable = bal < 0;
                    return (
                      <div key={s.id || i}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl hover:bg-slate-50 transition-colors duration-200 border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                            isOwed ? "bg-orange-100 text-orange-600" :
                            isReceivable ? "bg-emerald-100 text-emerald-600" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {s.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700 truncate">{s.name}</p>
                            <p className="text-xs text-slate-400">
                              {isOwed ? "Payable" : isReceivable ? "Receivable" : "Settled"}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm mt-2 sm:mt-0 flex-shrink-0 px-3 py-1 rounded-full ${
                          isOwed ? "text-orange-600 bg-orange-50" :
                          isReceivable ? "text-emerald-600 bg-emerald-50" :
                          "text-slate-400 bg-slate-50"
                        }`}>
                          {isOwed
                            ? `Owe Rs ${fmt(bal)}`
                            : isReceivable
                            ? `Receive Rs ${fmt(Math.abs(bal))}`
                            : "Settled"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ═══════ STOCK VALUE + RECENT ORDERS ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* ─── STOCK VALUE ─── */}
          <Card className="lg:col-span-1">
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Stock Value"
              iconClass="bg-violet-50"
            />
            <div className="p-5 pt-0 space-y-3">
              {[
                { label: "Selling Value",  value: fmt(stockValue?.selling_value),  color: "blue",    dot: "bg-blue-500"    },
                { label: "Product Cost",   value: fmt(stockValue?.product_cost),   color: "slate",   dot: "bg-slate-400"   },
                { label: "Profit Margin",  value: fmt(margin),                     color: "emerald", dot: "bg-emerald-500" },
                { label: "Wholesale Diff", value: fmt(wholesaleDiff),              color: "orange",  dot: "bg-orange-500"  },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center p-3.5 bg-${item.color}-50 rounded-xl border border-${item.color}-100`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${item.dot} rounded-full`} />
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="font-bold text-slate-800">Rs {item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ─── RECENT ORDERS ─── */}
          <Card className="lg:col-span-2">
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="Recent Orders"
              iconClass="bg-sky-50"
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Order #", "Supplier", "Amount", "Status", "Date"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(!recentOrders || recentOrders.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        No recent orders found
                      </td>
                    </tr>
                  ) : (
                    recentOrders.slice(0, 8).map((order, i) => {
                      const status = order.status || "unknown";
                      return (
                        <tr key={order.id || order.order_id || i}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 text-sm font-medium text-slate-700">
                            #{order.id || order.order_id || i + 1}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-600">
                            {order.supplier_name || order.supplier || "N/A"}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">
                            Rs {fmt(order.total_amount || order.amount)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              STATUS_STYLES[status] || STATUS_STYLES.ordered
                            }`}>
                              <span>{STATUS_ICONS[status] || "•"}</span>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-400">
                            {fmtDate(order.created_at)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ═══════ LEDGER SUMMARY ═══════ */}
        {ledger && (
          <Card className="mb-6">
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Ledger Summary"
              iconClass="bg-purple-50"
            />
            <div className="p-5 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total In",    value: ledger.totalIn  || 0,                             color: "emerald" },
                  { label: "Total Out",   value: ledger.totalOut || 0,                             color: "rose"    },
                  { label: "Net Balance", value: (ledger.totalIn || 0) - (ledger.totalOut || 0),  color: "blue"    },
                ].map((item) => (
                  <div key={item.label} className={`bg-${item.color}-50 rounded-xl p-4 border border-${item.color}-100`}>
                    <p className={`text-xs font-medium text-${item.color}-600 uppercase tracking-wide`}>
                      {item.label}
                    </p>
                    <p className={`text-xl font-bold text-${item.color}-700 mt-1`}>
                      Rs {fmt(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;