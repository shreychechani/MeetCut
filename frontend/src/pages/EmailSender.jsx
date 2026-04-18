/**
 * EmailSender.jsx  —  /email route
 *
 * Standalone page for sending meeting summary emails.
 * Features:
 *   - Load any processed transcript from the user's history
 *   - Full EmailPanel with all 3 modes
 *   - SMTP connection tester
 *   - Send history viewer
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaVideo, FaRobot, FaCog, FaListAlt, FaEnvelope,
  FaSpinner, FaCheckCircle, FaTimesCircle, FaHistory,
  FaChevronDown, FaWifi,
} from "react-icons/fa";
import { MdDashboard, MdSummarize, MdAudiotrack, MdSend } from "react-icons/md";
import { HiOutlineDocumentText } from "react-icons/hi";
import EmailPanel from "../components/EmailPanel";

const API = "http://localhost:3000/api";

function SidebarItem({ icon, label, path, active }) {
  return (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition font-medium text-sm ${
        active
          ? "bg-indigo-100 text-indigo-700 font-semibold"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function SmtpStatusBadge({ status }) {
  if (status === "checking") return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
      <FaSpinner className="animate-spin" /> Checking…
    </span>
  );
  if (status === "ok") return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
      <FaCheckCircle /> SMTP Connected
    </span>
  );
  if (status === "fail") return (
    <span className="flex items-center gap-1.5 text-xs text-red-500 font-bold">
      <FaTimesCircle /> SMTP Failed
    </span>
  );
  return null;
}

export default function EmailSender() {
  const [transcripts,     setTranscripts]     = useState([]);
  const [loadingList,     setLoadingList]      = useState(true);
  const [selectedId,      setSelectedId]       = useState("");
  const [selectedDoc,     setSelectedDoc]      = useState(null);
  const [loadingDoc,      setLoadingDoc]       = useState(false);
  const [smtpStatus,      setSmtpStatus]       = useState(null); // null | checking | ok | fail
  const [smtpError,       setSmtpError]        = useState("");
  const [history,         setHistory]          = useState([]);
  const [showHistory,     setShowHistory]      = useState(false);
  const [loadingHistory,  setLoadingHistory]   = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Load transcript list ──────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/audio/transcripts?limit=20`, { headers })
      .then(r => {
        const done = r.data.transcripts?.filter(t => t.status === "done") || [];
        setTranscripts(done);
      })
      .catch(console.error)
      .finally(() => setLoadingList(false));
  }, []);

  // ── Load selected transcript ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) { setSelectedDoc(null); return; }
    setLoadingDoc(true);
    axios.get(`${API}/audio/transcripts/${selectedId}`, { headers })
      .then(r => setSelectedDoc(r.data.transcript))
      .catch(console.error)
      .finally(() => setLoadingDoc(false));
  }, [selectedId]);

  // ── Load email history for selected transcript ────────────────────────────
  useEffect(() => {
    if (!selectedId) { setHistory([]); return; }
    setLoadingHistory(true);
    axios.get(`${API}/email/history/${selectedId}`, { headers })
      .then(r => setHistory(r.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [selectedId]);

  // ── Verify SMTP ───────────────────────────────────────────────────────────
  const checkSmtp = async () => {
    setSmtpStatus("checking");
    setSmtpError("");
    try {
      await axios.get(`${API}/email/verify-smtp`, { headers });
      setSmtpStatus("ok");
    } catch (err) {
      setSmtpStatus("fail");
      setSmtpError(err.response?.data?.message || "Connection failed");
    }
  };

  const participants = selectedDoc?.summary?.participants || selectedDoc?.participants || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r flex flex-col py-6 px-3 shrink-0">
        <h1 className="text-indigo-600 font-black text-xl px-2 mb-8 tracking-tight">MeetCut</h1>
        <nav className="flex flex-col gap-1">
          <SidebarItem icon={<MdDashboard />}    label="Dashboard"         path="/dashboard" />
          <SidebarItem icon={<FaVideo />}         label="Upload Video"      path="/upload" />
          <SidebarItem icon={<FaRobot />}         label="Create Bot"        path="/create-bot" />
          <SidebarItem icon={<MdAudiotrack />}    label="Audio Processor"   path="/audio" />
          <SidebarItem icon={<MdSummarize />}     label="Summary Generator" path="/summary" />
          <SidebarItem icon={<FaEnvelope />}      label="Send Email"        path="/email" active />
          <SidebarItem icon={<FaListAlt />}       label="My Meetings"       path="/meetings" />
          <SidebarItem icon={<FaCog />}           label="Settings"          path="/settings" />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <FaEnvelope className="text-indigo-500" /> Email Delivery
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Send meeting summaries & transcripts to participants via email
              </p>
            </div>

            {/* SMTP checker */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={checkSmtp}
                disabled={smtpStatus === "checking"}
                className="flex items-center gap-2 text-xs bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg text-gray-600 font-semibold transition"
              >
                <FaWifi size={11} /> Test SMTP
              </button>
              {smtpStatus && <SmtpStatusBadge status={smtpStatus} />}
              {smtpStatus === "fail" && smtpError && (
                <p className="text-xs text-red-400 max-w-48 text-right">{smtpError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ── Left: select meeting ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Meeting picker */}
              <div className="bg-white rounded-2xl border p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Select Meeting
                </p>
                {loadingList ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <FaSpinner className="animate-spin" /> Loading meetings…
                  </div>
                ) : transcripts.length === 0 ? (
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>No processed meetings found.</p>
                    <Link to="/audio" className="text-indigo-500 hover:underline text-xs font-semibold">
                      → Process an audio file first
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transcripts.map(t => (
                      <button
                        key={t._id}
                        onClick={() => setSelectedId(t._id)}
                        className={`w-full text-left p-3 rounded-xl border transition ${
                          selectedId === t._id
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <p className={`text-sm font-semibold truncate ${selectedId === t._id ? "text-indigo-700" : "text-gray-800"}`}>
                          {t.meetingTitle || "Untitled Meeting"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.meetingDate
                            ? new Date(t.meetingDate).toLocaleDateString()
                            : new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Meeting info card */}
              {loadingDoc && (
                <div className="bg-white rounded-2xl border p-5 flex items-center gap-2 text-gray-400 text-sm">
                  <FaSpinner className="animate-spin" /> Loading details…
                </div>
              )}
              {selectedDoc && !loadingDoc && (
                <div className="bg-white rounded-2xl border p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Meeting Details</p>
                  <h3 className="font-black text-gray-800 text-base">
                    {selectedDoc.summary?.meetingTitle || selectedDoc.meetingTitle}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedDoc.summary?.dateTime || selectedDoc.meetingDate || "—"}
                  </p>
                  {participants.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-400 mb-1.5">Participants</p>
                      <div className="flex flex-wrap gap-1.5">
                        {participants.map((p, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-400 italic line-clamp-3">
                      {selectedDoc.summary?.finalSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Send history */}
              {selectedId && (
                <div className="bg-white rounded-2xl border overflow-hidden">
                  <button
                    onClick={() => setShowHistory(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-gray-600">
                      <FaHistory className="text-gray-400" />
                      Send History {history.length > 0 && `(${history.length})`}
                    </span>
                    <FaChevronDown className={`text-gray-400 text-xs transition-transform ${showHistory ? "rotate-180" : ""}`} />
                  </button>
                  {showHistory && (
                    <div className="border-t px-5 py-4">
                      {loadingHistory ? (
                        <div className="text-xs text-gray-400 flex items-center gap-1.5">
                          <FaSpinner className="animate-spin" /> Loading…
                        </div>
                      ) : history.length === 0 ? (
                        <p className="text-xs text-gray-400">No emails sent yet for this meeting.</p>
                      ) : (
                        <div className="space-y-3">
                          {history.slice().reverse().map((h, i) => (
                            <div key={i} className="text-xs border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-gray-600">
                                  {new Date(h.sentAt).toLocaleString()}
                                </span>
                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                                  {h.mode}
                                </span>
                              </div>
                              <p className="text-gray-500">
                                Sent to: {h.recipients?.join(", ") || "—"}
                              </p>
                              {h.failed?.length > 0 && (
                                <p className="text-red-400">Failed: {h.failed.map(f => f.email).join(", ")}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: EmailPanel ── */}
            <div className="lg:col-span-3">
              {!selectedId ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 min-h-[500px] flex flex-col items-center justify-center text-center p-12">
                  <FaEnvelope className="text-gray-200 text-5xl mb-4" />
                  <p className="text-gray-400 font-semibold">Select a meeting to get started</p>
                  <p className="text-gray-300 text-sm mt-1">Choose a processed meeting from the list on the left</p>
                </div>
              ) : loadingDoc ? (
                <div className="bg-white rounded-2xl border min-h-[500px] flex items-center justify-center">
                  <FaSpinner className="animate-spin text-indigo-400 text-2xl" />
                </div>
              ) : selectedDoc ? (
                <EmailPanel
                  transcriptId={selectedId}
                  participants={participants}
                  meetingTitle={selectedDoc.summary?.meetingTitle || selectedDoc.meetingTitle || "Meeting"}
                />
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
