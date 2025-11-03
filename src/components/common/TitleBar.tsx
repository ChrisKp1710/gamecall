export function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      className="h-12 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 flex items-center px-4 select-none shadow-md"
    >
      {/* Logo + App Name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-wide">
            GameCall
          </span>
          <div className="text-white/70 text-[10px] font-medium -mt-0.5">
            Stay Connected
          </div>
        </div>
      </div>
    </div>
  );
}
