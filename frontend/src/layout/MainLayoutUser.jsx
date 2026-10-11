import { Outlet } from "react-router-dom";
import UserNavbar from "../components/user/UserNavbar";
import UserSidebar from "../components/user/UserSidebar";

function MainLayoutUser() {
  return (
    <div className="h-screen flex flex-col bg-base-200 overflow-hidden">
      
      {/* Navbar */}
      <UserNavbar />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar (fixed height, no scroll movement) */}
        <div className="w-64 h-full sticky top-0">
          <UserSidebar />
        </div>

        {/* Main Content (scrollable) */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default MainLayoutUser;