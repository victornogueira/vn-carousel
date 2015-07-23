/* Utils
---------------------------------------------------------------------------------------------- */
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

	for (var t in transforms){
	  if (transforms.hasOwnProperty(t)) {
		if (el.style[t] !== undefined){
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
---------------------------------------------------------------------------------------------- */
var VNCarousel;

(function() {
	VNCarousel = function($carousel, options) {
		if ('classList' in document.createElement('_')) {
			// Default settings
			var settings = {
				infinite: true,
				slidesWrapper: '.js-carousel-slides-wrapper',
				carouselPrev: '.js-carousel-prev',
				carouselNext: '.js-carousel-next',
				carouselPagination: '.js-carousel-pagination',
				peekingPercentage: 0, // 0 to 20
				slidesPerPage: 1
			};

			// Copy properties of 'options' to 'defaults', overwriting existing ones.
			for (var prop in options) {
				if (options.hasOwnProperty(prop)) {
					settings[prop] = options[prop];
				}
			}

			var $slidesWrapper = $carousel.querySelector(settings.slidesWrapper);
			var $carouselSlide = $slidesWrapper.children;
			var totalSlides    = $carouselSlide.length;
			var totalPages     = totalSlides/settings.slidesPerPage;
			var totalCloned    = 0;

			var $carouselPrev, $carouselNext, $clonedPagination, $paginationWrapper,
			    $paginationItem, $paginationFirst, slideWidth, pctDragged, paginationNodeList,
			    clickedElementIndex, peekingWidth, carouselWidthPx, transitionEnd,
			    has3dTransforms, carouselWidth, peekingAmount, transitioning, currentPage,
			    initCarousel, moveToPage,addTouchListeners, setCarouselOffset, moveToAdjacent,
			    updatePagination, moveFromCloned, paginationClick, buildCarousel,
			    buildNoCarousel, buildPagination, addStylingClasses, cloneSlides, i;

			// Init carousel
			initCarousel = function() {
				addStylingClasses();

				if (totalSlides > settings.slidesPerPage) {					
					buildCarousel();
					moveToPage(0);
				} else {
					buildNoCarousel();
				}
			};

			addStylingClasses = function() {
				// Add styling classes for carousel and slides wrapper
				$carousel.classList.add('carousel');
				$slidesWrapper.classList.add('carousel-slides-wrapper');

				// Add styling class for slides
				for (i = 0; i < totalSlides; i++) {
					$carouselSlide[i].classList.add('carousel-slide');
				}
			};

			buildCarousel = function() {
				// If carousel is infinite...
				if (settings.infinite) {
					cloneSlides();
				}

				$carouselPrev      = $carousel.querySelector(settings.carouselPrev);
				$carouselNext      = $carousel.querySelector(settings.carouselNext);
				$paginationWrapper = $carousel.querySelector(settings.carouselPagination);
				carouselWidth      = 100/totalSlides;
				peekingAmount      = Math.max(0, Math.min(settings.peekingPercentage, 20))/100;
				peekingWidth       = carouselWidth * peekingAmount;
				slideWidth         = (carouselWidth - peekingWidth * 2)/settings.slidesPerPage;
				transitionEnd      = transitionEndEventName();
				has3dTransforms    = supports3dTransforms();

				// Set the width for slides wrapper and each slide
				$slidesWrapper.style.width = totalSlides * 100 + '%';

				for (i = 0; i < $carouselSlide.length; i++) {
					$carouselSlide[i].style.width = slideWidth + '%';	
				}

				// Build pagination
				buildPagination();

				// Add touch listeners
				addTouchListeners();
			};

			buildNoCarousel = function() {
				for (i = 0; i < totalSlides; i++) {
					$carouselSlide[i].style.width = 100/settings.slidesPerPage + '%';
				}
				// Add styling class when the carousel is not needed
				$carousel.classList.add('no-carousel');
			};

			cloneSlides = function() {
				// Clone first slides and append to the end of list
				for (i = 0; i <= settings.slidesPerPage; i++) {
					var $firstSlides       = $carouselSlide[i];
					var $clonedFirstSlides = $firstSlides.cloneNode(true);

					$slidesWrapper.appendChild($clonedFirstSlides);
				}

				// Clone last slides and append to the beginning of list
				for (i = 0; i <= settings.slidesPerPage; i++) {
					var $lastSlides = $carouselSlide[i * 2 + totalSlides - settings.slidesPerPage - 1];
					var $clonedLastSlides = $lastSlides.cloneNode(true);

					$slidesWrapper.insertBefore($clonedLastSlides, $carouselSlide[i]);
				}

				// Calculate total cloned and update slide count
				$carouselSlide = $slidesWrapper.children;
				totalCloned    = $carouselSlide.length - totalSlides;
				totalSlides    = $carouselSlide.length;
				totalPages     = (totalSlides - totalCloned)/settings.slidesPerPage;
			};

			buildPagination = function() {
				// If there's a pagination indicator...
				if ($paginationWrapper) {
					// Add styling class for pagination
					$paginationWrapper.classList.add('carousel-pagination');

					// Create pagination element (dots)
					$paginationWrapper.innerHTML = '<button class="carousel-pagination-item">1</button>';
					$paginationItem = $paginationWrapper.children;	

					// Clone pagination elements
					for (i = 0; i < (totalSlides - totalCloned)/settings.slidesPerPage - 1; i++) {
						$clonedPagination = $paginationItem[0].cloneNode(true);
						$paginationItem[0].parentNode.appendChild($clonedPagination);

						// Print pagination index
						$paginationItem[i + 1].innerHTML = i + 2;
					}

					// Select first pagination item
					$paginationFirst = $paginationItem[0];
					$paginationFirst.classList.add('carousel-pagination-selected');
				}
			};

			addTouchListeners = function() {
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
								var slideOffset = (slideWidth * currentPage) - peekingWidth/settings.slidesPerPage;

								// Move with the finger
								var dragOffset = -pctDragged * slideWidth;

								// Make drag feel "heavier" at the first and last pane
								if (!settings.infinite) {
									if ((currentPage === 0 && ev.deltaX > 0) ||
									    (currentPage === totalSlides - 1 && ev.deltaX < 0)) {
										dragOffset *= 0.4;
									}
								}

								// Drag carousel
								setCarouselOffset(dragOffset + slideOffset * settings.slidesPerPage + slideWidth * totalCloned/2);	

								// Disable browser scrolling
								ev.preventDefault();
							break;

							case 'panend':
								// If more then 20% dragged, move slide
								if (Math.abs(pctDragged) > 0.20) {
									if (ev.deltaX > 0) {
										moveToAdjacent(1);
									} else {
										moveToAdjacent(-1);
									}
								// If not, move back to current slide
								} else {
									moveToPage(currentPage, true);
								}
							break;
						}
					}
				});
			};

			setCarouselOffset = function(distance, transition) {
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
			};

			moveToPage = function(page, transition) {
				// Setting horizontal limits to the carousel
				if (settings.infinite) {
					page = Math.max(-1, Math.min(page, totalPages));
				} else {
					page = Math.max(0, Math.min(page, totalPages - 1));
				}

				// Get selected slide (if more than one per page, the first of the current page)
				var currentSlide = Math.round(page * settings.slidesPerPage);

				// Remove class from selected slides
				for (i = 0; i < totalSlides; i++) {
					// Remove all classes
					$carouselSlide[i].classList.remove('carousel-slide-selected');
					$carouselSlide[i].classList.remove('carousel-slide-next');
					$carouselSlide[i].classList.remove('carousel-slide-prev');
				}

				// Add classes to selected slides
				for (i = 0; i < settings.slidesPerPage; i++) {
					$carouselSlide[i + totalCloned/2 + currentSlide].classList.add('carousel-slide-selected');
				}

				// Add class to prev slide
				var $prevSlide = currentSlide + totalCloned/2 - 1;

				if (settings.infinite && page > -1 || !settings.infinite && page > 0) {
					$carouselSlide[$prevSlide].classList.add('carousel-slide-prev');		
				}

				// Add class to next slide
				var $nextSlide = Math.round((page + 1) * settings.slidesPerPage + totalCloned/2);

				if ($nextSlide < totalSlides) {
					$carouselSlide[$nextSlide].classList.add('carousel-slide-next');
				}

				// Update current page
				currentPage = page;

				// Move to page
				setCarouselOffset(slideWidth * currentSlide - peekingWidth + slideWidth * totalCloned/2, transition);
			};

			updatePagination = function(page) {
				page = Math.ceil(page);

				if ($paginationWrapper) {
					for (i = 0; i < $paginationItem.length; i++) {
						$paginationItem[i].classList.remove('carousel-pagination-selected');	
					}
					
					if (settings.infinite) {
						if (page < totalPages + 1) {
							$paginationItem[page-1].classList.add('carousel-pagination-selected');	
						} else {
							$paginationItem[0].classList.add('carousel-pagination-selected');	
						}
					} else {
						$paginationItem[page].classList.add('carousel-pagination-selected');
					}
				}
			};

			moveToAdjacent = function(direction) {
				if (!transitioning) {
					var pageBeforeMoving  = currentPage;
					var slidesRemainder   = (totalSlides - totalCloned) % settings.slidesPerPage;
					var pageBeforeTheLast = Math.round(totalPages - 1 - slidesRemainder/settings.slidesPerPage);

					if (direction < 0) {
						if (slidesRemainder !== 0 && currentPage === pageBeforeTheLast) {
							currentPage += slidesRemainder/settings.slidesPerPage;
						} else {
							currentPage++;
						}
						moveToPage(currentPage, true);
					} else {
						currentPage--;
						moveToPage(Math.ceil(currentPage), true);
					}

					if (pageBeforeMoving !== currentPage) {
						transitioning = true;
					}
				}
			};

			moveFromCloned = function() {
				// Check if at the first page
				if (currentPage === -1) {
					// Move to non-cloned slides
					moveToPage(totalPages - 1);

				/* Check if at the last page
				   Rounded the values, since totalPages may differ from
				   currentPage when the results have repeating decimals
				   e.g. 2.333333333333333 !=  2.3333333333333335 */
 				} else if (Math.round((totalPages - currentPage) * 100) === 0) {
 					// Move to non-cloned slides
					moveToPage(0);
				}
			};

			paginationClick = function(elem) {
				paginationNodeList = Array.prototype.slice.call(elem.parentNode.children);

				clickedElementIndex = paginationNodeList.indexOf(elem);

				moveToPage(clickedElementIndex, true);
				currentPage = clickedElementIndex;	
			};

			initCarousel();


			// Add listeners

			if ($carouselNext) {
				$carouselNext.addEventListener('click', function(e) {
					moveToAdjacent(-1);

					e.preventDefault();
				});	
			}
			
			if ($carouselPrev) {
				$carouselPrev.addEventListener('click', function(e) {
					moveToAdjacent(1);

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
						moveToAdjacent(1);
					} else if (clickedItem.classList.contains('carousel-slide-next')) {
						moveToAdjacent(-1);
					}

					clickedItem = clickedItem.parentNode;
				}
			});	

			$slidesWrapper.addEventListener(transitionEnd,function() {
				if (settings.infinite) {
					moveFromCloned();
					updatePagination(currentPage + 1);
				} else {
					updatePagination(currentPage);
				}
				transitioning = false;
			});
		}
	};
}());