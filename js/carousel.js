var VNCarousel = function(elem, settings) {
  'use strict';

  var self = this;

  self.elem         = elem;
  self.totalCloned  = 0;
  self.didResize    = false;

  self.defaults = {
    slidesWrapper      : '.js-carousel-slides-wrapper',
    carouselPrev       : '.js-carousel-prev',
    carouselNext       : '.js-carousel-next',
    carouselPagination : '.js-carousel-pagination',
    infinite           : false,
    slidesPerPage      : 1,
    slidesToMove       : null,
    initialSlide       : 1,
    peekingPercentage  : 0,
    edgeWeight         : 0.2,
    centerSlides       : true,
    swipeThreshold     : 0.1,
    grabbingCursor     : true,
    speed              : 500,
    timing             : 'ease-out',
    paginationMarkup   : '<button class="carousel-pagination-item"></button>',
    responsive         : [],
    rtl                : false,
    respondTo          : 'window',
    onInit             : function() {},
    afterChange        : function() {},
    beforeChange       : function() {},
    hitEdge            : function() {}
  };

  // Override default settings
  for (var property in settings) {
    if (settings.hasOwnProperty(property)) {
      self.defaults[property] = settings[property];
    }
  }

  // Sort breakpoints (mobile-first)
  self.defaults.responsive.sort(function(a, b) {
    return parseFloat(a.breakpoint) - parseFloat(b.breakpoint);
  });

  // Run only on browsers that support the classlist API
  if ('classList' in document.createElement('_')) {
    self.init();

    // Callback
    self.onInit();
  }
};

VNCarousel.prototype.init = function(slide) {
  var self = this;

  self.getCurrentBreakpoint();

  // Override properties with the ones inside breakpoints
  for (var property in self.defaults) {
    if (self.defaults.hasOwnProperty(property)) {
      self[property] = self.updateBreakpointProperties(property);
    }
  }

  // If no slide is specified, start at default slide
  if (slide === undefined) {
    slide = self.initialSlide;
  }

  // Move the number of slides per page, by default
  if (self.slidesToMove === null) {
    self.slidesToMove = self.slidesPerPage;  
  // Don't move more than the slides per page
  } else {
    self.slidesToMove = Math.min(self.slidesToMove, self.slidesPerPage);
  }
  
  self.slidesWrapper      = self.elem.querySelector(self.slidesWrapper);
  self.carouselPrev       = self.elem.querySelector(self.carouselPrev);
  self.carouselNext       = self.elem.querySelector(self.carouselNext);
  self.paginationWrapper  = self.elem.querySelector(self.carouselPagination);
  self.peekingPercentage  = self.peekingPercentage/100;
  self.carouselSlide      = self.slidesWrapper.children;
  self.totalChildren      = self.carouselSlide.length;
  self.totalPagesFraction = self.totalChildren/self.slidesToMove;
  self.totalPages         = Math.ceil(self.totalPagesFraction);
  self.totalSlides        = self.totalChildren - self.totalCloned;
  self.slidesRemainder    = self.totalSlides % self.slidesToMove;

  self.addStylingClasses();

  if (this.totalChildren > self.slidesToMove) {
    self.buildCarousel();
    self.goToSlide(slide, false);
    self.updatePagination(self.currentPage);
  } else {
    self.buildNoCarousel();
  }
  
  self.addUIListeners();

  // Disable carousel if 'off'
  self.elem.classList.remove('carousel-off');

  if (self.off) {
    self.destroy();
    self.elem.classList.add('carousel-off');
  }
};

VNCarousel.prototype.buildCarousel = function() {
  var self = this;
  var peekingWidth = 100 - self.peekingPercentage * 100 * 2;
  var i;

  // Add attribute to get "real" slide index when needed (considering clones)
  for (i = 0; i < self.carouselSlide.length; i++) {
    self.carouselSlide[i].setAttribute('data-slide-number',i);
  }

  if (self.infinite) {
    self.cloneSlides();
  }

  self.slideWidth = 100/self.totalChildren;

  self.slidesWrapper.style.width = self.totalChildren/self.slidesPerPage *  peekingWidth + '%';

  for (i = 0; i < self.carouselSlide.length; i++) {
    self.carouselSlide[i].style.width = self.slideWidth + '%';
  }

  self.buildPagination();
};

VNCarousel.prototype.buildNoCarousel = function() {
  var self = this;

  for (var i = 0; i < self.totalChildren; i++) {
    self.carouselSlide[i].style.width = 100/self.slidesPerPage + '%';
  }

  // Add styling class when the carousel is not needed
  self.elem.classList.add('no-carousel');
};

