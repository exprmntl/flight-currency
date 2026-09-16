"""Create a reproducible Chrome Web Store ZIP with only runtime assets."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
source = root / 'src'
manifest = json.loads((source / 'manifest.json').read_text())
font = source / 'fonts/GeneralSans-Regular.woff2'
if not font.exists() or hashlib.sha256(font.read_bytes()).hexdigest() != '3ec2be771caf168b077ca05af4df1dace77088e2b3a27da570036e61be58a039':
    raise SystemExit('General Sans missing or changed. Run python3 scripts/prepare-font.py first.')
output = root / 'dist' / f'flight-currency-{manifest["version"]}.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(source.rglob('*')):
        if file.is_file() and not file.name.startswith('.'):
            info = zipfile.ZipInfo(file.relative_to(source).as_posix(), (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, file.read_bytes())
print(output)
