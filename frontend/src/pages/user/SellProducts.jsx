// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import QuantityInput from "../../components/user/sell/Quantity";
// import { printA4, printThermal } from "../../utils/printInvoice";

// // ─── helper: block minus / e / + from number inputs ──────────────────────────
// const blockInvalidKeys = (e) => {
//   if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
//     e.preventDefault();
//   }
// };

// const blockNegativePaste = (e) => {
//   const pasted = e.clipboardData.getData("text");
//   if (parseFloat(pasted) < 0) e.preventDefault();
// };

// const POS = () => {
//   const [cart, setCart] = useState([]);
//   const [message, setMessage] = useState("");
//   const [msgType, setMsgType] = useState("info");

//   const [discount, setDiscount] = useState(0);
//   const [cash, setCash] = useState(0);

//   const [paymentType, setPaymentType] = useState("cash");
//   const [customerType, setCustomerType] = useState("retail");

//   const [paymentOpen, setPaymentOpen] = useState(false);
//   const [customerTypeOpen, setCustomerTypeOpen] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const [scanning, setScanning] = useState(false);

//   const [customerName, setCustomerName] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");
//   const [customerAddress, setCustomerAddress] = useState("");

//   const scanRef = useRef();

//   const paymentOptions = ["cash", "loan"];
//   const customerTypes = ["retail", "wholesale"];
//   const [dueDate, setDueDate] = useState("");

//   // ─── focus scan on mount ────────────────────────────────────────────────────
//   useEffect(() => {
//     scanRef.current?.focus();
//   }, []);

//   // ─── clear cash when switching to loan ─────────────────────────────────────
//   useEffect(() => {
//     if (paymentType === "loan") setCash(0);
//   }, [paymentType]);

//   // ─── auto-set due date 30 days from today when switching to loan ────────────
//   useEffect(() => {
//     if (paymentType === "loan") {
//       const d = new Date();
//       d.setDate(d.getDate() + 30);
//       setDueDate(d.toISOString().split("T")[0]);
//     } else {
//       setDueDate(""); // ✅ clear due date when switching back to cash
//     }
//   }, [paymentType]);

//   // ─── reprice cart when customer type changes ────────────────────────────────
//   useEffect(() => {
//     setCart((prev) =>
//       prev.map((item) => ({
//         ...item,
//         price:
//           customerType === "wholesale"
//             ? item.Wholesale_Price
//             : item.selling_Price,
//       }))
//     );
//   }, [customerType]);

//   // ─── helpers ────────────────────────────────────────────────────────────────
//   const showMessage = (msg, type = "info") => {
//     setMessage(msg);
//     setMsgType(type);
//     setTimeout(() => setMessage(""), 3000);
//   };

//   const addToCart = (product) => {
//     const price =
//       customerType === "wholesale"
//         ? product.Wholesale_Price
//         : product.selling_Price;

//     setCart((prev) => {
//       if (product.stock <= 0) {
//         showMessage("❌ Out of stock", "error");
//         return prev;
//       }

//       const exist = prev.find((i) => i.Product_Id === product.Product_Id);

//       if (exist) {
//         if (exist.qty >= product.stock) {
//           showMessage("❌ Stock limit reached", "error");
//           return prev;
//         }
//         return prev.map((i) =>
//           i.Product_Id === product.Product_Id
//             ? { ...i, qty: i.qty + 1 }
//             : i
//         );
//       }

//       return [...prev, { ...product, qty: 1, price, item_discount: 0 }];
//     });
//   };

//   const handleScan = async (qr) => {
//     if (!qr || scanning) return;
//     setScanning(true);
//     try {
//       const res = await axios.get(
//         `http://localhost:8081/User/sellProducts/${qr}`
//       );
//       addToCart(res.data);
//       new Audio("/beep.mp3").play().catch(() => {});
//     } catch {
//       showMessage("❌ Product not found", "error");
//     }
//     setTimeout(() => setScanning(false), 300);
//   };

//   const updateQty = (id, qty) => {
//     const parsed = parseInt(qty, 10);
//     setCart((prev) =>
//       prev.map((item) =>
//         item.Product_Id === id
//           ? {
//               ...item,
//               qty: Math.max(
//                 1,
//                 Math.min(isNaN(parsed) ? 1 : parsed, item.stock || Infinity)
//               ),
//             }
//           : item
//       )
//     );
//   };

//   const updateItemDiscount = (id, value) => {
//     const parsed = parseFloat(value) || 0;
//     setCart((prev) =>
//       prev.map((item) =>
//         item.Product_Id === id
//           ? {
//               ...item,
//               item_discount: Math.max(0, Math.min(parsed, item.price)),
//             }
//           : item
//       )
//     );
//   };