VNCarousel.prototype.addStylingClasses = function() {
  var self = this;

  self.elem.classList.add('carousel');
  self.slidesWrapper.classList.add('carousel-slides-wrapper');
 
  for (var i = 0; i < self.totalChildren; i++) {
    self.carouselSlide[i].classList.add('carousel-slide');
  }
};

VNCarousel.prototype.cloneSlides = function() {
  var self = this; 
  var i;

  // Clone first slides and append to the end of list
  for (i = 0; i <= self.slidesPerPage; i++) {
    var firstSlides       = self.carouselSlide[i];
    var clonedFirstSlides = firstSlides.cloneNode(true);

    self.slidesWrapper.appendChild(clonedFirstSlides);
    clonedFirstSlides.classList.add('cloned-slide');
  }

  // Clone last slides and append to the beginning of list
  for (i = 0; i <= self.slidesPerPage; i++) {
    var lastSlides = self.carouselSlide[i * 2 + self.totalChildren - self.slidesPerPage - 1];
    var clonedLastSlides = lastSlides.cloneNode(true);

    self.slidesWrapper.insertBefore(clonedLastSlides, self.carouselSlide[i]);
    clonedLastSlides.classList.add('cloned-slide');
  }

  // Update slide count after cloning
  self.carouselSlide = self.slidesWrapper.children;
  self.totalCloned   = self.carouselSlide.length - self.totalChildren;
  self.totalChildren = self.carouselSlide.length;
  self.clonedSlides  = document.querySelectorAll('.cloned-slide');
};

VNCarousel.prototype.setCarouselOffset = function(distance, transition) {
    var self = this;

    self.Utils.removeTransition(self.slidesWrapper);

    if (transition !== false) {
      self.Utils.addTransition(self.slidesWrapper, self.speed, self.timing);
    }

    if (!self.rtl) {
      self.Utils.add3DTransform(self.slidesWrapper, distance * -1); 
    } else {
      self.Utils.add3DTransform(self.slidesWrapper, distance);
    }
};

VNCarousel.prototype.goToPage = function(page, transition) {
  var self = this;

  if (!self.transitioning) {
    self.pageBeforeMoving = self.currentPageFraction;

    // Set horizontal limits to the carousel
    if (self.infinite) {
      page = Math.max(0, Math.min(page, self.totalPagesFraction + 1));
    } else {
      page = Math.max(1, Math.min(page, self.totalPagesFraction));
    }

    // If moving to last page, check if page is not complete and move accordingly
    if (self.slidesRemainder !== 0 && page === self.totalPages) {
      page -= 1 - (self.slidesRemainder/self.slidesToMove);

    // Avoid stopping on fraction page, if not on the last page
    } else if (page < self.totalPages - 1) {
      page = Math.ceil(page);
    }

    // If moving to a different page
    if (self.pageBeforeMoving !== page) {
      // Callback only if carousel is going to transition
      if (transition !== false) {
        self.transitioning = true;
        self.beforeChange();
      }

      self.currentPageFraction = page;
      self.currentPage         = Math.ceil(page);
      self.firstOfCurrentPage  = Math.round((page - 1) * self.slidesToMove + 1);
      self.currentSlides       = self.getCurrentSlides();

      if (!self.infinite && self.carouselNext) {
        // Enable/disable nav when edge is hit
        self.carouselPrev.classList.remove('carousel-nav-disabled');
        self.carouselNext.classList.remove('carousel-nav-disabled');

        if (self.currentPage === 1) {
          self.carouselPrev.classList.add('carousel-nav-disabled');
          self.hitEdge(); // Callback
        } else if (self.currentPage === self.totalPages) {
          self.carouselNext.classList.add('carousel-nav-disabled');
          self.hitEdge(); // Callback
        }
      }
    }

    self.styleCurrentSlides();

    // Move carousel
    self.setCarouselOffset(self.getPageOffset(), transition);
  }
};

VNCarousel.prototype.goToSlide = function(slide, transition) {
  var self = this;
  var page = Math.ceil(slide/self.slidesToMove);

  page = Math.max(1, Math.min(page,self.totalPages));

  self.goToPage(page, transition);
};

VNCarousel.prototype.goToNextPage = function() {
  var self = this;
  var nextPage = self.currentPageFraction + 1;

  self.goToPage(nextPage);
};

VNCarousel.prototype.goToPrevPage = function() {
  var self = this;
  var prevPage = self.currentPageFraction - 1;

  self.goToPage(prevPage);
};

