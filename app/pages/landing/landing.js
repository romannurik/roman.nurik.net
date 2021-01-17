import './landing.scss';

export function LandingPage() {
  let update = () => document.body.style.setProperty('--vh', `${window.innerHeight / 100}px`);
  update();
  window.addEventListener('resize', update, false);

  window.addEventListener('load', () => {
    for (let link of document.querySelectorAll('.obfuscated-email')) {
      let email = link.getAttribute('data-email');
      if (email) {
        link.setAttribute('href', 'mailto:' + email
            .replace(/ /, '@')
            .replace(/ /, '.'));
      }
    }
  });
}