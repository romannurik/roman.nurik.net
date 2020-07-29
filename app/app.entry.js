require('./app.entry.scss');

import pages from './pages/**/*.js';
window.pages = pages.reduce((acc, val) => Object.assign(acc, val), {});
