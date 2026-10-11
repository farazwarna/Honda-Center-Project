import React from "react";

const QuantityInput = ({ qty, setQty }) => {
   console.log("qty value:", qty, "type:", typeof qty);
  const num = Number(qty); // ✅ fix: always a number

  const increase = () => {
    
      console.log("before increase:", qty, typeof qty);
    setQty(num + 1);
  
  }
  const decrease = () => {
    if (num > 1) setQty(num - 1);
  };

  return (
    <div className="flex items-center gap-2 border rounded-lg px-2 py-1 w-fit">
      <button
        onClick={decrease}
        className="px-2 text-lg font-bold text-red-500"
      >
        -
      </button>

      <input
        type="number"
        value={num}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val > 0) setQty(val);
        }}
        className="w-12 text-center outline-none"
      />

      <button
        onClick={increase}
        className="px-2 text-lg font-bold text-green-500"
      >
        +
      </button>
    </div>
  );
};

export default QuantityInput;