VNCarousel.prototype.moveFromCloned = function() {
  var self            = this;
  var currentPage     = self.currentPage;
  var clonedFirstPage = self.totalPages + 1;

  if (currentPage === 0) {
    self.goToPage(self.totalPages, false);
  } else if (currentPage === clonedFirstPage) {
    self.goToPage(1, false);
  }
};

VNCarousel.prototype.getCurrentSlides = function() {
  var self = this;
  var currentSlides;

  self.firstOfCurrentPage = Math.round((self.currentPageFraction - 1) * self.slidesToMove + 1);

  // If more than one slide per page, return array
  if (self.slidesToMove > 1) {
    currentSlides = [];

    for (var i = 0; i < self.slidesToMove; i++) {
      currentSlides.push(self.firstOfCurrentPage + i);
    }  
  } else {
    currentSlides = self.firstOfCurrentPage;
  }
  
  return currentSlides;
};

VNCarousel.prototype.styleCurrentSlides = function() {
  var self = this;
  var i;

  for (i = 0; i < self.totalChildren; i++) {
    self.carouselSlide[i].classList.remove('carousel-slide-selected');
  }

  // Add class to current slides (and clones)
  for (i = 0; i < self.slidesToMove; i++) {
    var indexToSelect = self.firstOfCurrentPage + i - 1;

    if (self.firstOfCurrentPage > self.totalSlides) {
      indexToSelect -= self.totalSlides;
    } else if (self.firstOfCurrentPage < 0) {
      indexToSelect += self.totalSlides;
    }

    var currentSlides = self.selectByIndex(indexToSelect);

    for (var j = 0; j < currentSlides.length; j++) {
      currentSlides[j].classList.add('carousel-slide-selected');  
    }
  }
};

VNCarousel.prototype.selectByIndex = function(index) {
  var self    = this;
  var selector = '.carousel-slide[data-slide-number="' + index + '"]';

  return self.slidesWrapper.querySelectorAll(selector); 
};

VNCarousel.prototype.buildPagination = function() {
  var self = this;

  if (self.paginationWrapper) {
    self.paginationWrapper.classList.add('carousel-pagination');

    // Create pagination element (dots)
    self.paginationWrapper.innerHTML = self.paginationMarkup;
    self.paginationItem              = self.paginationWrapper.children;

    var paginationFirst       = self.paginationItem[0];

    // Print pagination indexes
    paginationFirst.innerHTML = '1';

    for (var i = 0; i < self.totalPages - 1; i++) {
      var clonedPagination = self.paginationItem[0].cloneNode(true);

      self.paginationItem[0].parentNode.appendChild(clonedPagination);
      self.paginationItem[i + 1].innerHTML = i + 2;
    }
    
    paginationFirst.classList.add('carousel-pagination-selected');
  }
};

VNCarousel.prototype.updatePagination = function(page) {
  var self = this;

  if (self.paginationWrapper) {
    for (var i = 0; i < self.paginationItem.length; i++) {
      self.paginationItem[i].classList.remove('carousel-pagination-selected');  
    }

    if (self.infinite && page === 0) {
      self.paginationItem[self.totalPages - 1].classList.add('carousel-pagination-selected');
    } else {
      self.paginationItem[page - 1].classList.add('carousel-pagination-selected');  
    }
  }
};

VNCarousel.prototype.getPaginationClick = function(e) {
  var self = this;
  var clickedItem = e.target;

  while(clickedItem != self.paginationWrapper) {
    self.goToClickedPagination(clickedItem);
    clickedItem = clickedItem.parentNode;
  }
};

VNCarousel.prototype.goToClickedPagination = function(elem) {
  var self = this;
  var paginationNodeList  = Array.prototype.slice.call(elem.parentNode.children);
  var clickedPaginationItem = paginationNodeList.indexOf(elem) + 1;

  self.goToPage(clickedPaginationItem);
};

VNCarousel.prototype.updateAfterTransition = function(e) {
  var self = this;

  if (e.target === self.slidesWrapper) {
    self.transitioning = false;
    self.Utils.removeTransition(self.slidesWrapper);

    if (self.infinite) {
      self.moveFromCloned();
    }

    self.updatePagination(self.currentPage);

    // Callback only if moved to a different page
    if (self.pageBeforeMoving !== self.currentPageFraction) {
      self.afterChange();    
    }
  }
};

VNCarousel.prototype.getPageOffset = function() {
  var self           = this;
  var clonedOffset   = self.slideWidth * self.totalCloned/2;
  var peekingOffset  = self.slideWidth * self.peekingPercentage / (1 - self.peekingPercentage * 2);
  var carouselOffset = (self.slideWidth * (self.currentPageFraction - 1));

  if (!self.centerSlides) {
    carouselOffset = (self.slideWidth * (self.currentPageFraction - 1));
  } else {
    carouselOffset -= peekingOffset * (self.slidesPerPage/self.slidesToMove);
  }

  var pageOffset = carouselOffset * self.slidesToMove + clonedOffset;

  return pageOffset;
};