//   const removeFromCart = (id) =>
//     setCart((prev) => prev.filter((i) => i.Product_Id !== id));

//   // ─── totals ─────────────────────────────────────────────────────────────────
//   const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

//   const itemDiscountTotal = cart.reduce(
//     (sum, item) => sum + (item.item_discount || 0) * item.qty,
//     0
//   );

//   const total = Math.max(0, subtotal - itemDiscountTotal - discount);

//   const estimatedProfit =
//     cart.reduce((sum, item) => {
//       const costPrice = item.Product_Price || 0;
//       const salePrice = item.price;
//       const itemDisc = item.item_discount || 0;
//       return sum + (salePrice - itemDisc - costPrice) * item.qty;
//     }, 0) - discount;

//   const change = Math.max(0, cash - total);

//   // ─── checkout ────────────────────────────────────────────────────────────────
//   const handleSell = async () => {
//     if (cart.length === 0) return showMessage("Cart is empty", "error");
//     if (loading) return;

//     if (paymentType === "cash" && cash < total)
//       return showMessage("❌ Cash is less than total", "error");

//     if (paymentType === "loan" && !customerName.trim())
//       return showMessage("❌ Customer name required for loan", "error");

//     if (paymentType === "loan" && !dueDate)
//       return showMessage("❌ Due date required", "error");

//     setLoading(true);

//     try {
//       const items = cart.map((item) => ({
//         product_id: item.Product_Id,
//         quantity: item.qty,
//         item_discount: item.item_discount || 0,
//       }));

//       const res = await axios.post("http://localhost:8081/User/createSale", {
//         customer_type: customerType,
//         customer_name: customerName || null,
//         p_phone: customerPhone || null,
//         p_address: customerAddress || null,
//         discount,
//         paid: cash,
//         payment_type: paymentType,
//         due_date: paymentType === "loan" ? dueDate : null, // ✅ FIX: was missing
//         items,
//       });

//       const { sale_id, invoice_no } = res.data;

//       showMessage(res.data.message || "✅ Sale completed", "info");

//       printThermal({
//         saleId: sale_id,
//         invoiceNo: invoice_no,
//         date: new Date(),
//         customerType,
//         customerName,
//         customerPhone,
//         customerAddress,
//         items: cart,
//         subtotal,
//         itemDiscountTotal,
//         discount,
//         total,
//         cash,
//         change,
//         paymentType,
//       });

//       // Reset state
//       setCart([]);
//       setCash(0);
//       setDiscount(0);
//       setCustomerName("");
//       setCustomerPhone("");
//       setCustomerAddress("");
//     } catch (err) {
//       showMessage(err.response?.data?.message || "❌ Sale failed", "error");
//     }

//     setLoading(false);
//   };

//   // ─── render ──────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-gray-100 p-6 flex gap-6">

//       {/* ════════════════════════════════════════
//           LEFT PANEL
//       ════════════════════════════════════════ */}
//       <div className="w-2/3 bg-white rounded-2xl shadow-xl p-6 space-y-6">

//         <h1 className="text-2xl font-bold text-gray-800">Sell Products</h1>

//         {/* Message banner */}
//         {message && (
//           <div
//             className={`p-2 rounded text-white text-sm font-medium ${
//               msgType === "error" ? "bg-red-500" : "bg-blue-500"
//             }`}
//           >
//             {message}
//           </div>
//         )}

//         {/* QR / Barcode scanner */}
//         <input
//           ref={scanRef}
//           type="text"
//           placeholder="Scan QR Code..."
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               handleScan(e.target.value.trim());
//               e.target.value = "";
//             }
//           }}
//           className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
//         />

//         {/* Customer Type dropdown */}
//         <div className="relative">
//           <button
//             onClick={() => {
//               setCustomerTypeOpen(!customerTypeOpen);
//               setPaymentOpen(false);
//             }}
//             className="w-full flex justify-between items-center p-3 border rounded-lg bg-white hover:bg-gray-50"
//           >
//             <span className="font-medium">{customerType.toUpperCase()}</span>
//             <span className="text-gray-400 text-sm">▾</span>
//           </button>

