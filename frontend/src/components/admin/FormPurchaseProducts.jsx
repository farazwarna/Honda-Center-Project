import React from "react";

const PurchaseCart = ({
  cart,
  setCart,
  supplier,
  setSupplier,
  placeOrder,
}) => {
  /* ======================
     REMOVE ITEM
  ====================== */
  const removeItem = (id) => {
    setCart(cart.filter((i) => i.product_id !== id));
  };

  /* ======================
     UPDATE QTY
  ====================== */
  const updateQty = (id, qty) => {
    setCart(
      cart.map((i) =>
        i.product_id === id
          ? { ...i, quantity: Number(qty) }
          : i
      )
    );
  };

  const total = cart.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg sticky top-6">

      {/* HEADER */}
      <h2 className="text-lg font-bold mb-3">🧾 Purchase Cart</h2>

      {/* SUPPLIER */}
      <input
        value={supplier}
        onChange={(e) => setSupplier(e.target.value)}
        placeholder="Supplier name..."
        className="border p-2 w-full rounded-lg mb-3"
      />

      {/* ITEMS */}
      <div className="space-y-2 max-h-64 overflow-auto">
        {cart.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Cart is empty
          </p>
        ) : (
          cart.map((i) => (
            <div
              key={i.product_id}
              className="bg-gray-100 p-2 rounded flex justify-between items-center"
            >

              <div className="flex-1">
                <p className="font-medium text-sm">{i.name}</p>
                <p className="text-xs text-gray-500">
                  Rs {i.price}
                </p>
              </div>

              <input
                type="number"
                value={i.quantity}
                onChange={(e) =>
                  updateQty(i.product_id, e.target.value)
                }
                className="w-14 border rounded px-1"
              />

              <button
                onClick={() => removeItem(i.product_id)}
                className="text-red-500 ml-2"
              >
                ✕
              </button>

            </div>
          ))
        )}
      </div>

      {/* TOTAL */}
      <div className="mt-4 font-bold">
        Total: Rs {total}
      </div>

      {/* BUTTON */}
      <button
        onClick={placeOrder}
        disabled={cart.length === 0}
        className="bg-green-600 hover:bg-green-700 text-white w-full mt-3 py-2 rounded-lg disabled:opacity-50"
      >
        ✅ Place Order
      </button>

    </div>
  );
};

export default PurchaseCart;