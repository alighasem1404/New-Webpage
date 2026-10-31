const {test} = require('node:test');
const assert = require('node:assert/strict');
const {campaignUrl, metrics} = require('../projects/campaign-stats.js');
const url = 'https://www.kickstarter.com/projects/creator/campaign';
const project = {link: url + '?ref=nav_search&category_id=34'};
const record = {sourceUrl: url, fundingPercent: 284, backers: 46, state: 'live',
  deadline: '2026-11-11T17:14:05Z', updatedAt: '2026-10-26T12:00:00Z'};

test('campaign links match without tracking parameters or trailing slash', () => {
  assert.equal(campaignUrl(url + '/?ref=card'), url);
  assert.equal(campaignUrl(url.replace('www.', '')), url);
  assert.equal(metrics(project, [record]).backers, 46);
});

test('unrelated URLs and credentials cannot match cached campaign data', () => {
  for (const link of ['https://www.kickstarter.com.evil.test/projects/a/b', 'http://www.kickstarter.com/projects/a/b',
    'https://user:secret@www.kickstarter.com/projects/a/b', 'https://www.kickstarter.com:8443/projects/a/b']) {
    assert.equal(campaignUrl(link), null);
  }
  assert.equal(metrics({link: url + '-different'}, [record]), null);
});

test('remaining days follow the actual deadline and change without another fetch', () => {
  const snapshot = {...record, deadline: '2026-11-11T12:00:00Z'};
  assert.equal(metrics(project, [snapshot], Date.parse('2026-11-10T11:59:59Z')).daysRemaining, 1);
  assert.equal(metrics(project, [snapshot], Date.parse('2026-11-10T12:00:00Z')).daysRemaining, 1);
  const finalDay = metrics(project, [snapshot], Date.parse('2026-11-10T12:00:01Z'));
  assert.equal(finalDay.daysRemaining, 0);
  assert.equal(finalDay.hoursRemaining, 23);
  assert.equal(metrics(project, [snapshot], Date.parse('2026-11-11T11:59:30Z')).minutesRemaining, 1);
  assert.equal(metrics(project, [snapshot], Date.parse('2026-11-11T12:00:01Z')).daysRemaining, 0);
});

test('closed campaigns stop showing days to go', () => {
  assert.equal(metrics(project, [record], Date.parse(record.deadline)).ended, true);
  for (const state of ['successful', 'failed', 'canceled', 'suspended']) {
    assert.equal(metrics(project, [{...record, state}], Date.parse('2026-10-26T12:00:00Z')).ended, true);
  }
});

test('missing or malformed cached metrics do not overwrite manual fallbacks', () => {
  assert.equal(metrics(project, []), null);
  assert.equal(metrics(project, null), null);
  for (const change of [{fundingPercent: NaN}, {fundingPercent: -1}, {backers: '46'}, {backers: -1},
    {deadline: 'not a date'}, {updatedAt: ''}, {state: 'unknown'}]) {
    assert.equal(metrics(project, [{...record, ...change}]), null);
  }
});
