export default function PreferencesShell({ children }) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#05080e] overflow-hidden relative">
      {/* Aurora Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden h-full">
        {children}
      </div>
    </div>
  )
}
