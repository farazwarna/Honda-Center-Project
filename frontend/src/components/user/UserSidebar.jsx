import React from "react";
import { Link, useLocation } from "react-router-dom";

const UserSidebar = () => {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/User" },
    { name: "New Customer", path: "/User/Sell" },
    { name: "Sales", path: "/User/Sales" },
    { name: "Sale Loans", path: "/User/Loans" },
    { name: "Expenses", path: "/User/Expenses" },
     { name: "Easy Khata", path: "/User/EasyKhata" },
    { name: "Reports", path: "/User/Reports" },
  ];

  return (
    <div className="h-full w-60 bg-white text-gray-700 flex flex-col border-r shadow-sm">
      
      {/* Header */}
      <div className="px-4 py-5 border-b">
        <h2 className="text-lg font-bold text-red-600 tracking-wide">
          Honda Atlas
        </h2>
        <p className="text-xs text-gray-400">Management System</p>
      </div>

      {/* Menu */}
      <ul className="flex-1 px-3 py-4 space-y-2">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path}>
              <li
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200
                ${
                  isActive
                    ? "bg-red-100 text-red-600 font-semibold"
                    : "hover:bg-gray-100 hover:text-red-500"
                }`}
              >
                {item.name}
              </li>
            </Link>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="p-4 border-t">
        <button className="w-full bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition">
         Fawad Honda Center
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;