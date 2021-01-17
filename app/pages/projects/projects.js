import './carousel';
import './lottie-player';
import './projects.scss';

export function ProjectsPage() {
  window.addEventListener('load', () => {
    setupMediaSizing();
    setupVideoMedia();
    setupFiltering();

    for (let link of document.querySelectorAll('section.project a')) {
      link.setAttribute('target', '_blank');
    }
  });
}


function setupFiltering() {
  let applyFilter = (filter, scrollTop = true) => {
    filter = filter || 'all';
    for (let project of document.querySelectorAll('section.project')) {
      let tags = new Set((project.getAttribute('data-tags') || '').split(/\s+/));
      let wasHidden = project.classList.contains('is-hidden');
      project.classList.toggle('is-hidden', !(tags.has(filter) || filter === 'all'));
      if (wasHidden) {
        // TODO: this is needed because scroll-snap creates weird default starting scroll positions
        // for previously-invisible carousels. figure out a better way.
        setTimeout(() => project.querySelector('rn-carousel').snapToPage(0, {immediate: true}));
      }
    }
    document.querySelector('section.show-all').classList.toggle('is-hidden', filter !== 'featured');
    if (scrollTop) {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  let applyFilterFromHash = () => {
    let filter = (window.location.hash || '').substring(1) || 'featured';
    applyFilter(filter, false);
    let tab = Array.from(document.querySelectorAll('.filter input')).find(t => t.value === filter);
    if (tab) {
      tab.checked = true;
    }
  };

  for (let tab of document.querySelectorAll('.filter input')) {
    tab.addEventListener('click', ev => {
      let filter = ev.currentTarget.value;
      applyFilter(filter);
      window.history.pushState(null, null, `#${filter}`);
    });
  }

  document.querySelector('.show-all-projects-button').addEventListener('click', () => {
    window.history.pushState(null, null, `#all`);
    applyFilterFromHash();
  });

  window.addEventListener('hashchange', () => applyFilterFromHash());
  applyFilterFromHash();
}



function setupVideoMedia() {
  let timeouts = new Map();

  let playPauseVideoMedia = (media, play) => {
    let video = media.querySelector('video');
    let lottie = media.querySelector('rn-lottie-player');
    if (video) {
      if (!video._listeners) {
        video._listeners = true;
        let canPlay_ = () => {
          if (media.classList.contains('is-loading')) {
            // play only if we're still supposed to play
            video.play();
          }
          video.removeEventListener('canplay', canPlay_);
          media.classList.add('is-loaded');
          media.classList.remove('is-loading');
        };
        video.addEventListener('canplay', canPlay_);
        video.addEventListener('load', canPlay_);
        video.addEventListener('pause', () => media.classList.remove('is-playing'));
        video.addEventListener('play', () => media.classList.add('is-playing'));
      }

      if (play) {
        if (!media.classList.contains('is-loaded')) {
          media.classList.add('is-loading');
          video.load();
        } else {
          video.currentTime = 0;
          video.play();
        }
      } else {
        media.classList.remove('is-loading');
        video.currentTime = 0;
        video.pause();
      }
    } else if (lottie) {
      if (play) {
        lottie.play();
      } else {
        lottie.reset();
      }
    }
  };

  let playPause = page => {
    if (timeouts.has(page)) {
      clearTimeout(timeouts.get(page));
    }
    timeouts.set(page, setTimeout(
        () => playPauseVideoMedia(page.querySelector('.media'), page.active && page.visible),
        500));
  };

  let observer = new IntersectionObserver(entries => {
    for (let entry of entries) {
      entry.target.visible = entry.intersectionRatio >= 0.5;
      playPause(entry.target);
    }
  }, {threshold: 0.5});

  for (let el of document.querySelectorAll('rn-carousel-page.video, rn-carousel-page.lottie')) {
    el.addEventListener('activechange', () => playPause(el));
    observer.observe(el);
    playPause(el);
  }
}


function setupMediaSizing() {
  // TODO: componentize this in carousel somehow
  let sizeMedia = media => {
    let child = media.children[0];
    if (!child) {
      return;
    }

    let page = media.closest('rn-carousel-page');

    // crop options
    let cropX = page.classList.contains('crop-x');
    let cropY = page.classList.contains('crop-y');
    let shouldScaleHalf = page.classList.contains('crop-scale-half');

    let computedStyle = window.getComputedStyle(media);
    let cropPosition = computedStyle.getPropertyValue('--crop-position') || null;
    if (cropPosition) {
      // assume percentage
      cropPosition = parseFloat(cropPosition);
    }

    // container dimensions
    let mw = media.offsetWidth
        - parseFloat(computedStyle.paddingLeft)
        - parseFloat(computedStyle.paddingRight);
    let mh = media.offsetHeight
        - parseFloat(computedStyle.paddingTop)
        - parseFloat(computedStyle.paddingBottom);

    // image/video/etc dimensions
    let cw = child.offsetWidth;
    let ch = child.offsetHeight;

    let scale = (shouldScaleHalf ? 0.5 : 1);
    let translate = null;

    if (cw / ch > mw / mh) {
      // image wider than container, letterbox above/below
      if (cropX) {
        // allow horizontal cropping
        scale = Math.min(scale, mh / ch);
        if (cropPosition !== null) {
          translate = {x: Math.round((mw - cw * scale) * (cropPosition - 50) / 100), y: 0};
        }
      } else {
        scale = mw / cw;
      }
    } else if (cw / ch < mw / mh) {
      // image taller than container, letterbox left/right
      if (cropY) {
        // allow vertical cropping
        scale = Math.min(scale, mw / cw);
        if (cropPosition !== null) {
          translate = {x: 0, y: Math.round((mh - ch * scale) * (cropPosition - 50) / 100)};
        }
      } else {
        scale = mh / ch;
      }
    }

    scale = Math.min(scale, 1);
    child.style.setProperty('transform', [
      translate ? `translate(${translate.x}px, ${translate.y}px)` : '',
      `scale(${scale})`,
    ].filter(s => !!s).join(' '));
  };

  let sizeAllMedia = () => {
    for (let media of document.querySelectorAll('.media')) {
      sizeMedia(media);
    }
  };

  window.addEventListener('resize', () => sizeAllMedia());

  for (let video of document.querySelectorAll('.media video')) {
    video.addEventListener('resize', ev => {
      sizeMedia(ev.currentTarget.closest('.media'));
    });
  }

  for (let img of document.querySelectorAll('.media img')) {
    img.addEventListener('load', ev => {
      sizeMedia(ev.currentTarget.closest('.media'));
    });
  }

  // requires custom event
  // for (let lottie of document.querySelectorAll('.media rn-lottie-player')) {
  //   lottie.addEventListener('load', ev => {
  //     sizeMedia(ev.currentTarget.closest('.media'));
  //   });
  // }

  sizeAllMedia();
}
