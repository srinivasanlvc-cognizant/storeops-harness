import os
import re
import sys

SRC_DIR = r"src"
VIOLATIONS = []

# Pattern 1: Prohibit direct cross-module repository imports (e.g., activities importing staff repository)
CROSS_REPO_PATTERN = re.compile(r'import\s+.*from\s+[\'"].*\/([a-zA-Z0-9_-]+)\/repository\/.*[\'"]')

# Pattern 2: Prohibit raw throw new Error() in services/routes
RAW_ERROR_PATTERN = re.compile(r'throw\s+new\s+Error\(')

for root, _, files in os.walk(SRC_DIR):
    for file in files:
        if file.endswith(".ts"):
            filepath = os.path.join(root, file)
            module_name = os.path.basename(os.path.dirname(os.path.dirname(filepath)))
            
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for line_num, line in enumerate(lines, 1):
                    # Check 1: Raw Error
                    if RAW_ERROR_PATTERN.search(line):
                        VIOLATIONS.append(f"[RAW ERROR] {filepath}:{line_num} -> Throwing raw Error() instead of AppError")
                    
                    # Check 2: Cross-module repository import
                    match = CROSS_REPO_PATTERN.search(line)
                    if match:
                        imported_module = match.group(1)
                        if imported_module != module_name and module_name != "":
                            VIOLATIONS.append(f"[BOUNDARY VIOLATION] {filepath}:{line_num} -> Direct cross-module import from '{imported_module}' repository")

if VIOLATIONS:
    print("❌ CRITICAL CONTENT EVALUATION FAILED:")
    for v in VIOLATIONS:
        print(f"  - {v}")
    sys.exit(1)
else:
    print("✓ CRITICAL CONTENT EVALUATION PASSED: All file contents adhere strictly to StoreOps architecture rules!")
    sys.exit(0)