/* Utils
-------------------------------------------------------------- */
// Check for 3dTransforms support
function supports3dTransforms() {
	var el = document.createElement('p'),
	has3d,
	transforms = {
		'webkitTransform':'-webkit-transform',
		'OTransform':'-o-transform',
		'msTransform':'-ms-transform',
		'MozTransform':'-moz-transform',
		'transform':'transform'
	};

	// Add it to the body to get the computed style
	document.body.insertBefore(el, null);

	for(var t in transforms){
	  if (transforms.hasOwnProperty(t)) {
		if( el.style[t] !== undefined ){
			el.style[t] = 'translate3d(1px,1px,1px)';
			has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
		  }
		}
	}

	document.body.removeChild(el);

	return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
}

// Normalize transitionend event
function transitionEndEventName() {
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
}

/* Carousel
-------------------------------------------------------------- */
var VNCarousel;

(function() {
	VNCarousel = function($carousel, options) {
		if ('classList' in document.createElement('_')) {
			var $slidesWrapper, $carouselFirst, $carouselLast, $carouselPrev, $carouselNext,
				$carouselSlide, $clonedPagination, $paginationWrapper, $paginationItem,
				$paginationFirst, totalSlides, currentSlide, slideWidth, pctDragged,
				paginationNodeList, clickedElementIndex, peekingWidth, carouselWidthPx,
				transitionEnd, has3dTransforms, carouselWidth, totalCloned, peekingAmount,
				$carouselSecond, $carouselBeforeLast, slideBeforeMoving, transitioning, i;

			// Default settings
			var settings = {
				infinite: true,
				slidesWrapper: '.js-carousel-slides-wrapper',
				carouselPrev: '.js-carousel-prev',
				carouselNext: '.js-carousel-next',
				carouselPagination: '.js-carousel-pagination',
				peekingPercentage: 0 // 0 to 20
			};

			// Copy properties of 'options' to 'defaults', overwriting existing ones.
			for (var prop in options) {
				if (options.hasOwnProperty(prop)) {
					settings[prop] = options[prop];
				}
			}

			// Configure carousel's initial state
			function initCarousel() {
				$slidesWrapper      = $carousel.querySelector(settings.slidesWrapper);
				totalSlides         = $slidesWrapper.children.length;
				totalCloned         = 0;
				$carouselFirst      = $slidesWrapper.children[0];
				$carouselSecond     = $slidesWrapper.children[1];
				$carouselBeforeLast = $slidesWrapper.children[totalSlides-2];
				$carouselLast       = $slidesWrapper.children[totalSlides-1];

				// If carousel is infinite...
				if (settings.infinite) {
					// Clone 2 first and 2 last
					var $clonedFirst       = $carouselFirst.cloneNode(true);
					var $clonedSecond      = $carouselSecond.cloneNode(true);
					var $clonedBeforeLast  = $carouselBeforeLast.cloneNode(true);
					var $clonedLast        = $carouselLast.cloneNode(true);

					// Append them at the edges
					$slidesWrapper.appendChild($clonedFirst);
					$slidesWrapper.appendChild($clonedSecond);
					$slidesWrapper.insertBefore($clonedLast, $carouselFirst);
					$slidesWrapper.insertBefore($clonedBeforeLast, $clonedLast);

					// Total cloned...
					totalCloned = 4;
				}

				$carouselSlide     = $slidesWrapper.children;
				$carouselPrev      = $carousel.querySelector(settings.carouselPrev);
				$carouselNext      = $carousel.querySelector(settings.carouselNext);
				$paginationWrapper = $carousel.querySelector(settings.carouselPagination);
				totalSlides        = $carouselSlide.length;
				carouselWidth      = 100/totalSlides;
				peekingAmount      = Math.max(0, Math.min(settings.peekingPercentage, 20))/100;
				peekingWidth       = carouselWidth * peekingAmount;
				slideWidth         = (carouselWidth - peekingWidth * 2);
				transitionEnd      = transitionEndEventName();
				has3dTransforms    = supports3dTransforms();

				// Add styling classes for carousel and slides wrapper
				$carousel.classList.add('carousel');
				$slidesWrapper.classList.add('carousel-slides-wrapper');

				// Add styling class for slides
				for (i = 0; i < totalSlides; i++) {
					$carouselSlide[i].classList.add('carousel-slide');
				}

				if ($paginationWrapper) {
					// Create pagination element (dots)
					$paginationWrapper.innerHTML = '<button class="carousel-pagination-item"></button>';
					$paginationItem = $paginationWrapper.children;	

					// Clone pagination elements
					for (i = 0; i < (totalSlides - totalCloned ) - 1; i++) {
						$clonedPagination = $paginationItem[0].cloneNode(true);
						$paginationItem[0].parentNode.appendChild($clonedPagination);
					}

					// Select first pagination item
					$paginationFirst = $paginationItem[0];
					$paginationFirst.classList.add('carousel-pagination-selected');
				}

				// Position slides
				if (settings.infinite) {
					moveToSlide(2);
				} else {
					moveToSlide(0);
				}

				// Set the width for slides wrapper and each slide
				$slidesWrapper.style.width = totalSlides * 100 + '%';

				for (i = 0; i < $carouselSlide.length; i++) {
					$carouselSlide[i].style.width = slideWidth + '%';	
				}

				// Attach touch events
				initTouchEvents();
			}

			function initTouchEvents() {
				// Create hammer
				var createHammer = new Hammer($slidesWrapper);

				// Listen to events
				createHammer.on('panstart panleft panright panend', function(ev) {
					if (!transitioning) {
						switch(ev.type) {
							case 'panstart':
								// Get dragged amount
								carouselWidthPx = $carouselSlide[0].getBoundingClientRect().width;
							break;

							case 'panright':
							case 'panleft':			
								// Get pct dragged
								pctDragged = ev.deltaX/carouselWidthPx;

								// Get current carousel position
								var slideOffset = (slideWidth * currentSlide) - peekingWidth;

								// Move with the finger
								var dragOffset = -pctDragged * slideWidth;

								// Make drag feel "heavier" at the first and last pane
								if (!settings.infinite) {
									if((currentSlide === 0 && ev.deltaX > 0) ||
									   (currentSlide === totalSlides - 1 && ev.deltaX < 0)) {
										dragOffset *= 0.4;
									}
								}

								// Drag carousel
								setCarouselOffset(dragOffset + slideOffset);

								// Disable browser scrolling
								ev.preventDefault();
							break;

							case 'panend':
								// If more then 20% dragged, move slide
								if (Math.abs(pctDragged) > 0.20) {
									if (ev.deltaX > 0) {
										movetoAdjacent(1);
									} else {
										movetoAdjacent(-1);
									}
								// If not, move back to current slide
								} else {
									moveToSlide(currentSlide, true);
								}
							break;
						}
					}
				});
			}

			function setCarouselOffset(distance, transition) {
				$slidesWrapper.classList.remove('carousel-transition');

				if (transition) {
					$slidesWrapper.classList.add('carousel-transition');
				}

				if (has3dTransforms) {
					$slidesWrapper.style.transform = 'translate3d(' + (distance * -1) + '%,0,0)';
					$slidesWrapper.style.webkitTransform = 'translate3d(' + (distance * -1) + '%,0,0)';
				} else {
					$slidesWrapper.style.transform = 'translate(' + (distance * -1) + '%,0)';
					$slidesWrapper.style.webkitTransform = 'translate(' + (distance * -1) + '%,0)';
				}
			}

			function moveToSlide(slide, transition) {
				// Move to slide
				if (settings.infinite) {
					slide = Math.max(1, Math.min(slide, totalSlides - 2));
				} else {
					slide = Math.max(0, Math.min(slide, totalSlides - 1));
				}

				// Switch class to selected slide
				for (i = 0; i < totalSlides; i++) {
					$carouselSlide[i].classList.remove('carousel-slide-selected');
					$carouselSlide[i].classList.remove('carousel-slide-next');
					$carouselSlide[i].classList.remove('carousel-slide-prev');
				}

				$carouselSlide[slide].classList.add('carousel-slide-selected');
				
				if (slide > 0) {
					$carouselSlide[slide - 1].classList.add('carousel-slide-prev');	
				}

				if (slide < totalSlides - 1) {
					$carouselSlide[slide + 1].classList.add('carousel-slide-next');
				}

				// Update current slide
				currentSlide = slide;
				setCarouselOffset(slideWidth * slide - peekingWidth, transition);
			}

			function updatePagination(slide) {
				if ($paginationWrapper) {
					for (i = 0; i < $paginationItem.length; i++) {
						$paginationItem[i].classList.remove('carousel-pagination-selected');	
					}
					
					if (settings.infinite) {
						$paginationItem[slide-1].classList.add('carousel-pagination-selected');
					} else {
						$paginationItem[slide].classList.add('carousel-pagination-selected');
					}
				}
			}

			function movetoAdjacent(direction) {
				if (!transitioning) {
					slideBeforeMoving = currentSlide;

					if (direction < 0) {
						currentSlide++;
					} else {
						currentSlide--;
					}

					moveToSlide(currentSlide, true);

					if (slideBeforeMoving !== currentSlide) {
						transitioning = true;
					}
				}
			}

			function moveFromCloned() {
				if (currentSlide === 1) {
					moveToSlide(totalSlides - 3);
					currentSlide = totalSlides - 3;
				} else if (currentSlide === totalSlides - 2) {
					moveToSlide(2);
					currentSlide = 2;
				}
			}

			function paginationClick(elem) {
				paginationNodeList = Array.prototype.slice.call(elem.parentNode.children);

				if (settings.infinite) {
					clickedElementIndex = paginationNodeList.indexOf(elem) + 2;
				} else {
					clickedElementIndex = paginationNodeList.indexOf(elem);
				}

				moveToSlide(clickedElementIndex, true);
				currentSlide = clickedElementIndex;	
			}

			initCarousel();

			if ($carouselNext) {
				$carouselNext.addEventListener('click', function(e) {
					movetoAdjacent(-1);

					e.preventDefault();
				});	
			}
			
			if($carouselPrev) {
				$carouselPrev.addEventListener('click', function(e) {
					movetoAdjacent(1);

					e.preventDefault();
				});			
			}

			if ($paginationWrapper) {
				$paginationWrapper.addEventListener('click', function(e) {
					var clickedItem = e.target;

					while(clickedItem != $paginationWrapper) {
						paginationClick(clickedItem);
						clickedItem = clickedItem.parentNode;
					}
				});	
			}

			$slidesWrapper.addEventListener('click', function(e) {
				var clickedItem = e.target;

				while (clickedItem != $slidesWrapper) {
					if (clickedItem.classList.contains('carousel-slide-prev')) {
						movetoAdjacent(1);
					} else if (clickedItem.classList.contains('carousel-slide-next')) {
						movetoAdjacent(-1);
					}

					clickedItem = clickedItem.parentNode;
				}
			});	

			$slidesWrapper.addEventListener(transitionEnd,function() {
				if (settings.infinite) {
					moveFromCloned();
					updatePagination(currentSlide-1);
				} else {
					updatePagination(currentSlide);
				}
				transitioning = false;
			});
		}
	}
}());