import { useEffect } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = true,
  icon = null,
  subtitle = null,
  className = '',
  headerActions = null
}) => {
  const defaultValue = defaultOpen ? 'item-1' : undefined;

  // When opening, trigger a resize so charts reflow from 0-size containers
  useEffect(() => {
    const handleAccordionChange = () => {
      requestAnimationFrame(() => {
        try {
          window.dispatchEvent(new Event('resize'));
        } catch {}
      });
    };

    // Listen for accordion state changes via DOM mutations
    const observer = new MutationObserver(() => {
      handleAccordionChange();
    });

    const accordionElement = document.querySelector(`[data-title="${title}"]`);
    if (accordionElement) {
      observer.observe(accordionElement, {
        attributes: true,
        attributeFilter: ['data-state']
      });
    }

    return () => observer.disconnect();
  }, [title]);

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultValue}
      className={`collapsible-section-accordion ${className}`}
      data-title={title}
    >
      <AccordionItem
        value="item-1"
        className="collapsible-section border-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 overflow-hidden transition-shadow hover:shadow-md"
      >
        <AccordionTrigger
          className="collapsible-header flex justify-between items-center p-6 cursor-pointer user-select-none transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[80px] [&[data-state=open]]:border-b [&[data-state=open]]:border-gray-200 dark:[&[data-state=open]]:border-gray-700 hover:no-underline"
        >
          <div className="flex items-start gap-4 flex-1 py-2">
            {icon && (
              <span className="collapsible-icon text-2xl text-blue-600 dark:text-blue-400 flex items-center justify-center mt-1 flex-shrink-0" aria-hidden="true">
                {icon}
              </span>
            )}
            <div className="flex-1">
              <h3 className="collapsible-title m-0 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              {subtitle && (
                <p className="collapsible-subtitle mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="collapsible-controls flex items-center gap-3 ml-4">
            {headerActions && (
              <div
                className="collapsible-actions flex gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {headerActions}
              </div>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className="collapsible-content overflow-hidden transition-all">
          <div className="collapsible-inner p-6 pt-4 bg-gray-50/50 dark:bg-gray-800/50">
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CollapsibleSection;
