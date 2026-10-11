// pages/Reports.jsx
// All print logic lives in /api/reports/print/* (Node.js router)
// This file is purely UI — fetch data + open print window via URL

import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:8081/Reports";

// ─── formatters ───────────────────────────────────────────────────────────────
const rs = (v) =>
  "Rs " + Number(v || 0).toLocaleString("en-PK", { minimumFractionDigits: 0 });

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

// ─── open server-rendered print page in new tab ───────────────────────────────
const openPrint = (endpoint, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  window.open(`${API}/print/${endpoint}?${qs}`, "_blank");
};

// ─── shared UI atoms ──────────────────────────────────────────────────────────
const Badge = ({ v }) => {
  const map = {
    received:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    partial:   "bg-yellow-100  text-yellow-700  border-yellow-200",
    ordered:   "bg-blue-100   text-blue-700   border-blue-200",
    cancelled: "bg-red-100    text-red-600    border-red-200",
    cash:      "bg-emerald-100 text-emerald-700 border-emerald-200",
    loan:      "bg-orange-100 text-orange-700 border-orange-200",
    payment:   "bg-blue-100   text-blue-700   border-blue-200",
    purchase:  "bg-purple-100 text-purple-700 border-purple-200",
    advance:   "bg-amber-100  text-amber-700  border-amber-200",
    returned:  "bg-red-100    text-red-700    border-red-200",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide ${map[v] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {v}
    </span>
  );
};

const StatCard = ({ label, value, color = "red" }) => {
  const colors = {
    red:    "border-l-red-600   bg-red-50   text-red-700",
    green:  "border-l-emerald-500 bg-emerald-50 text-emerald-700",
    blue:   "border-l-blue-500  bg-blue-50   text-blue-700",
    amber:  "border-l-amber-500 bg-amber-50  text-amber-700",
    gray:   "border-l-gray-400  bg-gray-50   text-gray-700",
  };
  return (
    <div className={`border border-gray-200 border-l-4 rounded-lg p-3 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-xl font-extrabold mt-0.5 font-mono tracking-tight">{value}</p>
    </div>
  );
};

// ─── returns exclusion notice ─────────────────────────────────────────────────
const ReturnsNote = () => (
  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
    <span className="text-base">ℹ️</span>
    Sales with <strong>approved returns</strong> are excluded from revenue &amp; profit figures.
  </div>
);

const Tbl = ({ heads, children }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
    <table className="w-full text-sm min-w-full">
      <thead>
        <tr className="bg-gray-900 text-white">
          {heads.map((h, i) => (
            <th
              key={i}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap
                ${typeof h === "object" && h.right ? "text-right" : "text-left"}`}
            >
              {typeof h === "object" ? h.label : h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children || (
          <tr>
            <td colSpan={heads.length} className="px-4 py-10 text-center text-gray-400 text-sm">
              No data for selected period
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const TR = ({ children, i }) => (
  <tr className={`border-b border-gray-100 hover:bg-red-50 transition-colors
    ${i % 2 === 1 ? "bg-gray-50" : "bg-white"}`}>
    {children}
  </tr>
);

const TD = ({ children, right, bold, mono, green, red, muted }) => (
  <td className={[
    "px-4 py-2.5",
    right ? "text-right" : "",
    bold  ? "font-bold"  : "font-medium",
    mono  ? "font-mono text-xs" : "",
    green ? "text-emerald-600 font-bold" : "",
    red   ? "text-red-600 font-bold"     : "",
    muted ? "text-gray-400"              : "",
  ].filter(Boolean).join(" ")}>
    {children}
  </td>
);

// ─── section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, icon, onLoad, onPrint, loading, hasData, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-gray-800 text-sm tracking-tight">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        {!hasData ? (
          <button
            onClick={onLoad}
            disabled={loading}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-red-700
              text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors
              disabled:opacity-50 uppercase tracking-wide"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Loading...
              </>
            ) : "Load Report"}
          </button>
        ) : (
          <>
            <button
              onClick={onLoad}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200
                hover:bg-gray-100 text-gray-600 transition-colors"
            >
              ↺ Refresh
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800
                text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors uppercase tracking-wide"
            >
              🖨 Print
            </button>
          </>
        )}
      </div>
    </div>

    {!hasData && !loading && (
      <div className="px-6 py-10 text-center text-gray-400 text-sm">
        <div className="text-3xl mb-2 opacity-30">{icon}</div>
        Click <strong>Load Report</strong> to fetch data for the selected period
      </div>
    )}

    {hasData && <div className="p-6">{children}</div>}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL REPORT PANELS
// ══════════════════════════════════════════════════════════════════════════════

const SalesSummary = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/sales-summary?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load sales summary"); }
    setLoading(false);
  };
  return (
    <Section title="Sales Summary" icon="📊" onLoad={load} onPrint={() => openPrint("sales-summary", { from, to })} loading={loading} hasData={!!data}>
      {data && <>
        <ReturnsNote />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Transactions"   value={data.totals.total_sales}        color="gray" />
          <StatCard label="Revenue"        value={rs(data.totals.total_revenue)}  color="blue" />
          <StatCard label="Discounts"      value={rs(data.totals.total_discount)} color="amber" />
          <StatCard label="Net Profit"     value={rs(data.totals.total_profit)}
            color={data.totals.total_profit >= 0 ? "green" : "red"} />
        </div>
        <Tbl heads={["Date",{label:"Sales",right:true},{label:"Cash",right:true},{label:"Loan",right:true},{label:"Revenue",right:true},{label:"Discount",right:true},{label:"Profit",right:true}]}>
          {data.rows.map((r, i) => (
            <TR key={i} i={i}>
              <TD>{fmtDate(r.sale_date)}</TD>
              <TD right bold>{r.total_sales}</TD>
              <TD right green>{r.cash_sales}</TD>
              <TD right>{r.loan_sales}</TD>
              <TD right bold>{rs(r.total_revenue)}</TD>
              <TD right>{rs(r.total_discount)}</TD>
              <TD right green={Number(r.total_profit)>=0} red={Number(r.total_profit)<0}>{rs(r.total_profit)}</TD>
            </TR>
          ))}
        </Tbl>
      </>}
    </Section>
  );
};

