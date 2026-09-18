import os
import re
import subprocess
import sys

# Automatically set working directory to project root (one level above scripts/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR) if os.path.basename(SCRIPT_DIR) == "scripts" else SCRIPT_DIR
os.chdir(PROJECT_ROOT)

SECRET_PATTERNS = [
    (r"BEGIN\s+(RSA|OPENSSH|PRIVATE)\s+KEY", "Private Key"),
    (r"ghp_[a-zA-Z0-9]{36}", "GitHub Personal Access Token"),
    (r"sk-ant-api03-[a-zA-Z0-9_\-]{80,}", "Anthropic API Key"),
    (r"eyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}", "JWT Token"),
    (r"(?i)(password|passwd|secret|api_key)\s*[:=]\s*['\"][^'\"]{8,}['\"]", "Hardcoded Secret/Password"),
]

REQUIRED_FILES = ["package.json", "tsconfig.json", "eslint.config.js", ".gitignore"]

def check_required_files():
    print("[1/5] Checking essential files...")
    missing = [f for f in REQUIRED_FILES if not os.path.exists(f)]
    if missing:
        print(f"  ❌ Missing required files: {', '.join(missing)}")
        return False
    print("  ✓ All required project configuration files are present.")
    return True

def check_gitignore():
    print("\n[2/5] Checking .gitignore configuration...")
    if not os.path.exists(".gitignore"):
        print("  ❌ .gitignore missing!")
        return False
    
    with open(".gitignore", "r", encoding="utf-8") as f:
        content = f.read()
    
    essential_ignores = ["node_modules", "dist", ".env", "coverage"]
    missing_ignores = [ig for ig in essential_ignores if ig not in content]
    
    if missing_ignores:
        print(f"  ⚠️ Warning: .gitignore might be missing: {', '.join(missing_ignores)}")
    else:
        print("  ✓ .gitignore contains all critical rules (node_modules, dist, .env).")
    return True

def scan_for_secrets():
    print("\n[3/5] Scanning codebase for sensitive credentials & corporate secrets...")
    issues = 0
    ignore_dirs = {".git", "node_modules", "dist", "coverage"}
    
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            if file.endswith((".py", ".ts", ".js", ".json", ".md", ".env")):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        for line_num, line in enumerate(f, 1):
                            for pattern, secret_type in SECRET_PATTERNS:
                                if re.search(pattern, line):
                                    print(f"  🚨 POSITIVE SECRET MATCH [{secret_type}] -> {filepath}:{line_num}")
                                    issues += 1
                except Exception as e:
                    pass
    
    if issues == 0:
        print("  ✓ Zero secrets or sensitive enterprise credentials detected.")
        return True
    else:
        print(f"  ❌ Found {issues} potential secret leak(s). Review before pushing publicly!")
        return False

def check_git_status():
    print("\n[4/5] Checking Git repository status...")
    try:
        status = subprocess.check_output(["git", "status", "--porcelain"], text=True)
        uncommitted = [line for line in status.strip().split("\n") if line and not line.endswith("scripts/")]
        
        if uncommitted:
            print("  ⚠️ Uncommitted changes detected:")
            for line in uncommitted:
                print(f"     {line}")
        else:
            print("  ✓ Working tree clean.")
            
        unpushed = subprocess.check_output(["git", "log", "origin/main..HEAD", "--oneline"], text=True)
        if unpushed.strip():
            print("  ⚠️ Commits waiting to be pushed to remote:")
            for line in unpushed.strip().split("\n"):
                print(f"     {line}")
        else:
            print("  ✓ Local main branch is fully synced with remote GitHub main branch.")
        return True
    except Exception as e:
        print(f"  ❌ Git execution error: {e}")
        return False

def run_tests_and_lint():
    print("\n[5/5] Running StoreOps npm verification suite (build, lint, test)...")
    try:
        print("  Running TypeScript compiler check...")
        subprocess.check_call(["cmd", "/c", "npx tsc --noEmit"], stdout=subprocess.DEVNULL)
        print("  ✓ TypeScript check passed.")
        
        print("  Running ESLint check...")
        subprocess.check_call(["cmd", "/c", "npm run lint"], stdout=subprocess.DEVNULL)
        print("  ✓ ESLint module boundary check passed.")

        print("  Running Jest unit/integration tests...")
        subprocess.check_call(["cmd", "/c", "npm test"], stdout=subprocess.DEVNULL)
        print("  ✓ All Jest test suites passed.")
        return True
    except subprocess.CalledProcessError:
        print("  ❌ One or more build/test checks failed!")
        return False

def main():
    print("=" * 60)
    print(f" StoreOps Harness Repository Readiness Auditor")
    print(f" Root: {PROJECT_ROOT}")
    print("=" * 60)
    
    r1 = check_required_files()
    r2 = check_gitignore()
    r3 = scan_for_secrets()
    r4 = check_git_status()
    r5 = run_tests_and_lint()
    
    print("\n" + "=" * 60)
    if r1 and r2 and r3 and r4 and r5:
        print(" SUCCESS: Your repository is safe, clean, and ready to be Public!")
    else:
        print(" ATTENTION: Please fix the reported items above before sharing.")
    print("=" * 60)

if __name__ == "__main__":
    main()