//           {customerTypeOpen && (
//             <div className="absolute w-full bg-white border rounded-lg mt-1 shadow-lg z-20">
//               {customerTypes.map((type) => (
//                 <div
//                   key={type}
//                   onClick={() => {
//                     setCustomerType(type);
//                     setCustomerTypeOpen(false);
//                   }}
//                   className="p-3 hover:bg-blue-500 hover:text-white cursor-pointer text-sm font-medium"
//                 >
//                   {type.charAt(0).toUpperCase() + type.slice(1)}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Payment Type dropdown */}
//         <div className="relative">
//           <button
//             onClick={() => {
//               setPaymentOpen(!paymentOpen);
//               setCustomerTypeOpen(false);
//             }}
//             className="w-full flex justify-between items-center p-3 border rounded-lg bg-white hover:bg-gray-50"
//           >
//             <span className="font-medium">{paymentType.toUpperCase()}</span>
//             <span className="text-gray-400 text-sm">▾</span>
//           </button>

//           {paymentOpen && (
//             <div className="absolute w-full bg-white border rounded-lg mt-1 shadow-lg z-20">
//               {paymentOptions.map((op) => (
//                 <div
//                   key={op}
//                   onClick={() => {
//                     setPaymentType(op);
//                     setPaymentOpen(false);
//                   }}
//                   className="p-3 hover:bg-blue-500 hover:text-white cursor-pointer text-sm font-medium"
//                 >
//                   {op.charAt(0).toUpperCase() + op.slice(1)}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Loan customer form */}
//         {paymentType === "loan" && (
//           <div className="grid gap-3 border border-yellow-300 p-4 rounded-lg bg-yellow-50">
//             <p className="text-sm font-semibold text-yellow-700">
//               ⚠ Customer details required for loan
//             </p>
//             <input
//               placeholder="Customer Name *"
//               value={customerName}
//               onChange={(e) => setCustomerName(e.target.value)}
//               className="border p-2 rounded outline-none focus:ring-2 focus:ring-yellow-400"
//             />
//             <input
//               placeholder="Phone"
//               value={customerPhone}
//               onChange={(e) => setCustomerPhone(e.target.value)}
//               className="border p-2 rounded outline-none focus:ring-2 focus:ring-yellow-400"
//             />
//             <input
//               placeholder="Address"
//               value={customerAddress}
//               onChange={(e) => setCustomerAddress(e.target.value)}
//               className="border p-2 rounded outline-none focus:ring-2 focus:ring-yellow-400"
//             />

//             {/* Due Date */}
//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium text-yellow-700">
//                 Due Date *
//               </label>
//               <input
//                 type="date"
//                 value={dueDate}
//                 min={new Date().toISOString().split("T")[0]} // ✅ prevent past dates
//                 onChange={(e) => setDueDate(e.target.value)}
//                 className="border p-2 rounded outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
//               />
//             </div>
//           </div>
//         )}

//         {/* ── Cart items ── */}
//         <div className="space-y-3">
//           {cart.length === 0 ? (
//             <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
//               <p className="text-lg">🛒</p>
//               <p className="text-sm mt-1">No items — scan a product to begin</p>
//             </div>
//           ) : (
//             cart.map((item) => {
//               const disc = item.item_discount || 0;
//               const costPrice = item.Product_Price || 0;
//               const lineTotal = item.qty * (item.price - disc);
//               const itemProfit = (item.price - disc - costPrice) * item.qty;

//               return (
//                 <div
//                   key={item.Product_Id}
//                   className="border rounded-xl p-3 bg-gray-50 space-y-2"
//                 >
//                   {/* Row 1 — product name + price label + remove */}
//                   <div className="flex items-start justify-between">
//                     <div>
//                       <p className="font-semibold text-gray-800 text-sm">
//                         {item.Product_Name}
//                       </p>
//                       <p className="text-xs text-gray-500 mt-0.5">
//                         Rs {item.price} ×{" "}
//                         <span
//                           className={`font-semibold ${
//                             customerType === "wholesale"
//                               ? "text-green-600"
//                               : "text-blue-600"
//                           }`}
//                         >
//                           {customerType}
//                         </span>
//                         {" · "}
//                         <span className="text-gray-400">
//                           cost Rs {costPrice}
//                         </span>
//                       </p>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(item.Product_Id)}
//                       className="text-red-400 hover:text-red-600 text-lg leading-none ml-2"
//                     >
//                       ✕
//                     </button>
//                   </div>

//                   {/* Row 2 — qty + item discount + line total */}
//                   <div className="flex items-center gap-3">
//                     <QuantityInput
//                       qty={item.qty}
//                       setQty={(val) => updateQty(item.Product_Id, val)}
//                     />

