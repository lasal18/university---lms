import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AdminPortal = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Lists
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);

  // Create Lecturer Form
  const [lecName, setLecName] = useState('');
  const [lecEmail, setLecEmail] = useState('');
  const [lecPass, setLecPass] = useState('');
  const [lecIdField, setLecIdField] = useState('');
  const [lecSuccess, setLecSuccess] = useState('');
  const [lecError, setLecError] = useState('');

  // Create Module Form
  const [modTitle, setModTitle] = useState('');
  const [modCode, setModCode] = useState('');
  const [modDept, setModDept] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modSuccess, setModSuccess] = useState('');
  const [modError, setModError] = useState('');

  // Assign Lecturer Form
  const [assignModId, setAssignModId] = useState('');
  const [assignLecIds, setAssignLecIds] = useState([]);
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignError, setAssignError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLecturers = async () => {
    try {
      const res = await axios.get('/api/admin/lecturers');
      setLecturers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      const res = await axios.get('/api/attendance/stats');
      setAttendanceReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/payments');
      setPaymentsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchStudents();
    fetchLecturers();
    fetchCourses();
    fetchAttendanceReport();
    fetchPayments();
  }, []);

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/status`);
      alert(res.data.message);
      fetchStudents();
      fetchLecturers();
      fetchDashboardStats();
    } catch (err) {
      alert('Toggle user status failed');
    }
  };

  const handleCreateLecturer = async (e) => {
    e.preventDefault();
    setLecSuccess('');
    setLecError('');
    try {
      await axios.post('/api/admin/lecturers', {
        name: lecName,
        email: lecEmail,
        password: lecPass,
        lecturerId: lecIdField
      });
      setLecSuccess('Lecturer account created successfully!');
      setLecName('');
      setLecEmail('');
      setLecPass('');
      setLecIdField('');
      fetchLecturers();
      fetchDashboardStats();
    } catch (err) {
      setLecError(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    setModSuccess('');
    setModError('');
    try {
      await axios.post('/api/courses', {
        title: modTitle,
        moduleCode: modCode,
        department: modDept,
        description: modDesc
      });
      setModSuccess('Module created successfully!');
      setModTitle('');
      setModCode('');
      setModDept('');
      setModDesc('');
      fetchCourses();
      fetchDashboardStats();
    } catch (err) {
      setModError(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleAssignLecturer = async (e) => {
    e.preventDefault();
    setAssignSuccess('');
    setAssignError('');
    if (!assignModId) {
      setAssignError('Please select a module');
      return;
    }

    try {
      await axios.put(`/api/admin/modules/${assignModId}/assign`, {
        lecturerIds: assignLecIds
      });
      setAssignSuccess('Lecturers assigned to module successfully!');
      setAssignModId('');
      setAssignLecIds([]);
      fetchCourses();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleLecCheckboxChange = (lecId, checked) => {
    if (checked) {
      setAssignLecIds([...assignLecIds, lecId]);
    } else {
      setAssignLecIds(assignLecIds.filter(id => id !== lecId));
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">AETHERIA ADMIN</div>

          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
            <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user?.name}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{user?.email}</p>
            <span className="badge badge-blue">ADMINISTRATOR</span>
          </div>

          <ul className="nav-links">
            <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <a href="#dashboard" onClick={() => setActiveTab('dashboard')}>
                Analytics Dashboard
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'modules' ? 'active' : ''}`}>
              <a href="#modules" onClick={() => setActiveTab('modules')}>
                Manage Modules
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'lecturers' ? 'active' : ''}`}>
              <a href="#lecturers" onClick={() => setActiveTab('lecturers')}>
                Manage Lecturers
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}>
              <a href="#students" onClick={() => setActiveTab('students')}>
                Manage Students
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}>
              <a href="#attendance" onClick={() => { setActiveTab('attendance'); fetchAttendanceReport(); }}>
                Attendance Reports
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}>
              <a href="#payments" onClick={() => { setActiveTab('payments'); fetchPayments(); }}>
                Payment Ledgers
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
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Admin Console</h1>
                <p style={{ color: 'var(--text-muted)' }}>Academic & Operations Control Room</p>
              </div>
            </div>

            {loadingStats ? (
              <div style={{ color: 'var(--text-muted)' }}>Loading analytics...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Students Registered</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0.5rem 0' }}>{stats?.totalStudents || 0}</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Lecturers Registered</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--secondary)' }}>{stats?.totalLecturers || 0}</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Modules</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0.5rem 0' }}>{stats?.totalModules || 0}</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Gross Revenue</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--secondary)' }}>{stats?.totalRevenue || 0} LKR</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Overall Attendance</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--primary)' }}>{stats?.overallAttendancePercent}%</h2>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                  {/* Latest payments list */}
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Finance Transactions</h3>
                    {stats?.recentActivity?.payments?.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>No transactions logs.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.5rem' }}>Student</th>
                            <th style={{ padding: '0.5rem' }}>Reason</th>
                            <th style={{ padding: '0.5rem' }}>Amount</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats?.recentActivity?.payments?.map(pay => (
                            <tr key={pay._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{pay.student?.name}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{pay.module?.title || 'Fee'}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{pay.amount} LKR</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span className={`badge ${pay.status === 'Success' ? 'badge-green' : 'badge-blue'}`}>{pay.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Latest submissions */}
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Assignment Hand-ins</h3>
                    {stats?.recentActivity?.submissions?.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>No coursework uploaded recently.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                        {stats?.recentActivity?.submissions?.map(sub => (
                          <div key={sub._id} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>{sub.student?.name}</strong>
                              <span className="badge badge-blue">{sub.status}</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              Task: {sub.assignment?.title} ({sub.assignment?.module?.title})
                            </p>
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

        {/* MANAGE MODULES TAB */}
        {activeTab === 'modules' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Modules & Courses</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Left Column: List Modules */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Current Academic Modules</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto' }}>
                  {courses.map(course => (
                    <div key={course._id} className="mini-glass" style={{ padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{course.title}</strong>
                        <span className="badge badge-blue">{course.moduleCode}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>Department: {course.department}</p>
                      <p style={{ fontSize: '0.8rem' }}>👤 Primary Lecturer: {course.instructor?.name || 'Unassigned'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Creation & Assign forms */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Create Module Form */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add Module Catalog</h3>
                  {modSuccess && <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{modSuccess}</p>}
                  {modError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{modError}</p>}

                  <form onSubmit={handleCreateModule}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Module Title</label>
                        <input type="text" className="form-input" placeholder="Intro to Software Engineering" value={modTitle} onChange={(e) => setModTitle(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Module Code</label>
                        <input type="text" className="form-input" placeholder="SE-302" value={modCode} onChange={(e) => setModCode(e.target.value)} required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Department / Faculty</label>
                      <input type="text" className="form-input" placeholder="Computing" value={modDept} onChange={(e) => setModDept(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Course Description</label>
                      <textarea className="form-input" placeholder="Course outline details..." rows="2" value={modDesc} onChange={(e) => setModDesc(e.target.value)}></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Module</button>
                  </form>
                </div>

                {/* Assign Lecturer Form */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Assign Lecturer to Course</h3>
                  {assignSuccess && <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{assignSuccess}</p>}
                  {assignError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{assignError}</p>}

                  <form onSubmit={handleAssignLecturer}>
                    <div className="form-group">
                      <label className="form-label">Choose Module</label>
                      <select className="form-input" value={assignModId} onChange={(e) => setAssignModId(e.target.value)} style={{ background: '#111827' }} required>
                        <option value="">-- Choose Module --</option>
                        {courses.map(m => (
                          <option key={m._id} value={m._id}>{m.title} ({m.moduleCode})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Select Lecturers to Assign</label>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-glass)', padding: '0.75rem', borderRadius: '6px' }}>
                        {lecturers.map(lec => (
                          <div key={lec._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <input
                              type="checkbox"
                              id={`assign-lec-${lec._id}`}
                              checked={assignLecIds.includes(lec._id)}
                              onChange={(e) => handleLecCheckboxChange(lec._id, e.target.checked)}
                            />
                            <label htmlFor={`assign-lec-${lec._id}`} style={{ fontSize: '0.85rem' }}>{lec.name}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Assign Faculty</button>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MANAGE LECTURERS TAB */}
        {activeTab === 'lecturers' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Lecturers Directory</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              {/* Directory Listing */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Academic Faculty Directory</h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem' }}>ID</th>
                      <th style={{ padding: '0.5rem' }}>Name</th>
                      <th style={{ padding: '0.5rem' }}>Email</th>
                      <th style={{ padding: '0.5rem' }}>Status</th>
                      <th style={{ padding: '0.5rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturers.map(lec => (
                      <tr key={lec._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '1rem 0.5rem' }}>{lec.lecturerId}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>{lec.name}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>{lec.email}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span className={`badge ${lec.status === 'active' ? 'badge-green' : 'badge-blue'}`} style={{ background: lec.status === 'deactivated' ? 'rgba(239, 68, 68, 0.15)' : '', color: lec.status === 'deactivated' ? '#f87171' : '' }}>
                            {lec.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <button
                            className="btn"
                            style={{ 
                              background: lec.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: lec.status === 'active' ? '#f87171' : '#34d399',
                              border: 'none', padding: '0.3rem 0.6rem', fontSize: '0.75rem' 
                            }}
                            onClick={() => handleToggleUserStatus(lec._id)}
                          >
                            {lec.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Lecturer Account Form */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Register Faculty Member</h3>
                
                {lecSuccess && <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{lecSuccess}</p>}
                {lecError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{lecError}</p>}

                <form onSubmit={handleCreateLecturer}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" placeholder="Dr. Sarah Connor" value={lecName} onChange={(e) => setLecName(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" placeholder="sarah.c@university.edu" value={lecEmail} onChange={(e) => setLecEmail(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Temporary Password</label>
                    <input type="password" className="form-input" placeholder="••••••••" value={lecPass} onChange={(e) => setLecPass(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Faculty Lecturer ID (Optional)</label>
                    <input type="text" className="form-input" placeholder="LEC-9021" value={lecIdField} onChange={(e) => setLecIdField(e.target.value)} />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    Provision Lecturer Credentials
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* MANAGE STUDENTS TAB */}
        {activeTab === 'students' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Students Registry</h1>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Active Enrolled Students</h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>Student ID</th>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>Email</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                    <th style={{ padding: '0.5rem' }}>Registry Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(stud => (
                    <tr key={stud._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '1rem 0.5rem' }}>{stud.studentId || 'N/A'}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{stud.name}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{stud.email}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span className={`badge ${stud.status === 'active' ? 'badge-green' : 'badge-blue'}`} style={{ background: stud.status === 'deactivated' ? 'rgba(239, 68, 68, 0.15)' : '', color: stud.status === 'deactivated' ? '#f87171' : '' }}>
                          {stud.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <button
                          className="btn"
                          style={{ 
                            background: stud.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: stud.status === 'active' ? '#f87171' : '#34d399',
                            border: 'none', padding: '0.3rem 0.6rem', fontSize: '0.75rem' 
                          }}
                          onClick={() => handleToggleUserStatus(stud._id)}
                        >
                          {stud.status === 'active' ? 'Deactivate Portal' : 'Activate Portal'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ATTENDANCE REPORTS TAB */}
        {activeTab === 'attendance' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Attendance Monitoring Room</h1>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Low Attendance Flags (&lt;75% Attendance)</h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>ID</th>
                    <th style={{ padding: '0.5rem' }}>Student Name</th>
                    <th style={{ padding: '0.5rem' }}>Total Lectures</th>
                    <th style={{ padding: '0.5rem' }}>Attended Lectures</th>
                    <th style={{ padding: '0.5rem' }}>Ratio Rate</th>
                    <th style={{ padding: '0.5rem' }}>Status Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceReport.map(report => (
                    <tr key={report.student?._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '1rem 0.5rem' }}>{report.student?.studentId}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{report.student?.name}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{report.totalClasses}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{report.presentClasses}</td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: '700', color: report.percentage < 75 ? '#f87171' : '#34d399' }}>{report.percentage}%</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        {report.percentage < 75 ? (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                            ⚠️ Flagged Low Attendance
                          </span>
                        ) : (
                          <span className="badge badge-green">Satisfactory</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PAYMENT LEDGERS TAB */}
        {activeTab === 'payments' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Payment Register</h1>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Gross Revenue logs</h3>
                <span className="badge badge-green" style={{ fontSize: '1.1rem', padding: '0.5rem 1.5rem' }}>
                  Total Collected: {stats?.totalRevenue || 0} LKR
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>Date</th>
                    <th style={{ padding: '0.5rem' }}>Transaction ID</th>
                    <th style={{ padding: '0.5rem' }}>Student</th>
                    <th style={{ padding: '0.5rem' }}>Details</th>
                    <th style={{ padding: '0.5rem' }}>Amount</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map(pay => (
                    <tr key={pay._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '1rem 0.5rem' }}>{new Date(pay.paidAt || pay.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{pay.transactionId}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{pay.student?.name} ({pay.student?.studentId})</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{pay.paymentType} - {pay.module?.title || 'General'}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{pay.amount} LKR</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span className={`badge ${pay.status === 'Success' ? 'badge-green' : 'badge-blue'}`} style={{ background: pay.status === 'Failed' ? 'rgba(239, 68, 68, 0.15)' : '', color: pay.status === 'Failed' ? '#f87171' : '' }}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <label className="form-label">Authorized Role Badge</label>
                  <div>
                    <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                      ADMINISTRATOR
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

export default AdminPortal;
