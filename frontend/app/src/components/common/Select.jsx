import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export default function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  className = "", 
  disabled = false,
  allowClear = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleClickOutside, true);
      window.addEventListener("resize", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleClickOutside, true);
      window.removeEventListener("resize", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.val) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const dropdownPortal = isOpen ? createPortal(
    <div 
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${dropdownPos.top}px`,
        left: `${dropdownPos.left}px`,
        width: `${dropdownPos.width}px`,
        zIndex: 99999
      }}
      className="max-h-[220px] overflow-y-auto custom-scrollbar 
        bg-[#08101a]/95 backdrop-blur-xl border border-[var(--accent-500)]/30 rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.8)] p-1 animate-in fade-in zoom-in-95 duration-100"
    >
      {allowClear && (
         <div
           className={`px-3 py-2 text-[12px] cursor-pointer transition-colors hover:bg-[var(--accent-500)]/10 text-white/50 hover:text-white rounded-[6px]`}
           onClick={() => {
             onChange("");
             setIsOpen(false);
           }}
         >
           Clear Selection
         </div>
      )}

      {options.map((opt) => {
        const isSelected = String(opt.val) === String(value);
        return (
          <div
            key={opt.val}
            className={`
              px-3 py-2 text-[12px] cursor-pointer transition-all relative rounded-[6px] flex items-center justify-between
              ${isSelected ? 'bg-[var(--accent-500)]/15 text-[var(--accent-400)] font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'text-white/80 hover:bg-[var(--accent-500)]/10 hover:text-white'}
            `}
            onClick={() => {
              onChange(opt.val);
              setIsOpen(false);
            }}
          >
            <span>{opt.label}</span>
            {isSelected && (
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-400)] shadow-[0_0_8px_rgba(34,211,238,0.9)]"></div>
            )}
          </div>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between px-3.5 py-2 rounded-[10px] 
          border border-[var(--accent-500)]/20 bg-[#08101a]/70 backdrop-blur-md
          text-white/90 font-bold text-[12px] transition-all duration-200 neon-interactive select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--accent-500)]/40 hover:bg-[var(--accent-500)]/10 hover:text-[var(--accent-400)] shadow-[0_0_12px_rgba(34,211,238,0.08)]'}
          ${isOpen ? 'border-[var(--accent-400)] bg-[var(--accent-500)]/15 shadow-[0_0_18px_rgba(34,211,238,0.25)] text-[var(--accent-400)] font-extrabold' : ''}
        `}
      >
        <span className="text-[12px] truncate mr-2">{displayLabel}</span>
        <ChevronDown 
          size={14} 
          className={`text-white/50 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--accent-400)]' : ''}`} 
        />
      </div>

      {dropdownPortal}
    </div>
  );
}
