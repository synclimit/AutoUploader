import os
import sys
import re
import json
import time
import zipfile
import tempfile
import platform
import traceback
from datetime import datetime
from typing import List, Dict, Any, Optional

from services.system.path_service import PathService

# Key & Credential Redaction Patterns
REDACTION_PATTERNS = [
    (r'(?i)(api[_-]?key\s*[:=]\s*["\']?)([^"\';\s]+)(["\']?)', r'\1[REDACTED]\3'),
    (r'(?i)(access[_-]?token\s*[:=]\s*["\']?)([^"\';\s]+)(["\']?)', r'\1[REDACTED]\3'),
    (r'(?i)(refresh[_-]?token\s*[:=]\s*["\']?)([^"\';\s]+)(["\']?)', r'\1[REDACTED]\3'),
    (r'(?i)(client[_-]?secret\s*[:=]\s*["\']?)([^"\';\s]+)(["\']?)', r'\1[REDACTED]\3'),
    (r'(?i)(password\s*[:=]\s*["\']?)([^"\';\s]+)(["\']?)', r'\1[REDACTED]\3'),
    (r'AIzaSy[A-Za-z0-9_-]{33}', '[REDACTED_GEMINI_KEY]'),
    (r'Bearer\s+[A-Za-z0-9._~+/-]+=*', 'Bearer [REDACTED_TOKEN]'),
    (r'ya29\.[A-Za-z0-9_-]+', '[REDACTED_OAUTH_TOKEN]')
]

