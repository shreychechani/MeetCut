import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaVideo, FaRobot, FaCog, FaListAlt, FaEnvelope } from "react-icons/fa";
import { MdDashboard, MdSummarize, MdAudiotrack } from "react-icons/md";
import { getUser, API } from "../utils/auth";

const statusColors = {
  done:         "bg-green-100 text-green-700",
  completed:    "bg-green-100 text-green-700",
  transcribing: "bg-yellow-100 text-yellow-700",
  summarising:  "bg-blue-100 text-blue-700",
  ready:        "bg-yellow-100 text-yellow-700",
  failed:       "bg-red-100 text-red-700",
};

function statusLabel(s) {
  const map = { done: "Completed", completed: "Completed", transcribing: "Transcribing",
    summarising: "Summarising", ready: "Processing", failed: "Failed" };
  return map[s] || s || "Unknown";
}

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const { userName, token } = getUser();
  const displayName = userName || "there";
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const res = await fetch(`${API}/api/audio/transcripts?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setMeetings(data.transcripts || []);
      } catch { /* silent fail - show empty */ } finally {
        setLoadingMeetings(false);
      }
    }
    fetchMeetings();
  }, []);

  const filteredMeetings = meetings.filter(
    (m) =>
      (m.meetingTitle || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.meetingDate  || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col py-6 px-4">
        <h1 className="text-indigo-600 font-black text-xl mb-8">MeetCut</h1>
        <nav className="flex flex-col gap-1">
          <SidebarItem icon={<MdDashboard />}  label="Dashboard"         path="/dashboard" />
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
              Welcome back, {displayName} <span role="img" aria-label="wave">👋</span>
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
          <Card icon={<FaVideo size={26} className="text-indigo-500" />}      title="Upload Video"      desc="Upload a meeting recording"          link="/upload" />
          <Card icon={<FaRobot size={26} className="text-indigo-500" />}      title="Create Bot"        desc="Send a bot to your meeting"          link="/create-bot" />
          <Card icon={<MdAudiotrack size={26} className="text-indigo-500" />} title="Audio Processor"   desc="Transcribe & summarise audio files"  link="/audio" />
          <Card icon={<FaListAlt size={26} className="text-indigo-500" />}    title="My Meetings"       desc="View all your recorded meetings"     link="/meetings" />
        </div>

        <h2 className="text-lg font-semibold mb-4">Recent Meetings</h2>
        <div className="flex flex-col gap-4">
          {loadingMeetings ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mr-2" />
              Loading meetings...
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No meetings yet. Upload a recording or send a bot to get started.
            </div>
          ) : filteredMeetings.map((m) => (
            <div
              key={m._id}
              onClick={() => navigate(`/meetings/${m._id}`)}
              className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between cursor-pointer hover:border-blue-200 hover:bg-blue-50 border border-transparent transition"
            >
              <div>
                <div className="font-medium text-gray-800">{m.meetingTitle || "Untitled Meeting"}</div>
                <div className="text-gray-500 text-sm flex gap-4 mt-1">
                  <span>{formatDate(m.meetingDate || m.createdAt)}</span>
                  {m.durationSeconds && <span>{Math.floor(m.durationSeconds/60)}m</span>}
                  {m.participants?.length > 0 && <span>{m.participants.length} participants</span>}
                </div>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusColors[m.status] || "bg-gray-100 text-gray-600"}`}>
                {statusLabel(m.status)}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, path }) {
  return (
    <Link
      to={path}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition font-medium text-sm text-gray-600 hover:bg-gray-100"
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
