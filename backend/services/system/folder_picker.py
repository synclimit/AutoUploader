import sys
import os
import subprocess
import logging

logger = logging.getLogger("folder_picker")

# PowerShell script that uses Windows IFileOpenDialog (Modern File Explorer with FOS_PICKFOLDERS 0x20)
POWERSHELL_MODERN_PICKER_SCRIPT = r"""
$code = @"
using System;
using System.Runtime.InteropServices;

namespace NativeFolderPicker {
    public class FolderBrowser {
        public static string ShowDialog() {
            var dialog = (IFileOpenDialog)new FileOpenDialog();
            dialog.SetOptions(0x20); // FOS_PICKFOLDERS
            dialog.SetTitle("Select Watch Folder");
            if (dialog.Show(IntPtr.Zero) == 0) {
                IShellItem item;
                dialog.GetResult(out item);
                string path;
                item.GetDisplayName(0x80058000, out path); // SIGDN_FILESYSPATH
                return path;
            }
            return null;
        }
    }

    [ComImport, Guid("DC1C5A9C-E88A-4dde-A5A1-60F82A20AEF7")]
    class FileOpenDialog { }

    [ComImport, Guid("42f85136-9db9-441d-b306-0be21d05510d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IFileOpenDialog {
        [PreserveSig] int Show(IntPtr parent);
        void SetFileTypes(); void SetFileTypeIndex(); void GetFileTypeIndex(); void Advise(); void Unadvise();
        void SetOptions(uint fos); void GetOptions(); void SetDefaultFolder(); void SetFolder(); void GetFolder();
        void GetCurrentSelection(); void SetFileName(); void GetFileName(); void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string title);
        void SetOkButtonLabel(); void SetFileNameLabel(); void GetResult(out IShellItem pitem); void AddPlace();
        void SetDefaultExtension(); void Close(); void SetClientGuid(); void ClearClientGuid(); void IsOptionsMode();
    }

    [ComImport, Guid("43826884-730A-4A97-B950-751409CFA722"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IShellItem {
        void BindToHandler(); void GetParent(); void GetDisplayName(uint sigdnName, [MarshalAs(UnmanagedType.LPWStr)] out string ppszName);
        void GetAttributes(); void Compare();
    }
}
"@
Add-Type -TypeDefinition $code
[NativeFolderPicker.FolderBrowser]::ShowDialog()
"""

def open_modern_folder_picker() -> str | None:
    """
    Opens the modern Windows File Explorer Folder Picker dialog (IFileOpenDialog with FOS_PICKFOLDERS).
    Prevents popping up legacy 'SHBrowseForFolder' tree dialogs and eliminates double-triggering.
    """
    if sys.platform != "win32":
        # Fallback for non-Windows platforms
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            res = filedialog.askdirectory(title="Select Watch Folder")
            root.destroy()
            return res if res else None
        except Exception as e:
            logger.error(f"Fallback folder picker error: {e}")
            return None

    # Modern Windows 10/11 File Explorer Folder Picker
    try:
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0 # SW_HIDE

        out = subprocess.check_output(
            ["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", POWERSHELL_MODERN_PICKER_SCRIPT],
            creationflags=0x08000000, # CREATE_NO_WINDOW
            startupinfo=startupinfo,
            timeout=60
        )
        path = out.decode("utf-8", errors="ignore").strip()
        if path and os.path.exists(path):
            return path
    except Exception as e:
        logger.error(f"Modern Windows folder picker error: {e}")

    return None
