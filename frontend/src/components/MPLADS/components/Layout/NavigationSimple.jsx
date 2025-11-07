import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiMap,
  FiDollarSign,
  FiBarChart2,
  FiMessageCircle,
  FiMenu,
  FiX,
  FiMapPin,
  FiUsers
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useFilters } from '../../../../contexts/FilterContext';
import { mpladsAPI } from '../../../../services/api/mplads';
import { formatTermOrdinal, normalizeTerms } from '../../../../utils/lsTerm';
import { Button } from '@/components/ui/button';

const NavigationSimple = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { filters, updateFilter } = useFilters();
  const [availableTerms, setAvailableTerms] = useState([18, 17]);
  const [loadingTerms, setLoadingTerms] = useState(false);

  const navItems = [
    { 
      title: 'Overview', 
      path: '/mplads', 
      icon: <FiHome />,
      description: 'Key metrics and insights',
      category: 'primary'
    },
    { 
      title: 'Find Projects', 
      path: '/mplads/track-area', 
      icon: <FiMap />,
      description: 'Search projects by area',
      category: 'primary'
    },
    { 
      title: 'Browse States', 
      path: '/mplads/states', 
      icon: <FiMapPin />,
      description: 'States & UTs data',
      category: 'secondary'
    },
    { 
      title: 'Browse MPs', 
      path: '/mplads/mps', 
      icon: <FiUsers />,
      description: 'MP performance data',
      category: 'secondary'
    },
    { 
      title: 'Compare', 
      path: '/mplads/compare', 
      icon: <FiBarChart2 />,
      description: 'Side-by-side analysis',
      category: 'secondary'
    },
    { 
      title: 'Feedback', 
      path: '/mplads/report', 
      icon: <FiMessageCircle />,
      description: 'Report issues',
      category: 'utility'
    }
  ];

  const primaryItems = navItems.filter(item => item.category === 'primary');
  const secondaryItems = navItems.filter(item => item.category === 'secondary');
  const utilityItems = navItems.filter(item => item.category === 'utility');

  // Handle responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Fetch available LS terms for selector
  useEffect(() => {
    let mounted = true;
    const LS_KEY = 'mplads_terms';
    const TS_KEY = 'mplads_terms_ts';
    const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

    const fromCache = () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        const ts = Number(localStorage.getItem(TS_KEY) || 0);
        if (!raw) return null;
        if (Date.now() - ts > MAX_AGE_MS) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        return parsed;
      } catch { return null; }
    };

    const toCache = (terms) => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(terms));
        localStorage.setItem(TS_KEY, String(Date.now()));
      } catch { /* ignore */ }
    };

    const loadTerms = async () => {
      const cached = fromCache();
      if (cached && mounted) {
        const normalized = normalizeTerms(cached);
        if (normalized.length) {
          setAvailableTerms(normalized);
          if (!filters.lsTerm) updateFilter('lsTerm', Number(normalized[0]));
        }
      }

      try {
        setLoadingTerms(true);
        const resp = await mpladsAPI.getTerms();
        const normalized = normalizeTerms(resp?.data);
        if (mounted && normalized.length > 0) {
          setAvailableTerms(normalized);
          toCache(normalized);
          if (!filters.lsTerm) updateFilter('lsTerm', Number(normalized[0]));
        }
      } catch {
        // stick to cache/fallback
      } finally {
        if (mounted) setLoadingTerms(false);
      }
    };
    loadTerms();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close menu when clicking escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const isActive = (path) => location.pathname === path;

  // Detect if we are on an individual MP detail page
  const onMPDetail = location.pathname.startsWith('/mplads/mps/') && location.pathname !== '/mplads/mps';

  return (
    <>
      {/* Navigation Bar */}
      <nav style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        borderBottom: '1px solid #e2e8f0',
        minHeight: '64px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 1rem',
          maxWidth: '100%',
          minHeight: '64px'
        }}>
          {/* Logo */}
          <Link to="/mplads" style={{
            textDecoration: 'none',
            color: '#1a1a1a'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #2563eb 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>MPLADS Dashboard</h2>
            <span style={{
              fontSize: '0.75rem',
              color: '#2563eb',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Empowered Indian</span>
          </Link>

          {/* Desktop Menu */}
          <div style={{
            display: !isMobile ? 'flex' : 'none',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  textDecoration: 'none',
                  color: isActive(item.path) ? '#2563eb' : '#4a5568',
                  backgroundColor: isActive(item.path) ? '#eff6ff' : 'transparent',
                  borderRadius: '0.5rem',
                  fontWeight: isActive(item.path) ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            ))}

            {/* Global House + LS Term selectors (hidden on MP detail page) */}
            {!onMPDetail && (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginLeft: '0.75rem',
                  paddingLeft: '0.75rem',
                  borderLeft: '1px solid #e2e8f0'
                }}>
                  <label htmlFor="house-select" style={{ fontSize: '0.8125rem', color: '#4a5568' }}>
                    House
                  </label>
                  <select
                    id="house-select"
                    value={filters.house || 'Lok Sabha'}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateFilter('house', val);
                      if (val === 'Both Houses') {
                        updateFilter('lsTerm', 18);
                      }
                    }}
                    style={{
                      padding: '0.375rem 0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      background: '#ffffff',
                      color: '#1f2937'
                    }}
                  >
                    <option value="Lok Sabha">Lok Sabha</option>
                    <option value="Rajya Sabha">Rajya Sabha</option>
                    <option value="Both Houses">Both Houses</option>
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginLeft: '0.75rem',
                  paddingLeft: '0.75rem',
                  borderLeft: '1px solid #e2e8f0'
                }}>
                  <label htmlFor="ls-term-select" style={{ fontSize: '0.8125rem', color: '#4a5568' }}>
                    LS Term
                  </label>
                  <select
                    id="ls-term-select"
                    value={Number(filters.lsTerm) || 18}
                    onChange={(e) => updateFilter('lsTerm', Number(e.target.value))}
                    disabled={loadingTerms || filters.house === 'Rajya Sabha' || filters.house === 'Both Houses'}
                    style={{
                      padding: '0.375rem 0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      background: '#ffffff',
                      color: '#1f2937'
                    }}
                  >
                    {availableTerms.map((t) => (
                      <option key={String(t)} value={String(t)}>{formatTermOrdinal(t)}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            variant="outline"
            className="gap-2"
            style={{
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              border: '1px solid #bfdbfe',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
              color: '#2563eb',
              fontSize: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #dbeafe 0%, #e2e8f0 100%)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && isMobile && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }}
        />
      )}

      {/* Mobile Menu */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: isOpen ? '0' : '-100%',
          width: '85%',
          maxWidth: '340px',
          height: '100vh',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1001,
          overflowY: 'auto',
          paddingTop: '75px'
        }}>
        {/* Mobile Menu Header */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? '0' : '-100%',
          width: '85%',
          maxWidth: '340px',
          height: '65px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 1002,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2563eb 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>MPLADS</h3>
            <span style={{
              fontSize: '0.625rem',
              color: '#2563eb',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Empowered Indian</span>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            variant="ghost"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            <FiX />
          </Button>
        </div>
        
        <div style={{ padding: '1rem' }}>
          {/* Global House + LS Term selectors (mobile) - hidden on MP detail page */}
          {!onMPDetail && (
            <>
              <div style={{
                margin: '0 0 1rem',
                padding: '0.75rem 1rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>House</div>
                    <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>Choose data source</div>
                  </div>
                  <select
                    value={filters.house || 'Lok Sabha'}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateFilter('house', val);
                      if (val === 'Both Houses') updateFilter('lsTerm', 18);
                    }}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      background: '#ffffff',
                      color: '#1f2937'
                    }}
                  >
                    <option value="Lok Sabha">Lok Sabha</option>
                    <option value="Rajya Sabha">Rajya Sabha</option>
                    <option value="Both Houses">Both Houses</option>
                  </select>
                </div>
              </div>
              <div style={{
                margin: '0 0 1rem',
                padding: '0.75rem 1rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>Lok Sabha Term</div>
                    <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>Affects LS data only</div>
                  </div>
                  <select
                    value={Number(filters.lsTerm) || 18}
                    onChange={(e) => updateFilter('lsTerm', Number(e.target.value))}
                    disabled={loadingTerms || filters.house === 'Rajya Sabha' || filters.house === 'Both Houses'}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      background: '#ffffff',
                      color: '#1f2937'
                    }}
                  >
                    {availableTerms.map((t) => (
                      <option key={String(t)} value={String(t)}>{formatTermOrdinal(t)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Primary Items */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              padding: '0.75rem 1rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#2563eb',
              backgroundColor: '#e6f3ff',
              borderRadius: '0.5rem',
              marginBottom: '0.5rem'
            }}>Quick Access</div>
            {primaryItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  textDecoration: 'none',
                  color: isActive(item.path) ? '#2563eb' : '#4a5568',
                  backgroundColor: isActive(item.path) ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'transparent',
                  background: isActive(item.path) ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'transparent',
                  borderRadius: '0.5rem',
                  fontWeight: isActive(item.path) ? 600 : 400,
                  marginBottom: '0.5rem',
                  transition: 'all 0.2s',
                  border: isActive(item.path) ? '1px solid #bfdbfe' : '1px solid transparent'
                }}
              >
                <span style={{ fontSize: '1.375rem', color: isActive(item.path) ? '#2563eb' : '#6b7280' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>{item.description}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Secondary Items */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              padding: '0.75rem 1rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem',
              marginBottom: '0.5rem'
            }}>Explore</div>
            {secondaryItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  textDecoration: 'none',
                  color: isActive(item.path) ? '#2563eb' : '#4a5568',
                  backgroundColor: isActive(item.path) ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'transparent',
                  background: isActive(item.path) ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'transparent',
                  borderRadius: '0.5rem',
                  fontWeight: isActive(item.path) ? 600 : 400,
                  marginBottom: '0.5rem',
                  transition: 'all 0.2s',
                  border: isActive(item.path) ? '1px solid #bfdbfe' : '1px solid transparent'
                }}
              >
                <span style={{ fontSize: '1.375rem', color: isActive(item.path) ? '#2563eb' : '#6b7280' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>{item.description}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Utility Items */}
          {utilityItems.length > 0 && (
            <div>
              <div style={{
                padding: '0.75rem 1rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                marginBottom: '0.5rem'
              }}>Help</div>
              {utilityItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    textDecoration: 'none',
                    color: isActive(item.path) ? '#2563eb' : '#4a5568',
                    backgroundColor: isActive(item.path) ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'transparent',
                    background: isActive(item.path) ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'transparent',
                    borderRadius: '0.5rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                    marginBottom: '0.5rem',
                    transition: 'all 0.2s',
                    border: isActive(item.path) ? '1px solid #bfdbfe' : '1px solid transparent'
                  }}
                >
                  <span style={{ fontSize: '1.375rem', color: isActive(item.path) ? '#2563eb' : '#6b7280' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Breadcrumb */}
      <nav style={{
        backgroundColor: '#f7fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.75rem 1rem',
        position: 'sticky',
        top: '64px',
        zIndex: 998
      }}>
        <ol style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          fontSize: '0.875rem'
        }}>
          <li>
            <Link to="/" style={{ color: '#4a5568', textDecoration: 'none' }}>Home</Link>
          </li>
          <li style={{ color: '#a0aec0' }}>/</li>
          <li>
            <Link to="/mplads" style={{ color: '#4a5568', textDecoration: 'none' }}>MPLADS</Link>
          </li>
          {location.pathname !== '/mplads' && (
            <>
              <li style={{ color: '#a0aec0' }}>/</li>
              <li style={{ color: '#2c5282', fontWeight: 500 }}>
                {(() => {
                  // Handle specific nested routes for detail pages FIRST
                  if (location.pathname.startsWith('/mplads/mps/') && location.pathname !== '/mplads/mps') {
                    return 'Member';
                  }
                  if (location.pathname.startsWith('/mplads/states/') && location.pathname !== '/mplads/states') {
                    return 'State';
                  }
                  
                  // Then check for navigation item matches
                  const currentItem = navItems.find(item => item.path === location.pathname);
                  return currentItem?.title || 'Page';
                })()}
              </li>
            </>
          )}
        </ol>
      </nav>
    </>
  );
};

export default NavigationSimple;
