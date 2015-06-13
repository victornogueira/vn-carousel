# VN Carousel
A simple, jQuery-free, carousel made with the help of Hammer.js.  

## Features
- Responsive and touch-enabled
- Supports multiple carousels in one page
- Supports infinite (circular) navigation
- Supports slide peeking for previous and next items
- Supports custom classes

## Usage
1. Add your slides, pagination and prev/next buttons to the HTML:
´´´´HTML
<div class=“js-carousel”>
			<div class=“js-carousel-slides-wrapper”>
				<div>
					<div class=“slide-wrapper” style=
					“background-image: url(images/01.jpg)”>
					</div>
				</div>
				<div>
					<div class=“slide-wrapper” style=
					“background-image: url(images/02.jpg)”>
					</div>
				</div>
				<div>
					<div class=“slide-wrapper” style=
					“background-image: url(images/03.jpg)”>
					</div>
				</div>
			</div>
			<button class=“carousel-arrow carousel-arrow-prev js-carousel-prev”>previous</button>
			<button class=“carousel-arrow carousel-arrow-next js-carousel-next”>next</button>
			<div class=“carousel-pagination js-carousel-pagination”></div>
		</div>

2. At the bottom of the page, before the </body> tag, add the scripts:
‘’’’HTML
<script src=“js/hammer.min.js”></script>
<script src=“js/carousel.min.js”></script>

3. Call the VNCarousel function and setup the options:
‘’’HTML
<script src=“js/hammer.min.js”></script>
<script src=“js/carousel.min.js”></script>
$myCarousel = document.querySelector(‘.js-carousel’);

			VNCarousel($myCarousel,{
				circular: true,
				slidesWrapper: ‘.js-carousel-slides-wrapper’,
				carouselPrev: ‘.js-carousel-prev’,
				carouselNext: ‘.js-carousel-next’,
				carouselPagination: ‘.js-carousel-pagination’,
				peekingPercentage: 10 // 0 to 20
			});

## Browser support
Since the code relies on the classList API it won’t work on anything that doesn’t support it (e.g. IE8 and IE9). It was tested on Chrome, Safari, Opera, IE10, iOS Safari and Chrome for Android.
