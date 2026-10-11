// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   TrendingUp,
//   DollarSign,
//   CreditCard,
//   Package,
//   AlertTriangle,
//   ArrowUpRight,
//   ArrowDownRight,
//   ShoppingCart,
//   Users,
//   RotateCcw,
//   Wallet,
//   PieChart,
// } from "lucide-react";

// const Dashboard = () => {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchDashboard();
//     // Auto-refresh every 30 seconds
//     const interval = setInterval(fetchDashboard, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchDashboard = async () => {
//     try {
//       const res = await axios.get("http://localhost:8081/User/dashboard-stats");
//       setData(res.data);
//       setLoading(false);
//     } catch (err) {
//       console.error(err);
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600 font-medium">Loading Dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
//         <p className="text-red-500">Failed to load dashboard data</p>
//       </div>
//     );
//   }

//   const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
//     <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${color} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
//           <h3 className="text-3xl font-bold text-gray-800 mb-2">
//             {typeof value === "number" ? `Rs ${value.toLocaleString()}` : value}
//           </h3>
//           {subtitle && (
//             <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
//           )}
//           {trend && (
//             <div className={`flex items-center mt-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
//               {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
//               <span className="ml-1 font-medium">{Math.abs(trend)}%</span>
//             </div>
//           )}
//         </div>
//         <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
//           <Icon className={`${color.replace('border-', 'text-')}`} size={24} />
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
//       {/* Header */}
//       <div className="mb-8">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//               Dashboard Overview
//             </h1>
//             <p className="text-gray-500 mt-2">Today's business performance at a glance</p>
//           </div>
//           <button 
//             onClick={fetchDashboard}
//             className="px-4 py-2 bg-white rounded-xl shadow hover:shadow-lg transition-all flex items-center gap-2 text-gray-700 font-medium"
//           >
//             <RotateCcw size={18} />
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Main Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <StatCard
//           title="Total Cash Received"
//           value={data.totalCashSales}
//           icon={Wallet}
//           color="border-green-500"
//           subtitle={`Sales: Rs ${data.directCashSales.toLocaleString()} | Payments: Rs ${data.loanPaymentsReceived.toLocaleString()}`}
//         />
        
//         <StatCard
//           title="Gross Profit"
//           value={data.profit}
//           icon={TrendingUp}
//           color="border-blue-500"
//           subtitle={`Net: Rs ${data.netProfit.toLocaleString()} (after expenses)`}
//         />
        
//         <StatCard
//           title="Loans Given Today"
//           value={data.totalLoan}
//           icon={CreditCard}
//           color="border-orange-500"
//           subtitle={`${data.loanSalesCount} loan sales`}
//         />
        
//         <StatCard
//           title="Total Expenses"
//           value={data.totalExpenses}
//           icon={DollarSign}
//           color="border-red-500"
//           subtitle={`${data.expenseCount} expense entries`}
//         />
//       </div>

//       {/* Secondary Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <div className="bg-white rounded-2xl shadow-lg p-6">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="p-3 bg-purple-100 rounded-xl">
//               <ShoppingCart className="text-purple-600" size={24} />
//             </div>
//             <div>
//               <p className="text-gray-500 text-sm">Total Sales</p>
//               <h3 className="text-2xl font-bold text-gray-800">{data.totalSales}</h3>
//             </div>
//           </div>
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">Cash: {data.cashSalesCount}</span>
//             <span className="text-gray-600">Loan: {data.loanSalesCount}</span>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-lg p-6">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="p-3 bg-blue-100 rounded-xl">
//               <CreditCard className="text-blue-600" size={24} />
//             </div>
//             <div>
//               <p className="text-gray-500 text-sm">Loan Payments</p>
//               <h3 className="text-2xl font-bold text-gray-800">
//                 Rs {data.totalLoanPayments.toLocaleString()}
//               </h3>
//             </div>
//           </div>
//           <div className="text-sm text-gray-600">
//             {data.loanTransactionCount} transactions from {data.loanPaymentCount} customers
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-lg p-6">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="p-3 bg-red-100 rounded-xl">
//               <RotateCcw className="text-red-600" size={24} />
//             </div>
//             <div>
//               <p className="text-gray-500 text-sm">Returns Today</p>
//               <h3 className="text-2xl font-bold text-gray-800">
//                 Rs {data.totalReturns.toLocaleString()}
//               </h3>
//             </div>
//           </div>
//           <div className="text-sm text-gray-600">{data.returnCount} return requests</div>
//         </div>
//       </div>