VNCarousel.prototype.getCurrentBreakpoint = function() {
  var self = this;
  var containerWidth;
  var i;

  if (self.respondTo == 'window') {
    containerWidth = window.innerWidth - self.Utils.getScrollbarWidth();
  } else {
    containerWidth = self.elem.getBoundingClientRect().width;
  }

  for (i = 0; i < self.defaults.responsive.length; i++) {
    if (containerWidth > self.defaults.responsive[i].breakpoint) {
      self.bp = i;
    }
  }
};

VNCarousel.prototype.updateBreakpointProperties = function(property) {
  var self         = this;
  var defaultValue = self.defaults[property];
  var breakpointValue;
  var prevBreakpointsValue;
  var i;

  if (self.bp !== undefined) {
    breakpointValue = self.defaults.responsive[self.bp].settings[property];
  }

  // Use value in the current breakpoint
  if (breakpointValue !== undefined) {
    return breakpointValue;
  } else {
    // Use values on previous breakpoint
    for (i = self.bp; i >= 0; i--) {
      prevBreakpointsValue = self.defaults.responsive[i].settings[property];

      // If value is not undefined return and break
      if (prevBreakpointsValue !== undefined) {
        return prevBreakpointsValue;
      }
    }
    // Use value outside of breakpoints
    if (prevBreakpointsValue === undefined) {
      return defaultValue;
    }
  }
};

VNCarousel.prototype.listenToBreakpoints = function() {
  var self = this;
  var containerWidth;
  var prevBP;
  var nextBP;

  if (self.responsive.length) {
    if (self.respondTo == 'window') {
      containerWidth = window.innerWidth - self.Utils.getScrollbarWidth();
    } else {
      containerWidth = self.elem.getBoundingClientRect().width;
    }

    if (self.bp !== undefined) {
      if (self.bp !== self.defaults.responsive.length - 1) {
        nextBP = self.defaults.responsive[self.bp + 1].breakpoint;
      }

      if (self.bp !== 0) {
        prevBP = self.defaults.responsive[self.bp].breakpoint;
      } else {
        prevBP = self.defaults.responsive[0].breakpoint;
      }
    } else {
      nextBP = self.defaults.responsive[0].breakpoint;
    }

    if (containerWidth > nextBP || containerWidth < prevBP) {
      self.destroy();
      self.init(self.firstOfCurrentPage);
    }
  }
  
};

VNCarousel.prototype.addTouchListeners = function(ev) {
  var self = this;
  if (!self.transitioning) {
    switch(ev.type) {
      case 'panstart':
        self.slideWidthPx = self.carouselSlide[0].getBoundingClientRect().width;

        if (self.grabbingCursor) {
          self.elem.style.cursor = '-webkit-grabbing';
          self.elem.style.cursor = 'grabbing';  
        }
      break;

      case 'panright':
      case 'panleft': 
        var dragOffset;

        self.pctDragged = ev.deltaX/self.slideWidthPx/self.slidesToMove;

        // Move with the finger
        if (!self.rtl) {
          dragOffset = -self.pctDragged * self.slideWidth * self.slidesToMove;  
        } else {
          dragOffset = self.pctDragged * self.slideWidth * self.slidesToMove;
        }

        // Make drag feel "heavier" at the first and last pane
        if (!self.infinite) {
          if ((self.currentPage === 1 && ev.deltaX > 0) ||
              (self.currentPage === self.totalPages && ev.deltaX < 0)) {

            dragOffset *= self.edgeWeight;
          }
        }

        var panValue = dragOffset + self.getPageOffset();

        self.setCarouselOffset(panValue, false);  

        // Disable browser scrolling
        ev.preventDefault();
      break;

      case 'panend':
        if (Math.abs(self.pctDragged) > self.swipeThreshold) {
          if (ev.deltaX > 0) {
            if (!self.rtl) {
              self.goToPrevPage();
            } else {
              self.goToNextPage();  
            }
          } else {
            if (!self.rtl) {
              self.goToNextPage();  
            } else {
              self.goToPrevPage();
            }
          }  
        } else {
          self.goToPage(self.currentPage);
        }

        self.elem.style.cursor = '';
      break;
    }
  }
};

VNCarousel.prototype.keyboardEvents = function(e) {
  var self     = this;
  var keyCode  = e.keyCode;
  var keyLeft  = 37;
  var keyRight = 39;

  if (self.isFocused === true) {
    if (keyCode === keyLeft) {
      self.goToPrevPage();
    } else if (keyCode === keyRight) {
      self.goToNextPage();
    }
  }
};

