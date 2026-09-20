"""Obtain the official, unmodified brand font; keep its binary out of Git."""
from pathlib import Path
from urllib.request import urlopen
import hashlib

destination = Path(__file__).resolve().parents[1] / 'src/fonts/GeneralSans-Regular.woff2'
expected = '3ec2be771caf168b077ca05af4df1dace77088e2b3a27da570036e61be58a039'
url = 'https://cdn.fontshare.com/wf/MFQT7HFGCR2L5ULQTW6YXYZXXHMPKLJ3/YWQ244D6TACUX5JBKATPOW5I5MGJ3G73/7YY3ZAAE3TRV2LANYOLXNHTPHLXVWTKH.woff2'
if destination.exists() and hashlib.sha256(destination.read_bytes()).hexdigest() == expected:
    print('General Sans is ready.')
else:
    with urlopen(url, timeout=30) as response:
        content = response.read()
    if hashlib.sha256(content).hexdigest() != expected:
        raise SystemExit('Upstream font changed. Review before updating the pinned hash.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    print('General Sans is ready.')
