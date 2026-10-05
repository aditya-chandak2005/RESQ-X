import subprocess
import sys
import os
import time

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print("================================================================")
    print("  RESQ-X AI Disaster Response Intelligence Platform Launcher")
    print("================================================================")
    print(f"Working Directory: {root_dir}")

    # 1. Initialize Database
    print("\n[1/3] Initializing PostGIS / SQLite Database & Seeding Testbed...")
    python_exe = os.path.join(root_dir, "backend", ".venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    subprocess.run([python_exe, "-m", "backend.app.db.init_db"], cwd=root_dir, check=True)

    # 2. Start FastAPI Backend
    print("\n[2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=root_dir
    )

    # 3. Start Frontend
    print("\n[3/3] Starting Vite Frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=os.path.join(root_dir, "frontend")
    )

    print("\n================================================================")
    print("  RESQ-X is Live!")
    print("  - Command Dashboard: http://localhost:5173")
    print("  - Backend API Docs:  http://127.0.0.1:8000/docs")
    print("================================================================")
    print("Press Ctrl+C to terminate both servers.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down RESQ-X...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