VNCarousel.prototype.destroy = function() {
  var self = this;
  var i;

  // Delete clones
  if (self.clonedSlides) {
    for (i = 0; i < self.clonedSlides.length; i++) {
        self.clonedSlides[i].remove(); 
    }
  }

  // Delete pagination
  if (self.paginationItem) {
    for (i = 0; self.paginationItem.length; i++) {
      self.paginationItem[0].remove();
    }
  }

  // Remove inline styles and classes
  self.elem.classList.remove('carousel');
  self.slidesWrapper.removeAttribute('style');
  self.slidesWrapper.classList.remove('carousel-slides-wrapper');

  for (i = 0; i < self.carouselSlide.length; i++) {
    self.carouselSlide[i].classList.remove('carousel-slide');
    self.carouselSlide[i].classList.remove('carousel-slide-selected');
    self.carouselSlide[i].removeAttribute('style');
  }

  // Reset vars
  self.totalChildren = self.carouselSlide.length;
  self.totalCloned   = 0;
  self.slideWidth    = undefined;
  self.bp            = undefined;

  // Unbind touch listeners
  if (self.createHammer) {
    self.createHammer.destroy();  
  }

  if (self.carouselNext) {
    self.carouselNext.removeEventListener('click', self.carouselNextAction);
  }

  if (self.carouselPrev) {
    self.carouselPrev.removeEventListener('click', self.carouselPrevAction);
  }
};

VNCarousel.prototype.addUIListeners = function() {
  var self = this;

  if (self.totalSlides > self.slidesToMove) {
    self.carouselNextAction = self.goToNextPage.bind(self);
    self.carouselPrevAction = self.goToPrevPage.bind(self);
    
    if (self.carouselNext) {
      self.carouselNext.addEventListener('click', self.carouselNextAction);
    }

    if (self.carouselPrev) {
      self.carouselPrev.addEventListener('click', self.carouselPrevAction);  
    }

    if (self.paginationWrapper) {
      self.paginationWrapper.addEventListener('click', self.getPaginationClick.bind(self));
    }

    self.slidesWrapper.addEventListener(self.Utils.transitionEndEventName(), self.updateAfterTransition.bind(self));

    // Identify which carousel should respond to keyboard events
    document.addEventListener('click', function(e) {
      self.isFocused = false;

      if (self.elem.contains(e.target)) {
        self.isFocused = true;
      }
    });

    document.addEventListener('keyup', self.keyboardEvents.bind(self));

    // Add touch events with Hammer.js
    self.createHammer = new Hammer(self.slidesWrapper);
    self.createHammer.on('panstart panleft panright panend', self.addTouchListeners.bind(self));
  }
  
  window.addEventListener('resize', function() {
    self.didResize = true;
  });

  setInterval(function(){
    if (self.didResize) {
      self.listenToBreakpoints();

      self.didResize = false;
    }
  },200);
};


/*
   Utils
*/

VNCarousel.prototype.Utils = {

  transitionEndEventName: function() {
    var el = document.createElement('div');
    var transitions = {
      'transition':'transitionend',
      'WebkitTransition':'webkitTransitionEnd'
    };

    for (var i in transitions) {
      if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
        return transitions[i];
      }
    }
  },

  addTransition: function(elem, speed, timing) {
    elem.style.transition       = 'transform ' + speed + 'ms ' + timing;
    elem.style.webkitTransition = 'transform ' + speed + 'ms ' + timing;
    elem.classList.add('carousel-transitioning');
  },

  removeTransition: function(elem) {
    elem.style.transition = '';
    elem.style.webkitTransition = '';
    elem.classList.remove('carousel-transitioning');
  },

  add3DTransform: function(elem, value) {
    elem.style.webkitTransform = 'translate3d(' + value + '%,0,0)';
    elem.style.transform = 'translate3d(' + value + '%,0,0)';
  },
  
  getScrollbarWidth: function() {
      var outer = document.createElement("div");
      outer.style.visibility = "hidden";
      outer.style.width = "100px";
      outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

      document.body.appendChild(outer);

      var widthNoScroll = outer.offsetWidth;
      // force scrollbars
      outer.style.overflow = "scroll";

      // add innerdiv
      var inner = document.createElement("div");
      inner.style.width = "100%";
      outer.appendChild(inner);        

      var widthWithScroll = inner.offsetWidth;

      // remove divs
      outer.parentNode.removeChild(outer);

      return widthNoScroll - widthWithScroll;
  }

};
