from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
html_path = ROOT / "index.html"
if not html_path.exists():
    sys.exit("FAIL: index.html is missing")

html = html_path.read_text(encoding="utf-8")
errors = []
if not re.search(r"<html[^>]*lang=['\"]fr['\"]", html, re.I):
    errors.append("The HTML document should declare French as its language.")
if not re.search(r"</body>\s*</html>\s*$", html, re.I):
    errors.append("index.html must end with closing body/html tags.")

srcs = re.findall(r"<script\b[^>]*\bsrc=['\"]([^'\"]+)['\"][^>]*>\s*</script>", html, re.I)
for src in srcs:
    if src.startswith(("https://", "http://", "//")):
        continue
    target = (ROOT / src.split("?", 1)[0].split("#", 1)[0]).resolve()
    if ROOT.resolve() not in target.parents and target != ROOT.resolve():
        errors.append(f"Script path escapes repository: {src}")
    elif not target.exists():
        errors.append(f"Script referenced by index.html is missing: {src}")

inline_scripts = re.findall(r"<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)</script>", html, re.I)
scripts_to_check = []
for index, source in enumerate(inline_scripts, 1):
    if source.strip():
        scripts_to_check.append((f"index.inline.{index}.js", source))

for filename in ("fm26-phase1.js", "fm26-engine.js", "fm26-advanced.js"):
    path = ROOT / filename
    if path.exists():
        scripts_to_check.append((filename, path.read_text(encoding="utf-8")))

for name, source in scripts_to_check:
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as f:
        f.write(source)
        temp_path = f.name
    result = subprocess.run(["node", "--check", temp_path], text=True, capture_output=True)
    Path(temp_path).unlink(missing_ok=True)
    if result.returncode:
        errors.append(f"JavaScript syntax error in {name}:\n{result.stderr.strip()}")

required = ["fm26-phase1.js", "fm26-engine.js", "fm26-advanced.js"]
positions = [html.find(f'src="./{name}"') for name in required]
if all(pos >= 0 for pos in positions) and positions != sorted(positions):
    errors.append("FM26 modules are not loaded in the expected order: phase1, engine, advanced.")
if not all(pos >= 0 for pos in positions):
    errors.append("index.html must load all three FM26 extension modules.")

if errors:
    print("FM26 validation failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print(f"FM26 validation passed: {len(scripts_to_check)} JavaScript blocks checked; {len(srcs)} script references resolved.")
