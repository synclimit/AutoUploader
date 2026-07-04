export default function ActionButton({ children, variant = 'cyan', className = '', ...props }) {

  const variants = {

    cyan: 'bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/20',

    green: 'bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20',

  }

  return (

    <button

      className={`h-[48px] px-5 rounded-xl text-sm font-bold transition-all ${variants[variant]} ${className}`}

      {...props}

    >

      {children}

    </button>

  )

}
