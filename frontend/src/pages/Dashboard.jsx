import { useState } from "react";
import { Link } from "react-router-dom";
import { FaVideo, FaRobot, FaCog, FaListAlt } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

const meetings = [
  {
    title: "Q4 Product Strategy Review",
    date: "Feb 14, 2026",
    duration: "58 min",
    participants: 8,
    status: "Completed",
  },
  {
    title: "Engineering Sprint Retrospective",
    date: "Feb 13, 2026",
    duration: "32 min",
    participants: 5,
    status: "Completed",
  },
  {
    title: "Client Onboarding — Acme Corp",
    date: "Feb 13, 2026",
    duration: "45 min",
    participants: 4,
    status: "Processing",
  },
  {
    title: "Design System Sync",
    date: "Feb 12, 2026",
    duration: "27 min",
    participants: 3,
    status: "Completed",
  },
];

const statusColors = {
  Completed: "bg-green-100 text-green-700",
  Processing: "bg-yellow-100 text-yellow-700",
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const filteredMeetings = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.date.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col py-6 px-4">
        <h1 className="text-blue-600 font-bold text-xl mb-8">MeetCut</h1>
        <nav className="flex flex-col gap-2">
          <SidebarItem icon={<MdDashboard />} label="Dashboard" path="/dashboard" active />
          <SidebarItem icon={<FaVideo />} label="Upload Video" path="/upload" />
          <SidebarItem icon={<FaRobot />} label="Create Bot" path="/create-bot" />
          <SidebarItem icon={<FaListAlt />} label="My Meetings" path="/meetings" />
          <SidebarItem icon={<FaCog />} label="Settings" path="/settings" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-12 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Welcome back, John <span role="img" aria-label="wave">👋</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Here's what's happening with your meetings.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search meetings..."
              className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Action Cards */}
        <div className="flex gap-6 mb-8">
          <Card
            icon={<FaVideo size={28} className="text-blue-500" />}
            title="Upload Video"
            desc="Upload a meeting recording"
            link="/upload"
          />
          <Card
            icon={<FaRobot size={28} className="text-blue-500" />}
            title="Create Bot"
            desc="Send a bot to your meeting"
            link="/create-bot"
          />
        </div>

        {/* Meetings */}
        <h2 className="text-lg font-semibold mb-4">Recent Meetings</h2>

        <div className="flex flex-col gap-4">
          {filteredMeetings.map((m, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-gray-800">
                  {m.title}
                </div>
                <div className="text-gray-500 text-sm flex gap-4 mt-1">
                  <span>{m.date}</span>
                  <span>{m.duration}</span>
                  <span>{m.participants} participants</span>
                </div>
              </div>

              <span
                className={`px-4 py-1 rounded-full text-sm font-semibold ${statusColors[m.status]}`}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, path, active }) {
  return (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition font-medium text-base ${
        active
          ? "bg-blue-100 text-blue-700 font-semibold"
          : "text-gray-700 hover:bg-blue-50"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function Card({ icon, title, desc, link }) {
  return (
    <Link
      to={link}
      className="flex-1 bg-white rounded-xl shadow-sm px-6 py-6 flex items-center gap-4 border border-gray-200 hover:bg-blue-50 transition"
    >
      <div className="bg-blue-100 rounded-lg p-3">{icon}</div>
      <div>
        <div className="font-semibold text-gray-800 text-lg mb-1">{title}</div>
        <div className="text-gray-500 text-sm">{desc}</div>
      </div>
    </Link>
  );
}