import { NavLink } from "react-router-dom";

const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Upload Video", path: "/upload" },
  { name: "Create Bot", path: "/create-bot" },
  { name: "My Meetings", path: "/meetings" },
  { name: "Settings", path: "/settings" },
];

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-16">
        <div className="font-bold text-blue-600 text-xl mr-8">MeetCut</div>
        <div className="flex gap-2 md:gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md font-medium transition-colors text-gray-700 hover:text-blue-600 hover:bg-blue-50 ${
                  isActive ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : ""
                }`
              }
              end
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
