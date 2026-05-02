import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaVideo, FaRobot, FaCog, FaListAlt, FaEnvelope } from "react-icons/fa";
import { MdDashboard, MdSummarize, MdAudiotrack } from "react-icons/md";
import { getUser, clearAuth } from "../../utils/auth";
import toast from "react-hot-toast";

function SidebarItem({ icon, label, path, active }) {
  return (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition font-medium text-sm ${
        active
          ? "bg-indigo-50 text-indigo-600 font-semibold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    setUser(getUser());
  }, [path]);

  useEffect(() => {
    const onStorage = () => setUser(getUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const initials = user.userName?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = () => {
    clearAuth();
    setMenuOpen(false);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <>
      {/* Top-right profile avatar menu */}
      <div className="fixed top-4 right-6 z-50">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
          title="Open profile menu"
        >
          {user.userAvatar ? (
            <img
              src={user.userAvatar}
              alt={user.userName || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-indigo-600">
              {initials}
            </span>
          )}
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.userName || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{user.userEmail || ""}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile & Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>

      <aside className="w-64 bg-white border-r flex flex-col py-6 px-4 shrink-0 h-screen sticky top-0 overflow-y-auto">
        <Link to="/dashboard" className="text-indigo-600 font-black text-xl mb-8 pl-4 tracking-tight inline-block">
          MeetCut
        </Link>
        <nav className="flex flex-col gap-1">
          <SidebarItem icon={<MdDashboard />}        label="Dashboard"         path="/dashboard"   active={path === "/dashboard"} />
          <SidebarItem icon={<FaVideo />}            label="Upload Video"      path="/upload"      active={path === "/upload"} />
          <SidebarItem icon={<FaRobot />}            label="Create Bot"        path="/create-bot"  active={path === "/create-bot"} />
          <SidebarItem icon={<MdAudiotrack />}       label="Audio Processor"   path="/audio"       active={path === "/audio"} />
          <SidebarItem icon={<MdSummarize />}        label="Summary Generator" path="/summary"     active={path === "/summary"} />
          <SidebarItem icon={<FaEnvelope />}         label="Send Email"        path="/email"       active={path === "/email"} />
          <SidebarItem icon={<FaListAlt />}          label="My Meetings"       path="/meetings"    active={path.startsWith("/meetings") || path.startsWith("/transcript")} />
          <SidebarItem icon={<FaCog />}              label="Settings"          path="/settings"    active={path === "/settings"} />
        </nav>
      </aside>
    </>
  );
}
