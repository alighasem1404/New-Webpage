(() => {
  const LOCAL_PREVIEW_KEY = 'verseluft-projects-preview-v1';
  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isFilePreview = window.location.protocol === 'file:';
  const filePreviewProjects = [
    { id: 'the-wilds-beyond', section: 'live', title: 'The Wilds Beyond', description: 'An adventure guide for D&D campaigns. Follow hidden roads, explore strange horizons, and discover stories beyond the lantern light.', image: 'assets/test%20images/banner%20(4).webp', imageAlt: 'The Wilds Beyond campaign artwork', fundingPercent: 412, daysRemaining: 18, backers: 1800, progressWidth: 82 },
    { id: 'city-of-embers', section: 'live', title: 'City of Embers', description: 'A D&D campaign setting of rooftops and old magic. Explore a city that refuses to go quietly into the dark.', image: 'assets/test%20images/banner%202.webp', imageAlt: 'City of Embers campaign artwork', fundingPercent: 238, daysRemaining: 9, backers: 940, progressWidth: 58 },
    { id: 'the-lantern-moth', section: 'live', title: 'The Lantern Moth', description: 'A creature compendium for your D&D campaign. Discover strange monsters and encounter ideas that make every road feel alive.', image: 'assets/test%20images/banner.webp', imageAlt: 'The Lantern Moth campaign artwork', fundingPercent: 176, daysRemaining: 24, backers: 620, progressWidth: 46 },
    { id: 'ash-and-oath', section: 'live', title: 'Ash & Oath', description: 'A short D&D campaign of old promises and dangerous ruins. Give your players choices that shape the story and leave a mark.', image: 'assets/test%20images/bbeg%20banner%201.webp', imageAlt: 'Ash and Oath campaign artwork', fundingPercent: 109, daysRemaining: 6, backers: 310, progressWidth: 31 },
    { id: 'the-glass-isles', section: 'upcoming', title: 'The Glass Isles', description: 'A nautical hexcrawl for D&D, with island maps and impossible tides. Chart a course through a sea that remembers everyone who crosses it.', image: 'assets/test%20images/banner%20(4).webp', imageAlt: 'The Glass Isles cover artwork', status: 'Coming soon' },
    { id: 'mercenary-organizations', section: 'upcoming', title: 'Mercenary Organizations', description: 'A faction guide for Dungeon Masters. Build rival mercenary companies and put the cost of victory at the heart of your D&D campaign.', image: 'assets/test%20images/banner%202.webp', imageAlt: 'Mercenary Organizations cover artwork', status: 'Coming soon' },
    { id: 'the-entertainers', section: 'upcoming', title: 'The Entertainers', description: 'Performer NPCs and entertainment traditions for D&D. Bring memorable characters and new stories to the stages and taverns of your world.', image: 'assets/test%20images/banner.webp', imageAlt: 'The Entertainers cover artwork', status: 'Coming soon' },
    { id: 'villain-story-engine', section: 'upcoming', title: 'Villain Story Engine', description: 'A Dungeon Master toolkit for memorable D&D villains. Use their secrets, plans, and lairs to drive your campaign forward.', image: 'assets/test%20images/bbeg%20banner%201.webp', imageAlt: 'Villain Story Engine cover artwork', status: 'Coming soon' },
  ];
  const liveGrid = document.querySelector('#live-projects-grid, #live-projects');
  const deck = document.querySelector('#upcoming-deck');
  if (!liveGrid && !deck) return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const number = (value) => new Intl.NumberFormat('en-US').format(Number(value) || 0);
  const backers = (value) => {
    const count = Number(value) || 0;
    return count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k` : number(count);
  };
  const cardMarkup = (project, section, index) => {
    const title = escapeHtml(project.title);
    const image = escapeHtml(project.image);
    const alt = escapeHtml(project.imageAlt || `${project.title} artwork`);
    const description = escapeHtml(project.description);
    const link = /^https:\/\//i.test(project.link || '') ? project.link : '';
    if (section === 'upcoming') {
      const action = link
        ? `<a class="notify-label" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.status || 'Coming soon')} <b>↗</b></a>`
        : '<span class="notify-label">Coming soon</span>';
      return `<article class="project-card upcoming-card deck-${index}" data-project-id="${escapeHtml(project.id)}"><div class="project-art"><img class="project-banner" src="${image}" alt="${alt}" width="1672" height="941" loading="lazy" decoding="async" /></div><div class="project-card-body"><div><span class="project-status upcoming">◌ ${escapeHtml(project.status || 'Coming soon')}</span><h3>${title}</h3><p>${description}</p></div>${action}</div></article>`;
    }
    const action = link
      ? `<a class="project-arrow" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" aria-label="View ${title} campaign">↗</a>`
      : '';
    const percent = Math.min(100, Math.max(0, Number(project.progressWidth) || 0));
    return `<article class="project-card${index === 0 ? ' project-card-large' : ''}" data-project-id="${escapeHtml(project.id)}"><div class="project-art"><img class="project-banner" src="${image}" alt="${alt}" width="1672" height="941" loading="lazy" decoding="async" /></div><div class="project-card-body"><div><h3>${title}</h3><p>${description}</p></div><div class="project-meta"><span><strong>${number(project.fundingPercent)}%</strong> funded</span><span><strong>${number(project.daysRemaining)} days</strong> to go</span><span><strong>${backers(project.backers)}</strong> backers</span></div><div class="live-bottom-row"><div class="funding-bar"><span style="width:${percent}%"></span></div>${action}</div></div></article>`;
  };

  let upcomingCards = [];
  let upcomingIndex = 0;
  let timerStart = performance.now();
  let timerPaused = false;
  const timerDuration = 7000;
  const current = document.querySelector('#upcoming-current');
  const total = document.querySelector('#upcoming-total');
  const progress = document.querySelector('#upcoming-progress-bar, #upcoming-timer-bar');
  const prev = document.querySelector('#upcoming-prev');
  const next = document.querySelector('#upcoming-next');

  function updateUpcomingDeck() {
    if (!upcomingCards.length) return;
    upcomingCards.forEach((card, index) => {
      const offset = (index - upcomingIndex + upcomingCards.length) % upcomingCards.length;
      card.className = `project-card upcoming-card deck-${offset}`;
      card.setAttribute('aria-hidden', String(offset > 2));
    });
    if (current) current.textContent = String(upcomingIndex + 1).padStart(2, '0');
    if (progress) progress.style.width = `${((upcomingIndex + 1) / upcomingCards.length) * 100}%`;
  }

  function moveUpcoming(direction) {
    if (upcomingCards.length < 2) return;
    upcomingIndex = (upcomingIndex + direction + upcomingCards.length) % upcomingCards.length;
    timerStart = performance.now();
    if (progress) progress.style.width = '0%';
    updateUpcomingDeck();
  }

  if (prev) prev.addEventListener('click', () => moveUpcoming(-1));
  if (next) next.addEventListener('click', () => moveUpcoming(1));
  const deckWrap = document.querySelector('.upcoming-deck-wrap');
  if (deckWrap) {
    deckWrap.addEventListener('mouseenter', () => { timerPaused = true; });
    deckWrap.addEventListener('mouseleave', () => { timerPaused = false; timerStart = performance.now(); });
  }

  const projectData = isFilePreview
    ? Promise.resolve({ projects: filePreviewProjects })
    : fetch('/projects/data/projects.json', { cache: 'no-store' }).then((response) => {
      if (!response.ok) throw new Error(`Project data returned ${response.status}`);
      return response.json();
    });

  projectData
    .then((data) => {
      if (!data || !Array.isArray(data.projects)) throw new Error('Project data is not in the expected format.');
      if (isLocalPreview) {
        try {
          const previewProjects = JSON.parse(localStorage.getItem(LOCAL_PREVIEW_KEY) || 'null');
          if (Array.isArray(previewProjects)) data.projects = previewProjects;
        } catch (error) {
          console.warn('Could not read local project preview changes.', error);
        }
      }
      const live = data.projects.filter((project) => project.section === 'live');
      const upcoming = data.projects.filter((project) => project.section === 'upcoming');
      if (liveGrid) {
        liveGrid.innerHTML = live.map((project, index) => cardMarkup(project, 'live', index)).join('');
        liveGrid.setAttribute('aria-busy', 'false');
      }
      if (deck) {
        const firstNav = deck.querySelector('.upcoming-nav');
        let previousCard = null;
        deck.querySelectorAll('.upcoming-card').forEach((card) => card.remove());
        upcoming.forEach((project, index) => {
          const template = document.createElement('template');
          template.innerHTML = cardMarkup(project, 'upcoming', index).trim();
          const card = template.content.firstElementChild;
          if (previousCard) previousCard.after(card);
          else deck.insertBefore(card, firstNav || null);
          previousCard = card;
        });
        upcomingCards = [...deck.querySelectorAll('.upcoming-card')];
        deck.setAttribute('aria-busy', 'false');
        if (total) total.textContent = String(upcomingCards.length).padStart(2, '0');
        updateUpcomingDeck();
      }
      if (upcomingCards.length > 1) {
        function animateUpcoming(timestamp) {
          if (!timerPaused) {
            const elapsed = timestamp - timerStart;
            if (progress) progress.style.width = `${Math.min(elapsed / timerDuration, 1) * 100}%`;
            if (elapsed >= timerDuration) moveUpcoming(1);
          }
          requestAnimationFrame(animateUpcoming);
        }
        requestAnimationFrame(animateUpcoming);
      }
    })
    .catch((error) => {
      console.error('Could not load the project list.', error);
      if (liveGrid) {
        liveGrid.innerHTML = '<p class="project-load-error">Project information is temporarily unavailable. Please try again soon.</p>';
        liveGrid.setAttribute('aria-busy', 'false');
      }
      if (deck) deck.setAttribute('aria-busy', 'false');
    });

  if (isLocalPreview) {
    window.addEventListener('storage', (event) => {
      if (event.key === LOCAL_PREVIEW_KEY) window.location.reload();
    });
  }
})();
