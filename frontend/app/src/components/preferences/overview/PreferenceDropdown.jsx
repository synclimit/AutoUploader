import Select from '../../common/Select'

export default function PreferenceDropdown({ label, description, value, options, onChange }) {
  // Convert options to match Select component format
  const selectOptions = options.map(opt => ({
    val: opt.value,
    label: opt.label
  }));

  return (
    <div className="py-3 flex items-center justify-between group">
      
      <div className="flex flex-col gap-0.5 pr-8">
        <span className="text-[14px] font-bold text-white/90 tracking-wide">
          {label}
        </span>
        {description && (
          <span className="text-[12px] text-white/40 leading-snug">
            {description}
          </span>
        )}
      </div>

      <div className="relative shrink-0 w-[220px]">
        <Select 
          value={value} 
          onChange={onChange}
          options={selectOptions}
          className="w-full"
        />
      </div>

    </div>
  )
}
