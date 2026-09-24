const backdropDemo = document.querySelector('#backdrop-demo');
const sceneStatus = document.querySelector('#scene-status');
const sceneChoices = [...document.querySelectorAll('.scene-choice')];
const sceneCopy = {
  aurora: {
    number: '01',
    kicker: '01 / VEIL OF LIGHT',
    title: 'A little wonder',
    accent: 'in the distance.',
    caption: 'Slow gradients · soft stars · pointer-reactive light',
    label: 'Veil of light',
  },
  embers: {
    number: '02',
    kicker: '02 / EMBERFALL',
    title: 'The fire remembers',
    accent: 'every story.',
    caption: 'Drifting sparks · warm glow · layered atmosphere',
    label: 'Emberfall',
  },
  cartography: {
    number: '03',
    kicker: '03 / LIVING MAP',
    title: 'Old paths shift',
    accent: 'when you look away.',
    caption: 'Slow contour lines · a traveling glint · gentle drift',
    label: 'Living map',
  },
  moonlit: {
    number: '04',
    kicker: '04 / MOONLIT TIDE',
    title: 'Let the silence',
    accent: 'move like water.',
    caption: 'Liquid reflections · a breathing moon · slow ripples',
    label: 'Moonlit tide',
  },
  inkbloom: {
    number: '05',
    kicker: '05 / INK BLOOM',
    title: 'A thought takes shape',
    accent: 'before the words arrive.',
    caption: 'Organic clouds · soft color · slow diffusion',
    label: 'Ink bloom',
  },
  lanterns: {
    number: '06',
    kicker: '06 / LANTERN DRIFT',
    title: 'Keep one light',
    accent: 'for the road home.',
    caption: 'Floating glows · warm flicker · a little mystery',
    label: 'Lantern drift',
  },
};

sceneChoices.forEach((choice) => {
  choice.addEventListener('click', () => {
    const sceneName = choice.dataset.scene;
    const scene = sceneCopy[sceneName];
    backdropDemo.dataset.scene = sceneName;
    sceneChoices.forEach((button) => {
      const active = button === choice;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('#scene-kicker').textContent = scene.kicker;
    document.querySelector('#scene-heading').innerHTML = `${scene.title}<br /><i>${scene.accent}</i>`;
    document.querySelector('#scene-caption').textContent = scene.caption;
    document.querySelector('#scene-counter').innerHTML = `${scene.number} <i>/</i> 06`;
    sceneStatus.textContent = `${scene.label} background selected`;
  });
});

backdropDemo.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  const bounds = backdropDemo.getBoundingClientRect();
  backdropDemo.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
  backdropDemo.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
});
backdropDemo.addEventListener('pointerleave', () => {
  backdropDemo.style.setProperty('--pointer-x', '50%');
  backdropDemo.style.setProperty('--pointer-y', '48%');
});

const tiltStage = document.querySelector('#tilt-stage');
const tiltBook = document.querySelector('#tilt-book');
tiltStage.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  const bounds = tiltBook.getBoundingClientRect();
  const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
  const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2));
  tiltBook.style.setProperty('--rotate-x', `${-y * 13}deg`);
  tiltBook.style.setProperty('--rotate-y', `${x * 16}deg`);
  tiltStage.style.setProperty('--light-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
  tiltStage.style.setProperty('--light-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  tiltBook.style.setProperty('--sheen-x', `${x * 82}px`);
});
tiltStage.addEventListener('pointerleave', () => {
  tiltBook.style.removeProperty('--rotate-x');
  tiltBook.style.removeProperty('--rotate-y');
  tiltBook.style.removeProperty('--sheen-x');
  tiltStage.style.removeProperty('--light-x');
  tiltStage.style.removeProperty('--light-y');
});
tiltBook.addEventListener('click', () => {
  const tilted = tiltBook.classList.toggle('is-tilted');
  tiltBook.setAttribute('aria-pressed', String(tilted));
});

