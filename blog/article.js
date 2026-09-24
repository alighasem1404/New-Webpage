(() => {
  const articles = {
    'worldbuilding-playable': {
      number: '01', category: 'Behind the scenes', read: '8 min read', date: 'September 14, 2026',
      title: 'D&D worldbuilding: what makes a setting playable?',
      dek: 'A memorable D&D setting gives players reasons to explore.',
      intro: 'A good setting is not a pile of lore. It is a set of invitations: places to go, people to meet, and questions your players can answer through play.',
      image: '/assets/test%20images/article%20PH1.webp', imageAlt: 'Fantasy city illuminated by lava',
      paragraphOne: 'Before naming a dynasty or drawing a coastline, decide what your table should be curious about. A strong question gives every location a little tension and gives players a reason to move through the world.',
      paragraphTwo: 'Build outward from that question. Let the answer show up in a tavern rumour, a half-finished map, or a choice that changes who controls the road home.',
      quote: '“The best setting notes leave a door open for the players to walk through.”',
      paragraphThree: 'Keep the details that create decisions. A short list of pressures, relationships, and useful locations will serve a session better than pages of history nobody can touch.',
      list: ['Give each place a problem that can change.', 'Give each important character a want the players can understand.', 'Give the group at least one question only they can answer.'],
      inlineImage: '/assets/test%20images/article%20PH2.webp', inlineAlt: 'Dark fantasy character in a candlelit room', inlineCaption: 'A useful note gives the table somewhere to begin.',
      paragraphFour: 'When the page is ready, you should be able to point to the next choice. That is the test: does this detail help the table decide, discover, or care?'
    },
    'quiet-scenes': {
      number: '02', category: 'DM advice', read: '5 min read', date: 'September 10, 2026',
      title: '5 ways to make quiet D&D scenes matter',
      dek: 'Give your players space to notice, question, and choose.',
      intro: 'Not every memorable scene needs a battle map. Quiet moments create texture, reveal what characters value, and give the party time to decide what matters next.',
      image: '/assets/test%20images/article%20PH2.webp', imageAlt: 'Dark fantasy character in a candlelit room',
      paragraphOne: 'Start with a small interruption: a letter with no sender, a door left open, or a familiar song from a place nobody should know. A quiet scene becomes useful when it asks the group to pay attention.',
      paragraphTwo: 'Give the moment a choice. Players can follow the thread, ignore it, or reshape it. Each answer tells you what kind of story the table wants to make.',
      quote: '“A pause is still a decision when the table knows something is waiting.”',
      paragraphThree: 'Let the consequences travel. A quiet choice can change a relationship, close a route, or give the next fight a personal reason to exist.',
      list: ['Put one specific detail in the room.', 'Give the players two understandable responses.', 'Let the choice return later in a changed form.'],
      inlineImage: '/assets/test%20images/article%20PH4.webp', inlineAlt: 'Dark fantasy queen in a candlelit hall', inlineCaption: 'Small scenes become landmarks when their choices carry forward.',
      paragraphFour: 'If the scene makes the next decision clearer, it has done its work. Keep the silence, then follow what the players noticed.'
    },
    'supplement-process': {
      number: '03', category: 'Making games', read: '7 min read', date: 'September 05, 2026',
      title: 'Creating a D&D supplement: from idea to table',
      dek: 'See how a loose premise becomes a useful book through playtesting, editing, and questions at the table.',
      intro: 'A supplement only earns its place on the shelf when it makes play easier, richer, or more surprising. Every draft is a chance to move closer to that promise.',
      image: '/assets/test%20images/article%20PH3.webp', imageAlt: 'Alchemist in a candlelit workshop',
      paragraphOne: 'The first draft is a container for possibility. We start with the table problem we want to solve, then write enough material to learn what the idea wants to become.',
      paragraphTwo: 'Playtesting turns assumptions into evidence. The questions from a real table show which pieces need more room and which explanations can disappear.',
      quote: '“The table is where an idea learns what it is for.”',
      paragraphThree: 'Editing is not a polish pass at the end. It is the work of making every page point toward a decision, a useful reference, or a moment worth remembering.',
      list: ['Name the table problem before the page count.', 'Test the most uncertain idea first.', 'Cut anything that does not help the reader act.'],
      inlineImage: '/assets/test%20images/article%20PH3.webp', inlineAlt: 'Workshop tools and notes', inlineCaption: 'A finished page should feel ready to use, not merely finished.',
      paragraphFour: 'When a book can leave the page and work at the table, the process has reached its goal.'
    },
    'upcoming-books': {
      number: '04', category: 'News', read: '3 min read', date: 'September 02, 2026',
      title: 'Upcoming D&D books from Verseluft',
      dek: 'A first look at the adventures, settings, and tools coming next.',
      intro: 'The next shelf is taking shape. Here is what we are exploring, testing, and preparing for your table.',
      image: '/assets/test%20images/article%20PH4.webp', imageAlt: 'Dark fantasy queen in a candlelit hall',
      paragraphOne: 'New books begin with a table question: what would make a session easier to run or more exciting to play? From there, every outline and prototype has to earn its place.',
      paragraphTwo: 'We are building a mix of adventures, settings, and practical resources so each release can support a different kind of campaign.',
      quote: '“The next book should give your table a new door to open.”',
      paragraphThree: 'As these projects develop, we will share playtest notes, early art, and the decisions that shape the final pages.',
      list: ['Follow each project from first outline to final edit.', 'Look for playtest calls and preview pages.', 'Tell us what your table wants to see next.'],
      inlineImage: '/assets/test%20images/article%20PH1.webp', inlineAlt: 'Fantasy city illuminated by lava', inlineCaption: 'Every release starts with a question from the table.',
      paragraphFour: 'Keep an eye on the Projects page for milestones and the Library for finished titles.'
    },
    'towns-players-change': {
      number: '05', category: 'DM advice', read: '6 min read', date: 'August 28, 2026',
      title: 'Build a town your players can change',
      dek: 'A living town gives every character a reason to leave a mark.',
      intro: 'The best towns are not backdrops. They are systems of wants, routines, and pressure that respond when the party gets involved.',
      image: '/assets/test%20images/article%20PH1.webp', imageAlt: 'Fantasy city at night',
      paragraphOne: 'Give the town a problem that is already moving before the party arrives. A missing bridge, a tense election, or a closed market makes the first conversation matter.',
      paragraphTwo: 'Then give players more than one way to help. A town becomes theirs when different choices create different futures.',
      quote: '“A town feels alive when the party can change its next morning.”',
      paragraphThree: 'Track a few visible changes instead of recording everything. New faces, repaired streets, and changed prices are enough to show that choices travel.',
      list: ['Name three groups with different needs.', 'Give each group one useful offer and one cost.', 'Show the result of the party’s choices quickly.'],
      inlineImage: '/assets/test%20images/article%20PH4.webp', inlineAlt: 'Dark fantasy queen in a candlelit hall', inlineCaption: 'A changed street is proof that the table was heard.',
      paragraphFour: 'When players can point to something they changed, the town becomes part of their story.'
    },
    'adventure-hooks': {
      number: '06', category: 'Making games', read: '4 min read', date: 'August 21, 2026',
      title: 'Why constraints make better adventure hooks',
      dek: 'A clear limit can turn a familiar premise into a sharp invitation.',
      intro: 'Adventure hooks become memorable when they tell players what is urgent, what is strange, and what they can risk by getting involved.',
      image: '/assets/test%20images/article%20PH2.webp', imageAlt: 'Character study in a dark room',
      paragraphOne: 'Start with a constraint: one night, one witness, one road out. The limit creates pressure and keeps the opening easy to understand at the table.',
      paragraphTwo: 'Use the constraint to reveal character. Who breaks the rule, who protects it, and who benefits from keeping it in place?',
      quote: '“A good limit gives imagination something solid to push against.”',
      paragraphThree: 'Once play begins, let the group bend the constraint. The best hooks are clear at the start and flexible enough to become something unexpected.',
      list: ['Make the limit visible in the first scene.', 'Tie the constraint to a person, not just a clock.', 'Let the players decide what breaking it costs.'],
      inlineImage: '/assets/test%20images/article%20PH3.webp', inlineAlt: 'Alchemist in a candlelit workshop', inlineCaption: 'A sharp constraint gives a story somewhere to push.',
      paragraphFour: 'The hook has done its work when the table is already arguing about how to solve it.'
    }
  };

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || 'worldbuilding-playable';
  const article = articles[slug] || articles['worldbuilding-playable'];
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };

  setText('article-category', article.category);
  setText('article-number', article.number);
  setText('article-title', article.title);
  setText('article-dek', article.dek);
  setText('article-date', article.date);
  setText('article-read', article.read);
  setText('article-breadcrumb', article.title);
  setText('article-intro', article.intro);
  setText('article-paragraph-one', article.paragraphOne);
  setText('article-paragraph-two', article.paragraphTwo);
  setText('article-quote', article.quote);
  setText('article-paragraph-three', article.paragraphThree);
  setText('article-paragraph-four', article.paragraphFour);
  setText('article-end-number', article.number);
  const heroImage = document.querySelector('#article-hero-image');
  if (heroImage) { heroImage.src = article.image; heroImage.alt = article.imageAlt; }
  const inlineImage = document.querySelector('#article-inline-image');
  if (inlineImage) { inlineImage.src = article.inlineImage; inlineImage.alt = article.inlineAlt; }
  setText('article-inline-caption', article.inlineCaption);
  const list = document.querySelector('#article-list');
  if (list) list.innerHTML = article.list.map((item) => `<li>${item}</li>`).join('');
  document.title = `${article.title} | Verseluft Journal`;
  document.querySelector('#article-description')?.setAttribute('content', article.dek);

  const related = Object.entries(articles).filter(([key]) => key !== slug).slice(0, 3);
  const relatedGrid = document.querySelector('#article-related-grid');
  if (relatedGrid) {
    relatedGrid.innerHTML = related.map(([key, item]) => `<article class="article-related-card"><img src="${item.image}" alt="${item.imageAlt}" loading="lazy" /><div class="article-related-card-copy"><span class="blog-category">${item.category} · ${item.read}</span><h3>${item.title}</h3><a href="/blog/article.html?slug=${key}">Read the note ↗</a></div></article>`).join('');
  }
})();
