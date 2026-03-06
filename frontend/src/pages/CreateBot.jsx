import React, { useState } from 'react';

const CreateBot = () => {
  const [formData, setFormData] = useState({
    meetingUrl: 'https://zoom.us/j/123456789',
    date: '',
    time: '',
    audioOnly: false,
    generateTranscript: true,
    botIntroduce: false,
    emailNotify: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Bot created with config:', formData);
    // Handle bot creation logic here
  };

  const scheduledBots = [
    {
      title: 'Weekly Team Sync',
      date: 'Feb 16, 2026',
      time: '10:00 AM',
      label: 'Tomorrow'
    },
    {
      title: 'Product Roadmap Review',
      date: 'Feb 18, 2026',
      time: '2:00 PM',
      label: 'Feb 18'
    },
    {
      title: 'Client Presentation',
      date: 'Feb 20, 2026',
      time: '11:30 AM',
      label: 'Feb 20'
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>MeetCut</h1>
        </div>

        {/* Navigation */}
        <div style={styles.nav}>
          <a href="#" style={styles.navLink}>Dashboard</a>
          <a href="#" style={styles.navLink}>Upload Video</a>
          <a href="#" style={{...styles.navLink, ...styles.activeNavLink}}>Create Bot</a>
          <a href="#" style={styles.navLink}>My Meetings</a>
          <a href="#" style={styles.navLink}>Settings</a>
        </div>

        {/* Page Header */}
        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>Create Meeting Bot</h2>
          <p style={styles.pageSubtitle}>Send an AI bot to automatically join and record your meeting</p>
        </div>

        {/* Two Column Layout */}
        <div style={styles.twoColumn}>
          {/* Left Column - Bot Configuration */}
          <div style={styles.leftColumn}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Bot Configuration</h3>
              
              <p style={styles.instructionText}>Enter your meeting details below</p>

              <form onSubmit={handleSubmit}>
                {/* Meeting URL */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Meeting URL</label>
                  <input
                    type="url"
                    name="meetingUrl"
                    value={formData.meetingUrl}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                  <p style={styles.hintText}>Supports Zoom, Google Meet, Microsoft Teams</p>
                </div>

                {/* Date and Time Row */}
                <div style={styles.row}>
                  <div style={styles.halfWidth}>
                    <label style={styles.label}>Date</label>
                    <input
                      type="text"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      placeholder="dd-mm-yyyy"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.halfWidth}>
                    <label style={styles.label}>Time</label>
                    <input
                      type="text"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      placeholder="--:--"
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Additional Settings */}
                <div style={styles.settingsGroup}>
                  <label style={styles.label}>Additional Settings</label>
                  
                  <div style={styles.checkboxContainer}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="audioOnly"
                        checked={formData.audioOnly}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      <span>Record audio only</span>
                    </label>

                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="generateTranscript"
                        checked={formData.generateTranscript}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      <span>Generate transcript automatically</span>
                    </label>

                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="botIntroduce"
                        checked={formData.botIntroduce}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      <span>Bot will introduce itself (optional)</span>
                    </label>
                  </div>
                </div>

                {/* Email Notification */}
                <div style={styles.emailSection}>
                  <label style={styles.emailLabel}>
                    <input
                      type="checkbox"
                      name="emailNotify"
                      checked={formData.emailNotify}
                      onChange={handleInputChange}
                      style={styles.checkbox}
                    />
                    <span style={styles.emailText}>
                      <strong>Email Notification</strong> - Get notified when the recording is ready
                    </span>
                  </label>
                </div>

                {/* Create Bot Button */}
                <button type="submit" style={styles.submitButton}>
                  Create Bot
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - How it works & Recent Bots */}
          <div style={styles.rightColumn}>
            {/* How does the bot work? */}
            <div style={{...styles.card, marginBottom: '30px'}}>
              <h3 style={styles.cardTitle}>How does the bot work?</h3>
              <div style={styles.infoBox}>
                <p style={styles.infoText}>
                  The MeetCut bot joins your meeting as a participant at the scheduled time. 
                  It records audio and video, then processes the content with AI to generate a transcript.
                </p>
              </div>

              {/* Features List */}
              <div style={styles.featuresList}>
                {[
                  'Automatic joining at scheduled time',
                  'High-quality audio and video recording',
                  'AI-powered transcription and summary',
                  'Email notification when ready'
                ].map((feature, index) => (
                  <div key={index} style={styles.featureItem}>
                    <span style={styles.checkMark}>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Bot Meetings */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Scheduled Bots</h3>

              <div style={styles.scheduledList}>
                {scheduledBots.map((bot, index) => (
                  <div key={index} style={styles.scheduledItem}>
                    <div>
                      <div style={styles.scheduledHeader}>
                        <h4 style={styles.scheduledTitle}>{bot.title}</h4>
                        <span style={styles.scheduledLabel}>{bot.label}</span>
                      </div>
                      <p style={styles.scheduledTime}>{bot.date} • {bot.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href="#" style={styles.viewAllLink}>
                View all scheduled bots →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#f5f7fb',
    minHeight: '100vh',
    margin: 0,
    padding: '20px'
  },
  innerContainer: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    color: '#1a2b4c',
    fontSize: '32px',
    fontWeight: 700,
    margin: 0
  },
  nav: {
    display: 'flex',
    gap: '30px',
    marginBottom: '40px',
    padding: '15px 0',
    borderBottom: '2px solid #e0e7f0'
  },
  navLink: {
    color: '#2d3a5e',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '5px 0',
    borderBottom: '3px solid transparent'
  },
  activeNavLink: {
    color: '#3b82f6',
    borderBottom: '3px solid #3b82f6'
  },
  pageHeader: {
    marginBottom: '30px'
  },
  pageTitle: {
    color: '#1a2b4c',
    fontSize: '28px',
    margin: '0 0 5px 0'
  },
  pageSubtitle: {
    color: '#64748b',
    margin: 0
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px'
  },
  leftColumn: {
    width: '100%'
  },
  rightColumn: {
    width: '100%'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    color: '#1a2b4c',
    fontSize: '20px',
    margin: '0 0 15px 0'
  },
  instructionText: {
    color: '#64748b',
    marginBottom: '20px',
    fontStyle: 'italic'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    color: '#1a2b4c',
    fontWeight: 600,
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc'
  },
  hintText: {
    color: '#64748b',
    fontSize: '12px',
    marginTop: '5px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '20px'
  },
  halfWidth: {
    width: '100%'
  },
  settingsGroup: {
    marginBottom: '20px'
  },
  checkboxContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '10px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    color: '#1a2b4c'
  },
  checkbox: {
    width: '18px',
    height: '18px'
  },
  emailSection: {
    marginBottom: '30px'
  },
  emailLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '15px',
    background: '#f0f9ff',
    borderRadius: '8px'
  },
  emailText: {
    color: '#1a2b4c',
    fontWeight: 500
  },
  submitButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '14px 30px',
    borderRadius: '8px',
    fontWeight: 600,
    width: '100%',
    cursor: 'pointer',
    fontSize: '16px'
  },
  infoBox: {
    background: '#f0f9ff',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '25px'
  },
  infoText: {
    color: '#1a2b4c',
    lineHeight: 1.6,
    margin: 0
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  featureItem: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  checkMark: {
    color: '#3b82f6',
    fontSize: '20px'
  },
  scheduledList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px'
  },
  scheduledItem: {
    padding: '15px',
    background: '#f8fafc',
    borderRadius: '10px'
  },
  scheduledHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  },
  scheduledTitle: {
    color: '#1a2b4c',
    fontWeight: 600,
    margin: 0
  },
  scheduledLabel: {
    color: '#3b82f6',
    fontSize: '12px',
    fontWeight: 600
  },
  scheduledTime: {
    color: '#64748b',
    fontSize: '14px',
    margin: 0
  },
  viewAllLink: {
    display: 'block',
    textAlign: 'center',
    color: '#3b82f6',
    textDecoration: 'none',
    marginTop: '20px',
    fontWeight: 500
  }
};

export default CreateBot;