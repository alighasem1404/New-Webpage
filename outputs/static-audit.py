import json, re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, unquote

ROOT = Path(__file__).resolve().parent.parent
missing, references, placeholders, external = [], [], [], set()

def check(value, source, kind):
    value = value.strip()
    if not value or value.startswith(('data:', 'mailto:', 'javascript:', '//')):
        return
    url = urlparse(urljoin('http://local/' + source.relative_to(ROOT).as_posix(), value))
    if url.hostname != 'local':
        if url.scheme == 'https': external.add(value)
        return
    target = ROOT / unquote(url.path).lstrip('/')
    if url.path.endswith('/'): target /= 'index.html'
    references.append({'source': source.relative_to(ROOT).as_posix(), 'value': value, 'kind': kind})
    if not target.exists(): missing.append(references[-1])

class Parser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'href', 'poster'):
            if key in attrs:
                if tag == 'a' and attrs[key] == '#': placeholders.append({'source': self.source.relative_to(ROOT).as_posix(), 'line': self.getpos()[0], 'tag': self.get_starttag_text()})
                check(attrs[key], self.source, tag + ':' + key)
        for candidate in attrs.get('srcset', '').split(','):
            if candidate.strip(): check(candidate.strip().rsplit(' ', 1)[0], self.source, 'srcset')

for source in ROOT.rglob('*'):
    if not source.is_file() or any(part in ('assets', '.git', 'outputs') for part in source.relative_to(ROOT).parts): continue
    if source.suffix == '.html':
        parser = Parser()
        parser.source = source
        parser.feed(source.read_text(encoding='utf-8-sig'))
    elif source.suffix == '.css':
        for match in re.finditer(r'url\(\s*[\'"]?([^\)\'"\n]+)', source.read_text(encoding='utf-8-sig')): check(match[1], source, 'css:url')

for relative, collection in [('library/data/books.json', 'books'), ('projects/data/projects.json', 'projects')]:
    source = ROOT / relative
    for item in json.loads(source.read_text(encoding='utf-8-sig'))[collection]:
        for field in ('coverImage', 'detailImage', 'image', 'storeUrl', 'link'):
            if item.get(field): check(item[field], ROOT / 'index.html', item.get('title', '') + ':' + field)

result = {'referencesChecked': len(references), 'missing': missing, 'placeholders': placeholders, 'external': sorted(external)}
(ROOT / 'outputs/static-audit-results.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps({**result, 'external': len(external)}, indent=2))
