import FastClick from 'fastclick';

export function LandingPage() {
  window.addEventListener('load', () => {
    FastClick.attach(document.body);

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