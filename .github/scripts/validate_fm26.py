from pathlib import Path
import json
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
external_scripts = []
for src in srcs:
    if src.startswith(("https://", "http://", "//")):
        continue
    target = (ROOT / src.split("?", 1)[0].split("#", 1)[0]).resolve()
    if ROOT.resolve() not in target.parents and target != ROOT.resolve():
        errors.append(f"Script path escapes repository: {src}")
    elif not target.exists():
        errors.append(f"Script referenced by index.html is missing: {src}")
    elif target.suffix == ".js":
        external_scripts.append((target.name, target.read_text(encoding="utf-8")))

inline_scripts = re.findall(r"<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)</script>", html, re.I)
scripts_to_check = [(f"index.inline.{i}.js", source) for i, source in enumerate(inline_scripts, 1) if source.strip()]
scripts_to_check.extend(external_scripts)

seen = set()
for name, source in scripts_to_check:
    if name in seen:
        continue
    seen.add(name)
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as f:
        f.write(source)
        temp_path = f.name
    result = subprocess.run(["node", "--check", temp_path], text=True, capture_output=True)
    Path(temp_path).unlink(missing_ok=True)
    if result.returncode:
        errors.append(f"JavaScript syntax error in {name}:\n{result.stderr.strip()}")

required = ["fm26-phase1.js", "fm26-engine.js", "fm26-advanced.js", "fm26-world.js"]
positions = [html.find(f'src="./{name}"') for name in required]
if not all(pos >= 0 for pos in positions):
    errors.append("index.html must load all FM26 modules: phase1, engine, advanced and world.")
elif positions != sorted(positions):
    errors.append("FM26 modules are not loaded in the expected order.")

match = re.search(r"const LG=(\{[\s\S]*?\});\s*const BIG=", html)
if not match:
    errors.append("Could not locate the league database for validation.")
else:
    try:
        leagues = json.loads(match.group(1))
        for name, teams in leagues.items():
            if len(teams) < 8:
                errors.append(f"{name}: too few teams ({len(teams)}).")
            if len(teams) % 2:
                errors.append(f"{name}: round-robin scheduler requires an even number of teams.")
            if len(teams) != len(set(teams)):
                errors.append(f"{name}: duplicate club names.")
            # Re-run the circle-method scheduler and verify each club appears once per round.
            n = len(teams)
            ring = list(teams)
            pairings = []
            for r in range(n - 1):
                used = set()
                for i in range(n // 2):
                    home, away = ring[i], ring[n - 1 - i]
                    if (r + i) % 2:
                        home, away = away, home
                    if home in used or away in used:
                        errors.append(f"{name}: club scheduled twice in round {r + 1}.")
                    used.add(home); used.add(away)
                    pairings.append((home, away))
                if len(used) != n:
                    errors.append(f"{name}: a club is missing in round {r + 1}.")
                ring = [ring[0], ring[-1], *ring[1:-1]]
            if len(pairings) != n * (n - 1) // 2:
                errors.append(f"{name}: incorrect first-half fixture count.")
            if len({frozenset(pair) for pair in pairings}) != len(pairings):
                errors.append(f"{name}: duplicate pairing in first half.")
        if len(leagues) < 12:
            errors.append(f"Expected at least 12 playable leagues, found {len(leagues)}.")
    except Exception as exc:
        errors.append(f"League database validation failed: {exc}")

if errors:
    print("FM26 validation failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)
print(f"FM26 validation passed: {len(scripts_to_check)} JavaScript blocks checked; {len(srcs)} script references resolved; league schedules validated across {len(leagues) if 'leagues' in locals() else 0} leagues.")
