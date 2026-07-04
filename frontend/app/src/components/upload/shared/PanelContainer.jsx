export default function PanelContainer({ children, className = '' }) {

  return (

    <div className={`bg-[#101722] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col ${className}`}>

      {children}

    </div>

  )

}
