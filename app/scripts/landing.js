'use strict';

// Show my email address
var emailNode = document.querySelector('.email.obfuscated');
if (emailNode.dataset) {
  var obfuscated = emailNode.dataset.email;
  emailNode.setAttribute('href', 'mailto:' + obfuscated
        .replace(/ /, '@')
        .replace(/ /, '.'));
}