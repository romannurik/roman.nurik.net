require('./_jquery-carousel');


$(document).ready(function() {
  buildPagers();
  setupMediaSizing();
  setupVideoMedia();
  setupFullscreen();
  setupKeyboardNav();

  FastClick.attach(document.body);
  $('.project a').attr('target', '_blank');
});


function buildPagers() {
  $('.pages').carousel();

  // resize media to fit
  $(window).resize(function() {
    $('.media').each(function() {
      sizeMedia($(this));
    });
  });

  $('.media').each(function() {
    sizeMedia($(this));
  });
}


function setupFullscreen() {
  var $fullscreen = $('<div>')
      .addClass('fullscreen-overlay loader-parent')
      .click(function() {
        closeFullscreen_();
      })
      .appendTo('body');

  var $currentFullscreenMedia = null;

  function closeFullscreen_() {
    $('body').removeClass('has-fullscreen');
    $currentFullscreenMedia = null;
  }

  function loadFullscreenMedia_($media) {
    $currentFullscreenMedia = $media;
    var $content = $media.find('img, video').first().clone();
    var $loadingSpinner = $media.find('.loading-spinner').clone();

    $fullscreen
        .empty()
        .append($content)
        .append($loadingSpinner);

    if ($content.is('video')) {
      setTimeout(function() {
        $fullscreen.addClass('loading');
      }, 10);
      $content
          .on('canplay', function() {
            $content.addClass('loaded');
            $fullscreen
                .addClass('loaded')
                .removeClass('loading');
            $content.get(0).play();
          });

      var videoNode = $content.get(0);
      videoNode.load();
    }

    setTimeout(function() {
      $('body').addClass('has-fullscreen');
    }, 10);
  }

  $('.page:not(.no-fullscreen) .media').on('click keydown', function(ev) {
    if (ev.type == 'keydown' && ev.keyCode != 13) {
      return;
    }

    $fullscreen.removeClass('loaded loading');
    if ($(this).parents('.panning').length > 0) {
      return;
    }

    loadFullscreenMedia_($(this));
  });

  $(document).on('keydown', function(e) {
    if (e.keyCode == 27) {
      closeFullscreen_();
    }
  });

  window.loadFullscreenMedia = loadFullscreenMedia_;
  window.getCurrentFullscreenMedia = function() {
    return $currentFullscreenMedia;
  };
}


function setupKeyboardNav() {
  $('.pages').on('carouselpagechanged', function() {
    var currentPage = $(this).carousel('getPage');
    // $(this).find('.page').eq(currentPage).find('.media').focus();
  });

  $(document).on('keydown', function(e) {
    if (e.keyCode == 37 || e.keyCode == 39) {
      // left and right keys
      var direction = (e.keyCode == 37) ? -1 : 1;
      if ($('body').hasClass('has-fullscreen')) {
        // send to fullscreen
        var $media = getCurrentFullscreenMedia();
        if ($media) {
          var $page = $media.parent('.page');
          var $siblingPage = $page[(direction == -1) ? 'prev' : 'next']('.page:not(.no-fullscreen)');
          if ($siblingPage.length) {
            loadFullscreenMedia($siblingPage.find('.media'));
          }
        }
      } else {
        // find most visible pager
        var wh = $(window).height();
        var $mostVisiblePager = null;
        var mostAmountVisible = 0; // 0 to 1

        $('.pages').each(function() {
          var rect = $(this).get(0).getBoundingClientRect();
          var height = (rect.bottom - rect.top);
          var visibleHeight = (Math.min(rect.bottom, wh) - Math.max(rect.top, 0));
          var amountVisible = visibleHeight / height;
          if (amountVisible > mostAmountVisible) {
            $mostVisiblePager = $(this);
            mostAmountVisible = amountVisible;
          }
        });

        if ($mostVisiblePager) {
          // switch page
          $mostVisiblePager.carousel('setPage', $mostVisiblePager.carousel('getPage') + direction);
        }
      }
    }
  });
}


function setupVideoMedia() {
  // play/pause/click interactions
  var playEl = null;
  var playElTimeout;
  function playEl_() {
    playVideoMedia($(playEl), true);
  }

  $(document)
      .on('mouseenter', '.page.video .media', function() {
        if (playElTimeout) {
          clearTimeout(playElTimeout);
          playElTimeout = 0;
        }
        playEl = this;
        playElTimeout = setTimeout(playEl_, 100);
      })
      .on('mouseleave', '.page.video .media', function() {
        if (playElTimeout) {
          clearTimeout(playElTimeout);
          playElTimeout = 0;
        }
        playVideoMedia($(this), false);
      })
      .on('click', '.page.video .media', function() {
        $(this).find('video').get(0).currentTime = 0;
      });

  // loading spinners
  var $neverVisibleProjects = $('section.project:not(.was-visible)');

  function visibleProjectsUpdated_() {
    var ww = $(window).width();
    var wh = $(window).height();

    $neverVisibleProjects.each(function() {
      var rect = $(this).get(0).getBoundingClientRect();
      if (rect.bottom < 0 || rect.right < 0 || rect.left > ww || rect.top > wh) {
        // not visible
        return;
      }

      // remove this from list of never-visible projects
      $(this).addClass('was-visible');
      $neverVisibleProjects = $('section.project:not(.was-visible)');

      // load first page
      //loadPage($(this).find('.page').first());
    });
  }

  visibleProjectsUpdated_();
  $(window).on('scroll resize', visibleProjectsUpdated_);
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
  var $child = $media.children().eq(0);
  if (!$child.length) {
    return;
  }

  if ($media.parent('.page').hasClass('no-scale')) {
    return;
  }

  var ww = $media.width();
  var wh = $media.height();
  var ow = $child.get(0).offsetWidth;
  var oh = $child.get(0).offsetHeight;
  var scale = 1;

  if (ow / oh > ww / wh) {
    scale = ww / ow;
  } else {
    scale = wh / oh;
  }

  scale = Math.min(scale, 1);
  $child.css('transform', 'scale(' + scale + ')');
}


function playVideoMedia($media, play) {
  $media.data('should-be-playing', play);
  var $video = $media.find('video');

  if (play) {
    if (!$media.hasClass('loaded')) {
      $media.addClass('loading');
      $video
          .off('canplay')
          .on('canplay', function() {
            $media
                .addClass('loaded')
                .removeClass('loading');
            if ($media.data('should-be-playing')) {
              $video.get(0).play();
            }
          });
      $video.get(0).load();
    } else {
      $video.get(0).play();
    }
  } else {
    $video.get(0).pause();
  }
}