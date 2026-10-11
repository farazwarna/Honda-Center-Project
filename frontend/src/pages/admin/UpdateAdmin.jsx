import { useState, useEffect } from "react";

const EyeOpen = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckCircle = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
    <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XCircle = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const strengthConfig = [
  { label: "", color: "" },
  { label: "Weak", color: "bg-red-400" },
  { label: "Fair", color: "bg-orange-400" },
  { label: "Good", color: "bg-yellow-400" },
  { label: "Strong", color: "bg-emerald-400" },
  { label: "Excellent", color: "bg-teal-500" },
];

const strengthTextColor = [
  "",
  "text-red-500",
  "text-orange-500",
  "text-yellow-500",
  "text-emerald-600",
  "text-teal-600",
];

export default function UpdatePassword() {
  const [admin, setAdmin] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [strength, setStrength] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" }); // type: "success" | "error"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8081/Admin/get")
      .then((r) => r.json())
      .then((data) => { if (data.success) setAdmin(data.admin); })
      .catch(() => setStatus({ type: "error", message: "Could not connect to the server." }))
      .finally(() => setLoadingAdmin(false));
  }, []);

  useEffect(() => {
    const p = form.newPassword;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setStrength(s);
  }, [form.newPassword]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setStatus({ type: "", message: "" });
  };

  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword)
      return setStatus({ type: "error", message: "All fields are required." });
    if (form.newPassword !== form.confirmPassword)
      return setStatus({ type: "error", message: "New passwords do not match." });
    if (form.newPassword.length < 6)
      return setStatus({ type: "error", message: "Password must be at least 6 characters." });

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("http://localhost:8081/Admin/update-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: "success", message: data.message });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setStrength(0);
      } else {
        setStatus({ type: "error", message: data.message });
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Outfit',sans-serif]">

      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-t-2xl" />

        {/* Card */}
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl shadow-xl shadow-slate-200/80 px-8 py-8">

          {/* Header */}
          <div className="flex items-center gap-4 mb-7">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <LockIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Change Password</h1>
              <p className="text-sm text-slate-400 mt-0.5">Manage your admin credentials</p>
            </div>
          </div>

          {/* Admin Info Card */}
          {loadingAdmin ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-6 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-slate-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-200 rounded w-28" />
                <div className="h-3 bg-slate-200 rounded w-40" />
              </div>
            </div>
          ) : admin ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {admin.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{admin.username}</p>
                <p className="text-xs text-slate-400 truncate">{admin.email}</p>
              </div>
              <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full flex-shrink-0">
                Admin
              </span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={show.current ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => toggle("current")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {show.current ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={show.new ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => toggle("new")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {show.new ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>

              {/* Strength meter */}
              {form.newPassword && (
                <div className="mt-2.5">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength
                            ? strengthConfig[strength].color
                            : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${strengthTextColor[strength]}`}>
                    {strengthConfig[strength].label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={show.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2.5 pr-11 rounded-xl border bg-slate-50 text-slate-800 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    passwordsMismatch
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : passwordsMatch
                      ? "border-emerald-300 focus:ring-emerald-200 focus:border-emerald-400"
                      : "border-slate-200 focus:ring-indigo-300 focus:border-indigo-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggle("confirm")}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    passwordsMatch
                      ? "text-emerald-500"
                      : passwordsMismatch
                      ? "text-red-400"
                      : "text-slate-300 hover:text-slate-500"
                  }`}
                >
                  {passwordsMatch ? <CheckCircle /> : show.confirm ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords don't match</p>
              )}
            </div>

            {/* Status Alert */}
            {status.message && (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
                  status.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                <span className={status.type === "success" ? "text-emerald-500" : "text-red-400"}>
                  {status.type === "success" ? <CheckCircle /> : <XCircle />}
                </span>
                {status.message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || loadingAdmin}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm tracking-wide shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-300 mt-6">
            Changes are applied immediately and cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}