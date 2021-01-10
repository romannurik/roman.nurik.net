import './landing.scss';

export function LandingPage() {
  window.addEventListener('load', () => {
    for (let link of document.querySelectorAll('.email.obfuscated')) {
      let email = link.getAttribute('data-email');
      if (email) {
        link.setAttribute('href', 'mailto:' + email
            .replace(/ /, '@')
            .replace(/ /, '.'));
      }
    }
  });
}