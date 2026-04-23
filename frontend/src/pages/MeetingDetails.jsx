import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft, FaDownload, FaFileAlt, FaRobot, FaMicrophone,
  FaUsers, FaClock, FaCalendarAlt, FaCheckCircle, FaSpinner,
  FaExclamationCircle, FaPlay
} from "react-icons/fa";
import { MdSummarize } from "react-icons/md";
import { getUser, API } from "../utils/auth";
import toast from "react-hot-toast";

const BOT_STATUS_MAP = {
  pending:    { label: "Pending",    color: "gray",   icon: <FaClock /> },
  scheduled:  { label: "Scheduled", color: "blue",   icon: <FaCalendarAlt /> },
  joining:    { label: "Joining",   color: "yellow", icon: <FaSpinner className="animate-spin" /> },
  waiting:    { label: "Waiting",   color: "yellow", icon: <FaSpinner className="animate-spin" /> },
  joined:     { label: "In Meeting",color: "blue",   icon: <FaRobot /> },
  recording:  { label: "Recording", color: "red",    icon: <FaMicrophone /> },
  completed:  { label: "Completed", color: "green",  icon: <FaCheckCircle /> },
  failed:     { label: "Failed",    color: "red",    icon: <FaExclamationCircle /> },
};

const PROC_STATUS_MAP = {
  not_started:  { label: "Not Started",  color: "gray" },
  transcribing: { label: "Transcribing", color: "yellow" },
  analyzing:    { label: "Analyzing",    color: "blue" },
  completed:    { label: "Completed",    color: "green" },
  failed:       { label: "Failed",       color: "red" },
};

const TRANSCRIPT_STATUS_MAP = {
  transcribing: { label: "Transcribing", color: "yellow" },
  ready:        { label: "Ready",        color: "blue" },
  summarising:  { label: "Summarising",  color: "blue" },
  done:         { label: "Done",         color: "green" },
  failed:       { label: "Failed",       color: "red" },
};

const colorClasses = {
  gray:   { pill: "bg-gray-100 text-gray-600",    dot: "bg-gray-400" },
  blue:   { pill: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  yellow: { pill: "bg-yellow-100 text-yellow-700",dot: "bg-yellow-400" },
  green:  { pill: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  red:    { pill: "bg-red-100 text-red-700",      dot: "bg-red-500" },
};

function Badge({ label, color, dot = true }) {
  const c = colorClasses[color] || colorClasses.gray;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.pill}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
      {label}
    </span>
  );
}