const SalesDetail = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/sales-detail?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load sales detail"); }
    setLoading(false);
  };
  return (
    <Section title="Detailed Sales" icon="🧾" onLoad={load} onPrint={() => openPrint("sales-detail", { from, to })} loading={loading} hasData={!!data}>
      {data && <>
        <ReturnsNote />
        <Tbl heads={["ID","Invoice","Date","Customer","Payment",{label:"Amount",right:true},{label:"Paid",right:true},{label:"Balance",right:true},{label:"Profit",right:true}]}>
          {data.rows.map((r, i) => (
            <TR key={i} i={i}>
              <TD muted>{r.sale_id}</TD>
              <TD mono>{r.invoice_no || "—"}</TD>
              <TD>{fmtDate(r.sale_date)}</TD>
              <TD bold>{r.customer_name || <span className="text-gray-400 font-normal">Walk-in</span>}</TD>
              <TD><Badge v={r.payment_type} /></TD>
              <TD right bold>{rs(r.total_amount)}</TD>
              <TD right green>{rs(r.paid_amount)}</TD>
              <TD right red={Number(r.balance_due)>0}>{rs(r.balance_due)}</TD>
              <TD right green={Number(r.total_profit)>=0} red={Number(r.total_profit)<0}>{rs(r.total_profit)}</TD>
            </TR>
          ))}
        </Tbl>
      </>}
    </Section>
  );
};

const ProductSales = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/product-sales?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load product sales"); }
    setLoading(false);
  };
  return (
    <Section title="Product Sales" icon="📦" onLoad={load} onPrint={() => openPrint("product-sales", { from, to })} loading={loading} hasData={!!data}>
      {data && <>
        <ReturnsNote />
        <Tbl heads={["Product",{label:"Qty",right:true},{label:"Avg Cost",right:true},{label:"Avg Price",right:true},{label:"Revenue",right:true},{label:"Profit",right:true}]}>
          {data.rows.map((r, i) => (
            <TR key={i} i={i}>
              <TD bold>{r.product_name}</TD>
              <TD right>{r.total_qty}</TD>
              <TD right>{rs(r.avg_cost_price)}</TD>
              <TD right>{rs(r.avg_sale_price)}</TD>
              <TD right bold>{rs(r.total_revenue)}</TD>
              <TD right green={Number(r.total_profit)>=0} red={Number(r.total_profit)<0}>{rs(r.total_profit)}</TD>
            </TR>
          ))}
        </Tbl>
      </>}
    </Section>
  );
};

