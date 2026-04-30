import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar from '../components/common/Sidebar';
import { API, getUser } from '../utils/auth';

const VideoUpload = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    emailNotify: false
  });
  const [loading, setLoading] = useState(false);
  const { token, userName } = getUser();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadedFile) {
      toast.error('Please select a video file to upload');
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append('audio', uploadedFile); // The backend expects the field name to be 'audio' even for video files
      form.append('title', formData.title || uploadedFile.name);
      form.append('date', formData.date || new Date().toISOString());
      if (formData.description) {
        form.append('description', formData.description);
      }

      toast.loading('Uploading and processing video... This may take a few minutes.', { id: 'upload-toast' });

      const response = await axios.post(`${API}/api/audio/process`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Video processed successfully!', { id: 'upload-toast' });
      navigate(`/meetings/${response.data.transcriptId || ''}`);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to process video', { id: 'upload-toast' });
    } finally {
      setLoading(false);
    }
  };

  const meetings = [
    {
      title: 'Q4 Product Strategy Review',
      date: 'Feb 14, 2026',
      duration: '58 min',
      participants: 8,
      status: 'Completed',
      statusColor: '#22c55e'
    },
    {
      title: 'Engineering Sprint Retrospective',
      date: 'Feb 13, 2026',
      duration: '32 min',
      participants: 5,
      status: 'Completed',
      statusColor: '#22c55e'
    },
    {
      title: 'Client Onboarding — Acme Corp',
      date: 'Feb 13, 2026',
      duration: '45 min',
      participants: 4,
      status: 'Processing',
      statusColor: '#eab308'
    }
  ];

  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div style={styles.innerContainer}>
          {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h2 style={styles.welcomeTitle}>Welcome back, {userName ? userName.split(' ')[0] : 'User'}</h2>
          <p style={styles.welcomeSubtitle}>Upload a recording to process with AI</p>
        </div>

        {/* Two Column Layout */}
        <div style={styles.twoColumn}>
          {/* Left Column - Upload Section */}
          <div style={styles.leftColumn}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Upload Meeting Recording</h3>

              {/* Upload Area */}
              <form onSubmit={handleSubmit}>
                <div 
                  style={styles.uploadBox}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <div style={styles.uploadIcon}>📁</div>
                  <p style={styles.uploadText}>Click to upload or drag and drop</p>
                  <p style={styles.uploadSubtext}>MP4, MOV, AVI, MP3, M4A, WAV up to 2GB</p>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".mp4,.mov,.avi,.mp3,.m4a,.wav"
                    onChange={handleFileSelect}
                    style={styles.hiddenInput}
                  />
                  {uploadedFile && (
                    <p style={styles.fileName}>Selected: {uploadedFile.name}</p>
                  )}
                  <button 
                    type="button"
                    style={styles.selectButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('fileInput').click();
                    }}
                  >
                    Select File
                  </button>
                </div>

                {/* Video Details Form */}
                <div style={styles.formSection}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Meeting Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Q1 Product Review"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Meeting Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Description (Optional)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Add meeting notes or description..."
                      style={styles.textarea}
                    />
                  </div>

                  <div style={styles.checkboxGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="emailNotify"
                        checked={formData.emailNotify}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      <span>Send email notification when processing is complete</span>
                    </label>
                  </div>

                  <button type="submit" disabled={loading || !uploadedFile} style={{...styles.submitButton, opacity: (loading || !uploadedFile) ? 0.7 : 1}}>
                    {loading ? 'Processing...' : 'Upload and Process Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Recent Meetings */}
          <div style={styles.rightColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Recent Meetings</h3>
                <a href="#" style={styles.viewAllLink}>View all</a>
              </div>

              {/* Meeting List */}
              <div style={styles.meetingList}>
                {meetings.map((meeting, index) => (
                  <div key={index} style={styles.meetingItem}>
                    <div>
                      <h4 style={styles.meetingTitle}>{meeting.title}</h4>
                      <p style={styles.meetingMeta}>
                        {meeting.date} • {meeting.duration} • {meeting.participants} participants
                      </p>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: meeting.statusColor
                    }}>
                      {meeting.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
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
  welcomeSection: {
    marginBottom: '30px'
  },
  welcomeTitle: {
    color: '#1a2b4c',
    fontSize: '28px',
    margin: '0 0 5px 0'
  },
  welcomeSubtitle: {
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
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  cardTitle: {
    color: '#1a2b4c',
    fontSize: '20px',
    margin: '0 0 20px 0'
  },
  uploadBox: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    background: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '30px'
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  uploadText: {
    color: '#1a2b4c',
    fontWeight: 600,
    marginBottom: '8px'
  },
  uploadSubtext: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '20px'
  },
  fileName: {
    color: '#3b82f6',
    fontSize: '14px',
    marginBottom: '10px'
  },
  hiddenInput: {
    display: 'none'
  },
  selectButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  formSection: {
    marginTop: '30px'
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
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  checkboxGroup: {
    marginBottom: '25px'
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
  viewAllLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: 500
  },
  meetingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  meetingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderRadius: '10px',
    background: '#f8fafc'
  },
  meetingTitle: {
    color: '#1a2b4c',
    fontWeight: 600,
    margin: '0 0 5px 0'
  },
  meetingMeta: {
    color: '#64748b',
    fontSize: '14px',
    margin: 0
  },
  statusBadge: {
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600
  }
};

export default VideoUpload;