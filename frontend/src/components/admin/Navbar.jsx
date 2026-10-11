import React from "react";
import { useNavigate } from "react-router-dom";
import atlasLogo from "../../assets/atlas.png";

const Navbar = () => {
  const navigate = useNavigate();

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("Username");
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200">

      {/* Top brand stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-blue-900" />

      <div className="px-8 py-3 flex items-center justify-between">

        {/* LEFT — Logo + Divider + Text */}
        <div className="flex items-center gap-5">

          {/* Logo box */}
          <div className="w-13 h-13 p-1.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
            <img
              src={atlasLogo}
              alt="Atlas Honda"
              className="w-11 h-11 object-contain"
            />
          </div>

          {/* Vertical divider */}
          <div className="w-px h-10 bg-gray-200" />

          {/* Title group */}
          <div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest leading-none mb-1">
              Authorized Dealer
            </p>
            <h1 className="text-lg font-extrabold text-blue-900 tracking-tight leading-none">
              Fawad Honda Atlas Center
            </h1>
          </div>
        </div>

        {/* RIGHT — Logout button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>

      </div>
    </nav>
  );
};

export default Navbar;