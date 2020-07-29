import FastClick from 'fastclick';
import $ from 'jquery';

export function LandingPage() {
  $(document).ready(function() {
    console.log('f');
    FastClick.attach(document.body);

    // Show my email address
    var $emailLinks = $('.email.obfuscated');
    if ($emailLinks.data('email')) {
      var obfuscated = $emailLinks.data('email');
      $emailLinks.attr('href', 'mailto:' + obfuscated
            .replace(/ /, '@')
            .replace(/ /, '.'));
    }
  });
}