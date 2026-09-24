(() => {
  const STORAGE_KEY = 'verseluft-dashboard-content-v1';
  const PROJECT_PREVIEW_KEY = 'verseluft-projects-preview-v1';
  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const blogEntries = [
    { id: 'blog-worldbuilding-playable', kind: 'blog', title: 'D&D worldbuilding: what makes a setting playable?', description: 'A memorable D&D setting gives players reasons to explore.', category: 'Behind the scenes', status: 'Published', updated: 'Sep 14, 2026', views: 8240, image: '/assets/test%20images/article%20PH1.webp', slug: 'worldbuilding-playable' },
    { id: 'blog-quiet-scenes', kind: 'blog', title: '5 ways to make quiet D&D scenes matter', description: 'Give your players space to notice, question, and choose.', category: 'DM advice', status: 'Published', updated: 'Sep 10, 2026', views: 6940, image: '/assets/test%20images/article%20PH2.webp', slug: 'quiet-scenes' },
    { id: 'blog-supplement-process', kind: 'blog', title: 'Creating a D&D supplement: from idea to table', description: 'How a loose premise becomes a useful book through playtesting and editing.', category: 'Making games', status: 'Published', updated: 'Sep 05, 2026', views: 5280, image: '/assets/test%20images/article%20PH3.webp', slug: 'supplement-process' },
    { id: 'blog-upcoming-books', kind: 'blog', title: 'Upcoming D&D books from Verseluft', description: 'A look at the studio’s upcoming releases.', category: 'News', status: 'Draft', updated: 'Sep 02, 2026', views: 3010, image: '/assets/test%20images/article%20PH4.webp', slug: 'upcoming-books' },
    { id: 'blog-towns-players-change', kind: 'blog', title: 'Build a town your players can change', description: 'Make a living settlement through choices and consequences.', category: 'DM advice', status: 'Draft', updated: 'Aug 29, 2026', views: 2480, image: '/assets/test%20images/article%20PH1.webp', slug: 'towns-players-change' },
    { id: 'blog-adventure-hooks', kind: 'blog', title: 'Why constraints make better adventure hooks', description: 'Small creative limits can make a premise more playable.', category: 'Making games', status: 'Draft', updated: 'Aug 24, 2026', views: 1960, image: '/assets/test%20images/article%20PH2.webp', slug: 'adventure-hooks' },
    { id: 'blog-library-update', kind: 'blog', title: 'What is coming to the Verseluft library', description: 'A studio update on the books in our pipeline.', category: 'News', status: 'Draft', updated: 'Aug 18, 2026', views: 1540, image: '/assets/test%20images/article%20PH3.webp', slug: 'library-update' }
  ];
  const sampleValues = {
    7: { visitors: '5,940', views: '8,760', engagement: '4.52', changes: ['+9.1%', '+6.7%', '+0.3%'] },
    30: { visitors: '24,860', views: '38,420', engagement: '4.86', changes: ['+12.8%', '+8.4%', '+0.6%'] },
    90: { visitors: '69,320', views: '108,640', engagement: '4.62', changes: ['+18.2%', '+14.6%', '+0.4%'] }
  };
  let entries = [];
  let activeFilter = 'all';
  let toastTimer;
  let csrfToken = '';
  let projectSaveMode = 'remote';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const kindLabel = (kind) => ({ blog: 'Journal', book: 'Book', project: 'Project' }[kind] || 'Content');
  const kindClass = (kind) => `type-${kind}`;
  const statusClass = (status) => `status-${String(status).toLowerCase().replace(/\s+/g, '-')}`;
  const formatViews = (value) => `${(Number(value || 0) / 1000).toFixed(1)}k views`;

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.filter((entry) => entry.kind !== 'project')));
      return true;
    } catch (error) {
      console.warn('Dashboard data could not be saved in this browser.', error);
      showToast('Could not save in this browser. Export your changes to keep them.');
      return false;
    }
  }

  async function loadEntries() {
    let books = [];
    try {
      const response = await fetch('/library/data/books.json');
      if (!response.ok) throw new Error(`Book data returned ${response.status}`);
      const data = await response.json();
      books = data.books.map((book) => ({
        id: `book-${book.id}`, kind: 'book', title: book.title, description: book.shortDescription,
        category: book.categoryLabel || book.category, status: book.status === 'published' ? 'Published' : 'Draft',
        updated: 'Catalog', views: Math.round(500 + (book.sortOrder || 1) * 183), image: book.coverImage,
        slug: book.slug, categoryKey: book.category, featured: book.featured, sourceId: book.id
      }));
    } catch (error) {
      console.warn('Could not load the book catalog for the dashboard.', error);
    }

    let remoteProjects = [];
    try {
      const response = await fetch('/dashboard/api/projects.php', { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.projects) || !payload.csrfToken) throw new Error(payload.error || `Project service returned ${response.status}`);
      csrfToken = payload.csrfToken;
      projectSaveMode = 'remote';
      $('#project-api-warning').hidden = true;
      remoteProjects = payload.projects.map((project) => ({
        id: `project-${project.id}`, sourceId: project.id, kind: 'project', title: project.title,
        description: project.description, category: project.section === 'live' ? 'Live project' : 'Upcoming project',
        status: project.status, updated: 'Website', views: 0, image: project.image,
        section: project.section, imageAlt: project.imageAlt, fundingPercent: project.fundingPercent,
        daysRemaining: project.daysRemaining, backers: project.backers, progressWidth: project.progressWidth, link: project.link
      }));
    } catch (error) {
      console.error('The protected project service is unavailable.', error);
      if (isLocalPreview) {
        try {
          const response = await fetch('/projects/data/projects.json', { cache: 'no-store' });
          if (!response.ok) throw new Error(`Project data returned ${response.status}`);
          const data = await response.json();
          let projects = data.projects;
          try {
            const savedPreview = JSON.parse(localStorage.getItem(PROJECT_PREVIEW_KEY) || 'null');
            if (Array.isArray(savedPreview)) projects = savedPreview;
          } catch (storageError) {
            console.warn('Could not read local project preview changes.', storageError);
          }
          if (!Array.isArray(projects)) throw new Error('Project data is not in the expected format.');
          csrfToken = '';
          projectSaveMode = 'local-preview';
          remoteProjects = projects.map((project) => ({
            id: `project-${project.id}`, sourceId: project.id, kind: 'project', title: project.title,
            description: project.description, category: project.section === 'live' ? 'Live project' : 'Upcoming project',
            status: project.status, updated: 'Local preview', views: 0, image: project.image,
            section: project.section, imageAlt: project.imageAlt, fundingPercent: project.fundingPercent,
            daysRemaining: project.daysRemaining, backers: project.backers, progressWidth: project.progressWidth, link: project.link
          }));
          const warning = $('#project-api-warning');
          warning.hidden = false;
          warning.textContent = 'Local preview mode: project edits sync across this browser’s site pages, but are not published for visitors. cPanel setup is still required to publish changes.';
          showToast('Sample projects loaded from the homepage data.');
        } catch (previewError) {
          console.error('Could not load local project data.', previewError);
          $('#project-api-warning').hidden = false;
          showToast('Projects could not load. Check the project data file.');
        }
      } else {
        $('#project-api-warning').hidden = false;
        showToast('Projects could not load. Check the protected API setup before editing.');
      }
    }

    const defaults = [...blogEntries, ...books];
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(saved)) {
        entries = [...saved.filter((entry) => entry.kind !== 'project'), ...remoteProjects];
      } else entries = [...defaults, ...remoteProjects];
    } catch {
      entries = [...defaults, ...remoteProjects];
    }
    renderAll();
  }

  function projectPayload(entry) {
    return {
      id: entry.sourceId || entry.id.replace(/^project-/, ''), section: entry.section,
      title: entry.title, description: entry.description, image: entry.image,
      imageAlt: entry.imageAlt || `${entry.title} campaign artwork`, status: entry.status,
      fundingPercent: Number(entry.fundingPercent) || 0, daysRemaining: Number(entry.daysRemaining) || 0,
      backers: Number(entry.backers) || 0, progressWidth: Number(entry.progressWidth) || 0,
      link: entry.link || ''
    };
  }

  async function saveProjectsToSite() {
    if (projectSaveMode === 'local-preview' && isLocalPreview) {
      try {
        localStorage.setItem(PROJECT_PREVIEW_KEY, JSON.stringify(entries.filter((entry) => entry.kind === 'project').map(projectPayload)));
        return;
      } catch {
        throw new Error('Could not save the local preview changes in this browser.');
      }
    }
    if (!csrfToken) throw new Error('The protected project service is not ready. Refresh after setting up the cPanel login.');
    const response = await fetch('/dashboard/api/projects.php', {
      method: 'PUT', credentials: 'same-origin', headers: {
        'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken
      }, body: JSON.stringify({ projects: entries.filter((entry) => entry.kind === 'project').map(projectPayload) })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `The site did not save the project changes (${response.status}).`);
  }

  function showToast(message) {
    const toast = $('#dashboard-toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  function statusBadge(entry) {
    return `<span class="status-pill ${statusClass(entry.status)}">${escapeHtml(entry.status)}</span>`;
  }

  function entryRow(entry, manager = false) {
    return `<tr data-entry-id="${escapeHtml(entry.id)}"><td><div class="table-title"><span class="table-thumb">${entry.image ? `<img src="${escapeHtml(entry.image)}" alt="" loading="lazy" />` : ''}</span><span class="table-title-copy"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.category || kindLabel(entry.kind))}</small></span></div></td><td><span class="type-pill ${kindClass(entry.kind)}">${kindLabel(entry.kind)}</span></td><td>${statusBadge(entry)}</td><td>${escapeHtml(entry.updated)}</td>${manager ? `<td>${formatViews(entry.views)}</td>` : ''}<td><div class="row-actions"><button class="row-action" type="button" data-action="edit" data-id="${escapeHtml(entry.id)}" aria-label="Edit ${escapeHtml(entry.title)}" title="Edit">✎</button>${manager ? `<button class="row-action danger" type="button" data-action="delete" data-id="${escapeHtml(entry.id)}" aria-label="Remove ${escapeHtml(entry.title)}" title="Remove">×</button>` : ''}</div></td></tr>`;
  }

  function visibleEntries() {
    const query = ($('#content-search')?.value || '').trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesKind = activeFilter === 'all' || entry.kind === activeFilter;
      const matchesQuery = !query || `${entry.title} ${entry.description} ${entry.category} ${entry.status}`.toLowerCase().includes(query);
      return matchesKind && matchesQuery;
    });
  }

  function renderContentTable() {
    const rows = visibleEntries();
    $('#content-table-body').innerHTML = rows.length ? rows.map((entry) => entryRow(entry, true)).join('') : '<tr><td class="table-empty" colspan="6">No content matches that search.</td></tr>';
    $('#table-result-count').textContent = `${rows.length} ${rows.length === 1 ? 'item' : 'items'}`;
  }

  function renderRecent() {
    const latest = [...entries].sort((a, b) => String(b.updated).localeCompare(String(a.updated))).slice(0, 4);
    $('#recent-table-body').innerHTML = latest.map((entry) => entryRow(entry)).join('');
  }

  function renderCounts() {
    const counts = { all: entries.length, blog: 0, book: 0, project: 0, published: 0, draft: 0 };
    entries.forEach((entry) => {
      counts[entry.kind] += 1;
      if (entry.status === 'Published') counts.published += 1;
      else if (entry.status === 'Draft') counts.draft += 1;
    });
    $('#nav-content-count').textContent = String(counts.all);
    $('#count-all').textContent = String(counts.all);
    $('#count-blog').textContent = String(counts.blog);
    $('#count-book').textContent = String(counts.book);
    $('#count-project').textContent = String(counts.project);
    $('#metric-published').textContent = String(counts.published);
    $('#metric-drafts').textContent = `${counts.draft} drafts`;
    $('#published-ratio').textContent = counts.all ? `${Math.round(counts.published / counts.all * 100)}%` : '0%';
    $('#content-summary').innerHTML = ['blog', 'book', 'project'].map((kind) => `<span class="summary-chip"><strong>${counts[kind]}</strong> ${kindLabel(kind)}${counts[kind] === 1 ? '' : 's'}</span>`).join('');
  }

  const chartSets = {
    7: [0.26,0.31,0.28,0.42,0.37,0.53,0.48,0.58,0.46,0.62,0.57,0.72,0.66,0.8,0.73,0.91],
    30: [0.18,0.24,0.2,0.31,0.27,0.38,0.34,0.29,0.44,0.39,0.5,0.45,0.56,0.47,0.63,0.55,0.68,0.6,0.73,0.65,0.58,0.78,0.69,0.83,0.74,0.87,0.78,0.94],
    90: [0.16,0.2,0.18,0.27,0.24,0.31,0.29,0.34,0.3,0.4,0.37,0.45,0.39,0.49,0.43,0.54,0.48,0.57,0.52,0.61,0.55,0.65,0.6,0.7,0.64,0.74,0.67,0.79,0.72,0.84,0.77,0.91]
  };

  function chartMarkup(range) {
    const visitors = chartSets[range] || chartSets[30];
    const views = visitors.map((value, index) => Math.min(.98, value * 1.24 + .055 + Math.sin(index * 1.4) * .025));
    const line = (values) => values.map((value, index) => `${index ? 'L' : 'M'} ${(index / (values.length - 1) * 760).toFixed(1)} ${(190 - value * 166).toFixed(1)}`).join(' ');
    const area = `${line(visitors)} L 760 190 L 0 190 Z`;
    return `<svg viewBox="0 0 760 190" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="visitor-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#bd7937" stop-opacity=".18"/><stop offset="1" stop-color="#bd7937" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#visitor-fill)"/><path d="${line(views)}" fill="none" stroke="#b8c5b7" stroke-width="2.5" vector-effect="non-scaling-stroke"/><path d="${line(visitors)}" fill="none" stroke="#bd7937" stroke-width="2.5" vector-effect="non-scaling-stroke"/><circle cx="760" cy="${(190 - visitors.at(-1) * 166).toFixed(1)}" r="4" fill="#bd7937" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function updateCharts(range) {
    $$('.traffic-chart').forEach((chart) => { chart.innerHTML = chartMarkup(range); });
    const metrics = sampleValues[range] || sampleValues[30];
    $('#metric-visitors').textContent = metrics.visitors;
    $('#metric-views').textContent = metrics.views;
    $('#metric-engagement').innerHTML = `${metrics.engagement}<span>%</span>`;
    const visitorTrend = $('.metric-card:nth-child(1) .trend-up');
    const viewTrend = $('.metric-card:nth-child(2) .trend-up');
    const engagementTrend = $('.metric-card:nth-child(3) .trend-up');
    if (visitorTrend) visitorTrend.textContent = `↗ ${metrics.changes[0]}`;
    if (viewTrend) viewTrend.textContent = `↗ ${metrics.changes[1]}`;
    if (engagementTrend) engagementTrend.textContent = `↗ ${metrics.changes[2]}`;
  }

  function renderTopContent() {
    const top = [...entries].sort((a, b) => b.views - a.views).slice(0, 4);
    const markup = top.map((entry) => `<div class="top-content-row"><span class="top-content-thumb">${entry.image ? `<img src="${escapeHtml(entry.image)}" alt="" loading="lazy" />` : ''}</span><span class="top-content-copy"><strong>${escapeHtml(entry.title)}</strong><small>${kindLabel(entry.kind)} · ${escapeHtml(entry.category || 'General')}</small></span><span class="top-content-value">${formatViews(entry.views)}</span></div>`).join('');
    $('#top-content-list').innerHTML = markup;
    $('#analytics-top-pages').innerHTML = markup;
  }

  function renderSources() {
    const sources = [['Organic search', 41, '10,190'], ['Direct', 28, '6,961'], ['Social media', 19, '4,723'], ['Referral', 12, '2,986']];
    $('#source-list').innerHTML = sources.map(([label, amount, total]) => `<div class="source-row"><span class="source-name">${label}</span><span class="source-number">${total} <span>· ${amount}%</span></span><span class="source-track"><span style="width:${amount}%"></span></span></div>`).join('');
  }

  function renderAll() {
    renderCounts();
    renderRecent();
    renderContentTable();
    renderTopContent();
    renderSources();
    updateCharts(30);
  }

  function setView(name) {
    const viewName = name || 'overview';
    $$('.view-panel').forEach((panel) => {
      const active = panel.id === `${viewName}-view`;
      panel.classList.toggle('is-visible', active);
      panel.hidden = !active;
    });
    $$('.dashboard-nav [data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === viewName));
    const labels = { overview: 'Overview', content: 'Content library', analytics: 'Analytics' };
    $('#breadcrumb-current').textContent = labels[viewName] || 'Overview';
    $('#dashboard-sidebar').classList.remove('is-open');
    history.replaceState(null, '', `#${viewName}`);
  }

  function openDialog(entry = null) {
    const form = $('#content-form');
    form.reset();
    $('#entry-id').value = entry?.id || '';
    $('#dialog-title').innerHTML = entry ? 'Edit <i>entry.</i>' : 'New <i>entry.</i>';
    $('#dialog-kicker').textContent = entry ? 'UPDATE CONTENT' : 'CREATE CONTENT';
    $('#entry-kind').disabled = Boolean(entry);
    $('#project-options').hidden = (entry?.kind || $('#entry-kind').value) !== 'project';
    if (entry) {
      $('#entry-kind').value = entry.kind;
      $('#entry-status').value = entry.status;
      $('#entry-title').value = entry.title;
      $('#entry-description').value = entry.description || '';
      $('#entry-image').value = entry.image || '';
      $('#entry-category').value = entry.category || '';
      if (entry.kind === 'project') {
        $('#project-section').value = entry.section || 'upcoming';
        $('#project-image-alt').value = entry.imageAlt || '';
        $('#project-funding').value = entry.fundingPercent ?? 0;
        $('#project-days').value = entry.daysRemaining ?? 0;
        $('#project-backers').value = entry.backers ?? 0;
        $('#project-progress').value = entry.progressWidth ?? 0;
        $('#project-link').value = entry.link || '';
      }
    } else {
      $('#entry-kind').disabled = false;
      $('#entry-status').value = $('#entry-kind').value === 'project' ? 'Coming soon' : 'Draft';
      $('#project-section').value = 'upcoming';
      $('#project-image-alt').value = '';
      $('#project-funding').value = 0;
      $('#project-days').value = 0;
      $('#project-backers').value = 0;
      $('#project-progress').value = 0;
      $('#project-link').value = '';
    }
    $('#content-dialog').showModal();
    $('#entry-title').focus();
  }

  async function saveForm(event) {
    event.preventDefault();
    const id = $('#entry-id').value;
    const existing = entries.find((entry) => entry.id === id);
    const kind = existing?.kind || $('#entry-kind').value;
    const title = $('#entry-title').value.trim();
    const description = $('#entry-description').value.trim();
    const category = $('#entry-category').value.trim() || (kind === 'blog' ? 'Journal' : kindLabel(kind));
    const image = $('#entry-image').value.trim();
    const status = $('#entry-status').value;
    const previousEntries = structuredClone(entries);
    if (existing) {
      Object.assign(existing, { title, description, category, image, status, updated: 'Just now' });
      if (kind === 'project') Object.assign(existing, {
        section: $('#project-section').value,
        category: $('#project-section').value === 'live' ? 'Live project' : 'Upcoming project',
        fundingPercent: Number($('#project-funding').value), daysRemaining: Number($('#project-days').value),
        backers: Number($('#project-backers').value), progressWidth: Number($('#project-progress').value),
        imageAlt: $('#project-image-alt').value.trim(), link: $('#project-link').value.trim()
      });
    } else {
      const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const section = kind === 'project' ? $('#project-section').value : '';
      entries.unshift({ id: `${kind}-${Date.now()}`, sourceId: kind === 'project' ? (slug || `project-${Date.now()}`) : undefined, kind, title, description, category: kind === 'project' ? (section === 'live' ? 'Live project' : 'Upcoming project') : category, image, status, updated: 'Just now', views: 0, slug,
        ...(kind === 'project' ? {
          section, imageAlt: $('#project-image-alt').value.trim() || `${title} campaign artwork`, fundingPercent: Number($('#project-funding').value),
          daysRemaining: Number($('#project-days').value), backers: Number($('#project-backers').value),
          progressWidth: Number($('#project-progress').value), link: $('#project-link').value.trim()
        } : {})
      });
    }
    try {
      if (kind === 'project') await saveProjectsToSite();
      else if (!saveEntries()) throw new Error('Could not save this entry in the browser.');
    } catch (error) {
      entries = previousEntries;
      renderAll();
      showToast(error.message || 'Could not save the project changes.');
      return;
    }
    renderAll();
    $('#content-dialog').close();
    setView('content');
    showToast(kind === 'project' ? (projectSaveMode === 'local-preview' ? 'Project changes synced in this browser.' : 'Project changes are live on the site.') : (existing ? 'Entry updated in this browser.' : 'Entry added in this browser.'));
  }

  function handleTableAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const entry = entries.find((item) => item.id === button.dataset.id);
    if (!entry) return;
    if (button.dataset.action === 'edit') openDialog(entry);
    if (button.dataset.action === 'delete') {
      if (!window.confirm(entry.kind === 'project' ? `Remove “${entry.title}” from the public project sections? This will update the homepage and Projects page.` : `Remove “${entry.title}” from this browser’s dashboard?`)) return;
      const previousEntries = structuredClone(entries);
      entries = entries.filter((item) => item.id !== entry.id);
      const save = entry.kind === 'project' ? saveProjectsToSite() : Promise.resolve(saveEntries() || Promise.reject(new Error('Could not save this entry in the browser.')));
      save.then(() => showToast(entry.kind === 'project' ? (projectSaveMode === 'local-preview' ? 'Project removed from this browser’s preview.' : 'Project removed from the public site.') : 'Entry removed from this browser.')).catch((error) => {
        entries = previousEntries;
        renderAll();
        showToast(error.message || 'Could not remove the entry.');
      });
      renderAll();
    }
  }

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), note: 'Project entries are also saved on the website; journal and book edits in this dashboard are local only.', entries };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'verseluft-dashboard-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Dashboard data exported as JSON.');
  }

  $$('.dashboard-nav [data-view], [data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  $$('.nav-filter').forEach((button) => button.addEventListener('click', () => {
    activeFilter = button.dataset.kind;
    $$('.manager-tab').forEach((tab) => {
      const active = tab.dataset.filter === activeFilter;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    setView('content');
    renderContentTable();
  }));
  $$('.manager-tab').forEach((button) => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    $$('.manager-tab').forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    renderContentTable();
  }));
  $$('#content-table-body, #recent-table-body').forEach((table) => table.addEventListener('click', handleTableAction));
  $$('.primary-button[data-create]').forEach((button) => button.addEventListener('click', () => openDialog()));
  $('#content-form').addEventListener('submit', saveForm);
  $('#dialog-close').addEventListener('click', () => $('#content-dialog').close());
  $('#dialog-cancel').addEventListener('click', () => $('#content-dialog').close());
  $('#content-dialog').addEventListener('click', (event) => { if (event.target === $('#content-dialog')) $('#content-dialog').close(); });
  $('#content-search').addEventListener('input', renderContentTable);
  $('#export-button').addEventListener('click', exportData);
  $('#mobile-menu').addEventListener('click', () => $('#dashboard-sidebar').classList.toggle('is-open'));
  $('#dismiss-sample').addEventListener('click', () => $('.view-panel.is-visible .sample-banner')?.remove());
  ['#overview-range', '#analytics-range'].forEach((selector) => $(selector).addEventListener('change', (event) => updateCharts(Number(event.target.value))));
  $('#entry-kind').addEventListener('change', (event) => {
    const isProject = event.target.value === 'project';
    $('#project-options').hidden = !isProject;
    $('#entry-status').value = isProject ? 'Coming soon' : 'Draft';
  });
  $('#project-section').addEventListener('change', (event) => { $('#entry-status').value = event.target.value === 'live' ? 'In progress' : 'Coming soon'; });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setView('content');
      $('#content-search').focus();
    }
  });
  const today = new Date();
  $('#today-label').textContent = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  $('#overview-date').textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const hour = today.getHours();
  $('#greeting').textContent = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';
  const hashView = location.hash.slice(1);
  if (['overview', 'content', 'analytics'].includes(hashView)) setView(hashView);
  loadEntries();
})();