//       {/* Pending Loans Alert */}
//       {data.totalPendingLoans > 0 && (
//         <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl shadow-lg p-6 mb-8 border-l-4 border-orange-500">
//           <div className="flex items-start gap-4">
//             <div className="p-3 bg-orange-100 rounded-xl">
//               <AlertTriangle className="text-orange-600" size={24} />
//             </div>
//             <div className="flex-1">
//               <h3 className="text-lg font-bold text-gray-800 mb-2">Pending Loans Overview</h3>
//               <p className="text-gray-700">
//                 <span className="font-bold text-orange-600">{data.totalPendingLoans}</span> active loans with{" "}
//                 <span className="font-bold text-orange-600">Rs {data.totalPendingAmount.toLocaleString()}</span> outstanding balance
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Bottom Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Low Stock */}
//         <div className="bg-white rounded-2xl shadow-lg p-6">
//           <div className="flex items-center gap-3 mb-6">
//             <div className="p-3 bg-red-100 rounded-xl">
//               <AlertTriangle className="text-red-600" size={24} />
//             </div>
//             <h3 className="text-xl font-bold text-gray-800">Low Stock Alert</h3>
//           </div>
          
//           {data.lowStock.length === 0 ? (
//             <p className="text-gray-500 text-center py-8">All products are well stocked! 🎉</p>
//           ) : (
//             <div className="space-y-3">
//               {data.lowStock.map((item, idx) => (
//                 <div
//                   key={idx}
//                   className="flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
//                       <Package className="text-red-600" size={20} />
//                     </div>
//                     <div>
//                       <p className="font-semibold text-gray-800">{item.name}</p>
//                       <p className="text-xs text-gray-500">Rs {item.price}</p>
//                     </div>
//                   </div>
//                   <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-bold">
//                     {item.qty} left
//                   </span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Top Selling Items */}
//         <div className="bg-white rounded-2xl shadow-lg p-6">
//           <div className="flex items-center gap-3 mb-6">
//             <div className="p-3 bg-green-100 rounded-xl">
//               <TrendingUp className="text-green-600" size={24} />
//             </div>
//             <h3 className="text-xl font-bold text-gray-800">Top Sellers Today</h3>
//           </div>
          
//           {data.mostSoldItems.length === 0 ? (
//             <p className="text-gray-500 text-center py-8">No sales yet today</p>
//           ) : (
//             <div className="space-y-3">
//               {data.mostSoldItems.map((item, idx) => (
//                 <div
//                   key={idx}
//                   className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center font-bold text-green-800">
//                       #{idx + 1}
//                     </div>
//                     <div>
//                       <p className="font-semibold text-gray-800">{item.name}</p>
//                       <p className="text-xs text-green-600 font-medium">
//                         Profit: Rs {item.profit?.toLocaleString() || 0}
//                       </p>
//                     </div>
//                   </div>
//                   <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-bold">
//                     {item.qty} sold
//                   </span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;



import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  AlertTriangle,
  Users,
  RotateCcw,
  RefreshCw,
  Calendar,
  Package,
  ArrowUpRight,
  Activity,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileText,
  BarChart3,
} from "lucide-react";

