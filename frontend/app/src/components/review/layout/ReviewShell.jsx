export default function ReviewShell({ children }) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0f1a] relative">
      {/* Aurora Background Effects - Hardware Accelerated (Zero Lag) */}
      <div className="absolute top-0 left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(6,182,212,0.06)_0%,transparent_70%)] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-[10%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(30,58,138,0.08)_0%,transparent_70%)] rounded-full pointer-events-none"></div>
      
      {/* Content wrapper */}
      <div className="flex-1 flex flex-col h-full min-h-0 relative z-10">
        {children}
      </div>
    </div>
  )
}
