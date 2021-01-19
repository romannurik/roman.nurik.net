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

scroll(2, 1000);