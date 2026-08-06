import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Form states for creating a course
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDept, setNewDept] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch courses from Backend API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('/api/courses');
        setCourses(res.data);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      const res = await axios.post(`/api/courses/${courseId}/enroll`);
      setCourses(courses.map(course => {
        if (course._id === courseId) {
          return {
            ...course,
            isEnrolled: true,
            studentsEnrolledCount: res.data.studentsEnrolledCount
          };
        }
        return course;
      }));
    } catch (err) {
      console.error('Error enrolling:', err);
      alert(err.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newDept) return;

    try {
      const res = await axios.post('/api/courses', {
        title: newTitle,
        description: newDesc,
        department: newDept
      });
      setCourses([res.data, ...courses]);
      setNewTitle('');
      setNewDesc('');
      setNewDept('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating course:', err);
      alert(err.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">CAMPUS LMS</div>
          
          {/* User info widget */}
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
            <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user?.name || 'Test User'}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{user?.email || 'user@university.edu'}</p>
            <span className={`badge ${user?.role === 'instructor' ? 'badge-green' : 'badge-blue'}`}>
              {user?.role ? user.role.toUpperCase() : 'STUDENT'}
            </span>
          </div>

          <ul className="nav-links">
            <li className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}>
              <a href="#courses" onClick={() => setActiveTab('courses')}>
                Courses
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
        {activeTab === 'courses' ? (
          <>
            <div className="page-header">
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>My Classroom</h1>
                <p style={{ color: 'var(--text-muted)' }}>Welcome back to your academic portal</p>
              </div>
              
              {user?.role === 'instructor' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Course
                </button>
              )}
            </div>

            {/* Course creation modal panel */}
            {showCreateModal && (
              <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    position: 'absolute', right: '1.5rem', top: '1.5rem',
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '1.25rem'
                  }}
                >
                  ✕
                </button>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Launch a New Course</h3>
                <form onSubmit={handleCreateCourse}>
                  <div className="form-group">
                    <label className="form-label">Course Title & Code</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Machine Learning (CS480)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Artificial Intelligence"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-input" 
                      rows="3"
                      placeholder="Summarize course goals, topics covered, and prerequisites..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      style={{ resize: 'vertical' }}
                      required
                    ></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary">Publish Course</button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Grid of Courses */}
            {loadingCourses ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading courses...</div>
            ) : courses.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No courses published yet.
              </div>
            ) : (
              <div className="course-grid">
                {courses.map((course) => (
                  <div key={course._id} className="course-card glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'between' }}>
                    <div>
                      <span className="badge badge-blue" style={{ width: 'fit-content', marginBottom: '1rem' }}>
                        {course.department}
                      </span>
                      <h3 className="course-title">{course.title}</h3>
                      <p className="course-desc">{course.description}</p>
                    </div>
                    
                    <div style={{ marginTop: 'auto' }}>
                      <div className="course-footer" style={{ marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>👤 {course.instructor}</span>
                        <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>
                          🎓 {course.studentsEnrolledCount} enrolled
                        </span>
                      </div>

                      {user?.role === 'student' && (
                        course.isEnrolled ? (
                          <button className="btn btn-secondary" style={{ width: '100%', cursor: 'default' }} disabled>
                            ✓ Enrolled
                          </button>
                        ) : (
                          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleEnroll(course._id)}>
                            Enroll Course
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Account Profile</h1>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.name || 'Test User'}</p>
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user?.email || 'user@university.edu'}</p>
                </div>
                <div>
                  <label className="form-label">Authorized Role Badge</label>
                  <div>
                    <span className={`badge ${user?.role === 'instructor' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                      {user?.role ? user.role.toUpperCase() : 'STUDENT'}
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

export default Dashboard;
