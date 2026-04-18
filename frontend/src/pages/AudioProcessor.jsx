import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaVideo, FaRobot, FaCog, FaListAlt, FaMicrophone,
  FaUpload, FaSpinner, FaCheckCircle, FaTimesCircle,
  FaFilePdf, FaDownload, FaTrash, FaClock, FaUsers,
  FaPlay, FaLanguage, FaClipboard
} from "react-icons/fa";
import { MdDashboard, MdSummarize, MdAudiotrack } from "react-icons/md";
import { HiOutlineDocumentText } from "react-icons/hi";

const API = "http://localhost:3000/api";

// ─── Sidebar ─────────────────────────────────────────────────────────────────
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

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBadge({ num, label, status }) {
  const base = "flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all";
  if (status === "done")    return <span className={`${base} bg-emerald-100 text-emerald-700`}><FaCheckCircle /> {label}</span>;
  if (status === "active")  return <span className={`${base} bg-indigo-100 text-indigo-700 animate-pulse`}><FaSpinner className="animate-spin" /> {label}</span>;
  if (status === "error")   return <span className={`${base} bg-red-100 text-red-600`}><FaTimesCircle /> {label}</span>;
  return <span className={`${base} bg-gray-100 text-gray-400`}><span className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center text-[9px]">{num}</span> {label}</span>;
}

// ─── Segment row ──────────────────────────────────────────────────────────────
function SegmentRow({ seg }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-100 last:border-0 group">
      <div className="shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
          {seg.startFormatted}
        </span>
        <span className="text-[9px] text-gray-300">↓</span>
        <span className="text-[10px] font-mono bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">
          {seg.endFormatted}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {seg.speaker && (
          <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mb-1 mr-1">
            {seg.speaker}
          </span>
        )}
        <p className="text-sm text-gray-700 leading-relaxed">{seg.text}</p>
      </div>
    </div>
  );
}

