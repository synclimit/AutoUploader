export default function LogsShell({ children }) {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full h-full max-w-6xl">
          {children}
        </div>
      </div>
    </div>
  )
}