def sanitize_data(data: Any) -> Any:
    """Recursively redacts sensitive credentials from strings, dicts, and lists."""
    if isinstance(data, str):
        result = data
        for pattern, replacement in REDACTION_PATTERNS:
            result = re.sub(pattern, replacement, result)
        return result
    elif isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            key_str = str(k).lower()
            if any(s in key_str for s in ['token', 'secret', 'password', 'api_key', 'apikey', 'credential', 'private']):
                sanitized[k] = '[REDACTED]'
            else:
                sanitized[k] = sanitize_data(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    return data

class DiagnosticService:
    _instance = None

    def __init__(self):
        self.logs_dir = PathService.get_logs_dir()
        self.log_file = os.path.join(self.logs_dir, "diagnostic.jsonl")
        self.summary_file = os.path.join(self.logs_dir, "diagnostic_summary.json")
        self._counter = 100

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DiagnosticService()
        return cls._instance

    def _generate_error_id(self, module: str) -> str:
        self._counter += 1
        clean_module = re.sub(r'[^A-Z]', '', module.upper()) or "SYS"
        ts_code = hex(int(time.time()))[2:].upper()[-4:]
        return f"ERR-{clean_module[:6]}-{ts_code}{self._counter % 100:02d}"

    def log(
        self,
        level: str,
        module: str,
        action: str,
        message: str,
        error_id: Optional[str] = None,
        details: Optional[Any] = None,
        context: Optional[Dict[str, Any]] = None,
        exc_info: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Persists a structured diagnostic log entry."""
        level = level.upper()
        if level not in ["INFO", "DEBUG", "WARNING", "ERROR", "CRITICAL"]:
            level = "INFO"

        if (level in ["ERROR", "CRITICAL"]) and not error_id:
            error_id = self._generate_error_id(module)

        tb_str = None
        if exc_info:
            if isinstance(exc_info, BaseException):
                tb_str = "".join(traceback.format_exception(type(exc_info), exc_info, exc_info.__traceback__))
            elif exc_info is True:
                tb_str = traceback.format_exc()
            elif isinstance(exc_info, str):
                tb_str = exc_info

        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "module": module,
            "action": action,
            "error_id": error_id,
            "message": sanitize_data(message),
            "details": sanitize_data(details) if details else None,
            "context": sanitize_data(context) if context else None,
            "stack_trace": sanitize_data(tb_str) if tb_str else None,
            "process_id": os.getpid()
        }

        # Write line to diagnostic.jsonl safely
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            print("[Diagnostic Log Write Error]", e)

        return entry

    def get_logs(self, limit: int = 200, module: Optional[str] = None, level: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches recent diagnostic logs with filtering."""
        if not os.path.exists(self.log_file):
            return []

        results = []
        try:
            with open(self.log_file, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
                for line in reversed(lines):
                    if not line.strip():
                        continue
                    try:
                        record = json.loads(line)
                        if module and record.get("module", "").lower() != module.lower():
                            continue
                        if level and record.get("level", "").upper() != level.upper():
                            continue
                        if search:
                            search_lower = search.lower()
                            rec_str = json.dumps(record).lower()
                            if search_lower not in rec_str:
                                continue
                        results.append(record)
                        if len(results) >= limit:
                            break
                    except Exception:
                        continue
        except Exception as e:
            print("[Diagnostic Read Error]", e)

        return results

    def get_summary() -> Dict[str, Any]:
        """Builds high level summary metrics for Diagnostic Center."""
        frozen = getattr(sys, 'frozen', False)
        base_dir = sys._MEIPASS if frozen else os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        version_file = os.path.join(base_dir, "version.json")
        
        v_data = {"version": "1.0.0", "build": 0}
        if os.path.exists(version_file):
            try:
                with open(version_file, "r") as f:
                    v_data = json.load(f)
            except Exception:
                pass

        instance = DiagnosticService.get_instance()
        all_logs = instance.get_logs(limit=500)
        
        errors_count = sum(1 for l in all_logs if l.get("level") in ["ERROR", "CRITICAL"])
        warnings_count = sum(1 for l in all_logs if l.get("level") == "WARNING")
        
        return {
            "app_info": {
                "name": "Raynz PitStop",
                "version": f"v{v_data.get('version', '1.0.0')}",
                "build": v_data.get("build", 0),
                "executable_path": sys.executable if frozen else sys.argv[0],
                "installation_path": os.path.dirname(sys.executable) if frozen else base_dir,
                "is_frozen": frozen,
                "python_version": platform.python_version(),
                "os": f"{platform.system()} {platform.release()}",
                "architecture": platform.machine(),
                "appdata_dir": PathService.get_appdata_dir(),
                "logs_dir": PathService.get_logs_dir()
            },
            "metrics": {
                "total_logs": len(all_logs),
                "error_count": errors_count,
                "warning_count": warnings_count,
                "recent_errors": [l for l in all_logs if l.get("level") in ["ERROR", "CRITICAL"]][:10]
            }
        }

    def export_report_zip(self) -> str:
        """Generates a zip report of all diagnostic logs with sensitive data redacted."""
        temp_dir = tempfile.gettempdir()
        ts_filename = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        zip_path = os.path.join(temp_dir, f"RyanPitstop_Diagnostic_{ts_filename}.zip")

        logs = self.get_logs(limit=1000)
        summary = DiagnosticService.get_summary()

        update_logs = [l for l in logs if l.get("module", "").upper() in ["UPDATE", "SYSTEM"]]
        upload_logs = [l for l in logs if l.get("module", "").upper() in ["UPLOAD", "QUEUE"]]
        review_logs = [l for l in logs if l.get("module", "").upper() in ["REVIEW", "CAMPAIGN"]]
        error_logs = [l for l in logs if l.get("level") in ["ERROR", "CRITICAL"]]

        summary_txt = f"""==================================================
RYAN PITSTOP / AUTOUPLOADER DIAGNOSTIC REPORT
Generated At: {datetime.utcnow().isoformat()}Z
==================================================

App Name:         {summary['app_info']['name']}
Version:          {summary['app_info']['version']} (Build {summary['app_info']['build']})
OS:               {summary['app_info']['os']} ({summary['app_info']['architecture']})
Python:           {summary['app_info']['python_version']}
Execution Mode:   {'Frozen Exe' if summary['app_info']['is_frozen'] else 'Development'}
Executable Path:  {summary['app_info']['executable_path']}
Installation Dir: {summary['app_info']['installation_path']}
AppData Dir:      {summary['app_info']['appdata_dir']}

DIAGNOSTIC METRICS:
Total Error Count:   {summary['metrics']['error_count']}
Total Warning Count: {summary['metrics']['warning_count']}

REDACTION STATUS:
All sensitive API keys, OAuth tokens, passwords, and secrets have been redacted with [REDACTED].
"""

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("SUMMARY.txt", summary_txt)
            zf.writestr("SYSTEM_INFO.json", json.dumps(summary["app_info"], indent=2))
            zf.writestr("APP_INFO.json", json.dumps(summary, indent=2))
            zf.writestr("ERROR_LOG.json", json.dumps(sanitize_data(error_logs), indent=2))
            zf.writestr("UPDATE_LOG.json", json.dumps(sanitize_data(update_logs), indent=2))
            zf.writestr("UPLOAD_LOG.json", json.dumps(sanitize_data(upload_logs), indent=2))
            zf.writestr("REVIEW_LOG.json", json.dumps(sanitize_data(review_logs), indent=2))
            zf.writestr("BACKEND_LOG.json", json.dumps(sanitize_data(logs[:500]), indent=2))
            zf.writestr("IPC_LOG.json", json.dumps(sanitize_data([l for l in logs if l.get("module") == "IPC"]), indent=2))
            zf.writestr("REDACTION_REPORT.txt", "Automated Redaction Engine Active.\nPatterns sanitized: API keys, OAuth Tokens, Passwords, Session Secrets.")

            # Include autouploader.log if exists
            autouploader_log = os.path.join(PathService.get_logs_dir(), "autouploader.log")
            if os.path.exists(autouploader_log):
                try:
                    with open(autouploader_log, "r", encoding="utf-8", errors="replace") as f_raw:
                        content = f_raw.read()
                        zf.writestr("autouploader.log", sanitize_data(content))
                except Exception:
                    pass

        return zip_path

# Global instance shortcut
diagnostic_service = DiagnosticService.get_instance()
