import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaVideo, FaRobot, FaCog, FaListAlt, FaSearch, FaEye, FaTrash } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { getUser, API } from "../utils/auth";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  done:         { pill: "bg-green-100 text-green-700",  dot: "bg-green-500",  label: "Completed"   },
  completed:    { pill: "bg-green-100 text-green-700",  dot: "bg-green-500",  label: "Completed"   },
  summarising:  { pill: "bg-blue-100 text-blue-700",    dot: "bg-blue-400",   label: "Summarising" },
  transcribing: { pill: "bg-yellow-100 text-yellow-700",dot: "bg-yellow-400", label: "Transcribing"},
  ready:        { pill: "bg-yellow-100 text-yellow-700",dot: "bg-yellow-400", label: "Processing"  },
  failed:       { pill: "bg-red-100 text-red-700",      dot: "bg-red-500",    label: "Failed"      },
};

function getStatus(s) {
  return STATUS_STYLES[s] ?? { pill: "bg-gray-100 text-gray-600", dot: "bg-gray-400", label: s ?? "Unknown" };
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MyMeetings() {
  const navigate = useNavigate();
  const [search, setSearch]       = useState("");
  const [meetings, setMeetings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);
  const { token } = getUser();

  useEffect(() => {
    async function fetchMeetings() {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/api/audio/transcripts?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setMeetings(data.transcripts || []);
        else toast.error(data.message || "Failed to load meetings");
      } catch {
        toast.error("Could not connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, [token]);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this meeting record?")) return;
    setDeleting(id);
    try {
      const res  = await fetch(`${API}/api/audio/transcripts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Meeting deleted");
        setMeetings(m => m.filter(x => x._id !== id));
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = meetings.filter(m =>
    (m.meetingTitle || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.meetingDate  || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col py-6 px-4 shrink-0">
        <h1 className="text-blue-600 font-bold text-xl mb-8">MeetCut</h1>
        <nav className="flex flex-col gap-2">
          <SidebarItem icon={<MdDashboard />} label="Dashboard"  path="/dashboard" />
          <SidebarItem icon={<FaVideo />}     label="Upload Video" path="/upload" />
          <SidebarItem icon={<FaRobot />}     label="Create Bot"  path="/create-bot" />
          <SidebarItem icon={<FaListAlt />}   label="My Meetings" path="/meetings" active />
          <SidebarItem icon={<FaCog />}       label="Settings"    path="/settings" />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">My Meetings</h1>
            <p className="text-gray-500 mt-1 text-sm">View and manage all your recorded meetings.</p>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search meetings..."
              className="border rounded-lg pl-9 pr-4 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Meetings" value={meetings.length} color="blue" />
          <StatCard label="Completed"      value={meetings.filter(m => m.status === "done" || m.status === "completed").length} color="green" />
          <StatCard label="Processing"     value={meetings.filter(m => !["done","completed","failed"].includes(m.status)).length} color="yellow" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Recent Meetings</h2>
            <span className="text-sm text-gray-400">{filtered.length} records</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading meetings...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FaListAlt className="text-4xl mb-3 text-gray-300" />
              <p className="font-medium">No meetings found</p>
              <p className="text-sm mt-1">Upload an audio file or send a bot to a meeting to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Meeting</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Duration</th>
                  <th className="text-left px-4 py-3 font-semibold">Participants</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(m => {
                  const st = getStatus(m.status);
                  return (
                    <tr
                      key={m._id}
                      onClick={() => navigate(`/meetings/${m._id}`)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                          {m.meetingTitle || "Untitled Meeting"}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">
                          {m.originalFileName || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(m.meetingDate || m.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                        {formatDuration(m.durationSeconds)}
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {m.participants?.length > 0
                          ? <span>{m.participants.length} people</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${st.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/meetings/${m._id}`)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={e => handleDelete(e, m._id)}
                            disabled={deleting === m._id}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                            title="Delete"
                          >
                            {deleting === m._id
                              ? <div className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                              : <FaTrash />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-600 border-blue-100",
    green:  "bg-green-50 text-green-600 border-green-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
  };
  return (
    <div className={`rounded-xl border px-5 py-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium opacity-80 mt-0.5">{label}</div>
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