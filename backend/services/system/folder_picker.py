import sys
import os
import logging

logger = logging.getLogger("folder_picker")

def open_modern_folder_picker() -> str | None:
    """
    Opens native Windows folder picker dialog reliably across all Windows environments.
    Guarantees the dialog brings itself to top-most foreground and eliminates freezing.
    """
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        path = filedialog.askdirectory(title="Select Watch Folder")
        root.destroy()
        if path:
            norm_path = os.path.normpath(path)
            if os.path.exists(norm_path):
                return norm_path
    except Exception as e:
        logger.error(f"Tkinter folder picker error: {e}")

    # Fallback for Windows using PowerShell Forms
    if sys.platform == "win32":
        try:
            import subprocess
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = 0
            ps_script = "[System.Reflection.Assembly]::LoadWithPartialName('System.windows.forms') | Out-Null; $b = New-Object System.Windows.Forms.FolderBrowserDialog; $b.Description = 'Select Watch Folder'; if ($b.ShowDialog() -eq 'OK') { $b.SelectedPath }"
            out = subprocess.check_output(
                ["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
                creationflags=0x08000000,
                startupinfo=startupinfo,
                timeout=60
            )
            path = out.decode("utf-8", errors="ignore").strip()
            if path and os.path.exists(path):
                return os.path.normpath(path)
        except Exception as e:
            logger.error(f"PowerShell fallback folder picker error: {e}")

    return None
