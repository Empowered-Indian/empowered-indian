import { Skeleton } from '@/components/ui/skeleton'

const SkeletonLoader = ({
  type = 'text',
  width = '100%',
  height = '1rem',
  count = 1,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        )

      case 'table':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10 flex-1" />
              ))}
            </div>
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} className="flex gap-2">
                {[1, 2, 3, 4].map(cell => (
                  <Skeleton key={cell} className="h-12 flex-1" />
                ))}
              </div>
            ))}
          </div>
        )

      case 'chart':
        return (
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        )

      case 'stat':
        return (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        )

      case 'list':
        return (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        )

      default:
        return <Skeleton style={{ width, height }} />
    }
  }

  return (
    <div className={className}>
      {count > 1
        ? Array.from({ length: count }).map((_, index) => (
            <div key={index} className="mb-4 last:mb-0">
              {renderSkeleton()}
            </div>
          ))
        : renderSkeleton()}
    </div>
  )
}

export default SkeletonLoader
