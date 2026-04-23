/**
 * EmailPanel.jsx
 * Reusable email delivery panel.
 * Props:
 *   transcriptId  — string  (required)
 *   participants  — string[] (from summary or meeting data)
 *   meetingTitle  — string
 *   onClose       — fn (optional, for modal usage)
 */
import { useState } from "react";
import axios from "axios";
import {
  FaPaperPlane, FaSpinner, FaCheckCircle, FaTimesCircle,
  FaUserFriends, FaPlus, FaTimes, FaFileAlt, FaFilePdf,
  FaEnvelope, FaChevronDown, FaChevronUp, FaHistory,
} from "react-icons/fa";
import { MdSend, MdGroups, MdPersonAdd, MdAlternateEmail } from "react-icons/md";

const API = "http://localhost:3000/api";

// ─── Small helpers ────────────────────────────────────────────────────────────

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e?.trim());
}

function Tag({ label, onRemove, color = "indigo" }) {
  const palette = {
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    emerald:"bg-emerald-100 text-emerald-700 border-emerald-200",
    amber:  "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${palette[color]}`}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-60 transition ml-0.5">
          <FaTimes size={9} />
        </button>
      )}
    </span>
  );
}

function ModeButton({ id, active, icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
        active
          ? "border-indigo-500 bg-indigo-50 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`mt-0.5 text-lg ${active ? "text-indigo-600" : "text-gray-400"}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold ${active ? "text-indigo-700" : "text-gray-700"}`}>{title}</div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</div>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
        active ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
      }`}>
        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailPanel({ transcriptId, participants = [], meetingTitle = "Meeting", onClose }) {
  const [mode,              setMode]              = useState("all");      // all | manual | custom
  const [checkedParticipants, setChecked]         = useState(new Set());
  const [customEmails,      setCustomEmails]      = useState([]);
  const [customInput,       setCustomInput]       = useState("");
  const [customInputError,  setCustomInputError]  = useState("");
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const [senderName,        setSenderName]        = useState("");
  const [customMessage,     setCustomMessage]     = useState("");
  const [showAdvanced,      setShowAdvanced]      = useState(false);
  const [status,            setStatus]            = useState("idle");     // idle | sending | success | error
  const [result,            setResult]            = useState(null);

  const token = localStorage.getItem("token");

  // ── Participant checkbox toggle ────────────────────────────────────────────
  const toggleParticipant = (email) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedParticipants.size === participants.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(participants));
    }
  };

  // ── Custom email add/remove ───────────────────────────────────────────────
  const addCustomEmail = () => {
    const val = customInput.trim();
    if (!val) return;
    if (!isValidEmail(val)) { setCustomInputError("Invalid email address"); return; }
    if (customEmails.includes(val)) { setCustomInputError("Already added"); return; }
    setCustomEmails(prev => [...prev, val]);
    setCustomInput("");
    setCustomInputError("");
  };

  const removeCustomEmail = (email) => {
    setCustomEmails(prev => prev.filter(e => e !== email));
  };

  // ── Build final recipients list ───────────────────────────────────────────
  const buildRecipients = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (mode === "all") {
      // participants that look like emails, else we need real emails
      const emailParticipants = participants.filter(p => emailRegex.test(p));
      return [...new Set([...emailParticipants, ...customEmails])];
    }
    if (mode === "manual") {
      const selected = [...checkedParticipants].filter(p => emailRegex.test(p));
      return [...new Set([...selected, ...customEmails])];
    }
    // custom only
    return [...new Set(customEmails)];
  };

  const recipients = buildRecipients();
  const canSend    = recipients.length > 0 && status !== "sending";

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!canSend) return;
    setStatus("sending");
    setResult(null);
    try {
      const res = await axios.post(
        `${API}/email/send`,
        { transcriptId, mode, recipients, includeTranscript, senderName, customMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus("success");
      setResult(res.data);
    } catch (err) {
      setStatus("error");
      setResult({ message: err.response?.data?.message || "Failed to send email. Check SMTP config." });
    }
  };

  const reset = () => { setStatus("idle"); setResult(null); };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (status === "success" && result) {
    return (
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <FaCheckCircle className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg">Emails Sent!</h3>
              <p className="text-emerald-100 text-sm">{result.message}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {result.sent?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivered to</p>
              <div className="flex flex-wrap gap-2">
                {result.sent.map(e => <Tag key={e} label={e} color="emerald" />)}
              </div>
            </div>
          )}
          {result.failed?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Failed</p>
              <div className="flex flex-wrap gap-2">
                {result.failed.map(f => <Tag key={f.email} label={`${f.email} — ${f.reason}`} color="amber" />)}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
              Send Again
            </button>
            {onClose && (
              <button onClick={onClose} className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition text-sm">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MdSend className="text-white text-xl" />
          <div>
            <h3 className="text-white font-black text-base">Send Meeting Summary</h3>
            <p className="text-indigo-200 text-xs mt-0.5 truncate max-w-xs">{meetingTitle}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition">
            <FaTimes />
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* ── Step 1: Mode ── */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            1 · Choose recipients
          </p>
          <div className="space-y-2">
            <ModeButton
              active={mode === "all"}
              onClick={() => setMode("all")}
              icon={<MdGroups />}
              title="Send to all participants"
              desc="Automatically email everyone extracted from the meeting"
            />
            <ModeButton
              active={mode === "manual"}
              onClick={() => setMode("manual")}
              icon={<FaUserFriends />}
              title="Select recipients manually"
              desc="Pick specific participants from the checkbox list"
            />
            <ModeButton
              active={mode === "custom"}
              onClick={() => setMode("custom")}
              icon={<MdPersonAdd />}
              title="Custom email addresses only"
              desc="Type in any email addresses not in the participant list"
            />
          </div>
        </div>

        {/* ── Step 2: Participant checkboxes (manual mode) ── */}
        {mode === "manual" && participants.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Participants</p>
              <button onClick={toggleAll} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition">
                {checkedParticipants.size === participants.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="border rounded-xl overflow-hidden divide-y">
              {participants.map((p, i) => (
                <label key={i} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    checked={checkedParticipants.has(p)}
                    onChange={() => toggleParticipant(p)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700 flex-1">{p}</span>
                  {isValidEmail(p)
                    ? <span className="text-xs text-emerald-500 font-medium">valid email</span>
                    : <span className="text-xs text-amber-500 font-medium">name only</span>
                  }
                </label>
              ))}
            </div>
            {[...checkedParticipants].some(p => !isValidEmail(p)) && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                ⚠ Some selected names don't have email addresses. Add them below as custom emails.
              </p>
            )}
          </div>
        )}

        {mode === "manual" && participants.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            No participants were extracted from this meeting. Add custom emails below.
          </div>
        )}

        {/* ── Step 3: Custom email input (all modes) ── */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {mode === "custom" ? "Email addresses" : "Add additional recipients"}
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MdAlternateEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="email"
                value={customInput}
                onChange={e => { setCustomInput(e.target.value); setCustomInputError(""); }}
                onKeyDown={e => e.key === "Enter" && addCustomEmail()}
                placeholder="client@company.com"
                className={`w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                  customInputError ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-200"
                }`}
              />
            </div>
            <button
              onClick={addCustomEmail}
              className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center gap-1.5 text-sm font-semibold shrink-0"
            >
              <FaPlus size={11} /> Add
            </button>
          </div>
          {customInputError && <p className="text-xs text-red-500 mt-1">{customInputError}</p>}
          {customEmails.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {customEmails.map(e => (
                <Tag key={e} label={e} color="indigo" onRemove={() => removeCustomEmail(e)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Recipients preview ── */}
        {recipients.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-indigo-600 mb-2">
              Will send to {recipients.length} recipient{recipients.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recipients.map(r => <Tag key={r} label={r} color="indigo" />)}
            </div>
          </div>
        )}

        {/* ── Attachment options ── */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">2 · Attachments</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-indigo-200 bg-indigo-50 rounded-xl cursor-default">
              <FaFilePdf className="text-indigo-500" />
              <div className="flex-1">
                <span className="text-sm font-semibold text-indigo-700">Summary PDF</span>
                <span className="text-xs text-indigo-400 ml-2">(always included)</span>
              </div>
              <FaCheckCircle className="text-indigo-500" />
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={includeTranscript}
                onChange={e => setIncludeTranscript(e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
              <FaFileAlt className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Also attach Transcript PDF</span>
            </label>
          </div>
        </div>

        {/* ── Advanced options (collapsible) ── */}
        <div>
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition uppercase tracking-wider"
          >
            {showAdvanced ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
            Advanced options
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-3 pl-1">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Sender display name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Your Name or Team Name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Personal note (optional)</label>
                <textarea
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="Hi team, please find the summary from today's meeting attached..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error banner */}
        {status === "error" && result && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <FaTimesCircle className="mt-0.5 shrink-0" />
            <span>{result.message}</span>
          </div>
        )}

        {/* ── Send button ── */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md text-sm"
        >
          {status === "sending" ? (
            <><FaSpinner className="animate-spin" /> Sending emails…</>
          ) : (
            <><MdSend className="text-base" /> Send to {recipients.length || 0} recipient{recipients.length !== 1 ? "s" : ""}</>
          )}
        </button>

        {recipients.length === 0 && (
          <p className="text-center text-xs text-gray-400">
            {mode === "all" && participants.length === 0
              ? "No participant emails found. Add custom emails above."
              : mode === "manual"
              ? "Select participants or add custom emails above."
              : "Add at least one email address above."}
          </p>
        )}
      </div>
    </div>
  );
}
