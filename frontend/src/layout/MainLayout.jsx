import { Outlet } from "react-router-dom";
import Navbar from "../components/admin/Navbar";
import Sidebar from "../components/admin/Sidebar";

function MainLayout() {
  return (
    <div className="h-screen flex flex-col bg-base-200 overflow-hidden">

      {/* Navbar */}
      <Navbar />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar (fixed / non-scrolling) */}
        <div className="w-60 h-full sticky top-0">
          <Sidebar />
        </div>

        {/* Page Content (scrollable) */}
        <main className="flex-1 bg-white overflow-y-auto p-4">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default MainLayout;