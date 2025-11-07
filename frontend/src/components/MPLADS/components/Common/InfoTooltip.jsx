import { FiInfo } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * InfoTooltip - A wrapper around shadcn's Tooltip component
 *
 * Migrated from custom implementation to use shadcn Tooltip primitives
 * while maintaining backward compatibility with existing API.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.content - The tooltip content to display
 * @param {React.ReactNode} [props.icon=<FiInfo />] - The icon to display in the trigger button
 * @param {string} [props.position='top'] - Position of tooltip ('top', 'bottom', 'left', 'right')
 * @param {string} [props.className=''] - Additional CSS classes for the wrapper
 * @param {string} [props.size='small'] - Size of the trigger button ('small', 'medium', 'large')
 * @param {boolean} [props.usePortal] - Legacy prop, ignored (shadcn uses portal by default)
 */
const InfoTooltip = ({
  content,
  icon = <FiInfo />,
  position = 'top',
  className = '',
  size = 'small',
  usePortal = false  // Legacy prop - shadcn uses portal by default via Radix UI
}) => {
  // Map position prop to shadcn's side prop
  const sideMap = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right'
  };

  const side = sideMap[position] || 'top';

  // Map size to button dimensions
  const sizeClasses = {
    small: 'w-6 h-6 text-sm',
    medium: 'w-7 h-7 text-base',
    large: 'w-8 h-8 text-lg'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.small;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={`inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-110 p-0 ml-1.5 ${sizeClass} ${className}`}
            aria-label="More information"
            type="button"
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[250px] bg-gray-800 text-white border-gray-700 text-sm"
          sideOffset={5}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InfoTooltip;
