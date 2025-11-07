import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiInfo } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import './InfoTooltip.css';

const InfoTooltip = ({ 
  content, 
  icon = <FiInfo />, 
  position = 'top',
  className = '',
  size = 'small',
  usePortal = false  // Add prop to control portal usage
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [needsPortal, setNeedsPortal] = useState(usePortal);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const openTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkIfNeedsPortal = () => {
    if (!triggerRef.current || usePortal) return usePortal;
    
    // Check if any parent has overflow hidden
    let parent = triggerRef.current.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden') {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  };

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;

    // Get actual tooltip dimensions if available, otherwise use estimates
    let tooltipWidth = isMobile ? 220 : 250;
    let tooltipHeight = isMobile ? 80 : 60; // Better mobile estimate
    
    // If tooltip is already rendered, get actual dimensions
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      tooltipWidth = tooltipRect.width || tooltipWidth;
      tooltipHeight = tooltipRect.height || tooltipHeight;
    }
    
    const gap = isMobile ? 12 : 8; // Larger gap on mobile

    if (needsPortal) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = isMobile ? 16 : 10; // Larger margin on mobile
      
      // Smart positioning for mobile - always use bottom or top
      let preferredPosition = position;
      if (isMobile) {
        // On mobile, prefer bottom unless there's no space
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const requiredSpace = tooltipHeight + gap + margin;
        
        if (spaceBelow >= requiredSpace) {
          preferredPosition = 'bottom';
        } else if (spaceAbove >= requiredSpace) {
          preferredPosition = 'top';
        } else {
          // If neither has enough space, choose the one with more space
          preferredPosition = spaceBelow > spaceAbove ? 'bottom' : 'top';
        }
      }
      
      // Portal positioning - fixed coordinates (viewport-relative)
      switch (preferredPosition) {
        case 'top':
          top = rect.top - tooltipHeight - gap;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case 'bottom':
          top = rect.bottom + gap;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case 'left':
          if (!isMobile) { // Avoid left/right on mobile
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - gap;
          } else {
            // Fallback to bottom on mobile
            top = rect.bottom + gap;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          }
          break;
        case 'right':
          if (!isMobile) { // Avoid left/right on mobile
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + gap;
          } else {
            // Fallback to bottom on mobile
            top = rect.bottom + gap;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          }
          break;
      }

      // Keep within viewport bounds with better mobile handling
      left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin));
      top = Math.max(margin, Math.min(top, viewportHeight - tooltipHeight - margin));

      setTooltipPosition({ top, left });
    }
  }, [position, isMobile, needsPortal]);

  const handleShow = useCallback(() => {
    // Clear hide timeout if present
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    const showNow = () => {
      const shouldUsePortal = checkIfNeedsPortal();
      setNeedsPortal(shouldUsePortal);
      setIsVisible(true);

      if (shouldUsePortal) {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      }
    };

    if (isMobile) {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = setTimeout(showNow, 160); // 150–200ms open delay
    } else {
      showNow();
    }
  }, [calculatePosition, isMobile]);

  const handleHide = useCallback(() => {
    // Cancel pending open
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }

    if (isMobile) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 180); // 150–200ms close delay
    } else {
      setIsVisible(false);
    }
  }, [isMobile]);

  const handleClick = useCallback(() => {
    if (isVisible) {
      handleHide();
    } else {
      handleShow();
    }
  }, [isVisible, handleShow, handleHide]);

  // Keep tooltip open when moving between trigger and tooltip on desktop
  const handleMouseLeaveTrigger = useCallback((event) => {
    if (isMobile) return;
    const nextElement = event.relatedTarget;
    if (tooltipRef.current && nextElement && nextElement instanceof Node && tooltipRef.current.contains(nextElement)) {
      return;
    }
    handleHide();
  }, [isMobile, handleHide]);

  const handleMouseLeaveTooltip = useCallback((event) => {
    if (isMobile) return;
    const nextElement = event.relatedTarget;
    if (triggerRef.current && nextElement && nextElement instanceof Node && triggerRef.current.contains(nextElement)) {
      return;
    }
    handleHide();
  }, [isMobile, handleHide]);

  // Handle outside taps/clicks to close tooltip on mobile (but not when interacting with the tooltip itself)
  useEffect(() => {
    if (!isVisible || !isMobile) return;
    
    const handleOutsideClick = (event) => {
      const clickedInsideTrigger = triggerRef.current && event.target instanceof Node && triggerRef.current.contains(event.target);
      const clickedInsideTooltip = tooltipRef.current && event.target instanceof Node && tooltipRef.current.contains(event.target);
      if (!clickedInsideTrigger && !clickedInsideTooltip) {
        setIsVisible(false);
      }
    };
    
    // Add a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('click', handleOutsideClick);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isVisible, isMobile]);

  useEffect(() => {
    if (isVisible && needsPortal) {
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);
      
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [isVisible, needsPortal, calculatePosition]);

  // Recalculate position when tooltip becomes visible and has rendered
  useEffect(() => {
    if (isVisible && needsPortal && tooltipRef.current) {
      // Small delay to ensure tooltip is fully rendered
      const timer = setTimeout(() => {
        calculatePosition();
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, needsPortal, calculatePosition]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <div className={`tooltip-wrapper ${className}`}>
      <Button
        ref={triggerRef}
        variant="ghost"
        className={`tooltip-trigger ${size} ${isMobile ? 'mobile' : ''} gap-2`}
        onMouseEnter={!isMobile ? handleShow : undefined}
        onMouseLeave={!isMobile ? handleMouseLeaveTrigger : undefined}
        onClick={!isMobile ? handleClick : undefined}
        onTouchStart={isMobile ? (e) => { e.preventDefault(); handleClick(); } : undefined}
        aria-label="More information"
        aria-expanded={isVisible}
        type="button"
      >
        {icon}
      </Button>
      
      {isVisible && (
        needsPortal ? (
          createPortal(
            <div 
              className="tooltip-portal"
              style={{
                position: 'fixed',
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                zIndex: 9999
              }}
            >
              <div
                ref={tooltipRef}
                className="tooltip-content-portal"
                onMouseLeave={!isMobile ? handleMouseLeaveTooltip : undefined}
              >
                {content}
              </div>
            </div>,
            document.body
          )
        ) : (
          <div
            ref={tooltipRef}
            className={`tooltip-content tooltip-${position}`}
            onMouseLeave={!isMobile ? handleMouseLeaveTooltip : undefined}
          >
            {content}
          </div>
        )
      )}
    </div>
  );
};

export default InfoTooltip;