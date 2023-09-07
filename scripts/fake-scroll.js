// Run this in the chrome devtools to fake user scrolling for video recordings.

function scroll(numStops, delay = 3000) {
  let maxScrollY = document.body.scrollHeight - window.visualViewport.height;
  for (let i = 1; i <= numStops; i++) {
    setTimeout(() => {
      let top = (maxScrollY) / numStops * i;
      window.scrollTo({ top, behavior: 'smooth' });
      console.log(`${(i * 100 / numStops).toFixed(1)}% ... ${top}`);
    }, delay * (i - 1));
  }

  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), delay * (numStops + 1));
  console.log('back to top');
}

// idx.dev
// let stops = [0, 686, 1342, 2128, 2918, 3700, 4418]; stop = 0;

// drews
let stops = [0, 652, 1214, 1735, 2346];
window.scrollTo({ top: stops[stop++], behavior: 'smooth' });