//                     <div className="flex items-center gap-1 border rounded-lg px-2 py-1 bg-white w-36 focus-within:ring-2 focus-within:ring-yellow-300">
//                       <span className="text-xs text-gray-400 whitespace-nowrap select-none">
//                         Disc Rs
//                       </span>
//                       <input
//                         type="number"
//                         min="0"
//                         max={item.price}
//                         value={disc === 0 ? "" : disc}
//                         placeholder="0"
//                         onKeyDown={blockInvalidKeys}
//                         onPaste={blockNegativePaste}
//                         onChange={(e) =>
//                           updateItemDiscount(item.Product_Id, e.target.value)
//                         }
//                         className="w-full text-right text-sm text-yellow-600 font-semibold outline-none bg-transparent"
//                       />
//                     </div>

//                     <p className="font-bold text-gray-800 ml-auto text-sm">
//                       Rs {lineTotal.toFixed(0)}
//                     </p>
//                   </div>

//                   {/* Row 3 — per-item profit chip */}
//                   <div className="flex justify-end">
//                     <span
//                       className={`text-xs px-2 py-0.5 rounded-full font-medium ${
//                         itemProfit >= 0
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-600"
//                       }`}
//                     >
//                       Item profit: Rs {itemProfit.toFixed(0)}
//                     </span>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>

//       {/* ════════════════════════════════════════
//           RIGHT PANEL — CHECKOUT
//       ════════════════════════════════════════ */}
//       <div className="w-1/3 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4">

//         <h2 className="text-xl font-bold text-gray-800">Checkout</h2>

//         {/* Summary rows */}
//         <div className="space-y-2 text-sm">
//           <div className="flex justify-between text-gray-500">
//             <span>Items (qty)</span>
//             <span className="font-medium text-gray-800">
//               {cart.reduce((s, i) => s + i.qty, 0)}
//             </span>
//           </div>

//           <div className="flex justify-between text-gray-500">
//             <span>Subtotal</span>
//             <span className="font-medium text-gray-800">
//               Rs {subtotal.toFixed(0)}
//             </span>
//           </div>

//           <div className="flex justify-between text-yellow-600">
//             <span>Item Discounts</span>
//             <span className="font-semibold">
//               − Rs {itemDiscountTotal.toFixed(0)}
//             </span>
//           </div>
//         </div>

//         <div className="border-t pt-3 space-y-3">
//           {/* Order-level discount */}
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-500">Order Discount</span>
//             <input
//               type="number"
//               min="0"
//               value={discount === 0 ? "" : discount}
//               placeholder="0"
//               onKeyDown={blockInvalidKeys}
//               onPaste={blockNegativePaste}
//               onChange={(e) =>
//                 setDiscount(Math.max(0, Number(e.target.value) || 0))
//               }
//               className="w-24 border rounded-lg text-right px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-300"
//             />
//           </div>

//           {/* Total due */}
//           <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
//             <span className="font-bold text-blue-800">Total Due</span>
//             <span className="font-bold text-blue-800 text-xl">
//               Rs {total.toFixed(0)}
//             </span>
//           </div>

//           {/* Cash tendered — hidden for loan */}
//           {paymentType === "cash" && (
//             <div className="flex justify-between items-center">
//               <span className="text-sm text-gray-500">Cash</span>
//               <input
//                 type="number"
//                 min="0"
//                 value={cash === 0 ? "" : cash}
//                 placeholder="0"
//                 onKeyDown={blockInvalidKeys}
//                 onPaste={blockNegativePaste}
//                 onChange={(e) =>
//                   setCash(Math.max(0, Number(e.target.value) || 0))
//                 }
//                 className="w-24 border rounded-lg text-right px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-300"
//               />
//             </div>
//           )}

//           {/* Change — only relevant for cash */}
//           {paymentType === "cash" && (
//             <div className="flex justify-between text-green-600 font-bold">
//               <span>Change</span>
//               <span>Rs {change.toFixed(0)}</span>
//             </div>
//           )}

//           {/* Loan info summary */}
//           {paymentType === "loan" && dueDate && (
//             <div className="flex justify-between text-yellow-700 text-sm">
//               <span>Due Date</span>
//               <span className="font-semibold">{dueDate}</span>
//             </div>
//           )}
//         </div>

//         {/* Estimated Profit */}
//         <div
//           className={`flex justify-between items-center px-4 py-3 rounded-xl border text-sm font-semibold ${
//             estimatedProfit >= 0
//               ? "bg-green-50 border-green-200 text-green-700"
//               : "bg-red-50 border-red-200 text-red-600"
//           }`}
//         >
//           <div>
//             <p className="font-bold">Est. Profit</p>
//             <p className="text-xs font-normal opacity-70">
//               after all discounts
//             </p>
//           </div>
//           <span className="text-lg font-bold">
//             Rs {estimatedProfit.toFixed(0)}
//           </span>
//         </div>

