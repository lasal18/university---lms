import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const StudentPortal = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // All courses catalog
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Selected course for materials/assignments
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [moduleMaterials, setModuleMaterials] = useState([]);
  const [moduleAssignments, setModuleAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // File upload state for assignments
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Payment states
  const [selectedRepeatModuleId, setSelectedRepeatModuleId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(5000); // 5000 LKR flat fee
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [paymentErrorMsg, setPaymentErrorMsg] = useState('');
  const [paymentsHistory, setPaymentsHistory] = useState([]);

  // Attendance states
  const [attendanceList, setAttendanceList] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch Dashboard Stats
  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/students/dashboard');
      setDashboardData(res.data);
      setNotifications(res.data.notifications || []);
      setUnreadCount((res.data.notifications || []).filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch all courses for catalog
  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Error loading course catalog:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/payments');
      setPaymentsHistory(res.data);
    } catch (err) {
      console.error('Error loading payments:', err);
    }
  };

  // Fetch attendance
  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const res = await axios.get('/api/attendance');
      setAttendanceList(res.data);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch notifications separately for refresh
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
      setUnreadCount(res.filter ? res.filter(n => !n.isRead).length : res.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchCourses();
    fetchPayments();
    fetchAttendance();
  }, []);

  // Fetch course resources when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchResources = async () => {
      setLoadingResources(true);
      try {
        const matRes = await axios.get(`/api/materials/module/${selectedCourseId}`);
        setModuleMaterials(matRes.data);

        const assignRes = await axios.get(`/api/assignments/module/${selectedCourseId}`);
        setModuleAssignments(assignRes.data);

        const subRes = await axios.get('/api/submissions/my-submissions');
        setSubmissions(subRes.data);
      } catch (err) {
        console.error('Error loading course resources:', err);
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, [selectedCourseId]);

  const handleEnroll = async (courseId) => {
    try {
      await axios.post(`/api/courses/${courseId}/enroll`);
      alert('Successfully enrolled!');
      fetchCourses();
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadError('');
    setUploadSuccess('');
  };

  const handleAssignmentSubmit = async (e, assignmentId) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to submit');
      return;
    }

    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('file', selectedFile);

    try {
      await axios.post('/api/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess('Assignment submitted successfully!');
      setSelectedFile(null);
      setUploadingAssignmentId('');
      // Refresh resources
      const subRes = await axios.get('/api/submissions/my-submissions');
      setSubmissions(subRes.data);
      fetchDashboard();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Submission failed');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRepeatModuleId) {
      setPaymentErrorMsg('Please select a repeat module');
      return;
    }

    setPaying(true);
    setPaymentSuccessMsg('');
    setPaymentErrorMsg('');

    try {
      const res = await axios.post('/api/payments/repeat-exam', {
        moduleId: selectedRepeatModuleId,
        amount: paymentAmount,
        cardNumber,
        cardExpiry,
        cardCvc
      });

      setPaymentSuccessMsg(`Payment Completed! Reference ID: ${res.data.payment.paymentReference}`);
      setSelectedRepeatModuleId('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      fetchPayments();
      fetchDashboard();
    } catch (err) {
      setPaymentErrorMsg(err.response?.data?.message || 'Payment failed. Please check card inputs.');
    } finally {
      setPaying(false);
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to find submission status
  const getSubStatus = (assignId) => {
    const sub = submissions.find(s => s.assignment?._id === assignId || s.assignment === assignId);
    if (!sub) return { text: 'Not Submitted', class: 'badge-blue', sub: null };
    if (sub.status === 'Graded') {
      return { text: `Graded (${sub.marks} marks)`, class: 'badge-green', sub };
    }
    return { text: 'Submitted (Pending Grade)', class: 'badge-green', sub };
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">AETHERIA PORTAL</div>

          {/* User profile widget */}
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
            <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user?.name}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-blue">STUDENT</span>
              {unreadCount > 0 && (
                <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>
                  🔔 {unreadCount}
                </span>
              )}
            </div>
          </div>

          <ul className="nav-links">
            <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <a href="#dashboard" onClick={() => setActiveTab('dashboard')}>
                Dashboard Overview
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}>
              <a href="#courses" onClick={() => setActiveTab('courses')}>
                Course Catalog
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'materials' ? 'active' : ''}`}>
              <a href="#materials" onClick={() => setActiveTab('materials')}>
                Lecture Downloads
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}>
              <a href="#assignments" onClick={() => setActiveTab('assignments')}>
                My Assignments
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}>
              <a href="#attendance" onClick={() => setActiveTab('attendance')}>
                Attendance Tracker
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}>
              <a href="#payments" onClick={() => setActiveTab('payments')}>
                Repeat Exam Payments
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}>
              <a href="#notifications" onClick={() => setActiveTab('notifications')}>
                Notification Hub
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}>
              <a href="#profile" onClick={() => setActiveTab('profile')}>
                Account Profile
              </a>
            </li>
          </ul>
        </div>

        <button className="btn btn-secondary" onClick={logout} style={{ width: '100%' }}>
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <div className="page-header">
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Student Dashboard</h1>
                <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user?.name}</p>
              </div>
            </div>

            {loadingDashboard ? (
              <div style={{ color: 'var(--text-muted)' }}>Loading stats...</div>
            ) : (
              <>
                {/* Stats cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Enrolled Modules</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0' }}>{dashboardData?.enrolledModules?.length || 0}</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Pending Assignments</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--primary)' }}>{dashboardData?.upcomingAssignments?.length || 0}</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Attendance Rate</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--secondary)' }}>{dashboardData?.attendancePercentage}%</h2>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                  {/* Upcoming assignments list */}
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Upcoming Deadlines</h3>
                    {dashboardData?.upcomingAssignments?.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>No pending assignments. Excellent job!</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {dashboardData?.upcomingAssignments?.map(assign => (
                          <div key={assign._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
                            <div>
                              <p style={{ fontWeight: '600' }}>{assign.title}</p>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {assign.module?.title} ({assign.module?.moduleCode})
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '0.9rem', color: '#f87171', fontWeight: '600' }}>
                                Due: {new Date(assign.deadline).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent notifications */}
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Notifications</h3>
                    {notifications.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>No new alerts.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notifications.slice(0, 4).map(n => (
                          <div key={n._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem', color: n.isRead ? 'var(--text-muted)' : 'var(--text-main)' }}>
                              {!n.isRead && '🔵 '} {n.title}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* COURSE CATALOG TAB */}
        {activeTab === 'courses' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Course Catalog</h1>
            {loadingCourses ? (
              <div style={{ color: 'var(--text-muted)' }}>Loading catalog...</div>
            ) : (
              <div className="course-grid">
                {courses.map(course => {
                  const isEnrolled = dashboardData?.enrolledModules?.some(m => m._id === course._id);
                  return (
                    <div key={course._id} className="course-card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                      <span className="badge badge-blue" style={{ width: 'fit-content', marginBottom: '1rem' }}>
                        {course.department}
                      </span>
                      <h3 className="course-title">
                        {course.title} {course.moduleCode ? `(${course.moduleCode})` : ''}
                      </h3>
                      <p className="course-desc">{course.description}</p>
                      
                      <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          👤 Lecturer: {course.instructor || 'Staff'}
                        </p>
                        {isEnrolled ? (
                          <button className="btn btn-secondary" style={{ width: '100%', cursor: 'default' }} disabled>
                            ✓ Enrolled
                          </button>
                        ) : (
                          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleEnroll(course._id)}>
                            Enroll Module
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* LECTURE MATERIALS DOWNLOAD TAB */}
        {activeTab === 'materials' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Lecture Downloads</h1>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '500px' }}>
              <label className="form-label">Select Module</label>
              <select
                className="form-input"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{ background: '#111827' }}
              >
                <option value="">-- Choose Enrolled Course --</option>
                {dashboardData?.enrolledModules?.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.moduleCode})
                  </option>
                ))}
              </select>
            </div>

            {selectedCourseId && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Resources and Lecture Notes</h3>
                {loadingResources ? (
                  <p>Loading course resources...</p>
                ) : moduleMaterials.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No resources uploaded for this module yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {moduleMaterials.map(mat => (
                      <div key={mat._id} className="mini-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '8px' }}>
                        <div>
                          <h4 style={{ fontWeight: '700' }}>{mat.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{mat.description}</p>
                          <span className="badge badge-blue" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                            {mat.type.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          {mat.fileUrl ? (
                            <a
                              href={axios.defaults.baseURL ? `${axios.defaults.baseURL}${mat.fileUrl}` : mat.fileUrl}
                              className="btn btn-primary"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download Note
                            </a>
                          ) : (
                            <a
                              href={mat.resourceUrl}
                              className="btn btn-secondary"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Link
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ASSIGNMENTS SUBMISSION TAB */}
        {activeTab === 'assignments' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>My Course Assignments</h1>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '500px' }}>
              <label className="form-label">Select Module</label>
              <select
                className="form-input"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{ background: '#111827' }}
              >
                <option value="">-- Choose Enrolled Course --</option>
                {dashboardData?.enrolledModules?.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.moduleCode})
                  </option>
                ))}
              </select>
            </div>

            {selectedCourseId && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Assignments List</h3>
                {loadingResources ? (
                  <p>Loading assignments...</p>
                ) : moduleAssignments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No assignments registered for this module.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {moduleAssignments.map(assign => {
                      const { text, class: badgeClass, sub } = getSubStatus(assign._id);
                      return (
                        <div key={assign._id} className="mini-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                              <h4 style={{ fontWeight: '700', fontSize: '1.1rem' }}>{assign.title}</h4>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0' }}>{assign.description}</p>
                              <p style={{ fontSize: '0.85rem' }}>
                                📅 Deadline: <strong style={{ color: '#f87171' }}>{new Date(assign.deadline).toLocaleString()}</strong>
                              </p>
                              <p style={{ fontSize: '0.85rem' }}>
                                🏆 Max Marks: <strong>{assign.maximumMarks}</strong>
                              </p>
                            </div>
                            <div>
                              <span className={`badge ${badgeClass}`}>{text}</span>
                            </div>
                          </div>

                          {/* Grade and feedback display */}
                          {sub && sub.status === 'Graded' && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                              <p style={{ fontWeight: '700', color: 'var(--secondary)' }}>Marks Secured: {sub.marks} / {assign.maximumMarks}</p>
                              {sub.feedback && <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>Feedback: {sub.feedback}</p>}
                            </div>
                          )}

                          {/* Upload form */}
                          {(!sub || sub.status === 'Pending') && (
                            <div>
                              {uploadingAssignmentId === assign._id ? (
                                <form onSubmit={(e) => handleAssignmentSubmit(e, assign._id)} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                                  <div className="form-group">
                                    <label className="form-label">Upload Submission Document</label>
                                    <input type="file" className="form-input" onChange={handleFileChange} required />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      Allowed formats: {assign.allowedFileTypes?.join(', ') || 'pdf, docx, zip'}. Max 20MB.
                                    </span>
                                  </div>

                                  {uploadError && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{uploadError}</p>}

                                  <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary">Upload File</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setUploadingAssignmentId('')}>Cancel</button>
                                  </div>
                                </form>
                              ) : (
                                <button className="btn btn-primary" onClick={() => setUploadingAssignmentId(assign._id)}>
                                  {sub ? 'Re-submit Assignment' : 'Submit Assignment'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ATTENDANCE TRACKER TAB */}
        {activeTab === 'attendance' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Attendance Tracker</h1>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Academic Register</h3>
                <span className="badge badge-green" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  Overall Attendance: {dashboardData?.attendancePercentage}%
                </span>
              </div>

              {loadingAttendance ? (
                <p>Loading attendance logs...</p>
              ) : attendanceList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No attendance logs registered yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem 0.5rem' }}>Date</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Module Code</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Module Name</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map(record => (
                      <tr key={record._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '1rem 0.5rem' }}>{new Date(record.date).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>{record.module?.moduleCode || 'N/A'}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>{record.module?.title}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span className={`badge ${record.status === 'Present' ? 'badge-green' : 'badge-blue'}`} style={{ background: record.status === 'Absent' ? 'rgba(239, 68, 68, 0.15)' : '', color: record.status === 'Absent' ? '#f87171' : '' }}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* REPEAT EXAM PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Repeat Examination Payments</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Payment Checkout Panel */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Repeat Exam Checkout</h3>
                
                {paymentSuccessMsg && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    {paymentSuccessMsg}
                  </div>
                )}
                {paymentErrorMsg && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    {paymentErrorMsg}
                  </div>
                )}

                <form onSubmit={handlePaymentSubmit}>
                  <div className="form-group">
                    <label className="form-label">Select repeat exam module</label>
                    <select
                      className="form-input"
                      value={selectedRepeatModuleId}
                      onChange={(e) => setSelectedRepeatModuleId(e.target.value)}
                      style={{ background: '#111827' }}
                      required
                    >
                      <option value="">-- Choose Module --</option>
                      {courses.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.title} {m.moduleCode ? `(${m.moduleCode})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Repeat exam fee (LKR)</label>
                    <input type="text" className="form-input" value="5,000 LKR" disabled style={{ opacity: 0.7 }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Expiration Date</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVV / CVC</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="•••"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={paying}>
                    {paying ? 'Verifying payment...' : 'Pay Repeat Examination Fee'}
                  </button>
                </form>
              </div>

              {/* Payments History Panel */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Transaction History</h3>
                {paymentsHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No transactions recorded.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto' }}>
                    {paymentsHistory.map(pay => (
                      <div key={pay._id} className="mini-glass" style={{ padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong>{pay.module?.title || 'Tuition / Exam Fee'}</strong>
                          <span className={`badge ${pay.status === 'Success' ? 'badge-green' : 'badge-blue'}`} style={{ background: pay.status === 'Failed' ? 'rgba(239, 68, 68, 0.15)' : '', color: pay.status === 'Failed' ? '#f87171' : '' }}>
                            {pay.status}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Trans ID: {pay.transactionId}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ref ID: {pay.paymentReference || 'N/A'}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', borderTop: '1px dashed var(--border-glass)', paddingTop: '0.5rem' }}>
                          <span>Paid: {pay.amount} LKR</span>
                          <span>{pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : new Date(pay.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Notification Hub</h1>
              <button className="btn btn-secondary" onClick={fetchNotifications}>Refresh</button>
            </div>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              {notifications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>You have no notifications.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notifications.map(n => (
                    <div key={n._id} className="mini-glass" style={{ padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: n.isRead ? 0.7 : 1 }}>
                      <div>
                        <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>
                          {!n.isRead && '🔵 '} {n.title}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{n.message}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!n.isRead && (
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleMarkNotifRead(n._id)}>
                          Mark as Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Account Profile</h1>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.name}</p>
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.email}</p>
                </div>
                <div>
                  <label className="form-label">Student ID</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.studentId || 'STUDENT-' + user?._id?.slice(-5).toUpperCase()}</p>
                </div>
                <div>
                  <label className="form-label">Registration Number</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.registrationNumber || 'REG/' + new Date().getFullYear() + '/' + user?._id?.slice(-4).toUpperCase()}</p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <div>
                    <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                      {user?.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentPortal;