const magneticStage = document.querySelector('#magnetic-stage');
const magneticButton = document.querySelector('#magnetic-button');
magneticStage.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  const bounds = magneticButton.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const x = Math.max(-1, Math.min(1, (event.clientX - centerX) / 120));
  const y = Math.max(-1, Math.min(1, (event.clientY - centerY) / 120));
  magneticButton.style.setProperty('--pull-x', `${x * 9}px`);
  magneticButton.style.setProperty('--pull-y', `${y * 7}px`);
});
magneticStage.addEventListener('pointerleave', () => {
  magneticButton.style.setProperty('--pull-x', '0px');
  magneticButton.style.setProperty('--pull-y', '0px');
});

const revealCard = document.querySelector('#reveal-card');
const revealTrigger = document.querySelector('#reveal-trigger');
revealTrigger.addEventListener('click', () => {
  const isOpen = revealCard.classList.toggle('is-open');
  revealTrigger.setAttribute('aria-expanded', String(isOpen));
  revealTrigger.innerHTML = isOpen
    ? 'Close the field note <span aria-hidden="true">↑</span>'
    : 'Read the field note <span aria-hidden="true">↓</span>';
});

const compassStage = document.querySelector('#compass-stage');
const compass = document.querySelector('#compass');
const compassNeedle = document.querySelector('.compass-needle');
const pointCompass = (event) => {
  if (event.pointerType === 'touch') return;
  const bounds = compassStage.getBoundingClientRect();
  const x = event.clientX - (bounds.left + bounds.width / 2);
  const y = event.clientY - (bounds.top + bounds.height / 2);
  const angle = Math.atan2(y, x) * 180 / Math.PI + 90;
  compass.style.setProperty('--compass-angle', `${angle}deg`);
  compassNeedle.style.transform = `translateX(-50%) rotate(${-angle}deg)`;
  compassStage.style.setProperty('--compass-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
  compassStage.style.setProperty('--compass-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
};
compassStage.addEventListener('pointermove', pointCompass);
compassStage.addEventListener('pointerleave', () => {
  compass.style.setProperty('--compass-angle', '0deg');
  compassNeedle.style.removeProperty('transform');
  compassStage.style.removeProperty('--compass-x');
  compassStage.style.removeProperty('--compass-y');
});
compass.addEventListener('click', () => {
  compass.classList.toggle('is-awake');
});

const constellationStage = document.querySelector('#constellation-stage');
const starNodes = [...document.querySelectorAll('.star-node')];
const constellationMessage = document.querySelector('#constellation-message');
const constellationCount = document.querySelector('#constellation-count');
starNodes.forEach((star) => {
  star.addEventListener('click', () => {
    const awake = star.getAttribute('aria-pressed') !== 'true';
    star.setAttribute('aria-pressed', String(awake));
    const total = starNodes.filter((node) => node.getAttribute('aria-pressed') === 'true').length;
    constellationStage.classList.toggle('has-stars', total > 0);
    constellationStage.classList.toggle('is-complete', total === starNodes.length);
    constellationCount.textContent = `${total} / 5 lights awake`;
    constellationMessage.textContent = total === starNodes.length
      ? 'The old shape is awake again.'
      : total > 2
        ? 'The path is beginning to show.'
        : 'Touch the stars to draw a path.';
  });
});

const pauseButton = document.querySelector('#toggle-motion');
pauseButton.addEventListener('click', () => {
  const paused = document.body.classList.toggle('motion-paused');
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.innerHTML = paused
    ? 'Resume motion <span aria-hidden="true">▶</span>'
    : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
});

const reducedButton = document.querySelector('#reduced-motion');
reducedButton.addEventListener('click', () => {
  const reduced = document.body.classList.toggle('reduced-preview');
  reducedButton.setAttribute('aria-pressed', String(reduced));
  reducedButton.innerHTML = reduced
    ? 'Restore full motion <span aria-hidden="true">↗</span>'
    : 'Preview reduced motion <span aria-hidden="true">↗</span>';
});

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.body.classList.add('reduced-preview');
  reducedButton.setAttribute('aria-pressed', 'true');
  reducedButton.disabled = true;
  reducedButton.textContent = 'Reduced motion is active';
}