//         {/* Checkout button */}
//         <button
//           onClick={handleSell}
//           disabled={cart.length === 0 || loading}
//           className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//         >
//           {loading ? "Processing..." : "Checkout"}
//         </button>

//         {/* Print buttons */}
//         <button
//           onClick={() =>
//             printA4({
//               items: cart,
//               subtotal,
//               itemDiscountTotal,
//               discount,
//               total,
//             })
//           }
//           className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
//         >
//           Print A4
//         </button>

//         <button
//           onClick={() =>
//             printThermal({
//               items: cart,
//               subtotal,
//               itemDiscountTotal,
//               discount,
//               total,
//             })
//           }
//           className="w-full bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
//         >
//           Print Receipt
//         </button>
//       </div>
//     </div>
//   );
// };

// export default POS;













import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Search,
  ScanLine,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Banknote,
  User,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Package,
  ArrowRight,
  CheckCircle2,
  X,
  ChevronDown,
  Receipt,
  Printer,
  FileText,
  AlertCircle,
  TrendingUp,
  Store,
  Clock,
  Zap,
  RefreshCw,
} from "lucide-react";
import { printA4, printThermal } from "../../utils/printInvoice";

/* ─── Utilities ─── */
const fmt = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return "Rs 0";
  return `Rs ${num.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
};

const blockInvalidKeys = (e) => {
  if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
    e.preventDefault();
  }
};

const blockNegativePaste = (e) => {
  const pasted = e.clipboardData.getData("text");
  if (parseFloat(pasted) < 0) e.preventDefault();
};

/* ─── Sub-components ─── */

const GlassBadge = ({ children, color = "blue" }) => {
  const map = {
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber:  "bg-amber-50 text-amber-700 border-amber-200",
    red:    "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate:  "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${map[color] || map.blue}`}>
      {children}
    </span>
  );
};

const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <ShoppingCart size={32} className="text-slate-300" />
    </div>
    <p className="text-sm font-medium">Your cart is empty</p>
    <p className="text-xs text-slate-400 mt-1">Scan a product or search by name</p>
  </div>
);

const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

/* ─── Main POS ─── */

