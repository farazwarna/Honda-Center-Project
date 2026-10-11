import React, { useEffect } from "react";

const AlertDialog = ({ message, type = "success", onClose }) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const bg =
    type === "success" ? "bg-green-500" :
    type === "error" ? "bg-red-500" :
    "bg-blue-500";

  return (
    <div className={`fixed top-5 right-5 text-white px-4 py-2 rounded shadow ${bg}`}>
      {message}
    </div>
  );
};

export default AlertDialog;