import React from "react";

const CheckoutCard = () => {
  return (
    <div className="w-80 h-screen fixed right-0 top-0 bg-gray-50 border-l shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Summary</h2>

      <div className="bg-white rounded-xl shadow p-4 mb-3">
        <p className="text-sm text-gray-600">Total Items</p>
        <p className="text-xl font-bold">5</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-3">
        <p className="text-sm text-gray-600">Total Price</p>
        <p className="text-xl font-bold text-green-600">Rs 12,500</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <p className="text-sm text-gray-600">Customer</p>
        <p className="text-md font-medium">Walk-in</p>
      </div>

      <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
        Checkout
      </button>
    </div>
  );
};

export default CheckoutCard;