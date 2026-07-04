import os
import datetime
import subprocess
import time
import uuid

def generate_exec_id():
    now = datetime.datetime.now()
    return f"EXEC-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:4]}"

def setup_evidence_dirs(exec_id):
    base = os.path.join("evidence", exec_id)
    dirs = [
        base,
        os.path.join(base, "backend"),
        os.path.join(base, "frontend"),
        os.path.join(base, "workflow"),
        os.path.join(base, "database"),
        os.path.join(base, "reports")
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    return base

def main():
    exec_id = generate_exec_id()
    print(f"Starting Execution: {exec_id}")
    evidence_dir = setup_evidence_dirs(exec_id)
    
    # Snapshot DB before
    import shutil
    db_path = "app_v2.db"
    if os.path.exists(db_path):
        shutil.copy2(db_path, os.path.join(evidence_dir, "database", "snapshot_before.db"))
    
    # Run the functional workflow which triggers the UploadEngine
    print("Running workflow...")
    # Using run_step_3.py which sets up Profile -> Watch Folder -> Review -> Queue
    
    result = subprocess.run(
        [r"venv\Scripts\python", "tests/run_step_3.py"],
        capture_output=True,
        text=True
    )
    
    with open(os.path.join(evidence_dir, "workflow", "run_step_3_output.txt"), "w") as f:
        f.write(result.stdout)
        f.write("\nSTDERR:\n")
        f.write(result.stderr)
        
    print("Workflow finished. Collecting backend logs...")
    
    # Snapshot DB after
    if os.path.exists(db_path):
        shutil.copy2(db_path, os.path.join(evidence_dir, "database", "snapshot_after.db"))
        
    print(f"Execution {exec_id} completed. Check evidence folder.")
    
if __name__ == "__main__":
    main()
