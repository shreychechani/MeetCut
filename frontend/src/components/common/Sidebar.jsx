import { Link, useLocation } from "react-router-dom";
import { FaVideo, FaRobot, FaCog, FaListAlt, FaEnvelope } from "react-icons/fa";
import { MdDashboard, MdSummarize, MdAudiotrack } from "react-icons/md";

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
  const path = location.pathname;

  return (
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
  );
}
