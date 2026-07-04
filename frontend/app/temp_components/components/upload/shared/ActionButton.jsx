export default function ActionButton({ children, variant = 'cyan', className = '', ...props }) {

  const variants = {

    cyan: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20',

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