// ─── Summary section ──────────────────────────────────────────────────────────
function SummaryCard({ icon, title, color, children }) {
  const palette = {
    indigo:  "border-indigo-200  bg-indigo-50  text-indigo-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red:     "border-red-200     bg-red-50     text-red-700",
    purple:  "border-purple-200  bg-purple-50  text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${palette[color]}`}>
      <h3 className="font-bold text-sm flex items-center gap-1.5 mb-2">{icon} {title}</h3>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AudioProcessor() {
  const [file,         setFile]         = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [title,        setTitle]        = useState("");
  const [date,         setDate]         = useState("");
  const [participants, setParticipants] = useState("");
  const [step,         setStep]         = useState("idle"); // idle | uploading | transcribing | summarising | done | error
  const [result,       setResult]       = useState(null);  // { transcriptId, transcript, summary }
  const [error,        setError]        = useState("");
  const [activeTab,    setActiveTab]    = useState("summary"); // summary | transcript
  const [downloading,  setDownloading]  = useState(null);  // 'transcript' | 'summary' | null
  const [copied,       setCopied]       = useState(false);

  const fileRef    = useRef();
  const token      = localStorage.getItem("token");

  // ── File handling ─────────────────────────────────────────────────────────
  const acceptFile = useCallback((f) => {
    if (!f) return;
    const ok = ["audio/mpeg","audio/mp3","audio/wav","audio/wave","audio/x-wav","audio/mp4","audio/x-m4a","audio/aac"];
    if (!ok.includes(f.type) && !f.name.match(/\.(mp3|wav|m4a)$/i)) {
      setError("Only MP3, WAV, or M4A files are supported.");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setError("File must be under 25 MB (Whisper API limit).");
      return;
    }
    setError("");
    setFile(f);
    setResult(null);
    setStep("idle");
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  // ── Process audio ─────────────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!file) return setError("Please select an audio file first.");
    if (!token) return setError("You must be logged in.");

    setError("");
    setResult(null);
    setStep("uploading");

    const form = new FormData();
    form.append("audio",        file);
    form.append("title",        title);
    form.append("date",         date || new Date().toLocaleString());
    form.append("participants", participants);

    try {
      setStep("transcribing");
      const res = await axios.post(`${API}/audio/process`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 180_000, // 3 min for large files
      });

      setStep("done");
      setResult(res.data);
      setActiveTab("summary");
    } catch (err) {
      setStep("error");
      setError(err.response?.data?.message || "Processing failed. Check API keys and try again.");
    }
  };

  // ── Download PDF ──────────────────────────────────────────────────────────
  const downloadPDF = async (type) => {
    if (!result?.transcriptId) return;
    setDownloading(type);
    try {
      const res = await axios.post(
        `${API}/audio/pdf/${type}/${result.transcriptId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `MeetCut_${type === "transcript" ? "Transcript" : "Summary"}_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to download ${type} PDF.`);
    } finally {
      setDownloading(null);
    }
  };

  // ── Copy transcript ───────────────────────────────────────────────────────
  const copyTranscript = () => {
    if (!result?.transcript?.fullText) return;
    navigator.clipboard.writeText(result.transcript.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Step statuses ─────────────────────────────────────────────────────────
  const stepStatus = (s) => {
    const order = ["uploading", "transcribing", "summarising", "done"];
    const cur   = order.indexOf(step);
    const tgt   = order.indexOf(s);
    if (step === "error" && tgt <= cur) return "error";
    if (cur === tgt && step !== "done" && step !== "error") return "active";
    if (cur > tgt || step === "done") return "done";
    return "pending";
  };

  const summary    = result?.summary;
  const transcript = result?.transcript;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r flex flex-col py-6 px-3 shrink-0">
        <h1 className="text-indigo-600 font-black text-xl px-2 mb-8 tracking-tight">MeetCut</h1>
        <nav className="flex flex-col gap-1">
          <SidebarItem icon={<MdDashboard />}        label="Dashboard"         path="/dashboard" />
          <SidebarItem icon={<FaVideo />}             label="Upload Video"      path="/upload" />
          <SidebarItem icon={<FaRobot />}             label="Create Bot"        path="/create-bot" />
          <SidebarItem icon={<MdAudiotrack />}        label="Audio Processor"   path="/audio" active />
          <SidebarItem icon={<MdSummarize />}         label="Summary Generator" path="/summary" />
          <SidebarItem icon={<FaListAlt />}           label="My Meetings"       path="/meetings" />
          <SidebarItem icon={<FaCog />}               label="Settings"          path="/settings" />
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <MdAudiotrack className="text-indigo-500" />
              Audio Processor
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Upload a meeting audio file → Whisper transcribes it → Grok AI summarises it → Download professional PDFs
            </p>
          </div>

          {/* Pipeline steps */}
          <div className="flex flex-wrap gap-2 mb-6">
            <StepBadge num="1" label="Upload Audio"   status={file ? (step !== "idle" ? "done" : "pending") : "pending"} />
            <span className="text-gray-300 text-lg self-center">→</span>
            <StepBadge num="2" label="Whisper Transcription" status={stepStatus("transcribing")} />
            <span className="text-gray-300 text-lg self-center">→</span>
            <StepBadge num="3" label="Grok AI Summary" status={stepStatus("summarising")} />
            <span className="text-gray-300 text-lg self-center">→</span>
            <StepBadge num="4" label="PDF Export" status={step === "done" ? "done" : "pending"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ── Left: Upload panel ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-indigo-400 bg-indigo-50"
                    : file
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,audio/*"
                  className="hidden"
                  onChange={(e) => acceptFile(e.target.files[0])}
                />
                {file ? (
                  <>
                    <FaCheckCircle className="text-emerald-500 text-3xl mb-2" />
                    <p className="text-sm font-semibold text-emerald-700 text-center break-all">{file.name}</p>
                    <p className="text-xs text-emerald-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setStep("idle"); }}
                      className="mt-3 text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                    >
                      <FaTrash /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <FaUpload className="text-gray-300 text-3xl mb-3" />
                    <p className="text-sm font-medium text-gray-500 text-center">
                      Drop audio here or <span className="text-indigo-500">click to browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">MP3 · WAV · M4A  (max 25 MB)</p>
                  </>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-white rounded-xl border p-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Meeting Details (optional)</p>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Meeting Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Date (e.g. April 17, 2026)"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Participants (Alice, Bob, Charlie)"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                  <FaTimesCircle className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Process button */}
              <button
                onClick={handleProcess}
                disabled={!file || (step !== "idle" && step !== "error" && step !== "done")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md text-sm"
              >
                {step === "uploading" || step === "transcribing" ? (
                  <><FaSpinner className="animate-spin" /> Transcribing with Whisper…</>
                ) : step === "summarising" ? (
                  <><FaSpinner className="animate-spin" /> Generating AI Summary…</>
                ) : (
                  <><FaPlay /> Process Audio</>
                )}
              </button>

              {/* Processing hint */}
              {(step === "transcribing" || step === "uploading") && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-400 animate-pulse">⏳ Whisper is transcribing your audio…</p>
                  <p className="text-xs text-gray-300">This may take 1–3 minutes for longer recordings</p>
                </div>
              )}

              {/* PDF download buttons — shown after success */}
              {step === "done" && result && (
                <div className="bg-white rounded-xl border p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Download PDFs</p>
                  <button
                    onClick={() => downloadPDF("transcript")}
                    disabled={downloading === "transcript"}
                    className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                  >
                    {downloading === "transcript" ? <FaSpinner className="animate-spin" /> : <HiOutlineDocumentText />}
                    Transcript PDF
                  </button>
                  <button
                    onClick={() => downloadPDF("summary")}
                    disabled={downloading === "summary"}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                  >
                    {downloading === "summary" ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                    Summary PDF
                  </button>
                </div>
              )}
            </div>

            {/* ── Right: Results panel ── */}
            <div className="lg:col-span-3">
              {step === "idle" && !result && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12">
                  <FaMicrophone className="text-gray-200 text-5xl mb-4" />
                  <p className="text-gray-400 font-semibold">Results appear here</p>
                  <p className="text-gray-300 text-sm mt-1">Upload an audio file and click Process Audio</p>
                </div>
              )}

              {(step === "transcribing" || step === "uploading") && (
                <div className="bg-white rounded-2xl border h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                    <FaMicrophone className="absolute inset-0 m-auto text-indigo-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-gray-700 font-semibold">Transcribing with OpenAI Whisper</p>
                    <p className="text-gray-400 text-sm mt-1">Converting your audio to text with timestamps…</p>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {step === "done" && result && (
                <div className="bg-white rounded-2xl border overflow-hidden">
                  {/* Header bar */}
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-white font-black text-lg truncate">
                          {summary?.meetingTitle || title || "Meeting"}
                        </h2>
                        <p className="text-indigo-200 text-xs mt-0.5">{summary?.dateTime || date || "—"}</p>
                      </div>
                      <FaCheckCircle className="text-green-300 text-xl shrink-0 mt-0.5" />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {transcript?.durationSeconds > 0 && (
                        <span className="flex items-center gap-1 text-xs text-indigo-100">
                          <FaClock /> {formatDur(transcript.durationSeconds)}
                        </span>
                      )}
                      {transcript?.language && (
                        <span className="flex items-center gap-1 text-xs text-indigo-100">
                          <FaLanguage /> {transcript.language.toUpperCase()}
                        </span>
                      )}
                      {transcript?.segments?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-indigo-100">
                          <HiOutlineDocumentText /> {transcript.segments.length} segments
                        </span>
                      )}
                      {summary?.participants?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-indigo-100">
                          <FaUsers /> {summary.participants.length} participants
                        </span>
                      )}
                    </div>
                    {summary?.participants?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {summary.participants.map((p, i) => (
                          <span key={i} className="bg-indigo-500/60 text-white text-xs px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b">
                    <button
                      onClick={() => setActiveTab("summary")}
                      className={`flex-1 py-3 text-sm font-semibold transition ${
                        activeTab === "summary"
                          ? "text-indigo-600 border-b-2 border-indigo-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      AI Summary
                    </button>
                    <button
                      onClick={() => setActiveTab("transcript")}
                      className={`flex-1 py-3 text-sm font-semibold transition ${
                        activeTab === "transcript"
                          ? "text-indigo-600 border-b-2 border-indigo-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Transcript ({transcript?.segments?.length || 0} segments)
                    </button>
                  </div>

                  {/* Tab content */}
                  <div className="max-h-[55vh] overflow-y-auto">
                    {activeTab === "summary" && summary && (
                      <div className="p-5 space-y-4">
                        <SummaryCard icon="📋" title="Executive Summary" color="indigo">
                          <p className="text-sm text-indigo-800 leading-relaxed italic">{summary.finalSummary}</p>
                        </SummaryCard>
                        {summary.keyDiscussionPoints?.length > 0 && (
                          <SummaryCard icon="💬" title="Key Discussion Points" color="emerald">
                            <ul className="space-y-1">
                              {summary.keyDiscussionPoints.map((p, i) => (
                                <li key={i} className="text-sm text-emerald-800 flex gap-1.5">
                                  <span className="text-emerald-500 mt-0.5">•</span> {p}
                                </li>
                              ))}
                            </ul>
                          </SummaryCard>
                        )}
                        {summary.decisionsTaken?.length > 0 && (
                          <SummaryCard icon="✅" title="Decisions Taken" color="indigo">
                            <ul className="space-y-1">
                              {summary.decisionsTaken.map((d, i) => (
                                <li key={i} className="text-sm text-indigo-800 flex gap-1.5">
                                  <span className="text-indigo-400 mt-0.5">✓</span> {d}
                                </li>
                              ))}
                            </ul>
                          </SummaryCard>
                        )}
                        {summary.actionItems?.length > 0 && (
                          <SummaryCard icon="⚡" title="Action Items" color="red">
                            <div className="space-y-2">
                              {summary.actionItems.map((a, i) => (
                                <div key={i} className="bg-white/70 rounded-lg px-3 py-2">
                                  <p className="text-sm font-semibold text-gray-800">{a.task}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    👤 {a.owner || "Unassigned"} &nbsp;|&nbsp; 📅 {a.deadline || "TBD"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </SummaryCard>
                        )}
                        {summary.nextMeetingAgenda?.length > 0 && (
                          <SummaryCard icon="📅" title="Next Meeting Agenda" color="purple">
                            <ul className="space-y-1">
                              {summary.nextMeetingAgenda.map((a, i) => (
                                <li key={i} className="text-sm text-purple-800 flex gap-1.5">
                                  <span className="text-purple-400 mt-0.5">→</span> {a}
                                </li>
                              ))}
                            </ul>
                          </SummaryCard>
                        )}
                      </div>
                    )}

                    {activeTab === "transcript" && (
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-xs text-gray-400 font-medium">
                            {transcript?.segments?.length
                              ? `${transcript.segments.length} segments with timestamps`
                              : "Full transcript"}
                          </p>
                          <button
                            onClick={copyTranscript}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition"
                          >
                            {copied ? <FaCheckCircle className="text-emerald-500" /> : <FaClipboard />}
                            {copied ? "Copied!" : "Copy all"}
                          </button>
                        </div>
                        {transcript?.segments?.length > 0 ? (
                          <div>
                            {transcript.segments.map((seg) => (
                              <SegmentRow key={seg.index} seg={seg} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {transcript?.fullText || "No transcript available."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatDur(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
