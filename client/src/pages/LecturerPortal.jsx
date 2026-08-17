import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const LecturerPortal = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // My students
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Forms and resource loaders
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Upload note states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [noteType, setNoteType] = useState('pdf');
  const [noteFile, setNoteFile] = useState(null);
  const [noteUrl, setNoteUrl] = useState('');
  const [noteSuccess, setNoteSuccess] = useState('');
  const [noteError, setNoteError] = useState('');

  // Create assignment states
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState(100);
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignError, setAssignError] = useState('');

  // Grading states
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [gradingMarks, setGradingMarks] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [gradeSuccess, setGradeSuccess] = useState('');
  const [gradeError, setGradeError] = useState('');

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState({}); // { studentId: 'Present'/'Absent' }
  const [attendanceSuccess, setAttendanceSuccess] = useState('');
  const [attendanceError, setAttendanceError] = useState('');

  // Announcement states
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [announceSuccess, setAnnounceSuccess] = useState('');
  const [announceError, setAnnounceError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/lecturers/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching lecturer dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await axios.get('/api/lecturers/students');
      setStudents(res.data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchStudents();
  }, []);

  // Fetch materials/assignments when selectedModuleId changes
  useEffect(() => {
    if (!selectedModuleId) {
      setMaterials([]);
      setAssignments([]);
      setSubmissions([]);
      setAttendanceStudents([]);
      return;
    }

    const fetchModuleData = async () => {
      setLoadingResources(true);
      try {
        const matRes = await axios.get(`/api/materials/module/${selectedModuleId}`);
        setMaterials(matRes.data);

        const assignRes = await axios.get(`/api/assignments/module/${selectedModuleId}`);
        setAssignments(assignRes.data);

        // Find enrolled students for this module to load in Attendance
        const moduleDetails = dashboardData?.assignedModules?.find(m => m._id === selectedModuleId);
        if (moduleDetails) {
          // Filter students who are enrolled in this module
          const enrolled = students.filter(student => 
            student.modules.some(mod => mod._id === selectedModuleId)
          );
          setAttendanceStudents(enrolled);
          
          // Initialise attendance status
          const initialStatuses = {};
          enrolled.forEach(s => {
            initialStatuses[s._id] = 'Present';
          });
          setAttendanceStatuses(initialStatuses);
        }
      } catch (err) {
        console.error('Error fetching module data:', err);
      } finally {
        setLoadingResources(false);
      }
    };

    fetchModuleData();
  }, [selectedModuleId, students, dashboardData]);

  // Load submissions for selected assignment
  const handleLoadSubmissions = async (assignmentId) => {
    try {
      const res = await axios.get(`/api/submissions/assignment/${assignmentId}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error('Error loading submissions:', err);
    }
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) {
      setNoteError('Please select a module first');
      return;
    }

    const formData = new FormData();
    formData.append('moduleId', selectedModuleId);
    formData.append('title', noteTitle);
    formData.append('description', noteDesc);
    formData.append('type', noteType);
    if (noteFile) formData.append('file', noteFile);
    if (noteUrl) formData.append('resourceUrl', noteUrl);

    try {
      const res = await axios.post('/api/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNoteSuccess('Lecture material uploaded successfully!');
      setNoteTitle('');
      setNoteDesc('');
      setNoteFile(null);
      setNoteUrl('');
      // Reload materials list
      const matRes = await axios.get(`/api/materials/module/${selectedModuleId}`);
      setMaterials(matRes.data);
      fetchDashboard();
    } catch (err) {
      setNoteError(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) {
      setAssignError('Please select a module first');
      return;
    }

    try {
      await axios.post('/api/assignments', {
        moduleId: selectedModuleId,
        title: assignTitle,
        description: assignDesc,
        deadline: assignDeadline,
        maximumMarks: assignMaxMarks
      });
      setAssignSuccess('Assignment created successfully!');
      setAssignTitle('');
      setAssignDesc('');
      setAssignDeadline('');
      setAssignMaxMarks(100);
      // Reload assignments list
      const assignRes = await axios.get(`/api/assignments/module/${selectedModuleId}`);
      setAssignments(assignRes.data);
      fetchDashboard();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmissionId) return;

    try {
      await axios.put(`/api/submissions/${selectedSubmissionId}/grade`, {
        marks: parseFloat(gradingMarks),
        feedback: gradingFeedback
      });
      setGradeSuccess('Submission graded successfully!');
      setGradingMarks('');
      setGradingFeedback('');
      setSelectedSubmissionId('');
      
      // Reload submissions for active assignment
      const activeAssign = submissions[0]?.assignment;
      if (activeAssign) {
        handleLoadSubmissions(activeAssign);
      }
      fetchDashboard();
    } catch (err) {
      setGradeError(err.response?.data?.message || 'Grading failed');
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceStatuses({
      ...attendanceStatuses,
      [studentId]: status
    });
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) return;

    const records = Object.keys(attendanceStatuses).map(studentId => ({
      studentId,
      status: attendanceStatuses[studentId]
    }));

    try {
      await axios.post('/api/attendance', {
        moduleId: selectedModuleId,
        date: attendanceDate,
        records
      });
      setAttendanceSuccess('Attendance register updated successfully!');
      fetchDashboard();
    } catch (err) {
      setAttendanceError(err.response?.data?.message || 'Submission failed');
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      // Announce is standard notification with recipient null, role 'student'
      await axios.post('/api/notifications', {
        title: 'New Announcement: ' + announceTitle,
        message: announceMessage,
        targetRole: 'student',
        type: 'announcement'
      });
      setAnnounceSuccess('Announcement posted to all students!');
      setAnnounceTitle('');
      setAnnounceMessage('');
      fetchDashboard();
    } catch (err) {
      setAnnounceError('Failed to post announcement');
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await axios.delete(`/api/materials/${id}`);
      setMaterials(materials.filter(m => m._id !== id));
      fetchDashboard();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">AETHERIA LECTURER</div>

          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
            <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user?.name}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{user?.email}</p>
            <span className="badge badge-green">LECTURER</span>
          </div>

          <ul className="nav-links">
            <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <a href="#dashboard" onClick={() => setActiveTab('dashboard')}>
                Dashboard Overview
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'modules' ? 'active' : ''}`}>
              <a href="#modules" onClick={() => setActiveTab('modules')}>
                Assigned Modules
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'materials' ? 'active' : ''}`}>
              <a href="#materials" onClick={() => setActiveTab('materials')}>
                Lecture Notes Upload
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}>
              <a href="#assignments" onClick={() => setActiveTab('assignments')}>
                Assignments Builder
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'grading' ? 'active' : ''}`}>
              <a href="#grading" onClick={() => setActiveTab('grading')}>
                Grading Suite
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}>
              <a href="#attendance" onClick={() => setActiveTab('attendance')}>
                Attendance Registrar
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`}>
              <a href="#announcements" onClick={() => setActiveTab('announcements')}>
                Announcements
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
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Lecturer Portal</h1>
                <p style={{ color: 'var(--text-muted)' }}>Welcome back, Professor {user?.name}</p>
              </div>
            </div>

            {loadingDashboard ? (
              <div style={{ color: 'var(--text-muted)' }}>Loading stats...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Assigned Modules</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0' }}>{dashboardData?.assignedModules?.length || 0}</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Enrolled Students</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--primary)' }}>{dashboardData?.totalStudents || 0}</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Pending Submissions</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: '#f87171' }}>{dashboardData?.pendingSubmissionsCount || 0}</h2>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                  {/* Assigned Modules List */}
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>My Courses</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {dashboardData?.assignedModules?.map(course => (
                        <div key={course._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-glass)', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontWeight: '700' }}>{course.title}</p>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Code: {course.moduleCode} | Department: {course.department}
                            </span>
                          </div>
                          <div>
                            <span className="badge badge-blue">{course.studentsCount} Students</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming deadlines */}
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Upcoming Deadlines</h3>
                    {dashboardData?.upcomingDeadlines?.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>No deadlines set.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {dashboardData?.upcomingDeadlines?.map(dl => (
                          <div key={dl._id} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{dl.title}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Module: {dl.module?.title}</p>
                            <p style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '500' }}>Due: {new Date(dl.deadline).toLocaleDateString()}</p>
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

        {/* ASSIGNED MODULES TAB */}
        {activeTab === 'modules' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Assigned Modules</h1>
            <div className="course-grid">
              {dashboardData?.assignedModules?.map(mod => (
                <div key={mod._id} className="course-card glass-panel" style={{ padding: '1.5rem' }}>
                  <span className="badge badge-green" style={{ width: 'fit-content', marginBottom: '1rem' }}>
                    {mod.department}
                  </span>
                  <h3 className="course-title">{mod.title} ({mod.moduleCode})</h3>
                  <p className="course-desc">This module is assigned to you. You can publish notes, assignments, record student attendance, and grade submissions.</p>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👨‍🎓 {mod.studentsCount} Students Enrolled</span>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => { setSelectedModuleId(mod._id); setActiveTab('materials'); }}>
                      Manage Module
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* LECTURE NOTES TAB */}
        {activeTab === 'materials' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Manage Lecture Materials</h1>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '500px' }}>
              <label className="form-label">Active Module</label>
              <select
                className="form-input"
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                style={{ background: '#111827' }}
              >
                <option value="">-- Choose Module --</option>
                {dashboardData?.assignedModules?.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.moduleCode})
                  </option>
                ))}
              </select>
            </div>

            {selectedModuleId && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                {/* Upload Form */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Upload New Material</h3>
                  {noteSuccess && <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{noteSuccess}</p>}
                  {noteError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{noteError}</p>}
                  
                  <form onSubmit={handleMaterialUpload}>
                    <div className="form-group">
                      <label className="form-label">Material Title</label>
                      <input type="text" className="form-input" placeholder="e.g. Lecture 1: Intro to MERN" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-input" placeholder="Summarize content..." rows="2" value={noteDesc} onChange={(e) => setNoteDesc(e.target.value)}></textarea>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-input" value={noteType} onChange={(e) => setNoteType(e.target.value)} style={{ background: '#111827' }}>
                        <option value="pdf">PDF Document</option>
                        <option value="ppt">PowerPoint Presentation</option>
                        <option value="docx">Word File</option>
                        <option value="video">MP4 Video Note</option>
                        <option value="link">External Website Link</option>
                      </select>
                    </div>

                    {noteType === 'link' ? (
                      <div className="form-group">
                        <label className="form-label">Resource URL</label>
                        <input type="url" className="form-input" placeholder="https://example.com/slide" value={noteUrl} onChange={(e) => setNoteUrl(e.target.value)} required />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">Choose Document File</label>
                        <input type="file" className="form-input" onChange={(e) => setNoteFile(e.target.files[0])} required />
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                      Publish Material
                    </button>
                  </form>
                </div>

                {/* Materials List */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Current Materials</h3>
                  {loadingResources ? (
                    <p>Loading...</p>
                  ) : materials.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No resources uploaded for this module yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', maxHeight: '450px', overflowY: 'auto' }}>
                      {materials.map(mat => (
                        <div key={mat._id} className="mini-glass" style={{ padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>{mat.title}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mat.description}</p>
                            <span className="badge badge-blue" style={{ marginTop: '0.25rem', display: 'inline-block' }}>{mat.type.toUpperCase()}</span>
                          </div>
                          <button className="btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDeleteMaterial(mat._id)}>
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ASSIGNMENT BUILDER TAB */}
        {activeTab === 'assignments' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Assignments Builder</h1>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '500px' }}>
              <label className="form-label">Active Module</label>
              <select
                className="form-input"
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                style={{ background: '#111827' }}
              >
                <option value="">-- Choose Module --</option>
                {dashboardData?.assignedModules?.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.moduleCode})
                  </option>
                ))}
              </select>
            </div>

            {selectedModuleId && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                {/* Create Form */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Create Assignment</h3>
                  {assignSuccess && <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{assignSuccess}</p>}
                  {assignError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{assignError}</p>}
                  
                  <form onSubmit={handleCreateAssignment}>
                    <div className="form-group">
                      <label className="form-label">Assignment Title</label>
                      <input type="text" className="form-input" placeholder="e.g. Assignment 1: React Components" value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Requirements Description</label>
                      <textarea className="form-input" placeholder="Enter assignment instructions..." rows="3" value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} required></textarea>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Deadline Date & Time</label>
                      <input type="datetime-local" className="form-input" value={assignDeadline} onChange={(e) => setAssignDeadline(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Maximum Scoring Marks</label>
                      <input type="number" className="form-input" value={assignMaxMarks} onChange={(e) => setAssignMaxMarks(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                      Publish Assignment
                    </button>
                  </form>
                </div>

                {/* Assignment List */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Active Assignments</h3>
                  {loadingResources ? (
                    <p>Loading...</p>
                  ) : assignments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No assignments registered yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', maxHeight: '450px', overflowY: 'auto' }}>
                      {assignments.map(ass => (
                        <div key={ass._id} className="mini-glass" style={{ padding: '1.25rem', borderRadius: '8px' }}>
                          <h4 style={{ fontWeight: '700' }}>{ass.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>{ass.description}</p>
                          <p style={{ fontSize: '0.8rem' }}>Deadline: {new Date(ass.deadline).toLocaleString()}</p>
                          <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Max Marks: {ass.maximumMarks}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* GRADING SUITE TAB */}
        {activeTab === 'grading' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Grading Suite</h1>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '500px' }}>
              <label className="form-label">Select Module</label>
              <select
                className="form-input"
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                style={{ background: '#111827' }}
              >
                <option value="">-- Choose Module --</option>
                {dashboardData?.assignedModules?.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.moduleCode})
                  </option>
                ))}
              </select>
            </div>

            {selectedModuleId && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                {/* Submissions list */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Submissions</h3>
                  <div className="form-group">
                    <label className="form-label">Choose Assignment</label>
                    <select className="form-input" style={{ background: '#111827' }} onChange={(e) => handleLoadSubmissions(e.target.value)}>
                      <option value="">-- Select --</option>
                      {assignments.map(ass => (
                        <option key={ass._id} value={ass._id}>{ass.title}</option>
                      ))}
                    </select>
                  </div>

                  {submissions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No submissions found for this assignment.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                      {submissions.map(sub => (
                        <div key={sub._id} className="mini-glass" style={{ padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontWeight: '700' }}>{sub.student?.name} ({sub.student?.studentId || 'N/A'})</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                            <span className={`badge ${sub.status === 'Graded' ? 'badge-green' : 'badge-blue'}`}>{sub.status}</span>
                            {sub.status === 'Graded' && <p style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '0.25rem' }}>Grade: {sub.marks}</p>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <a href={axios.defaults.baseURL ? `${axios.defaults.baseURL}${sub.fileUrl}` : sub.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                              Download Doc
                            </a>
                            <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setSelectedSubmissionId(sub._id); setGradingMarks(sub.marks || ''); setGradingFeedback(sub.feedback || ''); }}>
                              Grade Doc
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grading Panel */}
                {selectedSubmissionId && (
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Grade Submission</h3>
                    {gradeSuccess && <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{gradeSuccess}</p>}
                    {gradeError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{gradeError}</p>}
                    
                    <form onSubmit={handleGradeSubmit}>
                      <div className="form-group">
                        <label className="form-label">Awarded Marks</label>
                        <input type="number" className="form-input" placeholder="e.g. 85" value={gradingMarks} onChange={(e) => setGradingMarks(e.target.value)} required />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Evaluative Feedback</label>
                        <textarea className="form-input" placeholder="Leave descriptive comments..." rows="4" value={gradingFeedback} onChange={(e) => setGradingFeedback(e.target.value)}></textarea>
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Save Grade & Alert Student
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ATTENDANCE REGISTRAR TAB */}
        {activeTab === 'attendance' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Attendance Registrar</h1>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '500px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Module ID</label>
                  <select className="form-input" value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} style={{ background: '#111827' }}>
                    <option value="">-- Choose Module --</option>
                    {dashboardData?.assignedModules?.map(m => (
                      <option key={m._id} value={m._id}>{m.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Lecture Date</label>
                  <input type="date" className="form-input" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                </div>
              </div>
            </div>

            {selectedModuleId && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Class Enrollment Attendance</h3>
                
                {attendanceSuccess && <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{attendanceSuccess}</p>}
                {attendanceError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{attendanceError}</p>}

                {attendanceStudents.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No students enrolled in this module catalog.</p>
                ) : (
                  <form onSubmit={handleAttendanceSubmit}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '2rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem 0.5rem' }}>Student ID</th>
                          <th style={{ padding: '1rem 0.5rem' }}>Student Name</th>
                          <th style={{ padding: '1rem 0.5rem' }}>Email</th>
                          <th style={{ padding: '1rem 0.5rem' }}>Register Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceStudents.map(student => (
                          <tr key={student._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                            <td style={{ padding: '1rem 0.5rem' }}>{student.studentId}</td>
                            <td style={{ padding: '1rem 0.5rem' }}>{student.name}</td>
                            <td style={{ padding: '1rem 0.5rem' }}>{student.email}</td>
                            <td style={{ padding: '1rem 0.5rem' }}>
                              <select className="form-input" style={{ width: '150px', background: '#111827' }} value={attendanceStatuses[student._id] || 'Present'} onChange={(e) => handleAttendanceChange(student._id, e.target.value)}>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <button type="submit" className="btn btn-primary">
                      Submit Attendance Register
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Post Announcements</h1>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '700px' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Broadcast Announcement</h3>
              
              {announceSuccess && <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{announceSuccess}</p>}
              {announceError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{announceError}</p>}

              <form onSubmit={handleAnnouncementSubmit}>
                <div className="form-group">
                  <label className="form-label">Subject Title</label>
                  <input type="text" className="form-input" placeholder="e.g. Schedule Change: Lecture 3 rescheduled" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Announcement Content Message</label>
                  <textarea className="form-input" placeholder="Enter broadcast message details..." rows="5" value={announceMessage} onChange={(e) => setAnnounceMessage(e.target.value)} required></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  Broadcast to all Enrolled Students
                </button>
              </form>
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
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Professor {user?.name}</p>
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.email}</p>
                </div>
                <div>
                  <label className="form-label">Lecturer ID</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.lecturerId || 'LECTURER-' + user?._id?.slice(-5).toUpperCase()}</p>
                </div>
                <div>
                  <label className="form-label">Authorized Role Badge</label>
                  <div>
                    <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                      LECTURER
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

export default LecturerPortal;
