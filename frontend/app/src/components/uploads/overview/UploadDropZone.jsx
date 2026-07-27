import { UploadCloud, PlaySquare } from 'lucide-react'

export default function UploadDropZone({ onFilesSelected, disabled, onSelectChannelRequest, isUploading, uploadProgress }) {
  
  const handleBrowseFiles = async (e) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    if (window.pywebview && window.pywebview.api) {
      const paths = await window.pywebview.api.select_files();
      if (paths && paths.length > 0 && onFilesSelected) {
        onFilesSelected(paths);
      }
    } else {
      console.error("PyWebView API not available.");
    }
  }

  const handleBrowseFolder = async (e) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    if (window.pywebview && window.pywebview.api) {
      const folderPath = await window.pywebview.api.select_folder();
      if (folderPath && onFilesSelected) {
        onFilesSelected([folderPath]); // Pass as array of paths
      }
    } else {
      console.error("PyWebView API not available.");
    }
  }

  return (
    <div 
      className={`relative w-full flex-1 rounded-[24px] flex flex-col items-center justify-center transition-all duration-500 overflow-hidden min-h-[260px] ${
        disabled
          ? 'bg-[#05080e]/40 border-2 border-dashed border-white/[0.05] opacity-40 cursor-not-allowed'
          : 'bg-[#05080e]/40 backdrop-blur-xl border-2 border-dashed border-white/[0.1] hover:bg-[#080d16]/60 hover:border-[var(--accent-500)]/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
      }`}
    >
      {disabled ? (
        <div className="flex flex-col items-center text-center z-10 px-8 animate-in fade-in duration-300">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/20 mb-5">
            <PlaySquare size={32} strokeWidth={2} />
          </div>
          <h3 className="text-[18px] font-bold tracking-wide text-white/50">
            Please select a destination channel first
          </h3>
          <p className="text-[13px] font-medium mt-1.5 mb-5 max-w-sm text-white/30">
            Choose where your videos will be uploaded before importing any files.
          </p>
          <button 
            onClick={(e) => { e.stopPropagation(); onSelectChannelRequest && onSelectChannelRequest(); }}
            className="px-6 py-2.5 rounded-xl font-semibold text-[13px] transition-all bg-white/[0.05] border border-white/[0.1] text-white/80 hover:bg-white/[0.1] hover:text-white"
          >
            Select Channel
          </button>
        </div>
      ) : isUploading ? (
        <div className="flex flex-col items-center text-center z-10 w-full px-8 animate-in zoom-in-95 duration-500">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-[var(--accent-500)]/20 text-[var(--accent-400)] shadow-[0_0_30px_rgba(34,211,238,0.4)] mb-5">
            <UploadCloud size={32} strokeWidth={2} className="animate-bounce" />
          </div>
          <h3 className="text-[18px] font-bold tracking-wide text-[var(--accent-400)] drop-shadow-md mb-2">
            Importing... {uploadProgress}%
          </h3>
          <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
             <div className="h-full bg-[var(--accent-400)] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center z-10 px-8 animate-in zoom-in-95 duration-500">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 mb-5 relative z-10 bg-white/[0.03] text-white/30 border border-white/[0.05] group-hover:bg-[var(--accent-500)]/10 group-hover:text-[var(--accent-400)] group-hover:border-[var(--accent-500)]/20 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] group-hover:-translate-y-1">
            <UploadCloud size={32} strokeWidth={2} className="transition-transform" />
          </div>
          <h3 className="text-[18px] font-bold tracking-wide transition-colors duration-300 text-white">
            Select your videos
          </h3>
          <p className="text-[13px] font-medium mt-1.5 mb-5 max-w-xs text-white/50 transition-colors">
            Supports MP4, MOV, and MKV. Large batches are better handled via Watch Folder.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleBrowseFiles}
              className="px-6 py-2.5 rounded-xl font-semibold text-[13px] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)] bg-white/[0.05] border border-white/[0.1] text-white hover:bg-gradient-to-b hover:from-cyan-400/20 hover:to-cyan-500/20 hover:border-[var(--accent-500)]/40 hover:text-[var(--accent-400)] hover:shadow-[0_0_15px_var(--color-primary-cyan)]"
            >
              Browse Files
            </button>
            <button 
              onClick={handleBrowseFolder}
              className="px-6 py-2.5 rounded-xl font-semibold text-[13px] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)] bg-white/[0.05] border border-white/[0.1] text-white hover:bg-gradient-to-b hover:from-cyan-400/20 hover:to-cyan-500/20 hover:border-[var(--accent-500)]/40 hover:text-[var(--accent-400)] hover:shadow-[0_0_15px_var(--color-primary-cyan)]"
            >
              Browse Folder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
