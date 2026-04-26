import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { clearAuth, getUser } from "../utils/auth";
import toast from "react-hot-toast";

const navItems = [
  { name: "Dashboard",    path: "/dashboard"  },
  { name: "Create Bot",   path: "/create-bot" },
  { name: "My Meetings",  path: "/meetings"   },
  { name: "Upload Video", path: "/upload"     },
  { name: "Settings",     path: "/settings"   },
];

// Pages that render their own full-screen sidebar layout — hide the top Navbar on these
const SIDEBAR_PATHS = [
  "/dashboard",
  "/meetings",
  "/upload",
  "/create-bot",
  "/audio",
  "/summary",
  "/email",
  "/settings",
];

function useHasSidebar(pathname) {
  return (
    SIDEBAR_PATHS.includes(pathname) ||
    pathname.startsWith("/meetings/") ||
    pathname.startsWith("/transcript/")
  );
}

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  // CRITICAL: ALL hooks must be called before any early return
  const [user, setUser] = useState(getUser());

  // Re-sync user state on every route change
  useEffect(() => {
    setUser(getUser());
  }, [location.pathname]);

  // Listen for cross-tab storage changes (e.g. login/logout in another tab)
  useEffect(() => {
    const onStorage = () => setUser(getUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Hide Navbar on pages that manage their own sidebar layout
  // Also hide on the Landing page since it provides its own top nav
  const isLanding = location.pathname === "/";
  const hasSidebar = useHasSidebar(location.pathname);
  if (hasSidebar || isLanding) return null;

  const { isLoggedIn, userName, userAvatar } = user;
  const initials = userName ? userName.charAt(0).toUpperCase() : "?";

  const handleLogout = () => {
    clearAuth();
    setUser(getUser());
    toast.success("Logged out successfully");
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">

        {/* Brand */}
        <NavLink to="/" className="font-bold text-blue-600 text-xl shrink-0">
          MeetCut
        </NavLink>

        {/* Nav links — only show when logged in */}
        {isLoggedIn && (
          <div className="hidden md:flex gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors
                   ${isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"}`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1 pr-3 transition-colors"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {initials}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
                  {userName}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                    </div>
                    <NavLink
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      ⚙️ Settings
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <NavLink
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
              >
                Log In
              </NavLink>
              <NavLink
                to="/signup"
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