const ProfitLoss = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/profit-loss?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load P&L"); }
    setLoading(false);
  };
  const totNet = data?.rows.reduce((s, r) => s + Number(r.net_profit || 0), 0) ?? 0;
  return (
    <Section title="Profit & Loss" icon="💹" onLoad={load} onPrint={() => openPrint("profit-loss", { from, to })} loading={loading} hasData={!!data}>
      {data && <>
        <ReturnsNote />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Revenue"      value={rs(data.rows.reduce((s,r)=>s+Number(r.total_revenue||0),0))}  color="blue" />
          <StatCard label="COGS"         value={rs(data.rows.reduce((s,r)=>s+Number(r.total_cogs||0),0))}     color="gray" />
          <StatCard label="Gross Profit" value={rs(data.rows.reduce((s,r)=>s+Number(r.gross_profit||0),0))}   color="green" />
          <StatCard label="Net Profit"   value={rs(totNet)} color={totNet >= 0 ? "green" : "red"} />
        </div>
        <Tbl heads={["Date",{label:"Revenue",right:true},{label:"COGS",right:true},{label:"Gross Profit",right:true},{label:"Discounts",right:true},{label:"Net Profit",right:true}]}>
          {data.rows.map((r, i) => {
            const net = Number(r.net_profit || 0);
            return (
              <TR key={i} i={i}>
                <TD>{fmtDate(r.report_date)}</TD>
                <TD right>{rs(r.total_revenue)}</TD>
                <TD right>{rs(r.total_cogs)}</TD>
                <TD right green>{rs(r.gross_profit)}</TD>
                <TD right>{rs(Number(r.order_discounts||0)+Number(r.item_discounts||0))}</TD>
                <TD right green={net>=0} red={net<0}>{rs(net)}</TD>
              </TR>
            );
          })}
        </Tbl>
      </>}
    </Section>
  );
};

const Customers = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/customers?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load customers"); }
    setLoading(false);
  };
  return (
    <Section title="Customer Report" icon="👥" onLoad={load} onPrint={() => openPrint("customers", { from, to })} loading={loading} hasData={!!data}>
      {data && (
        <Tbl heads={["Customer","Phone",{label:"Orders",right:true},{label:"Purchased",right:true},{label:"Paid",right:true},{label:"Outstanding",right:true},"Last Purchase"]}>
          {data.rows.map((r, i) => (
            <TR key={i} i={i}>
              <TD bold>{r.name || "—"}</TD>
              <TD mono>{r.phone || "—"}</TD>
              <TD right>{r.total_orders}</TD>
              <TD right>{rs(r.total_purchased)}</TD>
              <TD right green>{rs(r.total_paid)}</TD>
              <TD right red={Number(r.outstanding_balance)>0}>{rs(r.outstanding_balance)}</TD>
              <TD>{fmtDate(r.last_purchase)}</TD>
            </TR>
          ))}
        </Tbl>
      )}
    </Section>
  );
};

const Loans = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/loans?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load loans"); }
    setLoading(false);
  };
  return (
    <Section title="Loans & Credit" icon="🏦" onLoad={load} onPrint={() => openPrint("loans", { from, to })} loading={loading} hasData={!!data}>
      {data && <>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard label="Active Loans" value={data.rows.length}  color="amber" />
          <StatCard label="Total Due"    value={rs(data.totalDue)} color="red" />
        </div>
        <Tbl heads={["Invoice","Date","Customer","Phone",{label:"Total",right:true},{label:"Paid",right:true},{label:"Remaining",right:true}]}>
          {data.rows.map((r, i) => (
            <TR key={i} i={i}>
              <TD mono>{r.invoice_no || "—"}</TD>
              <TD>{fmtDate(r.loan_date)}</TD>
              <TD bold>{r.customer_name}</TD>
              <TD mono>{r.phone || "—"}</TD>
              <TD right>{rs(r.total_amount)}</TD>
              <TD right green>{rs(r.paid_amount)}</TD>
              <TD right red>{rs(r.remaining)}</TD>
            </TR>
          ))}
        </Tbl>
      </>}
    </Section>
  );
};

