// LoanApp.jsx — Full screen, Tailwind CSS, no navbar, red accent
// Plug into your layout that already has a sidebar + navbar
// Usage: <LoanApp />

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8081/CashLoan";

const fmt = (n) =>
  "Rs " + Number(n).toLocaleString("en-PK", { minimumFractionDigits: 0 });

const todayStr = () => new Date().toISOString().split("T")[0];

const COLORS = [
  "bg-red-500", "bg-rose-500", "bg-orange-500",
  "bg-blue-600", "bg-indigo-500", "bg-teal-500",
  "bg-purple-500", "bg-pink-500",
];
const avatarColor = (name) => COLORS[name.charCodeAt(0) % COLORS.length];

export default function EasyKhata() {
  const [parties, setParties]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [txns, setTxns]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [view, setView]           = useState("home");
  const [search, setSearch]       = useState("");
  const [partyForm, setPartyForm] = useState({ name: "", phone: "" });
  const [txnForm, setTxnForm]     = useState({ type: "gave", amount: "", note: "", date: todayStr() });
  const [toast, setToast]         = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchParties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/parties`);
      setParties(await res.json());
    } catch {
      showToast("Cannot reach server", "error");
    }
    setLoading(false);
  }, []);

  const fetchTxns = useCallback(async (pid) => {
    const res = await fetch(`${API}/transactions/${pid}`);
    setTxns(await res.json());
  }, []);

  useEffect(() => { fetchParties(); }, [fetchParties]);

  const openParty = async (party) => {
    setSelected(party);
    await fetchTxns(party.id);
    setView("detail");
  };

  const refreshSelected = async (id) => {
    const list = await fetch(`${API}/parties`).then(r => r.json());
    setParties(list);
    const updated = list.find(x => x.id === id);
    if (updated) setSelected(updated);
  };

  const addParty = async () => {
    if (!partyForm.name.trim()) return showToast("Name is required", "error");
    const res = await fetch(`${API}/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partyForm),
    });
    if (res.ok) {
      showToast("Party added successfully!");
      setPartyForm({ name: "", phone: "" });
      fetchParties();
      setView("home");
    }
  };

  const deleteParty = async (id) => {
    await fetch(`${API}/parties/${id}`, { method: "DELETE" });
    showToast("Party deleted", "error");
    fetchParties();
    setDelConfirm(null);
    setView("home");
  };

  const addTxn = async () => {
    if (!txnForm.amount || isNaN(txnForm.amount) || Number(txnForm.amount) <= 0)
      return showToast("Enter a valid amount", "error");
    const res = await fetch(`${API}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...txnForm, party_id: selected.id }),
    });
    if (res.ok) {
      showToast(txnForm.type === "gave" ? "Loan given recorded!" : "Loan received recorded!");
      setTxnForm({ type: "gave", amount: "", note: "", date: todayStr() });
      await fetchTxns(selected.id);
      await refreshSelected(selected.id);
      setView("detail");
    }
  };

  const deleteTxn = async (id) => {
    await fetch(`${API}/transactions/${id}`, { method: "DELETE" });
    showToast("Entry removed", "error");
    fetchTxns(selected.id);
    refreshSelected(selected.id);
  };

  const balance   = (p) => Number(p.total_gave) - Number(p.total_took);
  const totalGave = parties.reduce((s, p) => s + Number(p.total_gave), 0);
  const totalTook = parties.reduce((s, p) => s + Number(p.total_took), 0);
  const netGet    = Math.max(0, totalGave - totalTook);
  const netGive   = Math.max(0, totalTook - totalGave);

  const filtered = parties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || "").includes(search)
  );

  return (
    <div className="w-full h-full min-h-screen bg-slate-50 flex flex-col">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl text-white text-sm font-semibold pointer-events-none
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {delConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h3 className="text-lg font-black text-slate-800 mb-1 text-center">Delete Party?</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">This will permanently delete the party and all their transaction records.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteParty(delConfirm)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ HOME ══════════════ */}
      {view === "home" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Page Header */}
          <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">💰 UdhaarBook</h1>
              <p className="text-xs text-slate-400 mt-0.5">Cash Loan Tracker</p>
            </div>
            <button onClick={() => setView("addParty")}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-red-200 transition-all">
              + Add Party
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 p-5">
              <div className="relative overflow-hidden rounded-2xl p-5 bg-emerald-500 shadow-lg shadow-emerald-200">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="absolute -bottom-5 -left-3 w-16 h-16 bg-white/10 rounded-full" />
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">You'll Get</p>
                <p className="text-white text-2xl font-black leading-tight">{fmt(netGet)}</p>
                <p className="text-emerald-200 text-xs mt-1.5">
                  {parties.filter(p => balance(p) > 0).length} parties
                </p>
              </div>
              <div className="relative overflow-hidden rounded-2xl p-5 bg-red-500 shadow-lg shadow-red-200">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="absolute -bottom-5 -left-3 w-16 h-16 bg-white/10 rounded-full" />
                <p className="text-red-100 text-[10px] font-bold uppercase tracking-widest mb-1">You'll Give</p>
                <p className="text-white text-2xl font-black leading-tight">{fmt(netGive)}</p>
                <p className="text-red-200 text-xs mt-1.5">
                  {parties.filter(p => balance(p) < 0).length} parties
                </p>
              </div>
            </div>

            {/* Net Strip */}
            <div className="mx-5 mb-5 bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-emerald-400 to-red-400" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net Balance</p>
                  <p className={`text-xl font-black ${netGet >= netGive ? "text-emerald-600" : "text-red-500"}`}>
                    {fmt(Math.abs(netGet - netGive))}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">{parties.length} total parties</p>
                <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full
                  ${netGet >= netGive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {netGet >= netGive ? "▲ Positive" : "▼ Negative"}
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="px-5 mb-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-red-400 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Party List */}
            <div className="px-5 pb-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All Parties</p>
                <p className="text-xs text-slate-400 font-medium">{filtered.length} results</p>
              </div>

              {loading && (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-slate-500 font-semibold text-sm">
                    {search ? "No matching parties" : "No parties yet"}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {search ? "Try a different name or phone" : "Tap + Add Party to get started"}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {filtered.map((p) => {
                  const bal = balance(p);
                  const pos = bal >= 0;
                  return (
                    <button key={p.id} onClick={() => openParty(p)}
                      className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-red-100 active:scale-[0.99] transition-all text-left group">
                      <div className={`w-12 h-12 rounded-2xl ${avatarColor(p.name)} flex items-center justify-center text-white text-lg font-black flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{p.phone || "No phone number"}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-black text-base ${pos ? "text-emerald-600" : "text-red-500"}`}>
                          {fmt(Math.abs(bal))}
                        </p>
                        <p className={`text-[10px] font-bold mt-0.5 ${pos ? "text-emerald-400" : "text-red-400"}`}>
                          {pos ? "will give you ↑" : "you will give ↓"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ DETAIL ══════════════ */}
      {view === "detail" && selected && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
            <button onClick={() => setView("home")}
              className="text-red-500 hover:text-red-600 font-bold text-sm transition-colors">
              ← Back
            </button>
            <p className="font-black text-slate-800 text-sm truncate max-w-[160px]">{selected.name}</p>
            <button onClick={() => setDelConfirm(selected.id)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg">
              🗑️
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Hero Card */}
            <div className="m-5 rounded-3xl overflow-hidden shadow-xl border border-slate-200">
              <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 px-6 pt-6 pb-7 relative">
                <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/10 rounded-full -translate-y-10 translate-x-10" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
                <div className="relative flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${avatarColor(selected.name)} flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                    {selected.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-white font-black text-xl leading-tight">{selected.name}</h2>
                    <p className="text-slate-400 text-sm mt-0.5">{selected.phone || "No phone number"}</p>
                  </div>
                </div>
                <div className="relative bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net Balance</p>
                  <p className={`text-3xl font-black ${balance(selected) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(Math.abs(balance(selected)))}
                  </p>
                  <p className={`text-xs font-bold mt-1 ${balance(selected) >= 0 ? "text-emerald-400/80" : "text-red-400/80"}`}>
                    {balance(selected) >= 0 ? "↑ will give you" : "↓ you will give"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 bg-white divide-x divide-slate-100">
                <div className="px-5 py-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Gave</p>
                  <p className="text-emerald-600 font-black text-lg">{fmt(selected.total_gave)}</p>
                </div>
                <div className="px-5 py-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Took</p>
                  <p className="text-red-500 font-black text-lg">{fmt(selected.total_took)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 px-5 mb-5">
              <button
                onClick={() => { setTxnForm({ type: "gave", amount: "", note: "", date: todayStr() }); setView("addTxn"); }}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-1.5 shadow-lg shadow-emerald-200 transition-all">
                <span className="text-2xl">💸</span>
                <span className="text-sm">You Gave</span>
              </button>
              <button
                onClick={() => { setTxnForm({ type: "took", amount: "", note: "", date: todayStr() }); setView("addTxn"); }}
                className="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-1.5 shadow-lg shadow-red-200 transition-all">
                <span className="text-2xl">📥</span>
                <span className="text-sm">You Got</span>
              </button>
            </div>

            {/* Transactions */}
            <div className="px-5 pb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Transaction History</p>

              {txns.length === 0 && (
                <div className="text-center py-14 bg-white rounded-2xl border border-slate-100">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-slate-500 font-semibold text-sm">No transactions yet</p>
                  <p className="text-slate-400 text-xs mt-1">Use the buttons above to record a loan</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {txns.map((t) => (
                  <div key={t.id}
                    className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0 shadow
                      ${t.type === "gave" ? "bg-emerald-500" : "bg-red-500"}`}>
                      {t.type === "gave" ? "↑" : "↓"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {t.note || (t.type === "gave" ? "Loan Given" : "Loan Received")}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(t.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                      <p className={`font-black text-base ${t.type === "gave" ? "text-emerald-600" : "text-red-500"}`}>
                        {fmt(t.amount)}
                      </p>
                      <button onClick={() => deleteTxn(t.id)}
                        className="text-[10px] text-slate-300 hover:text-red-400 font-semibold hover:bg-red-50 rounded px-1.5 py-0.5 transition-colors">
                        ✕ remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ADD PARTY ══════════════ */}
      {view === "addParty" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-4 shadow-sm flex-shrink-0">
            <button onClick={() => setView("home")}
              className="text-red-500 hover:text-red-600 font-bold text-sm transition-colors">← Back</button>
            <p className="font-black text-slate-800">Add New Party</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto p-5">
              <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-3xl p-8 text-center mb-6 border border-red-100">
                <div className="text-6xl mb-3">👤</div>
                <p className="text-red-600 font-black text-base">New Contact</p>
                <p className="text-red-400 text-sm mt-1">Start tracking loans with this person</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name *</label>
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-400 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all"
                    placeholder="e.g. Ali Khan"
                    value={partyForm.name}
                    onChange={e => setPartyForm({ ...partyForm, name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && addParty()}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label>
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-400 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all"
                    placeholder="0300-1234567 (optional)"
                    value={partyForm.phone}
                    onChange={e => setPartyForm({ ...partyForm, phone: e.target.value })}
                  />
                </div>
                <button onClick={addParty}
                  className="w-full bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-black py-4 rounded-xl shadow-lg shadow-red-200 transition-all mt-1 text-sm">
                  Add Party
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ADD TRANSACTION ══════════════ */}
      {view === "addTxn" && selected && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-4 shadow-sm flex-shrink-0">
            <button onClick={() => setView("detail")}
              className="text-red-500 hover:text-red-600 font-bold text-sm transition-colors">← Back</button>
            <p className="font-black text-slate-800">New Transaction</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto p-5">

              {/* Party Badge */}
              <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-5">
                <div className={`w-10 h-10 rounded-xl ${avatarColor(selected.name)} flex items-center justify-center text-white font-black flex-shrink-0`}>
                  {selected.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recording for</p>
                  <p className="font-black text-slate-800 text-sm">{selected.name}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Balance</p>
                  <p className={`font-black text-sm ${balance(selected) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {fmt(Math.abs(balance(selected)))}
                  </p>
                </div>
              </div>

              {/* Type Toggle */}
              <div className="bg-slate-100 rounded-2xl p-1.5 flex gap-1.5 mb-5">
                <button
                  onClick={() => setTxnForm({ ...txnForm, type: "gave" })}
                  className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all
                    ${txnForm.type === "gave"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                      : "text-slate-500 hover:text-slate-700"}`}>
                  💸 You Gave
                </button>
                <button
                  onClick={() => setTxnForm({ ...txnForm, type: "took" })}
                  className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all
                    ${txnForm.type === "took"
                      ? "bg-red-500 text-white shadow-md shadow-red-200"
                      : "text-slate-500 hover:text-slate-700"}`}>
                  📥 You Got
                </button>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-5">
                {/* Amount */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Amount (Rs) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs</span>
                    <input
                      className={`w-full bg-slate-50 border-2 focus:bg-white rounded-xl pl-10 pr-4 py-4 text-2xl font-black placeholder-slate-300 outline-none transition-all
                        ${txnForm.type === "gave"
                          ? "border-emerald-200 focus:border-emerald-400 text-emerald-700"
                          : "border-red-200 focus:border-red-400 text-red-600"}`}
                      type="number"
                      placeholder="0"
                      value={txnForm.amount}
                      onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })}
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Note</label>
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-400 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all"
                    placeholder="e.g. Rent, emergency, shop expenses..."
                    value={txnForm.note}
                    onChange={e => setTxnForm({ ...txnForm, note: e.target.value })}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Date</label>
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-400 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition-all"
                    type="date"
                    value={txnForm.date}
                    onChange={e => setTxnForm({ ...txnForm, date: e.target.value })}
                  />
                </div>

                <button onClick={addTxn}
                  className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] text-sm
                    ${txnForm.type === "gave"
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                      : "bg-red-500 hover:bg-red-600 shadow-red-200"}`}>
                  Save Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}