import { useState } from "react";
import { Link } from "react-router-dom";
import { FaVideo, FaRobot, FaCog, FaListAlt, FaEnvelope } from "react-icons/fa";
import { MdDashboard, MdSummarize, MdAudiotrack } from "react-icons/md";

const meetings = [
  { title: "Q4 Product Strategy Review", date: "Feb 14, 2026", duration: "58 min", participants: 8, status: "Completed" },
  { title: "Engineering Sprint Retrospective", date: "Feb 13, 2026", duration: "32 min", participants: 5, status: "Completed" },
  { title: "Client Onboarding — Acme Corp", date: "Feb 13, 2026", duration: "45 min", participants: 4, status: "Processing" },
  { title: "Design System Sync", date: "Feb 12, 2026", duration: "27 min", participants: 3, status: "Completed" },
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
      <aside className="w-64 bg-white border-r flex flex-col py-6 px-4">
        <h1 className="text-indigo-600 font-black text-xl mb-8">MeetCut</h1>
        <nav className="flex flex-col gap-1">
          <SidebarItem icon={<MdDashboard />}  label="Dashboard"         path="/dashboard" active />
          <SidebarItem icon={<FaVideo />}       label="Upload Video"      path="/upload" />
          <SidebarItem icon={<FaRobot />}       label="Create Bot"        path="/create-bot" />
          <SidebarItem icon={<MdAudiotrack />}  label="Audio Processor"   path="/audio" />
          <SidebarItem icon={<MdSummarize />}   label="Summary Generator" path="/summary" />
          <SidebarItem icon={<FaEnvelope />}    label="Send Email"        path="/email" />
          <SidebarItem icon={<FaListAlt />}     label="My Meetings"       path="/meetings" />
          <SidebarItem icon={<FaCog />}         label="Settings"          path="/settings" />
        </nav>
      </aside>

      <main className="flex-1 px-12 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Welcome back, John <span role="img" aria-label="wave">👋</span>
            </h1>
            <p className="text-gray-500 mt-1">Here's what's happening with your meetings.</p>
          </div>
          <input
            type="text"
            placeholder="Search meetings..."
            className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-5 mb-8">
          <Card icon={<FaVideo size={26} className="text-indigo-500" />}      title="Upload Video"      desc="Upload a meeting recording"             link="/upload" />
          <Card icon={<FaRobot size={26} className="text-indigo-500" />}      title="Create Bot"        desc="Send a bot to your meeting"             link="/create-bot" />
          <Card icon={<MdAudiotrack size={26} className="text-indigo-500" />} title="Audio Processor"   desc="Transcribe & summarise audio files"     link="/audio" />
          <Card icon={<FaEnvelope size={26} className="text-indigo-500" />}   title="Send Email"        desc="Email summaries to participants"        link="/email" />
        </div>

        <h2 className="text-lg font-semibold mb-4">Recent Meetings</h2>
        <div className="flex flex-col gap-4">
          {filteredMeetings.map((m, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">{m.title}</div>
                <div className="text-gray-500 text-sm flex gap-4 mt-1">
                  <span>{m.date}</span>
                  <span>{m.duration}</span>
                  <span>{m.participants} participants</span>
                </div>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusColors[m.status]}`}>
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
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition font-medium text-sm ${
        active ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function Card({ icon, title, desc, link }) {
  return (
    <Link
      to={link}
      className="flex-1 bg-white rounded-xl shadow-sm px-5 py-5 flex items-center gap-4 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition"
    >
      <div className="bg-indigo-100 rounded-xl p-3">{icon}</div>
      <div>
        <div className="font-semibold text-gray-800 text-sm mb-0.5">{title}</div>
        <div className="text-gray-500 text-xs">{desc}</div>
      </div>
    </Link>
  );
}
