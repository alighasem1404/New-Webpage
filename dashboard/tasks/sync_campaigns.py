"""Refresh public campaign statistics from Kickstarter's embeddable cards.

Run once from cPanel cron, or use --watch for the local preview. No credentials
or browser cookies are used. A blocked or changed widget keeps the last snapshot.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_FLOOR
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import time
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

ROOT = Path(__file__).resolve().parents[2]
PROJECTS_PATH = ROOT / 'projects/data/projects.json'
STATS_PATH = ROOT / 'projects/data/campaign-stats.json'
LOCK_PATH = Path(__file__).with_suffix('.lock')
MAX_BYTES = 2_000_000


def campaign_url(value):
    """Accept campaign pages only; never turn arbitrary dashboard URLs into requests."""
    try:
        parts = urlsplit(str(value))
        if (parts.scheme != 'https' or parts.hostname not in ('kickstarter.com', 'www.kickstarter.com')
                or parts.username or parts.password or parts.port not in (None, 443)
                or not re.fullmatch(r'/projects/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/?', parts.path)):
            return None
        return 'https://www.kickstarter.com' + parts.path.rstrip('/')
    except ValueError:
        return None


class WidgetParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.cards = []
        self.deadlines = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'project-card' in attrs.get('class', '').split():
            self.cards.append(attrs)
        if 'ksr_page_timer' in attrs.get('class', '').split() and attrs.get('data-end-time'):
            self.deadlines.append(attrs['data-end-time'])


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def parse_widget(html, url, checked_at=None):
    parser = WidgetParser()
    parser.feed(html)
    if len(parser.cards) != 1 or len(set(parser.deadlines)) != 1:
        raise ValueError('The widget is missing its campaign card or closing date.')
    card = parser.cards[0]
    try:
        percent = Decimal(card['data-project-percent-raised'])
        backers = int(card['data-project-backers-count'])
        project_id = int(card.get('data-project-pid') or card['data-pid'])
        state = card['data-project-state']
        deadline = datetime.fromisoformat(parser.deadlines[0].replace('Z', '+00:00'))
    except (KeyError, ValueError, InvalidOperation) as error:
        raise ValueError('The widget statistics have an unsupported format.') from error
    if (not percent.is_finite() or not 0 <= percent <= 100_000
            or not 0 <= backers <= 100_000_000 or project_id <= 0
            or state not in ('live', 'successful', 'failed', 'canceled', 'suspended')
            or deadline.utcoffset() is None):
        raise ValueError('The widget returned invalid campaign statistics.')
    normalized_url = campaign_url(url)
    if not normalized_url:
        raise ValueError('Invalid Kickstarter campaign URL.')
    return {
        'sourceUrl': normalized_url,
        'sourceProjectId': project_id,
        'fundingPercent': int(percent.to_integral_value(rounding=ROUND_FLOOR)),
        'backers': backers,
        'deadline': deadline.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
        'state': state,
        'updatedAt': checked_at or utc_now(),
    }


class WidgetRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        parts = urlsplit(new_url)
        if parts.scheme != 'https' or parts.hostname not in ('kickstarter.com', 'www.kickstarter.com'):
            raise ValueError('The campaign widget redirected outside Kickstarter.')
        return super().redirect_request(request, file_pointer, code, message, headers, new_url)


def fetch_widget(url):
    normalized = campaign_url(url)
    if not normalized:
        raise ValueError('Invalid Kickstarter campaign URL.')
    request = Request(normalized + '/widget/card.html', headers={
        'User-Agent': 'VerseluftCampaignSync/1.0 (+https://verseluft.com/)',
        'Accept': 'text/html',
    })
    with build_opener(WidgetRedirects()).open(request, timeout=20) as response:
        if response.status != 200 or response.headers.get_content_type() != 'text/html':
            raise ValueError('The widget did not return an HTML card.')
        body = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError('The widget response is unexpectedly large.')
        return body.decode('utf-8')


def atomic_write(path, data):
    path = Path(path)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=path.parent, delete=False) as handle:
            temporary = handle.name
            json.dump(data, handle, ensure_ascii=False, indent=2, allow_nan=False)
            handle.write('\n')
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary, 0o644)
        os.replace(temporary, path)
    finally:
        if temporary and os.path.exists(temporary):
            os.unlink(temporary)


@contextmanager
def exclusive_lock(path):
    """Use an OS lock so overlapping cron runs cannot overwrite newer snapshots."""
    with open(path, 'a+b') as handle:
        if handle.tell() == 0:
            handle.write(b'0')
            handle.flush()
        handle.seek(0)
        if os.name == 'nt':
            import msvcrt
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            yield
        finally:
            handle.seek(0)
            if os.name == 'nt':
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def sync(projects_path=PROJECTS_PATH, stats_path=STATS_PATH, fetcher=fetch_widget):
    source = json.loads(Path(projects_path).read_text(encoding='utf-8-sig'))
    if source.get('schemaVersion') != 1 or not isinstance(source.get('projects'), list):
        raise ValueError('The project list has an unsupported format.')
    if len(source['projects']) > 100:
        raise ValueError('The project list is too large.')
    urls = list(dict.fromkeys(url for project in source['projects']
                              if project.get('section') == 'live'
                              and (url := campaign_url(project.get('link', '')))))
    previous = {'schemaVersion': 1, 'campaigns': []}
    if Path(stats_path).exists():
        previous = json.loads(Path(stats_path).read_text(encoding='utf-8-sig'))
        if previous.get('schemaVersion') != 1 or not isinstance(previous.get('campaigns'), list):
            raise ValueError('The statistics cache has an unsupported format; it was not overwritten.')
    cached = {record['sourceUrl']: record for record in previous['campaigns']
              if isinstance(record, dict) and record.get('sourceUrl') in urls}
    successes, errors = [], []
    for url in urls:
        try:
            cached[url] = parse_widget(fetcher(url), url)
            successes.append(url)
        except Exception as error:
            errors.append((url, str(error)))
    # All failures must leave both the last-good values and their timestamps untouched.
    if successes or not urls:
        atomic_write(stats_path, {'schemaVersion': 1, 'updatedAt': utc_now(),
                                 'campaigns': [cached[url] for url in urls if url in cached]})
    return successes, errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--watch', action='store_true', help='Refresh periodically for a local preview.')
    parser.add_argument('--interval', type=int, default=900, help='Watch interval in seconds (minimum 300).')
    args = parser.parse_args()
    if args.interval < 300:
        parser.error('The minimum interval is 300 seconds.')
    while True:
        try:
            with exclusive_lock(LOCK_PATH):
                successes, errors = sync()
            print(f'{utc_now()}: refreshed {len(successes)} campaign(s); {len(errors)} error(s).', flush=True)
            for url, error in errors:
                print(f'{url}: {error}', file=sys.stderr, flush=True)
            result = 1 if errors else 0
        except Exception as error:
            print(f'Campaign sync failed: {error}', file=sys.stderr, flush=True)
            result = 1
        if not args.watch:
            return result
        time.sleep(args.interval)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        pass