function formatDuration(seconds) {
  if (!seconds) return "N/A";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

function formatDate(str) {
  if (!str) return "N/A";
  const d = new Date(str);
  return isNaN(d)
    ? str
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = getUser();

  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchTranscript() {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/api/audio/transcripts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setTranscript(data.transcript);
        else toast.error(data.message || "Could not load meeting");
      } catch {
        toast.error("Server connection failed");
      } finally {
        setLoading(false);
      }
    }
    fetchTranscript();
  }, [id, token]);

  async function handleDownloadPDF(type) {
    setDownloading(type);
    try {
      const res = await fetch(`${API}/api/audio/pdf/${type}/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Download failed");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `MeetCut_${type === "transcript" ? "Transcript" : "Summary"}_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type === "transcript" ? "Transcript" : "Summary"} PDF downloaded!`);
    } catch (err) {
      toast.error(err.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-gray-500">
          <FaExclamationCircle className="text-4xl text-red-400 mx-auto mb-3" />
          <p className="font-semibold">Meeting not found</p>
          <button onClick={() => navigate("/meetings")} className="mt-4 text-blue-500 hover:underline text-sm">
            ← Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  const tStatus = TRANSCRIPT_STATUS_MAP[transcript.status] || { label: transcript.status, color: "gray" };
  const isDone  = transcript.status === "done" || transcript.status === "completed";
  const summary = transcript.summary;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Back button + Header */}
        <button
          onClick={() => navigate("/meetings")}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm mb-6 transition"
        >
          <FaArrowLeft /> Back to Meetings
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {summary?.meetingTitle || transcript.meetingTitle || "Untitled Meeting"}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge label={tStatus.label} color={tStatus.color} />
              {transcript.language && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase">
                  {transcript.language}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap justify-end">
            {isDone && (
              <Link
                to={`/transcript/${id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <FaFileAlt /> View Transcript
              </Link>
            )}
            {isDone && (
              <>
                <button
                  onClick={() => handleDownloadPDF("transcript")}
                  disabled={!!downloading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {downloading === "transcript"
                    ? <><div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> Downloading...</>
                    : <><FaDownload /> Transcript PDF</>}
                </button>
                <button
                  onClick={() => handleDownloadPDF("summary")}
                  disabled={!!downloading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {downloading === "summary"
                    ? <><div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> Downloading...</>
                    : <><MdSummarize className="text-base" /> Summary PDF</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <InfoCard icon={<FaClock className="text-blue-500" />} label="Duration" value={formatDuration(transcript.durationSeconds)} />
          <InfoCard icon={<FaCalendarAlt className="text-purple-500" />} label="Date" value={formatDate(transcript.meetingDate || transcript.createdAt)} />
          <InfoCard
            icon={<FaUsers className="text-green-500" />}
            label="Participants"
            value={transcript.participants?.length > 0 ? `${transcript.participants.length} people` : "N/A"}
          />
          <InfoCard icon={<FaMicrophone className="text-orange-500" />} label="Format" value={(transcript.audioFormat || "N/A").toUpperCase()} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Meeting Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaFileAlt className="text-blue-500" /> Meeting Info
            </h2>
            <dl className="space-y-3 text-sm">
              <Row label="Original File" value={transcript.originalFileName || "—"} />
              <Row label="Language"      value={(transcript.language || "—").toUpperCase()} />
              <Row
                label="Participants"
                value={
                  transcript.participants?.length > 0
                    ? transcript.participants.join(", ")
                    : "Not specified"
                }
              />
              {transcript.errorMessage && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg text-red-600 text-xs">
                  ⚠ {transcript.errorMessage}
                </div>
              )}
            </dl>
          </div>

          {/* Processing Status */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaRobot className="text-indigo-500" /> Processing Status
            </h2>
            <div className="space-y-3">
              <StatusRow label="Transcript" status={tStatus} />
              {transcript.recordingURL && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Recording</p>
                  <a
                    href={transcript.recordingURL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <FaPlay className="text-xs" /> Play Recording
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* AI Summary preview */}
          {summary && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:col-span-2">
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdSummarize className="text-green-500 text-lg" /> AI Summary
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{summary.finalSummary}</p>

              {summary.keyDiscussionPoints?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Discussion Points</p>
                  <ul className="space-y-1">
                    {summary.keyDiscussionPoints.slice(0, 4).map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-400 mt-0.5">•</span> {pt}
                      </li>
                    ))}
                    {summary.keyDiscussionPoints.length > 4 && (
                      <li className="text-xs text-gray-400">
                        +{summary.keyDiscussionPoints.length - 4} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {summary.actionItems?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Action Items</p>
                  <div className="space-y-1.5">
                    {summary.actionItems.slice(0, 3).map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-orange-50 px-3 py-1.5 rounded-lg">
                        <span className="text-orange-400">→</span>
                        <span className="text-gray-700 flex-1">{a.task}</span>
                        {a.owner && a.owner !== "Unassigned" && (
                          <span className="text-xs text-gray-500 shrink-0">{a.owner}</span>
                        )}
                      </div>
                    ))}
                    {summary.actionItems.length > 3 && (
                      <p className="text-xs text-gray-400 pl-2">+{summary.actionItems.length - 3} more...</p>
                    )}
                  </div>
                </div>
              )}

              <Link
                to={`/transcript/${id}`}
                className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline mt-2"
              >
                <FaFileAlt /> View Full Transcript & AI Analysis →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
        {icon} {label}
      </div>
      <div className="font-semibold text-gray-800 text-sm">{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-800 text-right">{value}</dd>
    </div>
  );
}

function StatusRow({ label, status }) {
  const c = colorClasses[status.color] || colorClasses.gray;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.pill}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {status.label}
      </span>
    </div>
  );
}