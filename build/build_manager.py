import os
import sys
import json
import shutil
import platform
import subprocess
from datetime import datetime

BUILD_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(BUILD_DIR)
RELEASE_DIR = os.path.join(BASE_DIR, "release")
LOG_FILE = os.path.join(RELEASE_DIR, "installer.log")

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    if not os.path.exists(RELEASE_DIR):
        os.makedirs(RELEASE_DIR)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def run_command(cmd, cwd=None, exit_on_fail=True):
    log(f"Running command: {cmd}")
    process = subprocess.Popen(cmd, shell=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    for line in iter(process.stdout.readline, ''):
        log(line.strip())
        
    process.stdout.close()
    return_code = process.wait()
    
    if return_code != 0:
        log(f"Command failed with code {return_code}: {cmd}")
        if exit_on_fail:
            sys.exit(return_code)
    return return_code

def check_dependencies():
    log("Checking Dependencies...")
    
    # 1. Python
    if subprocess.call("python --version", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) != 0:
        log("ERROR: Python is not installed or not in PATH.")
        sys.exit(1)
        
    # 2. Node & npm
    if subprocess.call("node --version", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) != 0:
        log("ERROR: Node.js is not installed or not in PATH.")
        sys.exit(1)
    if subprocess.call("npm --version", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) != 0:
        log("ERROR: npm is not installed or not in PATH.")
        sys.exit(1)
        
    # 3. PyInstaller (inside backend venv)
    pyinstaller_path = os.path.join(BASE_DIR, "backend", "venv", "Scripts", "pyinstaller.exe")
    if not os.path.exists(pyinstaller_path) or subprocess.call(f'"{pyinstaller_path}" --version', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) != 0:
        log("ERROR: PyInstaller not found in backend venv. Run: cd ../backend && venv\\Scripts\\pip install pyinstaller")
        sys.exit(1)
        
    # 4. Inno Setup
    inno_path = os.path.expanduser(r"~\AppData\Local\Programs\Inno Setup 6\ISCC.exe")
    if not os.path.exists(inno_path):
        # Fallback to Program Files just in case
        inno_path = r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
        if not os.path.exists(inno_path):
            log(f"ERROR: Inno Setup not found at {inno_path}. Please install Inno Setup 6.")
            sys.exit(1)
        
    log("All dependencies met.")

def generate_version():
    log("Generating Version Info...")
    version_file = os.path.join(BASE_DIR, "version.json")
    if os.path.exists(version_file):
        with open(version_file, "r") as f:
            v_data = json.load(f)
        v_data["build"] = v_data.get("build", 0) + 1
    else:
        v_data = {
            "version": "1.0.0",
            "build": 1,
            "channel": "stable"
        }
    with open(version_file, "w") as f:
        json.dump(v_data, f, indent=2)
        
    # Copy to release folder
    shutil.copy2(version_file, os.path.join(RELEASE_DIR, "version.json"))
    log(f"Version: {v_data['version']} Build: {v_data['build']}")

def generate_build_info():
    log("Generating Build Info...")
    version_file = os.path.join(BASE_DIR, "version.json")
    with open(version_file, "r") as f:
        v_data = json.load(f)
        
    python_v = subprocess.check_output("python --version", shell=True, text=True).strip()
    node_v = subprocess.check_output("node --version", shell=True, text=True).strip()
    
    info = {
        "Version": v_data["version"],
        "Build": v_data["build"],
        "Build Date": datetime.now().isoformat(),
        "Python Version": python_v,
        "Node Version": node_v,
        "Build Machine": platform.node(),
        "Architecture": platform.machine(),
        "Build Mode": "Production (onedir)"
    }
    
    info_file = os.path.join(RELEASE_DIR, "build_info.json")
    with open(info_file, "w") as f:
        json.dump(info, f, indent=2)
    log("Build Info generated.")

def health_check():
    log("Running Health Check...")
    exe_path = os.path.join(BASE_DIR, "backend", "dist", "AutoUploader", "AutoUploader.exe")
    if not os.path.exists(exe_path):
        log("ERROR: AutoUploader.exe not found for health check.")
        sys.exit(1)
        
    # Run the exe with --health-check
    run_command(f'"{exe_path}" --health-check', cwd=os.path.dirname(exe_path))
    log("Health Check Passed.")

def main():
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
        
    log("Starting AutoUploader Build Pipeline")
    check_dependencies()
    
    run_command(os.path.join(BUILD_DIR, "clean_build.bat"))
    run_command(os.path.join(BUILD_DIR, "build_frontend.bat"))
    run_command(os.path.join(BUILD_DIR, "build_backend.bat"))
    
    generate_version()
    
    run_command(os.path.join(BUILD_DIR, "create_installer.bat"))
    
    generate_build_info()
    
    # We copy the raw exe to release/ just in case per Phase 10
    raw_exe_src = os.path.join(BASE_DIR, "backend", "dist", "AutoUploader", "AutoUploader.exe")
    raw_exe_dst = os.path.join(RELEASE_DIR, "AutoUploader.exe")
    if os.path.exists(raw_exe_src):
        shutil.copy2(raw_exe_src, raw_exe_dst)
    
    health_check()
    
    log("Build Pipeline Complete Successfully!")

if __name__ == "__main__":
    main()
