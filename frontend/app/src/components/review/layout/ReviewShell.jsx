export default function ReviewShell({ children }) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0f1a] relative">
      {/* Aurora Background Effects - Shared with Home/Import */}
      <div className="absolute top-0 left-[10%] w-[600px] h-[600px] bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-[10%] w-[800px] h-[800px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      {/* Content wrapper */}
      <div className="flex-1 flex flex-col h-full min-h-0 relative z-10">
        {children}
      </div>
    </div>
  )
}
