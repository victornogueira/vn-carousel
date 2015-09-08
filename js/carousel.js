var VNCarousel = function(elem, settings) {
  'use strict';

  var self = this;
  var property;

  self.defaults = {
    slidesWrapper: '.js-carousel-slides-wrapper',
    carouselPrev: '.js-carousel-prev',
    carouselNext: '.js-carousel-next',
    carouselPagination: '.js-carousel-pagination',
    infinite: true,
    slidesPerPage: 1,
    peekingPercentage: 0,
    responsive: [],
    onInit: function() {},
    afterChange: function() {},
    beforeChange: function() {}
  };

  // Override default settings
  for (property in settings) {
    if (settings.hasOwnProperty(property)) {
      self.defaults[property] = settings[property];
    }
  }

  self.getCurrentBreakpoint();

  // Override properties with the ones inside breakpoints
  for (property in self.defaults) {
    if (self.defaults.hasOwnProperty(property)) {
      self[property] = self.listenToBreakpoints(property);
    }
  }

  self.elem                = elem;
  self.slidesWrapper       = elem.querySelector(self.slidesWrapper);
  self.carouselPrev        = elem.querySelector(self.carouselPrev);
  self.carouselNext        = elem.querySelector(self.carouselNext);
  self.paginationWrapper   = elem.querySelector(self.carouselPagination);
  self.peekingPercentage   = self.peekingPercentage/100;
  self.carouselSlide       = self.slidesWrapper.children;
  self.totalChildren       = self.carouselSlide.length;
  self.totalPagesFraction  = self.totalChildren/self.slidesPerPage;
  self.totalPages          = Math.ceil(self.totalPagesFraction);
  self.totalCloned         = 0;
  self.totalSlides         = self.totalChildren - self.totalCloned;
  self.transitionEnd       = self.transitionEndEventName();
  self.slidesRemainder     = self.totalSlides % self.slidesPerPage;

  // Run only on browsers that support the classlist API
  if ('classList' in document.createElement('_')) {
    document.addEventListener("DOMContentLoaded", function() {
      self.init();
    });
  }
};

VNCarousel.prototype.init = function() {
  var self = this;

  self.addStylingClasses();

  if (this.totalChildren > self.slidesPerPage) {         
    self.buildCarousel();
    self.goToPage(1, false);
  } else {
    self.buildNoCarousel();
  }

  self.onInit();
};

VNCarousel.prototype.buildCarousel = function() {
  var self = this;

  if (self.infinite) {
    self.cloneSlides();
  }
  
  var carouselWidth = 100/self.totalChildren;

  self.peekingWidth = carouselWidth * self.peekingPercentage;
  self.carouselWidth   = (carouselWidth - self.peekingWidth * 2)/self.slidesPerPage;

  self.slidesWrapper.style.width = self.totalChildren * 100 + '%';

  for (var i = 0; i < self.carouselSlide.length; i++) {
    self.carouselSlide[i].style.width = self.carouselWidth + '%'; 
  }

  self.buildPagination();
  self.addUIListeners(self.afterChange);
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
  }

  // Clone last slides and append to the beginning of list
  for (i = 0; i <= self.slidesPerPage; i++) {
    var lastSlides = self.carouselSlide[i * 2 + self.totalChildren - self.slidesPerPage - 1];
    var clonedLastSlides = lastSlides.cloneNode(true);

    self.slidesWrapper.insertBefore(clonedLastSlides, self.carouselSlide[i]);
  }

  // Update slide count after cloning
  self.carouselSlide = self.slidesWrapper.children;
  self.totalCloned   = self.carouselSlide.length - self.totalChildren;
  self.totalChildren = self.carouselSlide.length;
};

