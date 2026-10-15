export default function PreferencesShell({ children }) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#05080e] overflow-hidden relative">
      {/* Aurora Background Effects (Hardware Accelerated) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(37,99,235,0.06)_0%,transparent_70%)] rounded-full"></div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden h-full">
        {children}
      </div>
    </div>
  )
}
