import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('campaign_sync', ROOT / 'dashboard/tasks/sync_campaigns.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)
URL = 'https://www.kickstarter.com/projects/creator/campaign'
OTHER = 'https://www.kickstarter.com/projects/another/second-campaign'
CHECKED = '2026-10-26T12:00:00Z'


def widget(percent='284.6', backers='46', deadline='2026-11-11T12:14:05-05:00', state='live'):
    return f'''<div class="js-track project-card project-card-tall" data-project-pid="123"
        data-project-backers-count="{backers}" data-project-percent-raised="{percent}"
        data-project-state="{state}"></div>
        <li class="ksr_page_timer" data-end-time="{deadline}"></li>'''


class CampaignSyncTests(unittest.TestCase):
    def test_url_normalization_and_request_allowlist(self):
        self.assertEqual(sync.campaign_url(URL + '/?ref=card#details'), URL)
        self.assertEqual(sync.campaign_url(URL.replace('www.', '')), URL)
        for value in ['http://www.kickstarter.com/projects/a/b', 'https://kickstarter.com.evil.test/projects/a/b',
                      'https://user:secret@www.kickstarter.com/projects/a/b', 'https://127.0.0.1/projects/a/b',
                      'https://www.kickstarter.com:8443/projects/a/b', 'https://www.kickstarter.com/projects/a/../b',
                      'https://www.kickstarter.com/projects/a/b%2f..%2f..', 'https://www.kickstarter.com/projects/a']:
            with self.subTest(value=value):
                self.assertIsNone(sync.campaign_url(value))

    def test_public_widget_values_and_timezone(self):
        record = sync.parse_widget(widget(), URL, CHECKED)
        self.assertEqual(record['fundingPercent'], 284)
        self.assertEqual(record['backers'], 46)
        self.assertEqual(record['deadline'], '2026-11-11T17:14:05Z')
        self.assertEqual(record['updatedAt'], CHECKED)
        self.assertEqual(record['sourceUrl'], URL)

    def test_changed_widget_and_invalid_metrics_are_rejected(self):
        for html in ['<title>Just a moment...</title>', widget() + widget(), widget(deadline='2026-11-11T12:00:00'),
                     widget(percent='NaN'), widget(percent='Infinity'), widget(percent='-1'),
                     widget(backers='-1'), widget(backers='1.5'), widget(state='unknown')]:
            with self.subTest(html=html[:100]):
                with self.assertRaises(ValueError):
                    sync.parse_widget(html, URL, CHECKED)

    def test_redirects_cannot_leave_kickstarter(self):
        handler = sync.WidgetRedirects()
        for destination in ['http://www.kickstarter.com/projects/a/b', 'https://example.com/', 'https://127.0.0.1/']:
            with self.subTest(destination=destination):
                with self.assertRaises(ValueError):
                    handler.redirect_request(None, None, 302, 'redirect', {}, destination)

    def test_partial_refresh_keeps_other_campaign_and_manual_project_data(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            projects = folder / 'projects.json'
            cache = folder / 'stats.json'
            projects.write_text(json.dumps({'schemaVersion': 1, 'projects': [
                {'section': 'live', 'link': URL + '?ref=nav_search'}, {'section': 'live', 'link': OTHER},
                {'section': 'upcoming', 'link': 'https://www.kickstarter.com/projects/future/book'},
                {'section': 'live', 'link': 'https://example.com/projects/a/b'},
            ]}), encoding='utf-8')
            old_records = [sync.parse_widget(widget(percent='100'), url, CHECKED) for url in [URL, OTHER]]
            cache.write_text(json.dumps({'schemaVersion': 1, 'campaigns': old_records}), encoding='utf-8')
            original = projects.read_bytes()
            called = []

            def fetch(url):
                called.append(url)
                if url == OTHER:
                    raise OSError('Temporary network failure')
                return widget()

            successes, errors = sync.sync(projects, cache, fetch)
            records = json.loads(cache.read_text())['campaigns']
            self.assertEqual(called, [URL, OTHER])
            self.assertEqual(successes, [URL])
            self.assertEqual(len(errors), 1)
            self.assertEqual(records[0]['fundingPercent'], 284)
            self.assertEqual(records[1], old_records[1])
            self.assertEqual(projects.read_bytes(), original)

    def test_all_failures_leave_cache_bytes_unchanged(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            projects, cache = folder / 'projects.json', folder / 'stats.json'
            projects.write_text(json.dumps({'schemaVersion': 1, 'projects': [{'section': 'live', 'link': URL}]}))
            cache.write_text(json.dumps({'schemaVersion': 1, 'campaigns': [sync.parse_widget(widget(), URL, CHECKED)]}))
            before = cache.read_bytes()
            successes, errors = sync.sync(projects, cache, lambda _: '<title>Blocked</title>')
            self.assertEqual(successes, [])
            self.assertEqual(len(errors), 1)
            self.assertEqual(cache.read_bytes(), before)

    def test_atomic_write_preserves_existing_cache_on_encoding_error(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'stats.json'
            path.write_text('{"previous": true}')
            with self.assertRaises(ValueError):
                sync.atomic_write(path, {'invalid': float('nan')})
            self.assertEqual(path.read_text(), '{"previous": true}')
            self.assertEqual(list(path.parent.iterdir()), [path])

    def test_overlapping_refreshes_are_locked_out(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'refresh.lock'
            with sync.exclusive_lock(path):
                with self.assertRaises(OSError):
                    with sync.exclusive_lock(path):
                        self.fail('A second updater acquired the same lock.')
            with sync.exclusive_lock(path):
                pass


if __name__ == '__main__':
    unittest.main()
