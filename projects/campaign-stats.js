/* Shared by the public cards and the dependency-free Node checks. */
((root) => {
  function campaignUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || !['kickstarter.com', 'www.kickstarter.com'].includes(url.hostname)
          || url.username || url.password || url.port
          || !/^\/projects\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return null;
      return `https://www.kickstarter.com${url.pathname.replace(/\/$/, '')}`;
    } catch { return null; }
  }

  function metrics(project, records, now = Date.now()) {
    const url = campaignUrl(project.link);
    if (!url || !Array.isArray(records)) return null;
    const record = records.find((item) => item && item.sourceUrl === url);
    if (!record || !Number.isInteger(record.fundingPercent) || record.fundingPercent < 0
        || record.fundingPercent > 100000 || !Number.isInteger(record.backers)
        || record.backers < 0 || record.backers > 100000000
        || !['live', 'successful', 'failed', 'canceled', 'suspended'].includes(record.state)) return null;
    const deadline = Date.parse(record.deadline);
    const updatedAt = Date.parse(record.updatedAt);
    if (!Number.isFinite(deadline) || !Number.isFinite(updatedAt)) return null;
    const remaining = Math.max(0, deadline - now);
    return {...record,
      daysRemaining: Math.floor(remaining / 86400000),
      hoursRemaining: Math.floor(remaining / 3600000),
      minutesRemaining: Math.ceil(remaining / 60000),
      ended: record.state !== 'live' || deadline <= now,
    };
  }

  const api = {campaignUrl, metrics};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VerseluftCampaignStats = api;
})(typeof window !== 'undefined' ? window : globalThis);
