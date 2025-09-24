export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="h-12 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}