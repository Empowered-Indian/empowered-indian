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
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const lastFocusedElement = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
      // Close menu if switching from mobile to desktop
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobileMenuOpen]);

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

  // Group navigation items by category for better organization
  const primaryItems = navItems.filter(item => item.category === 'primary');
  const secondaryItems = navItems.filter(item => item.category === 'secondary');
  const utilityItems = navItems.filter(item => item.category === 'utility');

  const isActive = (path) => {
    // Exact match for the path
    if (location.pathname === path) {
      return true;
    }
    
    // For nested routes, ensure it's not matching parent paths incorrectly
    // Only match if the current path starts with the nav path followed by a slash
    // and there are no other nav items that are a better match
    const allPaths = navItems.map(item => item.path);
    const exactMatches = allPaths.filter(navPath => location.pathname === navPath);
    
    // If there's an exact match, don't highlight parent paths
    if (exactMatches.length > 0) {
      return false;
    }
    
    // Check for nested path match, but exclude parent matches
    if (location.pathname.startsWith(path + '/')) {
      // Make sure this isn't a false positive where a longer path should match instead
      const longerMatches = allPaths.filter(navPath => 
        navPath !== path && 
        navPath.startsWith(path) && 
        location.pathname.startsWith(navPath)
      );
      return longerMatches.length === 0;
    }
    
    return false;
  };

  const handleMenuToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isMobileMenuOpen) {
      lastFocusedElement.current = document.activeElement;
    }
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const closeMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    // Return focus to the toggle button after closing
    setTimeout(() => {
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      } else {
        toggleButtonRef.current?.focus();
      }
    }, 100);
  }, []);

  // Handle keyboard navigation and focus management
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMenu();
        return;
      }

      // Handle tab navigation within mobile menu
      if (isMobileMenuOpen && e.key === 'Tab') {
        const focusableElements = menuRef.current?.querySelectorAll(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements?.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && 
          menuRef.current && 
          !menuRef.current.contains(e.target) && 
          !toggleButtonRef.current?.contains(e.target)) {
        closeMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      
      // Prevent body scroll on mobile
      document.body.style.overflow = 'hidden';
      
      // Focus first menu item after animation
      setTimeout(() => {
        const focusableElements = menuRef.current?.querySelectorAll(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements?.length > 0) {
          focusableElements[0].focus();
        }
      }, 100);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, closeMenu]);

  // Force update menu position when state changes
  useEffect(() => {
    if (menuRef.current && isMobile) {
      if (isMobileMenuOpen) {
        menuRef.current.style.left = '0';
      } else {
        menuRef.current.style.left = '-100%';
      }
    }
  }, [isMobileMenuOpen, isMobile]);

  // Close menu on route change and manage focus
  useEffect(() => {
    if (isMobileMenuOpen) {
      closeMenu();
    }
  }, [location, closeMenu, isMobileMenuOpen]);

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <Link to="/mplads" className="nav-logo">
            <h2>MPLADS Dashboard</h2>
            <span className="nav-tagline">Empowered Indian</span>
          </Link>

          <Button
            ref={toggleButtonRef}
            variant="ghost"
            className="mobile-menu-toggle gap-2"
            onClick={handleMenuToggle}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="navigation-menu"
            aria-haspopup="true"
            type="button"
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </Button>

          {/* Mobile menu backdrop */}
          {isMobile && isMobileMenuOpen && (
            <div 
              className="mobile-menu-backdrop"
              onClick={closeMenu}
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

          <div 
            ref={menuRef}
            id="navigation-menu"
            className={`nav-menu ${isMobileMenuOpen ? 'nav-menu-active' : ''}`}
            role={isMobile ? 'menu' : 'navigation'}
            aria-label="Main navigation"
            aria-orientation={isMobile ? 'vertical' : 'horizontal'}
          >
            {/* Render navigation items with improved grouping */}
            {isMobile ? (
              // Mobile: Show grouped navigation
              <>
                <div className="nav-group nav-group-primary">
                  <div className="nav-group-label">Quick Access</div>
                  {primaryItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                      onClick={closeMenu}
                      aria-current={isActive(item.path) ? 'page' : undefined}
                      role="menuitem"
                    >
                      <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                      <div className="nav-text">
                        <span className="nav-title">{item.title}</span>
                        <span className="nav-description">{item.description}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <div className="nav-group nav-group-secondary">
                  <div className="nav-group-label">Explore</div>
                  {secondaryItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                      onClick={closeMenu}
                      aria-current={isActive(item.path) ? 'page' : undefined}
                      role="menuitem"
                    >
                      <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                      <div className="nav-text">
                        <span className="nav-title">{item.title}</span>
                        <span className="nav-description">{item.description}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {utilityItems.length > 0 && (
                  <div className="nav-group nav-group-utility">
                    <div className="nav-group-label">Help</div>
                    {utilityItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                        onClick={closeMenu}
                        aria-current={isActive(item.path) ? 'page' : undefined}
                        role="menuitem"
                      >
                        <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                        <div className="nav-text">
                          <span className="nav-title">{item.title}</span>
                          <span className="nav-description">{item.description}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Desktop: Show all 5 navigation items
              <>
                {[...primaryItems, ...secondaryItems, ...utilityItems].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                    onClick={closeMenu}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                    tabIndex={0}
                  >
                    <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                    <div className="nav-text">
                      <span className="nav-title">{item.title}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Simplified breadcrumb navigation */}
      <nav className="breadcrumb" aria-label="Breadcrumb navigation">
        <div className="breadcrumb-container">
          <ol className="breadcrumb-list">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            <li className="breadcrumb-separator" aria-hidden="true">/</li>
            <li className="breadcrumb-item">
              <Link to="/mplads">MPLADS</Link>
            </li>
            {location.pathname !== '/mplads' && (
              <>
                <li className="breadcrumb-separator" aria-hidden="true">/</li>
                <li className="breadcrumb-item breadcrumb-current" aria-current="page">
                  {(() => {
                    const currentItem = [...primaryItems, ...secondaryItems, ...utilityItems]
                      .find(item => isActive(item.path));
                    return currentItem?.title || 'Page';
                  })()}
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>
    </>
  );
};

export default Navigation;