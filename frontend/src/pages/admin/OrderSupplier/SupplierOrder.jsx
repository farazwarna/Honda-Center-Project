import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:8081";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  received:  { bg: "#EAF3DE", color: "#3B6D11", label: "Received"  },
  partial:   { bg: "#E6F1FB", color: "#185FA5", label: "Partial"   },
  cancelled: { bg: "#FCEBEB", color: "#A32D2D", label: "Cancelled" },
  pending:   { bg: "#FAEEDA", color: "#854F0B", label: "Pending"   },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px",
      borderRadius: "99px", fontSize: "11px", fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────

const ConfirmModal = ({ title, message, detail, onConfirm, onCancel, confirmLabel = "Confirm", confirmClass = "green", loading = false }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(2px)",
  }}>
    <div style={{
      background: "#fff", borderRadius: "16px", padding: "28px 28px 22px",
      width: "min(420px, calc(100vw - 40px))", boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
      border: "1px solid #ebebeb",
    }}>
      <p style={{ margin: "0 0 6px", fontFamily: "'Syne', sans-serif", fontSize: "17px", fontWeight: 700, color: "#111" }}>
        {title}
      </p>
      <p style={{ margin: "0 0 14px", fontSize: "13.5px", color: "#666", lineHeight: 1.5 }}>
        {message}
      </p>

      {/* Detail rows (e.g. items being received) */}
      {detail && detail.length > 0 && (
        <div style={{ background: "#f9f9f9", border: "1px solid #ebebeb", borderRadius: "10px", padding: "10px 14px", marginBottom: "18px" }}>
          {detail.map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < detail.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <span style={{ fontSize: "13px", color: "#333", fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: "13px", color: "#111", fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            flex: 1, padding: "11px", borderRadius: "10px", border: "none",
            fontFamily: "'DM Sans', sans-serif", fontSize: "13.5px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
            background: confirmClass === "green" ? "#EAF3DE" : "#FCEBEB",
            color: confirmClass === "green" ? "#3B6D11" : "#A32D2D",
          }}
        >
          {loading ? "Processing…" : confirmLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid #ebebeb",
            fontFamily: "'DM Sans', sans-serif", fontSize: "13.5px", fontWeight: 600,
            cursor: "pointer", background: "#fff", color: "#555",
          }}
        >
          No, go back
        </button>
      </div>
    </div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const SupplierOrders = () => {
  const [orders,         setOrders]         = useState([]);
  const [selected,       setSelected]       = useState(null);
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [cancelling,     setCancelling]     = useState(false);
  const [ordersLoading,  setOrdersLoading]  = useState(true);
  const [itemsLoading,   setItemsLoading]   = useState(false);

  // Modal state: null | "receive" | "cancel"
  const [confirmModal, setConfirmModal] = useState(null);

  // ── Load orders ─────────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/Supplier/get-orders`);
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Open order ───────────────────────────────────────────────────────────────
  const openOrder = async (order) => {
    setConfirmModal(null);
    setItemsLoading(true);
    setSelected(order);
    try {
      const { data } = await axios.get(`${API}/Supplier/get-order-items/${order.id}`);
      setItems(data.map((i) => ({ ...i, input_qty: 0 })));
    } catch {
      toast.error("Failed to load order items");
    } finally {
      setItemsLoading(false);
    }
  };

  // ── Update qty ───────────────────────────────────────────────────────────────
  const updateQty = (index, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const remaining = updated[index].quantity - updated[index].received_qty;
      updated[index].input_qty = Math.min(Math.max(Number(value), 0), remaining);
      return updated;
    });
  };

  // ── Receive (actual API call) ─────────────────────────────────────────────────
  const doReceive = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/Supplier/receive-order`, {
        order_id: selected.id,
        items: items.map((i) => ({
          product_id:   i.product_id,
          received_qty: i.input_qty,
          price:        i.price,
        })),
      });
      toast.success("Stock received successfully");
      const { data } = await axios.get(`${API}/Supplier/get-order-items/${selected.id}`);
      const refreshed = data.map((i) => ({ ...i, input_qty: 0 }));
      setItems(refreshed);

      const allDone = refreshed.every((i) => i.quantity === i.received_qty);
      const anyDone = refreshed.some((i) => i.received_qty > 0);
      const newStatus = allDone ? "received" : anyDone ? "partial" : "pending";
      setSelected((prev) => ({ ...prev, status: newStatus }));

      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || "Receive failed");
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  // ── Receive (open confirm) ────────────────────────────────────────────────────
  const receiveOrder = () => {
    const hasInput = items.some((i) => i.input_qty > 0);
    if (!hasInput) { toast.warning("Enter at least one quantity to receive"); return; }
    setConfirmModal("receive");
  };

  // ── Cancel (actual API call) ──────────────────────────────────────────────────
  const doCancel = async () => {
    setCancelling(true);
    try {
      await axios.post(`${API}/Supplier/cancel-order`, { order_id: selected.id });
      toast.success("Order cancelled");
      setSelected((prev) => ({ ...prev, status: "cancelled" }));
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || "Cancel failed");
    } finally {
      setCancelling(false);
      setConfirmModal(null);
    }
  };

  // ── Download PDF ─────────────────────────────────────────────────────────────
  const downloadPdf = () => {
    window.open(`${API}/Supplier/order-pdf/${selected.id}`, "_blank");
  };

  // ── Derived state ─────────────────────────────────────────────────────────────
  const isFullyReceived = items.length > 0 && items.every((i) => i.quantity === i.received_qty);
  const isCancelled     = selected?.status === "cancelled";
  const hasAnyReceived  = items.some((i) => i.received_qty > 0);

  // ✅ Can cancel if: not already cancelled, not fully received.
  //    Partial receipt is now ALLOWED — only fully received orders are locked.
  const canCancel = !isCancelled && !isFullyReceived;

  // Items that will be sent in the receive call (for the confirm dialog)
  const receivePreview = items
    .filter((i) => i.input_qty > 0)
    .map((i) => ({ label: i.Product_Name, value: `${i.input_qty} unit${i.input_qty !== 1 ? "s" : ""}` }));

  // Unreceived items that will be cancelled (for the confirm dialog)
  const cancelPreview = items
    .filter((i) => i.quantity - i.received_qty > 0)
    .map((i) => ({
      label: i.Product_Name,
      value: `${i.quantity - i.received_qty} remaining`,
    }));

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        .so-root { padding: 24px; font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #f5f5f3; }
        .so-grid { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }

        /* Orders sidebar */
        .so-sidebar { background: #fff; border: 1px solid #ebebeb; border-radius: 16px; overflow: hidden; }
        .so-sidebar-head { padding: 16px 18px 12px; border-bottom: 1px solid #f0f0f0; }
        .so-sidebar-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #111; margin: 0; }
        .so-sidebar-sub   { font-size: 12px; color: #aaa; margin: 2px 0 0; }
        .so-order-list    { overflow-y: auto; max-height: calc(100vh - 160px); padding: 10px; display: flex; flex-direction: column; gap: 6px; }

        .so-order-item {
          padding: 12px 14px; border: 1px solid #ebebeb; border-radius: 12px;
          cursor: pointer; transition: border-color .15s, background .15s;
          background: #fff;
        }
        .so-order-item:hover { background: #fafafa; border-color: #ddd; }
        .so-order-item.active { border-color: #e03030; background: #fff9f9; }
        .so-order-item.cancelled { opacity: .55; }

        .so-order-name  { font-size: 13.5px; font-weight: 600; color: #1a1a1a; margin: 0 0 4px; }
        .so-order-meta  { font-size: 12px; color: #aaa; margin: 0; }

        /* Detail panel */
        .so-detail { background: #fff; border: 1px solid #ebebeb; border-radius: 16px; overflow: hidden; }
        .so-detail-head { padding: 20px 24px 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: flex-start; }
        .so-detail-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #111; margin: 0 0 3px; }
        .so-detail-sub   { font-size: 13px; color: #999; margin: 0; }

        /* Items */
        .so-items { padding: 16px 24px; display: flex; flex-direction: column; gap: 10px; max-height: calc(100vh - 300px); overflow-y: auto; }
        .so-item { border: 1px solid #ebebeb; border-radius: 12px; padding: 14px 16px; background: #fafafa; }
        .so-item-name { font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 3px; }
        .so-item-meta { font-size: 12px; color: #aaa; margin: 0 0 10px; }
        .so-item-row  { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

        .so-qty-input {
          width: 80px; text-align: center; padding: 7px 10px; border-radius: 8px;
          border: 1.5px solid #e8e8e8; font-size: 14px; font-family: 'DM Sans', sans-serif;
          background: #fff; color: #1a1a1a; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .so-qty-input:focus { border-color: #e03030; box-shadow: 0 0 0 3px rgba(224,48,48,.1); }
        .so-qty-input:disabled { background: #f5f5f5; color: #bbb; cursor: not-allowed; }

        /* Progress bar */
        .so-prog-track { height: 5px; background: #ebebeb; border-radius: 99px; margin-top: 10px; }
        .so-prog-fill  { height: 100%; border-radius: 99px; background: #3B6D11; transition: width .3s; }

        /* Footer */
        .so-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; gap: 10px; }
        .so-btn {
          flex: 1; padding: 11px 16px; border-radius: 10px; font-size: 13.5px;
          font-weight: 600; font-family: 'DM Sans', sans-serif; border: none;
          cursor: pointer; transition: opacity .15s, transform .1s;
        }
        .so-btn:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
        .so-btn:active:not(:disabled) { transform: none; }
        .so-btn:disabled { opacity: .45; cursor: not-allowed; }
        .so-btn.green  { background: #EAF3DE; color: #3B6D11; }
        .so-btn.red    { background: #FCEBEB; color: #A32D2D; }
        .so-btn.gray   { background: #f0f0f0; color: #555; flex: 0; padding: 11px 20px; }
        .so-btn.indigo { background: #E6F1FB; color: #185FA5; flex: 0; padding: 11px 16px; }

        /* Banner */
        .so-banner { margin: 0 24px 14px; padding: 10px 14px; border-radius: 10px; font-size: 13px; }
        .so-banner.red    { background: #FCEBEB; color: #A32D2D; border: 1px solid #F7C1C1; }
        .so-banner.amber  { background: #FAEEDA; color: #854F0B; border: 1px solid #FAC775; }
        .so-banner.green  { background: #EAF3DE; color: #3B6D11; border: 1px solid #C0DD97; }

        /* Empty state */
        .so-empty { padding: 60px 24px; text-align: center; color: #bbb; font-size: 14px; }

        /* Shimmer */
        .so-shimmer { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:200% 100%; animation: so-shimmer 1.2s infinite; border-radius: 8px; }
        @keyframes so-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Spinner */
        .so-spinner { width:14px; height:14px; border:2px solid rgba(0,0,0,.15); border-top-color:#3B6D11; border-radius:50%; animation:so-spin .6s linear infinite; display:inline-block; vertical-align:middle; margin-right:7px; }
        @keyframes so-spin { to{transform:rotate(360deg)} }

        @media (max-width: 768px) {
          .so-grid { grid-template-columns: 1fr; }
          .so-order-list { max-height: 260px; }
        }
      `}</style>

      {/* ── Receive Confirm Modal ── */}
      {confirmModal === "receive" && (
        <ConfirmModal
          title="Confirm Stock Receipt"
          message="The following quantities will be added to inventory. This action cannot be undone."
          detail={receivePreview}
          confirmLabel="Yes, Receive Stock"
          confirmClass="green"
          loading={loading}
          onConfirm={doReceive}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* ── Cancel Confirm Modal ── */}
      {confirmModal === "cancel" && (
        <ConfirmModal
          title="Cancel Order?"
          message={
            hasAnyReceived
              ? "Some items were already received and will stay in inventory. Only the remaining undelivered items will be cancelled."
              : "This will cancel the entire order. This action cannot be undone."
          }
          detail={cancelPreview}
          confirmLabel="Yes, Cancel Remaining"
          confirmClass="red"
          loading={cancelling}
          onConfirm={doCancel}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <div className="so-root">

        {/* ── Page header ── */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#111" }}>
            Supplier Orders
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#999" }}>
            Manage and receive supplier deliveries
          </p>
        </div>

        <div className="so-grid">

          {/* ══ ORDERS SIDEBAR ══ */}
          <div className="so-sidebar">
            <div className="so-sidebar-head">
              <p className="so-sidebar-title">Orders</p>
              <p className="so-sidebar-sub">{orders.length} total</p>
            </div>
            <div className="so-order-list">
              {ordersLoading ? (
                [1,2,3].map((k) => (
                  <div key={k} className="so-shimmer" style={{ height: "64px" }} />
                ))
              ) : orders.length === 0 ? (
                <p style={{ textAlign: "center", color: "#bbb", fontSize: "13px", padding: "24px 0" }}>
                  No orders found
                </p>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className={`so-order-item ${selected?.id === o.id ? "active" : ""} ${o.status === "cancelled" ? "cancelled" : ""}`}
                    onClick={() => openOrder(o)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <p className="so-order-name">{o.supplier_name}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="so-order-meta">
                      Rs {Number(o.total_amount).toLocaleString()} &nbsp;·&nbsp; #{o.id}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ══ DETAIL PANEL ══ */}
          <div className="so-detail">

            {!selected ? (
              <div className="so-empty">
                Select an order from the list to view details
              </div>
            ) : (
              <>
                {/* Order header */}
                <div className="so-detail-head">
                  <div>
                    <p className="so-detail-title">Order #{selected.id}</p>
                    <p className="so-detail-sub">{selected.supplier_name}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <StatusBadge status={selected.status} />
                    <button className="so-btn indigo" style={{ flex: 0 }} onClick={downloadPdf}>
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Status banners */}
                {isCancelled && (
                  <div className="so-banner red" style={{ marginTop: "14px" }}>
                    This order has been cancelled and cannot be modified.
                  </div>
                )}
                {isFullyReceived && !isCancelled && (
                  <div className="so-banner green" style={{ marginTop: "14px" }}>
                    All items have been received. This order is complete.
                  </div>
                )}
                {/* Info banner: partial cancel possible */}
                {!isCancelled && !isFullyReceived && hasAnyReceived && (
                  <div className="so-banner amber" style={{ marginTop: "14px" }}>
                    Some items already received. You can still cancel the remaining undelivered items.
                  </div>
                )}

                {/* Items list */}
                {itemsLoading ? (
                  <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[1,2,3].map((k) => <div key={k} className="so-shimmer" style={{ height: "90px" }} />)}
                  </div>
                ) : (
                  <div className="so-items">
                    {items.map((item, idx) => {
                      const remaining = item.quantity - item.received_qty;
                      const progress  = item.quantity > 0 ? (item.received_qty / item.quantity) * 100 : 0;
                      const done      = remaining === 0;

                      return (
                        <div key={idx} className="so-item" style={{ borderColor: done ? "#C0DD97" : "#ebebeb" }}>
                          <div className="so-item-row">
                            <div style={{ flex: 1 }}>
                              <p className="so-item-name">{item.Product_Name}</p>
                              <p className="so-item-meta">
                                Ordered {item.quantity} &nbsp;·&nbsp;
                                Received {item.received_qty} &nbsp;·&nbsp;
                                <span style={{ color: done ? "#3B6D11" : remaining <= 3 ? "#854F0B" : "#aaa" }}>
                                  {done ? "Complete" : `${remaining} remaining`}
                                </span>
                                &nbsp;·&nbsp; Rs {Number(item.price).toLocaleString()}
                              </p>
                            </div>
                            <input
                              className="so-qty-input"
                              type="number"
                              min={0}
                              max={remaining}
                              value={item.input_qty}
                              disabled={isCancelled || done}
                              onChange={(e) => updateQty(idx, e.target.value)}
                            />
                          </div>
                          <div className="so-prog-track">
                            <div
                              className="so-prog-fill"
                              style={{
                                width: `${progress}%`,
                                background: done ? "#3B6D11" : progress > 0 ? "#185FA5" : "#ebebeb",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action footer */}
                <div className="so-footer">

                  {/* Receive button */}
                  {!isCancelled && !isFullyReceived && (
                    <button className="so-btn green" onClick={receiveOrder} disabled={loading}>
                      Confirm Receive
                    </button>
                  )}

                  {/* Cancel button — available unless fully received or already cancelled */}
                  {canCancel && (
                    <button className="so-btn red" onClick={() => setConfirmModal("cancel")}>
                      {hasAnyReceived ? "Cancel Remaining" : "Cancel Order"}
                    </button>
                  )}

                  {/* Close */}
                  <button
                    className="so-btn gray"
                    onClick={() => { setSelected(null); setConfirmModal(null); setItems([]); }}
                  >
                    Close
                  </button>

                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierOrders;