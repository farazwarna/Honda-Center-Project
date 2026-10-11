import React from "react";
import { Link } from "react-router-dom";
const UserNavbar = () => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 border-b-4 border-red-600">
      <div className="flex items-center justify-between">
        
        {/* Left (empty for balance) */}
        <div className="w-1/3"></div>

        {/* Center Title */}
        <div className="w-1/3 text-center">
          <h1 className="text-2xl font-bold text-black tracking-wide">
            Honda Atlas
          </h1>
          <p className="text-xs text-red-600 font-semibold">
            Auto Parts System
          </p>
        </div>

        {/* Right Button */}
        <div className="w-1/3 flex justify-end">
          <Link to="/"><button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-black transition duration-300">
            Admin Dashboard
          </button>
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default UserNavbar;