const Suppliers = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/suppliers?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load suppliers"); }
    setLoading(false);
  };
  return (
    <Section title="Supplier Report" icon="🚚" onLoad={load} onPrint={() => openPrint("suppliers", { from, to })} loading={loading} hasData={!!data}>
      {data && (
        <Tbl heads={["Supplier","Phone",{label:"Orders",right:true},{label:"Ordered",right:true},{label:"Received",right:true},{label:"Balance",right:true}]}>
          {data.rows.map((r, i) => (
            <TR key={i} i={i}>
              <TD bold>{r.name}</TD>
              <TD mono>{r.phone || "—"}</TD>
              <TD right>{r.total_orders}</TD>
              <TD right>{rs(r.total_ordered)}</TD>
              <TD right green>{rs(r.total_received)}</TD>
              <TD right red={Number(r.outstanding_balance)>0}>{rs(r.outstanding_balance)}</TD>
            </TR>
          ))}
        </Tbl>
      )}
    </Section>
  );
};

const SupplierOrders = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/supplier-orders?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load supplier orders"); }
    setLoading(false);
  };
  return (
    <Section title="Supplier Orders" icon="📋" onLoad={load} onPrint={() => openPrint("supplier-orders", { from, to })} loading={loading} hasData={!!data}>
      {data && (
        <Tbl heads={["#","Supplier","Date","Status",{label:"Items",right:true},{label:"Amount",right:true}]}>
          {data.rows.map((r, i) => (
            <TR key={i} i={i}>
              <TD muted>{r.order_id}</TD>
              <TD bold>{r.supplier_name}</TD>
              <TD>{fmtDate(r.order_date)}</TD>
              <TD><Badge v={r.status} /></TD>
              <TD right>{r.item_count}</TD>
              <TD right bold>{rs(r.total_amount)}</TD>
            </TR>
          ))}
        </Tbl>
      )}
    </Section>
  );
};

