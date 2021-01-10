import $ from 'jquery';
import './carousel';
import './portfolio.scss';

export function PortfolioPage() {
  $(document).on('ready', () => {
    buildPagers();
    setupMediaSizing();
    setupVideoMedia();
    setupFullscreen();
    setupKeyboardNav();

    $('.project a').attr('target', '_blank');
  });
}


function buildPagers() {
  $(window).on('resize', () => $('.media').each((_, el) => sizeMedia($(el))));
  $('.media').each((_, el) => sizeMedia($(el)));
}


function setupFullscreen() {
  let $fullscreen = $('<div>')
      .addClass('fullscreen-overlay loader-parent')
      .on('click', () => closeFullscreen_())
      .appendTo('body');

  let $currentFullscreenMedia = null;

  function closeFullscreen_() {
    $('body').removeClass('has-fullscreen');
    $currentFullscreenMedia = null;
  }

  function loadFullscreenMedia_($media) {
    $currentFullscreenMedia = $media;
    let $content = $media.find('img, video').first().clone();
    let $loadingSpinner = $media.find('.loading-spinner').clone();

    $fullscreen
        .empty()
        .append($content)
        .append($loadingSpinner);

    if ($content.is('video')) {
      setTimeout(() => $fullscreen.addClass('loading'), 10);
      $content.on('canplay', () => {
        $content.addClass('loaded');
        $fullscreen
            .addClass('loaded')
            .removeClass('loading');
        $content.get(0).play();
      });

      let videoNode = $content.get(0);
      videoNode.load();
    }

    setTimeout(() =>$('body').addClass('has-fullscreen'), 10);
  }

  $('.page:not(.no-fullscreen) .media').on('click keydown', ev => {
    if (ev.type == 'keydown' && ev.keyCode != 13) {
      return;
    }

    $fullscreen.removeClass('loaded loading');
    if ($(this).parents('.panning').length > 0) {
      return;
    }

    loadFullscreenMedia_($(ev.currentTarget));
  });

  $(document).on('keydown', ev => {
    if (ev.keyCode == 27) {
      closeFullscreen_();
    }
  });

  window.loadFullscreenMedia = loadFullscreenMedia_;
  window.getCurrentFullscreenMedia = () => $currentFullscreenMedia;
}


function setupKeyboardNav() {
  $(document).on('keydown', ev => {
    if (ev.keyCode == 37 || ev.keyCode == 39) {
      // left and right keys
      let direction = (ev.keyCode == 37) ? -1 : 1;
      if ($('body').hasClass('has-fullscreen')) {
        // send to fullscreen
        let $media = getCurrentFullscreenMedia();
        if ($media) {
          let $page = $media.parent('.page');
          let $siblingPage = $page[(direction == -1) ? 'prev' : 'next']('.page:not(.no-fullscreen)');
          if ($siblingPage.length) {
            loadFullscreenMedia($siblingPage.find('.media'));
          }
        }
      }
    }
  });
}


function setupVideoMedia() {
  for (let el of Array.from(document.querySelectorAll('rn-carousel-page.video .media'))) {
    el.addEventListener('click', () => toggleVideoMediaPlaying(el));
  }
}


function setupMediaSizing() {
  $('.media video').on('resize', function() {
    sizeMedia($(this).parents('.media'));
  });
  $('.media img').on('load', function() {
    sizeMedia($(this).parents('.media'));
  });
}


function sizeMedia($media) {
  let $child = $media.children().eq(0);
  if (!$child.length) {
    return;
  }

  if ($media.parent('.page').hasClass('no-scale')) {
    return;
  }

  let ww = $media.width();
  let wh = $media.height();
  let ow = $child.get(0).offsetWidth;
  let oh = $child.get(0).offsetHeight;
  let scale = 1;

  if (ow / oh > ww / wh) {
    scale = ww / ow;
  } else {
    scale = wh / oh;
  }

  scale = Math.min(scale, 1);
  $child.css('transform', `scale(${scale})`);
}


function toggleVideoMediaPlaying(media) {
  let playing = media.classList.contains('is-playing');
  let video = media.querySelector('video');

  if (!video._listeners) {
    video._listeners = true;
    let canPlay_ = () => {
      video.removeEventListener('canplay', canPlay_);
      media.classList.add('is-loaded');
      media.classList.remove('is-loading');
      video.play();
    };
    video.addEventListener('canplay', canPlay_);
    video.addEventListener('pause', () => media.classList.remove('is-playing'));
    video.addEventListener('play', () => media.classList.add('is-playing'));
  }

  if (!playing) {
    if (!media.classList.contains('is-loaded')) {
      media.classList.add('is-loading');
      video.load();
    } else {
      video.currentTime = 0;
      video.play();
    }
  } else {
    video.pause();
  }
}