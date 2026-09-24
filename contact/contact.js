const contactForm = document.querySelector('#message-form');

if (contactForm) {
  const contactEmail = contactForm.dataset.contactEmail.trim();
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const formNote = document.querySelector('#contact-form-note');

  if (!contactEmail) {
    submitButton.disabled = true;
    formNote.textContent = 'The message form is ready for the studio’s preferred contact email.';
  } else {
    submitButton.disabled = false;
    formNote.textContent = 'Your email app will open with a draft for you to review before sending.';
  }

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactEmail) return;

    const fields = new FormData(contactForm);
    const subject = `[Verseluft website] ${fields.get('subject')}`;
    const message = [
      `Name: ${fields.get('name')}`,
      `Reply to: ${fields.get('email')}`,
      '',
      fields.get('message'),
    ].join('\n');
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
  });
}

document.querySelectorAll('[data-inquiry]').forEach((topicLink) => {
  topicLink.addEventListener('click', () => {
    const topicMap = {
      'backer-support': 'Book or campaign support',
      publishing: 'Publishing and partnerships',
      general: 'Press or general enquiry',
    };
    const subject = document.querySelector('#message-form select[name="subject"]');
    if (subject && topicMap[topicLink.dataset.inquiry]) {
      subject.value = topicMap[topicLink.dataset.inquiry];
    }
  });
});
