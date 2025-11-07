import { useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import './CollapsibleSection.css';

const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = true,
  icon = null,
  subtitle = null,
  className = '',
  headerActions = null
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const firstOpenRef = useRef(true);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  // When opening, trigger a resize so charts reflow from 0-size containers
  useEffect(() => {
    if (isOpen) {
      // Give CSS a moment to apply layout before dispatch
      const raf = requestAnimationFrame(() => {
        try { window.dispatchEvent(new Event('resize')); } catch {}
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);

  return (
    <div className={`collapsible-section ${className} ${isOpen ? 'open' : 'closed'}`}>
      <div 
        className="collapsible-header"
        onClick={toggleSection}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSection();
          }
        }}
        aria-expanded={isOpen}
        aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="collapsible-title-group">
          {icon && <span className="collapsible-icon" aria-hidden="true">{icon}</span>}
          <div className="collapsible-text">
            <h3 className="collapsible-title">{title}</h3>
            {subtitle && <p className="collapsible-subtitle">{subtitle}</p>}
          </div>
        </div>
        
        <div className="collapsible-controls">
          {headerActions && <div className="collapsible-actions">{headerActions}</div>}
          <Button
            variant="ghost"
            className="collapsible-toggle gap-2"
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
            onClick={(e) => {
              e.stopPropagation();
              toggleSection();
            }}
          >
            {isOpen ? <FiChevronUp /> : <FiChevronDown />}
          </Button>
        </div>
      </div>
      
      <div 
        id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="collapsible-content"
        aria-hidden={!isOpen}
      >
        <div className="collapsible-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
