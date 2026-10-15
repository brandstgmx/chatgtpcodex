"""Package static files with explicit public-server read permissions."""
from pathlib import Path
import re
import stat
import tempfile
import time
import zipfile

REPO = Path(__file__).resolve().parents[1]
SITE = REPO / 'landing-playbook-v12.0-clean-baseline'


def entry(name, directory=False):
    info = zipfile.ZipInfo(name + ('/' if directory and not name.endswith('/') else ''), date_time=time.localtime()[:6])
    info.create_system = 3
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = ((stat.S_IFDIR | 0o755) if directory else (stat.S_IFREG | 0o644)) << 16
    if directory:
        info.external_attr |= 0x10
    return info


def normalize(archive):
    with zipfile.ZipFile(archive) as source:
        entries = [(item.filename, source.read(item), item.is_dir()) for item in source.infolist()]
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as target:
        for name, data, directory in entries:
            target.writestr(entry(name, directory), data)


def verify(archive, root):
    with zipfile.ZipFile(archive) as package:
        assert package.testzip() is None
        for item in package.infolist():
            assert stat.S_IMODE(item.external_attr >> 16) == (0o755 if item.is_dir() else 0o644), item.filename
            if not item.is_dir():
                assert package.read(item) == (root / item.filename).read_bytes(), item.filename
        # Python's extractor deliberately ignores Unix modes; check the archive
        # modes independently, and validate bytes after extraction as well.
        with tempfile.TemporaryDirectory(dir='/tmp') as temporary:
            package.extractall(temporary)
            for item in package.infolist():
                if not item.is_dir():
                    assert (Path(temporary) / item.filename).read_bytes() == package.read(item)
    print('Verified bytes, ZIP integrity and modes:', archive.name)


if __name__ == '__main__':
    hosting = REPO / 'landing-playbook-v12.0-HOSTING.zip'
    files = [SITE / name for name in ['index.html', 'robots.txt', 'sitemap.xml']]
    for name in ['css', 'img']:
        files.extend(sorted(path for path in (SITE / name).rglob('*') if path.is_file()))
    # Ship the complete runtime, not duplicate source modules or obsolete bundles.
    script = re.search(r'<script\s+src="(js/app[^"?]*\.js)', (SITE / 'index.html').read_text())
    assert script, 'Missing deployed application bundle'
    files.extend(SITE / name for name in [script[1], 'js/vendor/hls-stream-optimized.js', 'js/vendor/LICENSE.hls.js.txt'])
    with zipfile.ZipFile(hosting, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
        directories = {parent.relative_to(SITE).as_posix()
                       for path in files for parent in path.parents
                       if parent != SITE and SITE in parent.parents}
        for name in sorted(directories):
            package.writestr(entry(name, True), b'')
        for path in files:
            package.writestr(entry(path.relative_to(SITE).as_posix()), path.read_bytes())
    verify(hosting, SITE)
    full = REPO / 'landing-playbook-v12.0-clean-baseline-SITIO.zip'
    # Rebuild from current files; normalizing an older archive leaves stale code.
    source_files = sorted(path for path in SITE.rglob('*')
                          if path.is_file()
                          and not {'node_modules', 'results', 'evidence'}.intersection(path.relative_to(SITE).parts)
                          and path.name != 'SHA256SUMS')
    with zipfile.ZipFile(full, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
        for path in source_files:
            package.writestr(entry(SITE.name + '/' + path.relative_to(SITE).as_posix()), path.read_bytes())
        demo = REPO / 'demos/demo-urgencia.html'
        package.writestr(entry('demo-urgencia.html'), demo.read_bytes())
    # The independent demo is stored outside the site folder in this package.
    with zipfile.ZipFile(full) as package:
        for item in package.infolist():
            assert stat.S_IMODE(item.external_attr >> 16) == (0o755 if item.is_dir() else 0o644)
            source = REPO / 'demos/demo-urgencia.html' if item.filename == 'demo-urgencia.html' else REPO / item.filename
            if not item.is_dir():
                assert package.read(item) == source.read_bytes(), item.filename
        assert package.testzip() is None
    print('Verified full package permissions and bytes:', full.name)