const POS = () => {
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("info");

  const [discount, setDiscount] = useState(0);
  const [cash, setCash] = useState(0);

  const [paymentType, setPaymentType] = useState("cash");
  const [customerType, setCustomerType] = useState("retail");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [customerTypeOpen, setCustomerTypeOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const scanRef = useRef();
  const searchRef = useRef();
  const searchDebounce = useRef();

  const paymentOptions = [
    { value: "cash", label: "Cash", icon: Banknote, color: "emerald" },
    { value: "loan", label: "Loan", icon: CreditCard, color: "amber" },
  ];

  const customerTypes = [
    { value: "retail", label: "Retail", icon: User, color: "blue" },
    { value: "wholesale", label: "Wholesale", icon: Store, color: "purple" },
  ];

  const [dueDate, setDueDate] = useState("");

  /* ── Focus scan on mount ── */
  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  /* ── Clear cash when loan ── */
  useEffect(() => {
    if (paymentType === "loan") setCash(0);
  }, [paymentType]);

  /* ── Auto due date for loan ── */
  useEffect(() => {
    if (paymentType === "loan") {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().split("T")[0]);
    } else {
      setDueDate("");
    }
  }, [paymentType]);

  /* ── Reprice cart on customer type change ── */
  useEffect(() => {
    setCart((prev) =>
      prev.map((item) => ({
        ...item,
        price:
          customerType === "wholesale"
            ? item.Wholesale_Price
            : item.selling_Price,
      }))
    );
  }, [customerType]);

  /* ── Search by name ── */
  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8081/User/searchProducts?q=${encodeURIComponent(query)}`
      );
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
      // Don't show toast for search errors - too noisy
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery, searchProducts]);

  /* ── helpers ── */
  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const addToCart = (product) => {
    const price =
      customerType === "wholesale" && product.Wholesale_Price
        ? product.Wholesale_Price
        : product.selling_Price || product.Product_Price || 0;

    setCart((prev) => {
      if (product.stock <= 0) {
        showMessage("Out of stock", "error");
        return prev;
      }

      const exist = prev.find((i) => i.Product_Id === product.Product_Id);

      if (exist) {
        if (exist.qty >= product.stock) {
          showMessage("Stock limit reached", "error");
          return prev;
        }
        return prev.map((i) =>
          i.Product_Id === product.Product_Id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      return [...prev, { ...product, qty: 1, price, item_discount: 0 }];
    });

    setSearchQuery("");
    setSearchResults([]);
    showMessage(`${product.Product_Name} added to cart`, "success");
  };

  const handleScan = async (qr) => {
    if (!qr || scanning) return;
    setScanning(true);
    try {
      const res = await axios.get(
        `http://localhost:8081/User/sellProducts/${qr}`
      );
      addToCart(res.data);
      new Audio("/beep.mp3").play().catch(() => {});
    } catch {
      showMessage("Product not found", "error");
    }
    setTimeout(() => setScanning(false), 300);
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.Product_Id !== id) return item;
        const newQty = item.qty + delta;
        if (newQty < 1) return item;
        if (newQty > item.stock) {
          showMessage("Stock limit reached", "error");
          return item;
        }
        return { ...item, qty: newQty };
      })
    );
  };

  const setQtyDirect = (id, qty) => {
    const parsed = parseInt(qty, 10);
    setCart((prev) =>
      prev.map((item) =>
        item.Product_Id === id
          ? {
              ...item,
              qty: Math.max(
                1,
                Math.min(isNaN(parsed) ? 1 : parsed, item.stock || Infinity)
              ),
            }
          : item
      )
    );
  };

  const updateItemDiscount = (id, value) => {
    const parsed = parseFloat(value) || 0;
    setCart((prev) =>
      prev.map((item) =>
        item.Product_Id === id
          ? {
              ...item,
              item_discount: Math.max(0, Math.min(parsed, item.price)),
            }
          : item
      )
    );
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.Product_Id !== id));

  /* ── totals ── */
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const itemDiscountTotal = cart.reduce(
    (sum, item) => sum + (item.item_discount || 0) * item.qty,
    0
  );

  const total = Math.max(0, subtotal - itemDiscountTotal - discount);

  const estimatedProfit =
    cart.reduce((sum, item) => {
      const costPrice = item.Product_Price || 0;
      const salePrice = item.price;
      const itemDisc = item.item_discount || 0;
      return sum + (salePrice - itemDisc - costPrice) * item.qty;
    }, 0) - discount;

  const change = Math.max(0, cash - total);

  /* ── checkout ── */
  const handleSell = async () => {
    if (cart.length === 0) return showMessage("Cart is empty", "error");
    if (loading) return;

    if (paymentType === "cash" && cash < total)
      return showMessage("Cash is less than total", "error");

    if (paymentType === "loan" && !customerName.trim())
      return showMessage("Customer name required for loan", "error");

    if (paymentType === "loan" && !dueDate)
      return showMessage("Due date required", "error");

    setLoading(true);

    try {
      const items = cart.map((item) => ({
        product_id: item.Product_Id,
        quantity: item.qty,
        item_discount: item.item_discount || 0,
      }));

      const res = await axios.post("http://localhost:8081/User/createSale", {
        customer_type: customerType,
        customer_name: customerName || null,
        p_phone: customerPhone || null,
        p_address: customerAddress || null,
        discount,
        paid: cash,
        payment_type: paymentType,
        due_date: paymentType === "loan" ? dueDate : null,
        items,
      });

      const { sale_id, invoice_no } = res.data;

      showMessage(res.data.message || "Sale completed", "success");

      // Reset
      setCart([]);
      setCash(0);
      setDiscount(0);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      showMessage(err.response?.data?.message || "Sale failed", "error");
    }

    setLoading(false);
  };

  const activePayment = paymentOptions.find((p) => p.value === paymentType);
  const activeCustomer = customerTypes.find((c) => c.value === customerType);

  return (
    <div className="min-h-screen bg-slate-50 flex gap-0">
      {/* ════════════════════════════════════════
          LEFT PANEL — PRODUCTS & CART
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <Store size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Point of Sale</h1>
            <p className="text-xs text-slate-500">Fawad Honda Center</p>
          </div>

          {/* Message Toast */}
          <div className="ml-auto">
            {message && (
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 ${
                  msgType === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : msgType === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {msgType === "error" && <AlertCircle size={16} />}
                {msgType === "success" && <CheckCircle2 size={16} />}
                {msgType === "info" && <Zap size={16} />}
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Search & Scan Bar */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex gap-3">
            {/* Search by Name */}
            <div className="flex-1 relative" ref={searchRef}>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-300 transition-all">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search product by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                />
                {searchLoading && (
                  <RefreshCw size={16} className="animate-spin text-slate-400" />
                )}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchFocused && (searchResults.length > 0 || searchLoading) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-auto">
                  {searchLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <SkeletonPulse key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="py-2">
                      <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                      </p>
                      {searchResults.map((product) => {
                        const price =
                          customerType === "wholesale"
                            ? product.Wholesale_Price
                            : product.selling_Price;
                        const isOut = product.stock <= 0;
                        return (
                          <button
                            key={product.Product_Id}
                            onClick={() => !isOut && addToCart(product)}
                            disabled={isOut}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                              isOut ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              isOut ? "bg-red-100 text-red-500" : "bg-blue-50 text-blue-600"
                            }`}>
                              <Package size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">
                                {product.Product_Name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Stock: {product.stock} · Cost: {fmt(product.Product_Price)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-slate-800 text-sm">{fmt(price)}</p>
                              {isOut ? (
                                <GlassBadge color="red">OUT</GlassBadge>
                              ) : (
                                <GlassBadge color="green">IN STOCK</GlassBadge>
                              )}
                            </div>
                            {!isOut && (
                              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors">
                                <Plus size={16} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {searchFocused && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-6 text-center">
                  <Search size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No products found</p>
                </div>
              )}
            </div>

            {/* QR Scan */}
            <div className="w-64">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <ScanLine size={18} className="text-blue-400 shrink-0" />
                <input
                  ref={scanRef}
                  type="text"
                  placeholder="Scan QR..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleScan(e.target.value.trim());
                      e.target.value = "";
                    }
                  }}
                  className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {cart.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="space-y-3 max-w-4xl">
              {cart.map((item) => {
                const disc = item.item_discount || 0;
                const costPrice = item.Product_Price || 0;
                const lineTotal = item.qty * (item.price - disc);
                const itemProfit = (item.price - disc - costPrice) * item.qty;

                return (
                  <div
                    key={item.Product_Id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Package size={22} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {item.Product_Name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <GlassBadge color={customerType === "wholesale" ? "purple" : "blue"}>
                              {customerType}
                            </GlassBadge>
                            <span className="text-xs text-slate-400">
                              Cost {fmt(costPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.Product_Id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-0 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQty(item.Product_Id, -1)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.qty}
                          onChange={(e) => setQtyDirect(item.Product_Id, e.target.value)}
                          onKeyDown={blockInvalidKeys}
                          className="w-14 h-10 text-center bg-transparent outline-none text-sm font-bold text-slate-800"
                        />
                        <button
                          onClick={() => updateQty(item.Product_Id, 1)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Unit Price */}
                      <div className="text-sm">
                        <p className="text-xs text-slate-400">Unit Price</p>
                        <p className="font-bold text-slate-700">{fmt(item.price)}</p>
                      </div>

                      {/* Item Discount */}
                      <div className="flex items-center gap-1.5 border border-amber-200 rounded-xl px-3 py-2 bg-amber-50/50 focus-within:ring-2 focus-within:ring-amber-300">
                        <Tag size={14} className="text-amber-500 shrink-0" />
                        <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                          Disc
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={item.price}
                          value={disc === 0 ? "" : disc}
                          placeholder="0"
                          onKeyDown={blockInvalidKeys}
                          onPaste={blockNegativePaste}
                          onChange={(e) =>
                            updateItemDiscount(item.Product_Id, e.target.value)
                          }
                          className="w-20 text-right text-sm text-amber-700 font-bold outline-none bg-transparent"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="ml-auto text-right">
                        <p className="text-xs text-slate-400">Line Total</p>
                        <p className="text-xl font-bold text-slate-900">
                          {fmt(lineTotal)}
                        </p>
                      </div>
                    </div>

                    {/* Profit chip */}
                    <div className="flex justify-end mt-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold ${
                          itemProfit >= 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                      >
                        <TrendingUp size={12} className="inline mr-1" />
                        Profit: {fmt(itemProfit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT PANEL — CHECKOUT
      ════════════════════════════════════════ */}
      <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col h-screen shrink-0">
        {/* Checkout Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Checkout</h2>
              <p className="text-xs text-slate-500">{cart.length} item{cart.length !== 1 ? "s" : ""} · {cart.reduce((s, i) => s + i.qty, 0)} qty</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {/* Customer Type */}
          <div className="relative">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Type</p>
            <button
              onClick={() => {
                setCustomerTypeOpen(!customerTypeOpen);
                setPaymentOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {activeCustomer && <activeCustomer.icon size={18} className={`text-${activeCustomer.color}-600`} />}
                <span className="font-semibold text-slate-700">{activeCustomer?.label}</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${customerTypeOpen ? "rotate-180" : ""}`} />
            </button>
            {customerTypeOpen && (
              <div className="absolute w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-xl z-30 overflow-hidden">
                {customerTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setCustomerType(type.value);
                      setCustomerTypeOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left ${
                      customerType === type.value ? "bg-blue-50 text-blue-700" : "text-slate-700"
                    }`}
                  >
                    <type.icon size={18} />
                    <span className="font-semibold text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Type */}
          <div className="relative">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</p>
            <button
              onClick={() => {
                setPaymentOpen(!paymentOpen);
                setCustomerTypeOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {activePayment && <activePayment.icon size={18} className={`text-${activePayment.color}-600`} />}
                <span className="font-semibold text-slate-700">{activePayment?.label}</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${paymentOpen ? "rotate-180" : ""}`} />
            </button>
            {paymentOpen && (
              <div className="absolute w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-xl z-30 overflow-hidden">
                {paymentOptions.map((op) => (
                  <button
                    key={op.value}
                    onClick={() => {
                      setPaymentType(op.value);
                      setPaymentOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left ${
                      paymentType === op.value ? "bg-blue-50 text-blue-700" : "text-slate-700"
                    }`}
                  >
                    <op.icon size={18} />
                    <span className="font-semibold text-sm">{op.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loan Customer Form */}
          {paymentType === "loan" && (
            <div className="space-y-3 border border-amber-200 rounded-xl p-4 bg-amber-50/50">
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <AlertCircle size={16} />
                <p className="text-sm font-bold">Loan Customer Details</p>
              </div>

              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  placeholder="Customer Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300 bg-white text-sm"
                />
              </div>

              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300 bg-white text-sm"
                />
              </div>

              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  placeholder="Address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300 bg-white text-sm"
                />
              </div>

              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300 bg-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Summary */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-700">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-600">Item Discounts</span>
              <span className="font-semibold text-amber-600">− {fmt(itemDiscountTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Order Discount</span>
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-300">
                <Tag size={14} className="text-slate-400" />
                <input
                  type="number"
                  min="0"
                  value={discount === 0 ? "" : discount}
                  placeholder="0"
                  onKeyDown={blockInvalidKeys}
                  onPaste={blockNegativePaste}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 text-right text-sm font-bold text-slate-700 outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Total Due */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg shadow-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Due</p>
                <p className="text-3xl font-black tracking-tight mt-1">{fmt(total)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Receipt size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Cash Input (cash only) */}
          {paymentType === "cash" && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">Cash Received</span>
                <div className="flex items-center gap-1.5 border border-emerald-200 rounded-lg px-3 py-1.5 bg-emerald-50 focus-within:ring-2 focus-within:ring-emerald-300">
                  <Banknote size={14} className="text-emerald-500" />
                  <input
                    type="number"
                    min="0"
                    value={cash === 0 ? "" : cash}
                    placeholder="0"
                    onKeyDown={blockInvalidKeys}
                    onPaste={blockNegativePaste}
                    onChange={(e) => setCash(Math.max(0, Number(e.target.value) || 0))}
                    className="w-24 text-right text-sm font-bold text-emerald-700 outline-none bg-transparent"
                  />
                </div>
              </div>

              {change > 0 && (
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-emerald-700">Change</span>
                  <span className="text-xl font-black text-emerald-700">{fmt(change)}</span>
                </div>
              )}
            </>
          )}

          {/* Loan Due Date */}
          {paymentType === "loan" && dueDate && (
            <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">Due Date</span>
              </div>
              <span className="text-sm font-bold text-amber-800">{dueDate}</span>
            </div>
          )}

          {/* Estimated Profit */}
          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 border text-sm ${
              estimatedProfit >= 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className={estimatedProfit >= 0 ? "text-emerald-600" : "text-red-500"} />
              <span className={`font-bold ${estimatedProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                Est. Profit
              </span>
            </div>
            <span className={`text-lg font-black ${estimatedProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {fmt(estimatedProfit)}
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-5 border-t border-slate-100 space-y-3 shrink-0 bg-white">
          <button
            onClick={handleSell}
            disabled={cart.length === 0 || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={18} className="animate-spin" /> Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Complete Sale <ArrowRight size={18} />
              </span>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                printA4({
                  items: cart,
                  subtotal,
                  itemDiscountTotal,
                  discount,
                  total,
                })
              }
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <FileText size={16} /> A4
            </button>
            <button
              onClick={() =>
                printThermal({
                  items: cart,
                  subtotal,
                  itemDiscountTotal,
                  discount,
                  total,
                })
              }
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <Printer size={16} /> Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;