/* ─── Utilities ─── */
const fmt = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return "Rs 0";
  return `Rs ${num.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
};

const fmtInt = (n) => {
  const num = parseInt(n, 10);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-PK");
};

/* ─── Sub-components ─── */

const KpiCard = ({ title, value, subtitle, icon: Icon, gradient }) => (
  <div
    className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
    style={{ background: gradient }}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-5 -mb-5" />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon size={20} className="text-white" />
        </div>
        <ArrowUpRight size={18} className="text-white/60" />
      </div>
      <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      {subtitle && <p className="text-white/70 text-xs mt-2">{subtitle}</p>}
    </div>
  </div>
);

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, label, color = "text-slate-800" }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div
      className={`p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 ${color}`}
    >
      <Icon size={18} />
    </div>
    <h3 className="text-lg font-bold text-slate-800">{label}</h3>
  </div>
);

const Empty = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
    <Activity size={32} className="mb-2 opacity-50" />
    <p className="text-sm">{message}</p>
  </div>
);

const ProgressBar = ({ value, max, colorClass }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/* ─── Main Dashboard ─── */

const Dashboard = () => {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `http://localhost:8081/User/dashboard-stats?date=${date}`,
        { timeout: 15000 }
      );
      setData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  /* ── Loading State ── */
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
            <div className="h-8 bg-gray-200 rounded w-56" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 bg-gray-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md shadow-xl border border-red-100">
          <AlertTriangle
            size={48}
            className="text-red-500 mx-auto mb-4"
          />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Dashboard Unavailable
          </h3>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchDashboard}
            className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const realizedProfit =
    data.realizedProfit !== undefined
      ? data.realizedProfit
      : data.grossProfit;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* ═══════ HEADER ═══════ */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
              🏍
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Fawad Honda Center
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Business Intelligence Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium text-slate-700"
              />
            </div>

            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold text-slate-700 shadow-sm transition-all"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ═══════ KPI CARDS ═══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <KpiCard
            title="Cash In Hand"
            value={fmt(data.totalCashReceived)}
            subtitle={`Sales: ${fmt(data.directCashSales)}`}
            icon={Wallet}
            gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
          />
          <KpiCard
            title="Realized Profit"
            value={fmt(realizedProfit)}
            subtitle={`Net: ${fmt(data.netProfit)}`}
            icon={TrendingUp}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          />
          <KpiCard
            title="Pending Loans"
            value={fmt(data.totalPendingAmount)}
            subtitle={`${fmtInt(data.totalPendingLoans)} loans`}
            icon={CreditCard}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          />
          <KpiCard
            title="Today's Revenue"
            value={fmt(data.totalRevenue)}
            subtitle={`${fmtInt(data.totalSales)} sales`}
            icon={ShoppingCart}
            gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
          />
        </div>

        {/* ═══════ SECOND ROW ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Top Products */}
          <GlassCard className="p-6">
            <SectionTitle
              icon={Package}
              label="Top Selling Products"
              color="text-blue-600"
            />
            {!data.mostSoldItems?.length ? (
              <Empty message="No products sold today" />
            ) : (
              <div className="space-y-3">
                {data.mostSoldItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Revenue: {fmt(item.revenue)} · Profit:{" "}
                        {fmt(item.profit)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-blue-600">
                        {item.qty}
                      </p>
                      <p className="text-xs text-slate-400">sold</p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Stock Alerts */}
          <GlassCard className="p-6">
            <SectionTitle
              icon={AlertTriangle}
              label="Stock Alerts"
              color="text-red-500"
            />
            {!data.lowStock?.length && !data.outOfStock?.length ? (
              <Empty message="All products well stocked" />
            ) : (
              <div className="space-y-3">
                {data.outOfStock?.map((item, i) => (
                  <div
                    key={`out-${i}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-red-200 bg-red-50/50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {fmt(item.price)}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                      OUT OF STOCK
                    </span>
                  </div>
                ))}
                {data.lowStock?.map((item, i) => (
                  <div
                    key={`low-${i}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-orange-100 bg-orange-50/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <Package size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {fmt(item.price)} · Min: {item.minStock}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-orange-600">
                        {item.qty}
                      </p>
                      <p className="text-xs text-slate-400">left</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* ═══════ THIRD ROW ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Top Customers */}
          <GlassCard className="p-6">
            <SectionTitle
              icon={Users}
              label="Top Customers"
              color="text-emerald-600"
            />
            {!data.topCustomers?.length ? (
              <Empty message="No customer data" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCustomers.map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                              {c.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-700">
                              {c.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-500 text-sm">
                          {c.orderCount ?? c.purchases}
                        </td>
                        <td className="py-4 text-right font-bold text-emerald-600">
                          {fmt(c.totalPurchased ?? c.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Returns & Collections */}
          <GlassCard className="p-6">
            <SectionTitle
              icon={RotateCcw}
              label="Returns & Collections"
              color="text-orange-500"
            />
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-400 font-medium">
                  Total Returns Value
                </p>
                <h3 className="text-4xl font-bold text-orange-500 mt-1">
                  {fmt(data.totalReturns)}
                </h3>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
                <RotateCcw size={28} className="text-orange-500" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Approved Returns</span>
                <span className="font-bold text-slate-800">
                  {fmtInt(data.returnCount)}
                </span>
              </div>
              <ProgressBar
                value={data.returnCount}
                max={data.totalSales}
                colorClass="bg-orange-400"
              />

              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                <span className="text-slate-500">Collection Rate</span>
                <span className="font-bold text-blue-600">
                  {data.collectionRate}%
                </span>
              </div>
              <ProgressBar
                value={parseFloat(data.collectionRate)}
                max={100}
                colorClass="bg-blue-500"
              />

              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                <span className="text-slate-500">Loan Payments Today</span>
                <span className="font-bold text-slate-700">
                  {fmt(data.totalLoanPayments)}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ═══════ BOTTOM STATS ═══════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: "Total Sales",
              value: fmtInt(data.totalSales),
              icon: Receipt,
              color: "text-slate-700",
            },
            {
              label: "Expenses",
              value: fmt(data.totalExpenses),
              icon: DollarSign,
              color: "text-red-500",
            },
            {
              label: "Collection Rate",
              value: `${data.collectionRate}%`,
              icon: CheckCircle2,
              color: "text-blue-500",
            },
            {
              label: "Avg Sale",
              value: fmt(data.avgSaleValue),
              icon: BarChart3,
              color: "text-purple-500",
            },
          ].map((stat, i) => (
            <GlassCard
              key={i}
              className="p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow"
            >
              <stat.icon size={20} className={`${stat.color} mb-3`} />
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </GlassCard>
          ))}
        </div>

        {/* ═══════ HOURLY TREND + EXPENSES ═══════ */}
        {(data.hourlySales?.length > 0 ||
          data.expenseBreakdown?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            {data.hourlySales?.length > 0 && (
              <GlassCard className="p-6">
                <SectionTitle
                  icon={Activity}
                  label="Hourly Sales Trend"
                  color="text-indigo-500"
                />
                <div className="space-y-3">
                  {data.hourlySales.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400 w-16 shrink-0">
                        {h.hour}:00
                      </span>
                      <div className="flex-1">
                        <ProgressBar
                          value={h.revenue}
                          max={data.totalRevenue}
                          colorClass="bg-indigo-400"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                        {fmt(h.revenue)}
                      </span>
                      <span className="text-xs text-slate-400 w-10 text-right shrink-0">
                        {h.salesCount}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {data.expenseBreakdown?.length > 0 && (
              <GlassCard className="p-6">
                <SectionTitle
                  icon={FileText}
                  label="Expense Breakdown"
                  color="text-rose-500"
                />
                <div className="space-y-3">
                  {data.expenseBreakdown.map((e, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500 w-24 shrink-0 capitalize">
                        {e.category}
                      </span>
                      <div className="flex-1">
                        <ProgressBar
                          value={e.amount}
                          max={data.totalExpenses}
                          colorClass="bg-rose-400"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-20 text-right shrink-0">
                        {fmt(e.amount)}
                      </span>
                      <span className="text-xs text-slate-400 w-8 text-right shrink-0">
                        {e.count}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* ═══════ RECENT PAYMENTS ═══════ */}
        {data.recentPayments?.length > 0 && (
          <GlassCard className="p-6 mb-8">
            <SectionTitle
              icon={Clock}
              label="Recent Loan Payments"
              color="text-cyan-600"
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((p, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-3 font-medium text-slate-700">
                        {p.customer_name}
                      </td>
                      <td className="py-3 font-bold text-cyan-600">
                        {fmt(p.amount)}
                      </td>
                      <td className="py-3 text-slate-500 text-sm capitalize">
                        {p.payment_method}
                      </td>
                      <td className="py-3 text-slate-500 text-sm capitalize">
                        {p.loan_type}
                      </td>
                      <td className="py-3 text-right text-xs text-slate-400">
                        {new Date(p.created_at).toLocaleTimeString("en-PK", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* ═══════ FOOTER ═══════ */}
        <div className="text-center text-xs text-slate-400 pt-4 pb-8">
          <p>Fawad Honda Center — {date}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;