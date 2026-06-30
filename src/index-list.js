// Scrolly essay: hovering a highlighted word reveals a cursor-following image
// preview. Everything is mockup — the preview box just shows the word's label.

const preview = document.querySelector('.hover-preview');
const words = document.querySelectorAll('.reveal-word');

if (preview && words.length) {
  const imageBox = preview.querySelector('.preview-image');
  let active = false;

  words.forEach(word => {
    word.addEventListener('mouseenter', () => {
      imageBox.textContent = word.dataset.image || 'image';
      preview.classList.add('is-visible');
      active = true;
    });
    word.addEventListener('mouseleave', () => {
      preview.classList.remove('is-visible');
      active = false;
    });
  });

  window.addEventListener('mousemove', event => {
    if (!active) return;
    preview.style.left = `${event.clientX}px`;
    preview.style.top = `${event.clientY}px`;
  });
}
