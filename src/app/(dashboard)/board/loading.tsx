export default function BoardLoading() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-48 bg-accent-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-accent-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-48 bg-accent-200 rounded animate-pulse" />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex gap-4 h-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 lg:w-80 flex flex-col shrink-0">
              <div className="h-10 bg-accent-300 rounded-t-lg animate-pulse" />
              <div className="flex-1 bg-accent-100 rounded-b-lg p-2 space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-24 bg-white rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
