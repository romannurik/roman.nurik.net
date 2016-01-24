(function($) {

  $.fn.wheelswipe = function(callback) {
    callback = callback || function(){};

    var wheelLastHitDirection;
    var wheelLastFailedStrengthX;
    var wheelDebounce;

    $(this).on('wheel', function(ev) {
      var direction = (ev.originalEvent.deltaX < 0) ? -1 : 1;
      var strengthX = Math.abs(ev.originalEvent.deltaX);
      if (strengthX < Math.abs(ev.originalEvent.deltaY)) {
        // don't interrupt vertical scrolling
        return true;
      }

      if (wheelDebounce || strengthX < 30) {
        wheelLastFailedStrengthX = strengthX;
        return false;
      }

      if (strengthX > wheelLastFailedStrengthX || direction != wheelLastHitDirection) {
        // successful swipe
        wheelLastHitDirection = direction;
        wheelDebounce = true;
        setTimeout(function() {
          wheelDebounce = false;
        }, 300);

        callback(direction);
      }
      return false;
    });

    return this;
  };

}(jQuery));