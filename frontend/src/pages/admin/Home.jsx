import axios from "axios";
import React, { useEffect, useState, useRef, useCallback } from "react";
import RegisterProductDialog from "../../components/dialogs/RegisterProductDialog";
import { Link } from "react-router-dom";
import UpdateProductDialog from "../../components/dialogs/UpdateProductDialog";

// ─── Config ─────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:8081";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escape special regex characters to prevent XSS via highlight */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Escape HTML entities before injecting into the DOM */
const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const highlight = (text, search) => {
  if (!search) return escapeHtml(text);
  const safe = escapeRegex(search);
  const escaped = escapeHtml(text);
  return escaped.replace(
    new RegExp(`(${escapeRegex(escapeHtml(safe))})`, "gi"),
    '<mark class="bg-yellow-200 rounded-sm px-0.5">$1</mark>'
  );
};

/** Clamp-based pagination: shows at most 7 page buttons with ellipsis */
const buildPageRange = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);
};

// ─── Component ───────────────────────────────────────────────────────────────

const Home = () => {
  const [open, setOpen]             = useState(false);
  const [data, setData]             = useState([]);
  const [search, setSearch]         = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // product id pending delete
  const [error, setError]           = useState("");
  const [editId, setEditId] = useState(null);

  const LIMIT = 10;
  const timeoutRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (page = 1, searchText = "") => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await axios.get(
        `${API}/Products/getdata`,
        { params: { page, limit: LIMIT, search: searchText } }
      );
      setData(res.data);
      setTotalPages(res.totalPages);
      setCurrentPage(res.page);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(1, "");
  }, [loadProducts]);

  // ── Search debounce ────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => loadProducts(1, value), 300);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = (id) => setDeleteConfirm(id);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/Products/delete/${deleteConfirm}`);
      setDeleteConfirm(null);
      // Stay on current page; fall back to page-1 if it becomes empty
      loadProducts(currentPage, search);
    } catch (err) {
      console.error(err);
      setError("Failed to delete product.");
      setDeleteConfirm(null);
    }
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const goTo = (page) => {
    if (page < 1 || page > totalPages) return;
    loadProducts(page, search);
  };

  const pageRange = buildPageRange(currentPage, totalPages);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-screen-xl mx-auto">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} product{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-red-600 hover:bg-red-700 active:scale-95 transition text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
        >
          + Add New Product
        </button>
      </div>

      {/* ── Register dialog ── */}
      <RegisterProductDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        load={() => loadProducts(1, search)}
      />

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Product?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. The product will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ── Search ── */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or key..."
          value={search}
          onChange={handleSearch}
          className="border border-gray-300 px-3 py-2 rounded-lg w-full sm:w-1/3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl shadow border border-gray-100">
        <table className="w-full bg-white text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wider">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Key</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-400">
                  <span className="inline-block animate-pulse">Loading…</span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-400">
                  No products found
                </td>
              </tr>
            ) : (
              data.map((d) => (
                <tr
                  key={d.Product_Id}
                  className="border-b border-gray-100 hover:bg-red-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    #{d.Product_Id}
                  </td>
                  <td
                    className="px-4 py-3 text-gray-600"
                    dangerouslySetInnerHTML={{ __html: highlight(d.Product_Key, search) }}
                  />
                  <td
                    className="px-4 py-3 font-semibold text-gray-800"
                    dangerouslySetInnerHTML={{ __html: highlight(d.Product_Name, search) }}
                  />
                  <td className="px-4 py-3 text-right text-green-600 font-bold">
                    Rs. {Number(d.Product_Price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {d.Product_Description}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                    <button
  onClick={() => setEditId(d.Product_Id)}
  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-medium transition"
>
  Edit
</button>
                      <button
                        onClick={() => confirmDelete(d.Product_Id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium transition"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => console.log("Sell:", d)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-medium transition"
                      >
                        Sell
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-6 flex-wrap">
          <button
            disabled={currentPage === 1}
            onClick={() => goTo(currentPage - 1)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Prev
          </button>

          {pageRange.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  currentPage === p
                    ? "bg-red-600 text-white shadow"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            disabled={currentPage === totalPages}
            onClick={() => goTo(currentPage + 1)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}
      <UpdateProductDialog
  productId={editId}
  isOpen={!!editId}
  onClose={() => setEditId(null)}
  onUpdated={() => loadProducts(currentPage, search)}
/>
    </div>
  );
};

export default Home;