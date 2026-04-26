import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaVideo, FaRobot, FaCog, FaListAlt, FaSearch, FaEye, FaTrash } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { getUser, API } from "../utils/auth";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";

const getStatusBadge = (status, processingStatus) => {
  // If meeting is completed, show processing status instead
  if (status === 'completed' && processingStatus) {
    const processingBadges = {
      'not_started': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⏳', label: 'Waiting' },
      'transcribing': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🎤', label: 'Transcribing' },
      'analyzing': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '🧠', label: 'Analyzing' },
      'summarising': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '🧠', label: 'Analyzing' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Ready' },
      'done': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Ready' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Failed' }
    };

    const badge = processingBadges[processingStatus] || processingBadges['not_started'];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
        {['transcribing', 'analyzing', 'summarising'].includes(processingStatus) && (
          <span className="ml-2 animate-pulse">●</span>
        )}
      </span>
    );
  }

  // Regular bot status badges
  const badges = {
    'pending': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⏳', label: 'Pending' },
    'scheduled': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📅', label: 'Scheduled' },
    'joining': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🚪', label: 'Joining' },
    'recording': { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴', label: 'Recording' },
    'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Completed' },
    'done': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Completed' },
    'failed': { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Failed' },
    'transcribing': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🎤', label: 'Transcribing' },
    'summarising': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '🧠', label: 'Analyzing' },
    'analyzing': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '🧠', label: 'Analyzing' }
  };

  const badge = badges[status] || badges['pending'];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
      <span className="mr-1">{badge.icon}</span>
      {badge.label}
      {['transcribing', 'analyzing', 'summarising'].includes(status) && (
        <span className="ml-2 animate-pulse">●</span>
      )}
    </span>
  );
};

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
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [meetings, setMeetings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [deleting, setDeleting]         = useState(null);
  const { token } = getUser();

  const fetchMeetings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/api/audio/transcripts?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMeetings(data.transcripts || []);
      else setError(data.message || "Failed to load meetings");
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  if (loading) {
    return <LoadingSpinner message="Loading meetings..." />;
  }

  const filtered = meetings.filter(m => {
    const matchesSearch = (m.meetingTitle || "").toLowerCase().includes(search.toLowerCase()) ||
                          (m.meetingDate || "").toLowerCase().includes(search.toLowerCase());
    const mStatus = m.processingStatus || m.status || "not_started";
    const matchesStatus = filterStatus === "all" || mStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
          <div className="flex gap-4 items-center">
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
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="not_started">Waiting</option>
              <option value="transcribing">Transcribing</option>
              <option value="analyzing">Analyzing</option>
              <option value="summarising">Summarising</option>
              <option value="ready">Processing</option>
              <option value="completed">Completed</option>
              <option value="done">Done</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => fetchMeetings()} 
          />
        )}

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

          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No meetings yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Get started by scheduling your first AI-powered meeting recording
              </p>
              <button
                onClick={() => navigate("/create-bot")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
              >
                <span>➕</span>
                Create Your First Meeting
              </button>
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
                      <td className="px-6 py-4">
                        {getStatusBadge(m.botStatus, m.processingStatus)}
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