VNCarousel.prototype.setCarouselOffset = function(distance, transition) {
    var self = this;

    self.slidesWrapper.classList.remove('carousel-transition');

    if (transition !== false) {
      self.slidesWrapper.classList.add('carousel-transition');
    }

    self.slidesWrapper.style.webkitTransform = 'translate3d(' + (distance * -1) + '%,0,0)';
    self.slidesWrapper.style.transform = 'translate3d(' + (distance * -1) + '%,0,0)'; 
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
      page -= 1 - (self.slidesRemainder/self.slidesPerPage);

    // Avoid stopping on fraction page, if not on the last page
    } else if (page < self.totalPages - 1) {
      page = Math.ceil(page);
    }

    if (self.pageBeforeMoving !== page) {
      // Callback only if carousel is going to transition
      if (transition !== false) {
        self.transitioning = true;
        self.beforeChange();
      }

      self.currentPageFraction = page;
      self.currentPage         = Math.ceil(page);
      self.firstOfCurrentPage  = Math.round((page - 1) * self.slidesPerPage + 1);
      self.currentSlides       = self.getCurrentSlides();

      self.styleCurrentSlides();
    }

    // Move carousel
    self.setCarouselOffset(self.getPageOffset(), transition);
  }
};

VNCarousel.prototype.goToSlide = function(slide) {
  var self = this;
  var page = Math.ceil(slide/self.slidesPerPage);

  page = Math.max(1, Math.min(page,self.totalPages));

  self.goToPage(page);
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

  self.firstOfCurrentPage = Math.round((self.currentPageFraction - 1) * self.slidesPerPage + 1);

  // If more than one slide per page, return array
  if (self.slidesPerPage > 1) {
    currentSlides = [];

    for (var i = 0; i < self.slidesPerPage; i++) {
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
    self.carouselSlide[i].classList.remove('carousel-slide-prev');
    self.carouselSlide[i].classList.remove('carousel-slide-next');
  }

  // Add class to current
  for (i = 0; i < self.slidesPerPage; i++) {
    var currentSlides = self.firstOfCurrentPage + self.totalCloned/2 + i - 1;
    self.carouselSlide[currentSlides].classList.add('carousel-slide-selected');
  }

  // Add class to prev/next
  var selectedSlides    = self.slidesWrapper.querySelectorAll('.carousel-slide-selected');
  var firstCurrentSlide = selectedSlides[0];
  var lastCurrentSlide  = selectedSlides[self.slidesPerPage - 1];
  var peekingLeft       = self.prevNode(firstCurrentSlide);
  var peekingRight      = self.nextNode(lastCurrentSlide);

  if (peekingLeft) {
    peekingLeft.classList.add('carousel-slide-prev');  
  }

  if (peekingRight) {
    peekingRight.classList.add('carousel-slide-next');  
  }
};

VNCarousel.prototype.buildPagination = function() {
  var self = this;

  if (self.paginationWrapper) {
    self.paginationWrapper.classList.add('carousel-pagination');

    // Create pagination element (dots)
    self.paginationWrapper.innerHTML = '<button class="carousel-pagination-item">1</button>';
    self.paginationItem = self.paginationWrapper.children;  

    for (var i = 0; i < self.totalPages - 1; i++) {
      var clonedPagination = self.paginationItem[0].cloneNode(true);
      self.paginationItem[0].parentNode.appendChild(clonedPagination);

      // Print pagination index
      self.paginationItem[i + 1].innerHTML = i + 2;
    }

    var paginationFirst = self.paginationItem[0];
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

VNCarousel.prototype.goToClickedPeeking = function(e) {
  var self = this;
  var clickedItem = e.target;

  while (clickedItem != self.slidesWrapper) {
    if (clickedItem.classList.contains('carousel-slide-prev')) {
      self.goToPrevPage();
    } else if (clickedItem.classList.contains('carousel-slide-next')) {
      self.goToNextPage();
    }

    clickedItem = clickedItem.parentNode;
  }
};

VNCarousel.prototype.updateAfterTransition = function() {
  var self = this;

  self.transitioning = false;

  if (self.infinite) {
    self.moveFromCloned();
  }

  self.updatePagination(self.currentPage);

  if (self.pageBeforeMoving !== self.currentPageFraction) {
    self.afterChange();    
  }
};

VNCarousel.prototype.getPageOffset = function() {
  var self           = this;
  var clonedWidth    = self.carouselWidth * self.totalCloned/2;
  var peekingWidth   = self.peekingWidth/self.slidesPerPage;
  var carouselOffset = (self.carouselWidth * (self.currentPageFraction - 1)) - peekingWidth;
  var pageOfset      = carouselOffset * self.slidesPerPage + clonedWidth;

  return pageOfset;
};

VNCarousel.prototype.getCurrentBreakpoint = function() {
  var self = this;
  var i;

  // Sort breakpoints (mobile-first)
  self.defaults.responsive.sort(function(a, b) {
      return parseFloat(a.breakpoint) - parseFloat(b.breakpoint);
  });

  // Get current breakpoint
  for (i = 0; i < self.defaults.responsive.length; i++) {
    if (window.innerWidth > self.defaults.responsive[i].breakpoint) {
      self.bp = i;
    }
  }
};

VNCarousel.prototype.listenToBreakpoints = function(property) {
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

VNCarousel.prototype.addTouchListeners = function(ev) {
  var self = this;
  if (!self.transitioning) {
    switch(ev.type) {
      case 'panstart':
        self.carouselWidthPx = self.carouselSlide[0].getBoundingClientRect().width;
      break;

      case 'panright':
      case 'panleft': 
        self.pctDragged = ev.deltaX/self.carouselWidthPx;

        // Move with the finger
        var dragOffset = -self.pctDragged * self.carouselWidth;

        // Make drag feel "heavier" at the first and last pane
        if (!self.infinite) {
          if ((self.currentPage === 1 && ev.deltaX > 0) ||
              (self.currentPage === self.totalPages && ev.deltaX < 0)) {
            dragOffset *= 0.3;
          }
        }

        var panValue = dragOffset + self.getPageOffset();

        self.setCarouselOffset(panValue, false);  

        // Disable browser scrolling
        ev.preventDefault();
      break;

      case 'panend':
        if (Math.abs(self.pctDragged) > 0.2) {
          if (ev.deltaX > 0) {
            self.goToPrevPage();
          } else {
            self.goToNextPage();
          }  
        } else {
          self.goToPage(self.currentPage);
        }
      break;
    }
  }
};

VNCarousel.prototype.keyboardEvents = function(e) {
  var self = this;
  var keyCode = e.keyCode;
  var keyLeft = 37;
  var keyRight = 39;

  if (self.isFocused === true) {
    if (keyCode === keyLeft) {
      self.goToPrevPage();
    } else if (keyCode === keyRight) {
      self.goToNextPage();
    }
  }
};

VNCarousel.prototype.addUIListeners = function() {
  var self = this;
 
  if (self.carouselNext) {
    self.carouselNext.addEventListener('click', self.goToNextPage.bind(self));
  }

  if (self.carouselPrev) {
    self.carouselPrev.addEventListener('click', self.goToPrevPage.bind(self));  
  }

  if (self.paginationWrapper) {
    self.paginationWrapper.addEventListener('click', self.getPaginationClick.bind(self));
  }

  self.slidesWrapper.addEventListener('click', self.goToClickedPeeking.bind(self));
  self.slidesWrapper.addEventListener(self.transitionEnd, self.updateAfterTransition.bind(self));

  // Add touch events with Hammer.js
  self.createHammer = new Hammer(self.slidesWrapper);
  self.createHammer.on('panstart panleft panright panend', self.addTouchListeners.bind(self));

  document.addEventListener('click', function(e) {
    self.isFocused = false;

    if (self.elem.contains(e.target)) {
      self.isFocused = true;
    }
  });

  document.addEventListener('keyup', self.keyboardEvents.bind(self));
};

/* Utils
------------------------------------------------------------------------------------------------ */

VNCarousel.prototype.transitionEndEventName = function() {
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
};

VNCarousel.prototype.prevNode = function(elem)  {
  do {
      elem = elem.previousSibling;
  } while ( elem && elem.nodeType !== 1 );

  return elem;
};

VNCarousel.prototype.nextNode = function(elem) {
  do {
      elem = elem.nextSibling;
  } while ( elem && elem.nodeType !== 1 );

  return elem;
};