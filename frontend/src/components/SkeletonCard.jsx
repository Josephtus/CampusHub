export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-52 bg-gray-200"></div>
      
      {/* Content Skeleton */}
      <div className="p-6 space-y-3">
        <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
        <div className="h-6 bg-gray-300 rounded-lg w-full"></div>
        <div className="h-6 bg-gray-300 rounded-lg w-3/4"></div>
        
        <div className="space-y-2 pt-2">
          <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
        </div>
      </div>
    </div>
  );
}