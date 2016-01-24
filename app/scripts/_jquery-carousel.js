require('./_jquery-wheelswipe');

(function($) {


  $.fn.carousel = function() {
    var args = arguments;
    var returnValue;
    $(this).each(function() {
      returnValue = _carousel.apply(this, args);
    });
    return returnValue;
  };

  // Make a carousel or send carousel command to a single carousel
  function _carousel(opts) {
    var carouselNode = this;

    if (typeof opts === 'string') {
      var action = opts;
      var carouselObj = carouselNode._carousel;
      switch (action) {
        case 'getPage':
          return carouselObj.currentPage;
        case 'setPage':
          carouselObj.snapToPage(arguments[1], true);
          return;
      }
      return;
    }

    var carouselObj = new Carousel(this, opts);
    carouselObj.build();
    carouselNode._carousel = carouselObj;
  }

  // Carousel class

  function Carousel(node, opts) {
    this.node = node;
    this.$carousel = $(node);
    this.opts = $.extend({}, opts || {});
    this.opts.loadPage = this.opts.loadPage || function(){};
  }


  Carousel.prototype.build = function() {
    var me = this;

    this.$pages = this.$carousel.find('.page');
    this.$pageScroller = $('<div>')
        .addClass('page-scroll')
        .append(this.$pages)
        .appendTo(this.$carousel);

    this.currentPage = -1;
    this.loadedPages = {};
    this.panning = false;
    this.scrollX = 0;
    this.numPages = this.$pages.length;

    // cancel some default behaviors, regardless if there are pages or not
    this.preventDefaultBrowserBehaviors();

    $(window).resize(function() {
      me.relayout();
    });

    if (this.numPages <= 1) {
      this.relayout();
      return;
    }

    // more than one page
    this.$carousel.addClass('pannable');
    this.buildPageNavigation();
    this.relayout();
    this.scrollTo(0, false, false);
    this.setupSwipe();
  };


  Carousel.prototype.setupSwipe = function() {
    var me = this;

    this.$carousel.wheelswipe(function(direction) {
      me.snapToPage(me.currentPage + direction, true);
    });

    // set up hammer JS
    var lastDeltaX = 0;
    var pageAtPanStart = -1;
    var swiped = false;

    var hammer = new Hammer(this.$carousel.get(0), {
      dragLockToAxis: true
    });

    hammer.on('panend pan swipe', function(ev) {
      // disable browser scrolling
      ev.preventDefault();
      ev.srcEvent.preventDefault();

      var right = ev.deltaX < 0;

      switch (ev.type) {
        case 'pan':
          if (!swiped) {
            var deltaX = (ev.deltaX - lastDeltaX);
            me.panning = true;
            if (pageAtPanStart < 0) {
              pageAtPanStart = me.currentPage;
            }
            me.$carousel.addClass('panning');
            me.scrollTo(me.scrollX - deltaX);
            lastDeltaX = ev.deltaX;
          }
          break;

        case 'swipe':
          swiped = true;
          lastDeltaX = 0;
          right = (ev.direction & Hammer.DIRECTION_RIGHT) == 0;
          me.snapToPage(pageAtPanStart + (right ? 1 : -1), true);
          setTimeout(function() {
            me.panning = false;
            pageAtPanStart = -1;
            me.$carousel.removeClass('panning');
          }, 0);
          ev.srcEvent.stopPropagation();
          break;

        case 'panend':
          if (!swiped) {
            lastDeltaX = 0;
            me.snapToPage(me.currentPage, true);
            setTimeout(function() {
              me.panning = false;
              pageAtPanStart = -1;
              me.$carousel.removeClass('panning');
            }, 0);
          }
          swiped = false;
          break;
      }
    });
  };


  Carousel.prototype.preventDefaultBrowserBehaviors = function() {
    var me = this;
    this.$carousel
        .on('dragstart', function(ev) {
          ev.preventDefault();
        })
        .on('click', function(ev) {
          if (me.panning) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        })
        .on('wheel', function(e) {
          if (Math.abs(e.originalEvent.deltaX)) {
            e.preventDefault();
          }
        })
        // prevent tab-focus from scrolling the carousel weirdly
        .on('focusin', function(ev) {
          var $page = $(ev.target).parents('.page');
          if ($page.length) {
            setTimeout(function() {
              me.$carousel.scrollLeft(0);
              me.snapToPage($page.index(), true);
            }, 0);
          }
        });
  };


  Carousel.prototype.buildPageNavigation = function() {
    var me = this;

    // create edge clickers
    this.$edgeClickerPrev = $('<div>')
        .addClass('edge-clicker prev')
        .appendTo(this.$carousel)
        .click(function() {
          me.snapToPage(me.currentPage - 1, true);
        });
    this.$edgeClickerNext = $('<div>')
        .addClass('edge-clicker next')
        .appendTo(this.$carousel)
        .click(function() {
          me.snapToPage(me.currentPage + 1, true);
        });

    this.$pageDots = $('<div>').addClass('page-dots').appendTo(this.$carousel);
    var pageDotClick_ = function() {
      me.snapToPage($(this).index(), true);
    };

    for (var i = 0; i < this.numPages; i++) {
      this.$pageDots.append($('<div>').addClass('page-dot').click(pageDotClick_));
    }
  };

  Carousel.prototype.loadPageByIndex = function(pageIndex) {
    if (pageIndex < 0 || pageIndex >= this.numPages || pageIndex in this.loadedPages) {
      return;
    }

    this.loadedPages[pageIndex] = true;
    this.opts.loadPage(this.$pages.eq(pageIndex));
  };


  Carousel.prototype.scrollTo = function(x, animated, loadPages) {
    if (loadPages === undefined) {
      loadPages = true;
    }

    if (animated === undefined) {
      animated = false;
    }

    this.scrollX = Math.max(0, Math.min((this.pageWidth + this.pageSpacing) * (this.numPages - 1), x));
    this.$pageScroller
        .toggleClass('animate-scroll', animated)
        .css('transform', 'translate3d(' + (-this.scrollX) + 'px,0,0)');

    var newCurrentPage = Math.round(this.scrollX / this.pageWidth);
    if (this.currentPage != newCurrentPage) {
      this.currentPage = newCurrentPage;

      if (loadPages) {
        this.loadPageByIndex(this.currentPage - 1);
        this.loadPageByIndex(this.currentPage);
        this.loadPageByIndex(this.currentPage + 1);
      }

      var me = this;
      if (this.$pageDots) {
        this.$pageDots.find('.page-dot').each(function(index) {
          $(this).toggleClass('active', index == me.currentPage);
        });
      }

      this.$carousel.trigger('carouselpagechanged');
    }
  };


  Carousel.prototype.snapToPage = function(pageIndex, animated) {
    this.scrollTo(pageIndex * (this.pageWidth + this.pageSpacing), animated);
  };


  Carousel.prototype.relayout = function() {
    this.pagePeek = (window.screen.width < 480) ? 16 : 32;
    this.pageSpacing = 16;

    this.pagerWidth = this.$carousel.width();
    this.pageWidth = this.pagerWidth - (this.pagePeek + this.pageSpacing) * 2;

    if (this.$edgeClickerPrev) {
      this.$edgeClickerPrev.css({width: this.pagePeek});
      this.$edgeClickerNext.css({width: this.pagePeek});
    }

    this.$carousel.find('.page').css({
      width: this.pageWidth,
      minWidth: this.pageWidth,
      marginRight: this.pageSpacing,
    });

    this.$carousel.find('.page:first-child').css({
      marginLeft: this.pageSpacing + this.pagePeek
    });

    this.$carousel.find('.page:last-child').css({
      marginRight: this.pagePeek
    });
  };


}(jQuery));
