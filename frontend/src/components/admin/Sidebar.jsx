import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const menu = [
    { name: "Dashboard", icon: "🏠", link: "/Admin/Dashboard" },
    { name: "Available Stock", icon: "📊", link: "/Admin/AvailableProducts" },
    { name: "Register Products", icon: "📦", link: "/Admin" },
    { name: "Purchase", icon: "🛒", link: "/Admin/Purchase" },
    { name: "Orders", icon: "👥", link: "/Admin/Orders" },
    { name: "Suppliers", icon: "📈", link: "/Admin/SupplierCredit" },
        { name: "Admin", icon: "📈", link: "/Admin/UpdateAdmin" },
  ];

  return (
    <div
      className={`h-full ${
        open ? "w-60" : "w-20"
      } bg-white border-r shadow-sm flex flex-col justify-between transition-all duration-300`}
    >
      {/* TOP */}
      <div className="p-4">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          {open && (
            <h1 className="text-lg font-bold text-red-600 tracking-wide">
              AutoParts
            </h1>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="text-gray-500 text-lg hover:text-red-500 transition"
          >
            ☰
          </button>
        </div>

        {/* MENU */}
        <ul className="space-y-1">
          {menu.map((item, index) => {
            const isActive = location.pathname === item.link;

            return (
              <li key={index}>
                <NavLink
                  to={item.link}
                  end
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                  ${
                    isActive
                      ? "bg-red-100 text-red-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-red-500"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>

                  {open && (
                    <span className="whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t">
        {open ? (
          <p className="text-xs text-gray-400 text-center">
            © 2026 AutoParts ERP
          </p>
        ) : (
          <p className="text-center text-gray-400">©</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;