const Inventory = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/inventory`); setData(r.data); }
    catch { alert("Failed to load inventory"); }
    setLoading(false);
  };
  return (
    <Section title="Inventory & Stock" icon="🗄" onLoad={load} onPrint={() => openPrint("inventory")} loading={loading} hasData={!!data}>
      {data && <>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="Products"     value={data.rows.length}          color="gray" />
          <StatCard label="Cost Value"   value={rs(data.totalCostValue)}   color="blue" />
          <StatCard label="Retail Value" value={rs(data.totalRetailValue)} color="green" />
        </div>
        <Tbl heads={["Product",{label:"Stock",right:true},{label:"Cost",right:true},{label:"Retail",right:true},{label:"Wholesale",right:true},{label:"Stock Value",right:true}]}>
          {data.rows.map((r, i) => {
            const low = Number(r.stock_qty) <= 5;
            return (
              <TR key={i} i={i}>
                <TD bold>{r.Product_Name}</TD>
                <TD right red={low} green={!low}>{r.stock_qty}{low && " ⚠"}</TD>
                <TD right>{rs(r.cost_price)}</TD>
                <TD right>{rs(r.retail_price)}</TD>
                <TD right>{rs(r.wholesale_price)}</TD>
                <TD right bold>{rs(r.stock_value_cost)}</TD>
              </TR>
            );
          })}
        </Tbl>
      </>}
    </Section>
  );
};

const SupplierLedger = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/supplier-ledger?from=${from}&to=${to}`); setData(r.data); }
    catch { alert("Failed to load ledger"); }
    setLoading(false);
  };
  return (
    <Section title="Supplier Ledger" icon="📒" onLoad={load} onPrint={() => openPrint("supplier-ledger", { from, to })} loading={loading} hasData={!!data}>
      {data && (
        <Tbl heads={["#","Date","Supplier","Type",{label:"Debit",right:true},{label:"Credit",right:true},{label:"Balance",right:true}]}>
          {data.rows.map((r, i) => (
            <TR key={i} i={i}>
              <TD muted>{r.id}</TD>
              <TD>{fmtDate(r.entry_date)}</TD>
              <TD bold>{r.supplier_name}</TD>
              <TD><Badge v={r.type} /></TD>
              <TD right red={Number(r.debit)>0}>{rs(r.debit)}</TD>
              <TD right green={Number(r.credit)>0}>{rs(r.credit)}</TD>
              <TD right bold>{rs(r.balance)}</TD>
            </TR>
          ))}
        </Tbl>
      )}
    </Section>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const today        = new Date().toISOString().slice(0, 10);
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().slice(0, 10);
const firstOfYear  = `${new Date().getFullYear()}-01-01`;

const QUICK = [
  { label: "Today",        from: today,                                                        to: today },
  { label: "This Week",    from: new Date(Date.now()-6*864e5).toISOString().slice(0,10),       to: today },
  { label: "This Month",   from: firstOfMonth,                                                 to: today },
  { label: "Last 30 Days", from: new Date(Date.now()-29*864e5).toISOString().slice(0,10),      to: today },
  { label: "This Year",    from: firstOfYear,                                                  to: today },
];

const TABS = [
  { id: "sales-summary",    label: "Sales Summary",   icon: "📊" },
  { id: "sales-detail",     label: "Sales Detail",    icon: "🧾" },
  { id: "product-sales",    label: "Products",        icon: "📦" },
  { id: "profit-loss",      label: "Profit & Loss",   icon: "💹" },
  { id: "customers",        label: "Customers",       icon: "👥" },
  { id: "loans",            label: "Loans",           icon: "🏦" },
  { id: "suppliers",        label: "Suppliers",       icon: "🚚" },
  { id: "supplier-orders",  label: "Supplier Orders", icon: "📋" },
  { id: "inventory",        label: "Inventory",       icon: "🗄" },
  { id: "supplier-ledger",  label: "Sup. Ledger",     icon: "📒" },
];

const Reports = () => {
  const [from, setFrom]     = useState(firstOfMonth);
  const [to, setTo]         = useState(today);
  const [activeTab, setTab] = useState("sales-summary");

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5" }}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={{ background: "#c8102e" }} className="shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
              <span className="text-red-700 font-extrabold text-lg leading-none">H</span>
            </div>
            <div>
              <h1 className="text-white font-extrabold text-xl tracking-tight leading-tight">
                Fawad Honda Center
              </h1>
              <p className="text-red-200 text-xs tracking-wide">
                Genuine Honda Spare Parts &amp; Accessories
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-red-200 text-xs uppercase tracking-widest">Reports</p>
            <p className="text-white text-sm font-semibold">{fmtDate(today)}</p>
          </div>
        </div>
      </div>

      {/* ── DATE FILTER BAR ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => {
              const active = from === q.from && to === q.to;
              return (
                <button
                  key={q.label}
                  onClick={() => { setFrom(q.from); setTo(q.to); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                    active
                      ? "bg-red-700 text-white border-red-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-700"
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider">From</span>
            <input
              type="date" value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none
                focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
            <span className="text-gray-300 font-bold">→</span>
            <input
              type="date" value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none
                focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
          </div>

          <div className="ml-auto hidden md:flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span>{fmtDate(from)} — {fmtDate(to)}</span>
          </div>
        </div>

        {/* ── TABS ──────────────────────────────────────────────────────── */}
        <div className="max-w-screen-2xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max border-t border-gray-100">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold
                    border-b-2 whitespace-nowrap transition-colors uppercase tracking-wide ${
                    active
                      ? "border-red-600 text-red-700"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                  }`}
                >
                  <span className="text-sm">{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── REPORT CONTENT ────────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        {activeTab === "sales-summary"   && <SalesSummary   key={from+to} from={from} to={to} />}
        {activeTab === "sales-detail"    && <SalesDetail    key={from+to} from={from} to={to} />}
        {activeTab === "product-sales"   && <ProductSales   key={from+to} from={from} to={to} />}
        {activeTab === "profit-loss"     && <ProfitLoss     key={from+to} from={from} to={to} />}
        {activeTab === "customers"       && <Customers      key={from+to} from={from} to={to} />}
        {activeTab === "loans"           && <Loans          key={from+to} from={from} to={to} />}
        {activeTab === "suppliers"       && <Suppliers      key={from+to} from={from} to={to} />}
        {activeTab === "supplier-orders" && <SupplierOrders key={from+to} from={from} to={to} />}
        {activeTab === "inventory"       && <Inventory      key="inventory" />}
        {activeTab === "supplier-ledger" && <SupplierLedger key={from+to} from={from} to={to} />}
      </div>
    </div>
  );
};

export default Reports;