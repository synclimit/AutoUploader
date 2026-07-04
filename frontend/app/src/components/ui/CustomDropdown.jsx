import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

export default function CustomDropdown({ options, value, onChange, placeholder = 'Select option...', searchable = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => String(o.value) === String(value))
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] bg-[#05080e] border ${isOpen ? 'border-[var(--accent-500)]' : 'border-white/[0.08]'} rounded-[10px] px-3 flex items-center justify-between cursor-pointer transition-colors`}
      >
        <span className={`text-[13px] ${selectedOption ? 'text-white' : 'text-white/40'} truncate`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#0d121c] border border-white/[0.08] rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {searchable && (
            <div className="p-2 border-b border-white/[0.04]">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input 
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full h-[32px] bg-white/[0.02] border border-transparent rounded-[6px] pl-8 pr-3 text-[12px] text-white outline-none focus:border-[var(--accent-500)]/50 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-white/40 text-center">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-[6px] cursor-pointer text-[13px] transition-colors ${
                    String(value) === String(opt.value) ? 'bg-[var(--accent-500)]/10 text-[var(--accent-400)] font-bold' : 'text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {String(value) === String(opt.value) && <Check size={14} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
