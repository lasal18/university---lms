import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      {/* Navigation */}
      <header className="landing-header glass-panel">
        <div className="landing-nav-container">
          <div className="landing-logo">AETHERIA LMS</div>
          <nav className="landing-nav">
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#stats" className="nav-link-item">Stats</a>
            <a href="#about" className="nav-link-item">About</a>
          </nav>
          <div className="landing-actions">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" style={{ marginRight: '1rem' }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <span className="badge badge-blue" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            ✨ Introducing Version 2.0
          </span>
          <h1 className="hero-title">
            Empower the Future of <span className="text-gradient">Academic Excellence</span>
          </h1>
          <p className="hero-subtitle">
            A comprehensive, secure, and modern Learning Management System designed to bridge the gap between pedagogy and technology.
          </p>
          <div className="hero-ctas">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg">
                Enter Learning Portal →
              </button>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg" style={{ marginRight: '1rem' }}>
                  Create Student Account
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Instructor Portal
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Interactive Preview */}
        <div className="hero-preview glass-panel">
          <div className="preview-header">
            <div className="preview-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="preview-title">Aetheria Academic Dashboard</div>
          </div>
          <div className="preview-body">
            <div className="preview-sidebar">
              <div className="preview-nav-item active"></div>
              <div className="preview-nav-item"></div>
              <div className="preview-nav-item"></div>
            </div>
            <div className="preview-content">
              <div className="preview-glow"></div>
              <div className="preview-card-grid">
                <div className="preview-card mini-glass">
                  <div className="preview-bar-group">
                    <div className="preview-bar-label"></div>
                    <div className="preview-bar-value" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div className="preview-card mini-glass">
                  <div className="preview-bar-group">
                    <div className="preview-bar-label"></div>
                    <div className="preview-bar-value" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
              <div className="preview-chart mini-glass">
                <div className="chart-line"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Designed for Higher Education</h2>
          <p className="section-subtitle">Everything instructors and students need to collaborate, track progress, and learn efficiently.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon">📚</div>
            <h3 className="feature-card-title">Structured Courseware</h3>
            <p className="feature-card-desc">Publish courses, upload materials, and manage enrollments in a centralized, structured database.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon">📊</div>
            <h3 className="feature-card-title">Analytics & Grading</h3>
            <p className="feature-card-desc">Comprehensive insights on class performance, completion rates, and average scoring metrics.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-card-title">Seamless Experience</h3>
            <p className="feature-card-desc">Real-time interactions powered by Node.js and React, delivering updates with low-latency responsiveness.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <div className="stat-number">15K+</div>
            <div className="stat-label">Active Students</div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-number">480+</div>
            <div className="stat-label">Published Courses</div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-number">98.5%</div>
            <div className="stat-label">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">AETHERIA LMS</div>
            <p className="footer-tagline">Excellence in learning, anywhere.</p>
          </div>
          <div className="footer-links">
            <div className="footer-link-group">
              <h4>Portal</h4>
              <Link to="/login">Sign In</Link>
              <Link to="/register">Create Account</Link>
            </div>
            <div className="footer-link-group">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#stats">Stats</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Aetheria University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
