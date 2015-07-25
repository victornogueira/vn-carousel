# VN Carousel
A simple jQuery-free carousel. Uses Hammer.js for handling touch events.

## Features
- Responsive and touch-enabled
- Multiple slides per page
- Desktop mouse dragging
- Multiple carousels in one page
- Supports custom classes
- Optional infinite mode
- Optional slide peeking for previous and next items

## Usage

1. Add the CSS before `</head>`:

	```HTML
	<head>
		<link rel="stylesheet" href="css/carousel.css">
		<title>Carousel</title>
	</head>
	```
2. Add your slides, pagination and prev/next buttons to the HTML:

	```HTML
	
	<div class="js-carousel">
		<div class="js-carousel-slides-wrapper">
			<div>Slide 1</div>
			<div>Slide 2</div>
			<div>Slide 3</div>
		</div>
		<!-- Navigation buttons and pagination are optional -->
		<button class="js-carousel-prev">Previous</button>
		<button class="js-carousel-next">Next</button>
		<div class="js-carousel-pagination"></div>
	</div>
	
	```

3. At the bottom of the page, before the `</body>` tag, add the scripts:

	```HTML
	
	<script src="js/hammer.min.js"></script>
	<script src="js/carousel.min.js"></script>
	
	```

4. Call the carousel function and configure the options:

	```Javascript
	
	$myCarousel = document.querySelector('.js-carousel');
	
	VNCarousel($myCarousel,{
		infinite: true,
		slidesWrapper: '.js-carousel-slides-wrapper',
		carouselPrev: '.js-carousel-prev',
		carouselNext: '.js-carousel-next',
		carouselPagination: '.js-carousel-pagination',
		slidesPerPage: 4,
		peekingPercentage: 10 // 0 to 20
	});
	
	```
	
## Multiple carousels in one page

- For multiple carousels, simply select all elements with a given class and run the carousel function inside a For Loop:

	```Javascript
	
	$myCarousel = document.querySelectorAll('.js-carousel');

	for (i = 0; i < $myCarousel.length; i++) {
		VNCarousel($myCarousel[i],{
			infinite: true,
			slidesWrapper: '.js-carousel-slides-wrapper',
			carouselPrev: '.js-carousel-prev',
			carouselNext: '.js-carousel-next',
			carouselPagination: '.js-carousel-pagination',
			slidesPerPage: 4,
			peekingPercentage: 10 // 0 to 20
		});
	}
	
	```

## Browser support
Since the code relies on the classlist API it won't work on anything that doesn't support it (e.g. IE8 and IE9). Check http://caniuse.com/#search=classlist for more details. The carousel was tested on Chrome, Safari, Opera (latest and 12.16), IE10+, iOS Safari and Chrome for Android.
