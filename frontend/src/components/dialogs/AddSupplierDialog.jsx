import React, { useState } from "react";
import axios from "axios";

const AddSupplierDialog = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    balance: 0,
  });

  if (!open) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "balance"
          ? parseFloat(e.target.value) || 0
          : e.target.value,
    });
  };

  const submit = async () => {
    if (!form.name) {
      alert("Supplier name is required");
      return;
    }

    try {
      await axios.post("http://localhost:8081/Supplier/create", form);

      onSuccess();
      onClose();

      // reset form
      setForm({
        name: "",
        phone: "",
        address: "",
        balance: 0,
      });
    } catch (err) {
      if (err.response?.data?.code === "ER_DUP_ENTRY") {
        alert("Supplier name already exists");
      } else {
        console.error(err);
        alert("Error creating supplier");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-96 p-5 rounded-2xl shadow-xl">

        <h2 className="text-xl font-bold mb-4">Add Supplier</h2>

        <input
          name="name"
          placeholder="Supplier Name *"
          className="w-full border p-2 mb-2 rounded"
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone"
          className="w-full border p-2 mb-2 rounded"
          onChange={handleChange}
        />

        <textarea
          name="address"
          placeholder="Address"
          className="w-full border p-2 mb-2 rounded"
          onChange={handleChange}
        />

        <input
          name="balance"
          type="number"
          placeholder="Opening Balance"
          className="w-full border p-2 mb-3 rounded"
          onChange={handleChange}
        />

        <div className="flex gap-2">
          <button
            onClick={submit}
            className="flex-1 bg-green-600 text-white py-2 rounded"
          >
            Save
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-gray-400 text-white py-2 rounded"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddSupplierDialog;