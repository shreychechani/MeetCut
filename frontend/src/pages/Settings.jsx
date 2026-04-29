import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getUser, saveAuth, API } from "../utils/auth";

const tabs = ["Profile", "Notifications", "Privacy", "Integrations", "Billing", "Danger Zone"];

export default function Settings() {
  const { userName, userEmail } = getUser();
  const displayName = userName || "User";
  const avatarInitials = displayName.charAt(0).toUpperCase();
  const [activeTab, setActiveTab] = useState("Profile");
  const [saved, setSaved] = useState(false);
  const [toggles, setToggles] = useState({
    emailMeetingReminders: true,
    emailWeeklySummary: false,
    pushNotifications: true,
    smsAlerts: false,
    showOnlineStatus: true,
    allowRecording: true,
    shareAnalytics: false,
    calendarSync: true,
    slackIntegration: false,
    zoomIntegration: true,
  });
  const [profile, setProfile] = useState({
    name: displayName,
    email: userEmail || "user@example.com",
    role: "",
    timezone: "Asia/Kolkata",
    language: "English",
    bio: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { token } = getUser();
        const res = await axios.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = res.data.user;

        setProfile(prev => ({
          ...prev,
          name: user.fullName || prev.name,
          email: user.email || prev.email,
          role: user.role || prev.role,
          timezone: user.timezone || prev.timezone,
          language: user.language || prev.language,
          bio: user.bio || prev.bio
        }));

        if (user.preferences) {
          setToggles(prev => ({ ...prev, ...user.preferences }));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile settings.");
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const { token } = getUser();
      const payload = {
        fullName: profile.name,
        role: profile.role,
        timezone: profile.timezone,
        language: profile.language,
        bio: profile.bio,
        preferences: toggles
      };

      const res = await axios.put(`${API}/api/auth/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local storage so the sidebar/header updates
      saveAuth({ token, user: res.data.user });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Settings saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error(err.response?.data?.message || "Failed to save settings.");
    }
  };

  const toggle = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#0f1117", color: "#e8eaf0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 3px; }
        input, textarea, select {
          background: #1a1d27 !important;
          border: 1px solid #2a2d3a !important;
          color: #e8eaf0 !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 14px !important;
          width: 100%;
          outline: none;
          transition: border 0.2s;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #6c63ff !important;
          box-shadow: 0 0 0 3px rgba(108,99,255,0.15) !important;
        }
        select option { background: #1a1d27; }
        .tab-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          padding: 10px 18px; border-radius: 10px;
          color: #6b7080; transition: all 0.2s; white-space: nowrap;
        }
        .tab-btn:hover { color: #e8eaf0; background: #1a1d27; }
        .tab-btn.active { color: #fff; background: #1e2030; box-shadow: 0 0 0 1px #2a2d3a; }
        .save-btn {
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          border: none; border-radius: 10px; color: #fff;
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          font-size: 14px; padding: 11px 28px; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 20px rgba(108,99,255,0.3);
        }
        .save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(108,99,255,0.45); }
        .save-btn:active { transform: translateY(0); }
        .danger-btn {
          background: transparent; border: 1px solid #ff4d6d;
          border-radius: 10px; color: #ff4d6d;
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          font-size: 14px; padding: 11px 24px; cursor: pointer;
          transition: all 0.2s;
        }
        .danger-btn:hover { background: rgba(255,77,109,0.1); }
        .card {
          background: #1a1d27; border: 1px solid #2a2d3a;
          border-radius: 16px; padding: 24px; margin-bottom: 16px;
        }
        .card-title {
          font-size: 15px; font-weight: 600; color: #e8eaf0; margin-bottom: 4px;
        }
        .card-desc { font-size: 13px; color: #6b7080; margin-bottom: 20px; }
        .label { font-size: 13px; font-weight: 500; color: #9ba3b8; margin-bottom: 6px; display: block; }
        .row { display: flex; gap: 16px; }
        .row > * { flex: 1; }
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0; border-bottom: 1px solid #1e2030;
        }
        .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
        .toggle-row:first-child { padding-top: 0; }
        .toggle-label { font-size: 14px; font-weight: 500; color: #c8cad8; }
        .toggle-sub { font-size: 12px; color: #6b7080; margin-top: 2px; }
        .toggle-track {
          width: 44px; height: 24px; border-radius: 12px;
          cursor: pointer; position: relative; transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute; top: 3px; width: 18px; height: 18px;
          border-radius: 50%; background: #fff; transition: left 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .integration-card {
          display: flex; align-items: center; justify-content: space-between;
          background: #1e2030; border: 1px solid #2a2d3a;
          border-radius: 12px; padding: 16px 20px; margin-bottom: 10px;
        }
        .int-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; margin-right: 14px; flex-shrink: 0;
        }
        .connect-btn {
          background: #1a1d27; border: 1px solid #2a2d3a;
          border-radius: 8px; color: #9ba3b8;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          padding: 7px 16px; cursor: pointer; transition: all 0.2s;
        }
        .connect-btn:hover { border-color: #6c63ff; color: #a78bfa; }
        .connected-badge {
          background: rgba(52,199,89,0.12); border: 1px solid rgba(52,199,89,0.3);
          border-radius: 8px; color: #34c759;
          font-size: 12px; font-weight: 600; padding: 5px 12px;
        }
        .plan-card {
          background: linear-gradient(135deg, #1e2030, #1a1d27);
          border: 1px solid #6c63ff44; border-radius: 16px; padding: 24px;
          margin-bottom: 16px; position: relative; overflow: hidden;
        }
        .plan-card::before {
          content: ''; position: absolute; top: -40px; right: -40px;
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle, rgba(108,99,255,0.15), transparent 70%);
        }
        .badge-pro {
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          border-radius: 6px; color: #fff; font-size: 11px;
          font-weight: 700; padding: 3px 10px; letter-spacing: 0.05em;
          display: inline-block; margin-bottom: 10px;
        }
        .stat-chip {
          background: #1e2030; border: 1px solid #2a2d3a;
          border-radius: 10px; padding: 14px 18px; flex: 1; text-align: center;
        }
        .stat-chip .num { font-size: 22px; font-weight: 700; color: #e8eaf0; }
        .stat-chip .lbl { font-size: 12px; color: #6b7080; margin-top: 2px; }
        .saved-toast {
          position: fixed; bottom: 32px; right: 32px;
          background: #22c55e; color: #fff;
          border-radius: 12px; padding: 12px 20px;
          font-size: 14px; font-weight: 600;
          box-shadow: 0 8px 32px rgba(34,197,94,0.35);
          animation: slideUp 0.3s ease;
          display: flex; align-items: center; gap: 8px;
          z-index: 999;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 700; color: #fff;
          flex-shrink: 0; position: relative;
        }
        .avatar-edit {
          position: absolute; bottom: 0; right: 0;
          width: 22px; height: 22px; border-radius: 50%;
          background: #2a2d3a; border: 2px solid #0f1117;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; cursor: pointer;
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2030", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6c63ff,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✂️</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>MeetCut</span>
          <span style={{ color: "#2a2d3a", fontSize: 18 }}>·</span>
          <span style={{ color: "#6b7080", fontSize: 15 }}>Settings</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 13, color: "#6b7080" }}>{profile.name}</span>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "32px 24px", gap: 28 }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#3d4055", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, paddingLeft: 8 }}>Account</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tabs.map((tab) => (
              <button key={tab} className={`tab-btn${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)} style={{ textAlign: "left" }}>
                <span style={{ marginRight: 8 }}>
                  {tab === "Profile" ? "👤" : tab === "Notifications" ? "🔔" : tab === "Privacy" ? "🔒" : tab === "Integrations" ? "🔗" : tab === "Billing" ? "💳" : "⚠️"}
                </span>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── PROFILE ── */}
          {activeTab === "Profile" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Profile Settings</h2>
                <p style={{ color: "#6b7080", fontSize: 14, marginTop: 4 }}>Manage how you appear on MeetCut</p>
              </div>
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
                  <div className="avatar">
                    {avatarInitials}
                    <div className="avatar-edit">✏️</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{profile.name}</div>
                    <div style={{ color: "#6b7080", fontSize: 13 }}>{profile.email}</div>
                    <button style={{ background: "none", border: "1px solid #2a2d3a", borderRadius: 7, color: "#9ba3b8", fontSize: 12, padding: "4px 12px", cursor: "pointer", marginTop: 8, fontFamily: "inherit" }}>Change Photo</button>
                  </div>
                </div>
                <div className="row" style={{ marginBottom: 16 }}>
                  <div>
                    <label className="label">Full Name</label>
                    <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="row" style={{ marginBottom: 16 }}>
                  <div>
                    <label className="label">Role / Title</label>
                    <input value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Timezone</label>
                    <select value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
                      <option value="Asia/Kolkata">IST — Asia/Kolkata</option>
                      <option value="America/New_York">EST — America/New_York</option>
                      <option value="America/Los_Angeles">PST — America/Los_Angeles</option>
                      <option value="Europe/London">GMT — Europe/London</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Bio</label>
                  <textarea rows={3} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} style={{ resize: "vertical" }} />
                </div>
                <div>
                  <label className="label">Language</label>
                  <select value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))} style={{ width: "calc(50% - 8px)" }}>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="save-btn" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "Notifications" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Notifications</h2>
                <p style={{ color: "#6b7080", fontSize: 14, marginTop: 4 }}>Choose what you hear about and when</p>
              </div>
              {[
                {
                  group: "Email", items: [
                    { key: "emailMeetingReminders", label: "Meeting Reminders", sub: "Get reminded 15 min before a meeting" },
                    { key: "emailWeeklySummary", label: "Weekly Summary", sub: "Digest of your meetings every Monday" },
                  ]
                },
                {
                  group: "Push", items: [
                    { key: "pushNotifications", label: "Push Notifications", sub: "Browser or mobile push alerts" },
                    { key: "smsAlerts", label: "SMS Alerts", sub: "Text message for urgent meetings" },
                  ]
                },
              ].map(({ group, items }) => (
                <div key={group} className="card">
                  <div className="card-title">{group} Notifications</div>
                  <div className="card-desc">Control {group.toLowerCase()} alerts from MeetCut</div>
                  {items.map(({ key, label, sub }) => (
                    <div key={key} className="toggle-row">
                      <div>
                        <div className="toggle-label">{label}</div>
                        <div className="toggle-sub">{sub}</div>
                      </div>
                      <div className="toggle-track" style={{ background: toggles[key] ? "#6c63ff" : "#2a2d3a" }} onClick={() => toggle(key)}>
                        <div className="toggle-thumb" style={{ left: toggles[key] ? 23 : 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="save-btn" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}

          {/* ── PRIVACY ── */}
          {activeTab === "Privacy" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Privacy & Security</h2>
                <p style={{ color: "#6b7080", fontSize: 14, marginTop: 4 }}>Control your data and visibility</p>
              </div>
              <div className="card">
                <div className="card-title">Visibility</div>
                <div className="card-desc">Who can see your activity on MeetCut</div>
                {[
                  { key: "showOnlineStatus", label: "Show Online Status", sub: "Let others see when you're active" },
                  { key: "allowRecording", label: "Allow Meeting Recording", sub: "Hosts can record meetings you join" },
                  { key: "shareAnalytics", label: "Share Usage Analytics", sub: "Help improve MeetCut with anonymous data" },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="toggle-row">
                    <div>
                      <div className="toggle-label">{label}</div>
                      <div className="toggle-sub">{sub}</div>
                    </div>
                    <div className="toggle-track" style={{ background: toggles[key] ? "#6c63ff" : "#2a2d3a" }} onClick={() => toggle(key)}>
                      <div className="toggle-thumb" style={{ left: toggles[key] ? 23 : 3 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">Password</div>
                <div className="card-desc">Update your account password</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><label className="label">Current Password</label><input type="password" placeholder="••••••••" /></div>
                  <div className="row">
                    <div><label className="label">New Password</label><input type="password" placeholder="••••••••" /></div>
                    <div><label className="label">Confirm Password</label><input type="password" placeholder="••••••••" /></div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="save-btn" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}

          {/* ── INTEGRATIONS ── */}
          {activeTab === "Integrations" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Integrations</h2>
                <p style={{ color: "#6b7080", fontSize: 14, marginTop: 4 }}>Connect your favourite tools to MeetCut</p>
              </div>
              {[
                { icon: "📅", name: "Google Calendar", desc: "Sync meetings to your calendar", key: "calendarSync", color: "#4285f4" },
                { icon: "💬", name: "Slack", desc: "Get meeting notifications in Slack", key: "slackIntegration", color: "#4a154b" },
                { icon: "🎥", name: "Zoom", desc: "Import Zoom meetings into MeetCut", key: "zoomIntegration", color: "#2d8cff" },
                { icon: "📁", name: "Google Drive", desc: "Attach Drive files to meetings", key: null, color: "#34a853" },
                { icon: "🎯", name: "Notion", desc: "Export meeting notes to Notion", key: null, color: "#ffffff" },
              ].map(({ icon, name, desc, key, color }) => (
                <div key={name} className="integration-card">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="int-icon" style={{ background: color + "22" }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                      <div style={{ color: "#6b7080", fontSize: 12 }}>{desc}</div>
                    </div>
                  </div>
                  {key ? (
                    toggles[key]
                      ? <span className="connected-badge">✓ Connected</span>
                      : <button className="connect-btn" onClick={() => toggle(key)}>Connect</button>
                  ) : (
                    <button className="connect-btn">Connect</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── BILLING ── */}
          {activeTab === "Billing" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Billing</h2>
                <p style={{ color: "#6b7080", fontSize: 14, marginTop: 4 }}>Manage your plan and usage</p>
              </div>
              <div className="plan-card">
                <div className="badge-pro">PRO PLAN</div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>₹799<span style={{ fontSize: 16, fontWeight: 400, color: "#6b7080" }}> / month</span></div>
                <div style={{ color: "#9ba3b8", fontSize: 13, marginTop: 6, marginBottom: 20 }}>Renews on April 6, 2026</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["48", "Meetings"], ["12h", "Saved"], ["∞", "Storage"]].map(([num, lbl]) => (
                    <div key={lbl} className="stat-chip"><div className="num">{num}</div><div className="lbl">{lbl}</div></div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title">Payment Method</div>
                <div className="card-desc">Your current saved card</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1e2030", borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#6c63ff22", borderRadius: 6, padding: "4px 10px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#a78bfa" }}>VISA</div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14 }}>•••• •••• •••• 4242</span>
                  </div>
                  <button style={{ background: "none", border: "1px solid #2a2d3a", borderRadius: 7, color: "#9ba3b8", fontSize: 12, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>Update</button>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Invoices</div>
                <div className="card-desc">Download past invoices</div>
                {["March 2026", "February 2026", "January 2026"].map((month) => (
                  <div key={month} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1e2030" }}>
                    <div style={{ fontSize: 14 }}>Invoice — {month}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>₹799</span>
                      <button style={{ background: "none", border: "none", color: "#6c63ff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Download ↓</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DANGER ZONE ── */}
          {activeTab === "Danger Zone" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Danger Zone</h2>
                <p style={{ color: "#6b7080", fontSize: 14, marginTop: 4 }}>Irreversible actions — proceed with caution</p>
              </div>
              {[
                { icon: "📤", title: "Export Your Data", desc: "Download a full copy of your meetings, notes, and account data.", action: "Export Data", danger: false },
                { icon: "🚫", title: "Deactivate Account", desc: "Temporarily disable your account. You can reactivate anytime.", action: "Deactivate", danger: true },
                { icon: "🗑️", title: "Delete Account", desc: "Permanently delete your account and all associated data. This cannot be undone.", action: "Delete Account", danger: true },
              ].map(({ icon, title, desc, action, danger }) => (
                <div key={title} style={{ background: danger ? "rgba(255,77,109,0.04)" : "#1a1d27", border: `1px solid ${danger ? "rgba(255,77,109,0.2)" : "#2a2d3a"}`, borderRadius: 14, padding: "20px 24px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ fontSize: 22, marginTop: 2 }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: danger ? "#ff6b84" : "#e8eaf0" }}>{title}</div>
                      <div style={{ color: "#6b7080", fontSize: 13, marginTop: 3, maxWidth: 460 }}>{desc}</div>
                    </div>
                  </div>
                  <button className={danger ? "danger-btn" : "connect-btn"} style={{ whiteSpace: "nowrap" }}>{action}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {saved && (
        <div className="saved-toast">
          <span>✓</span> Changes saved successfully!
        </div>
      )}
    </div>
  );
}