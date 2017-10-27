/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
__webpack_require__(2);
__webpack_require__(3);
module.exports = __webpack_require__(4);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function initMap() {
	var map, infoWindow, geocoder, markerCluster, markers, loadMarkers, posts, latLngQuery;
	// store clean form for comparison later
	var cleanForm = $('#post-filter-form').serialize();

	loadMarkers = function loadMarkers(posts) {
		markers = [];
		var bounds = new google.maps.LatLngBounds();

		for (var i = 0; i < posts.length; i++) {
			var latLng = new google.maps.LatLng(posts[i].coordinates[1], posts[i].coordinates[0]);
			var marker = new google.maps.Marker({
				position: latLng,
				label: posts[i].title,
				animation: google.maps.Animation.DROP,
				url: '/posts/' + posts[i]._id
			});
			google.maps.event.addListener(marker, 'click', function () {
				window.location.href = this.url;
			});
			markers.push(marker);
			bounds.extend(markers[i].getPosition());
		}

		map.fitBounds(bounds);

		markerCluster = new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });
	};

	$.get('/posts').done(function (data) {
		posts = data.posts;
		geocoder = new google.maps.Geocoder();
		map = new google.maps.Map(document.getElementById('map'), {
			zoom: 10,
			center: new google.maps.LatLng(37.773972, -122.431297),
			mapTypeId: 'terrain'
		});
		// load all post markers
		loadMarkers(posts);
		// Get user location
		getLocation();
	});

	// listen for submit event on post filter form from /posts index
	$('#post-filter-form').on('submit', formSubmit);
	// add click listener for any pagination button clicks and submit query
	$('ul.pagination').on('click', '.page-link', pageBtnClick);

	function getLocation() {
		infoWindow = new google.maps.InfoWindow();
		// Try HTML5 geolocation.
		// Note: This example requires that you consent to location sharing when
		// prompted by your browser. If you see the error "The Geolocation service
		// failed.", it means you probably did not give permission for the browser to
		// locate you.
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function (position) {
				var pos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				// add pos variable coordinates to the window object (making them accessible via formSubmit callback)
				window.pos = pos;
				infoWindow.setPosition(pos);
				infoWindow.setContent('You are here.');
				infoWindow.open(map);
				window.setTimeout(function () {
					infoWindow.close();
				}, 3000);

				map.setCenter(pos);
				map.setZoom(10);

				// Update DOM with posts near user location
				$.get('/posts?post%5Blongitude%5D=' + pos.lng + '&post%5Blatitude%5D=' + pos.lat).done(paintDom).fail(handleError);
			}, function () {
				handleLocationError(true, infoWindow, map.getCenter());
			});
		} else {
			// Browser doesn't support Geolocation
			handleLocationError(false, infoWindow, map.getCenter());
		}
	}

	function handleLocationError(browserHasGeolocation, infoWindow, pos) {
		infoWindow.setPosition(pos);
		infoWindow.setContent(browserHasGeolocation ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.');
		infoWindow.open(map);
	}

	// define function that handles filter form submission
	function formSubmit(e) {
		// prevent default form submission behavior
		e.preventDefault();
		// if distance field is filled out then make sure location is also filled out
		if ($('#distance').val() && !$('#location').val()) {
			$('#location').focus().after('<div class="form-validation">Location required if distance entered</div>');
			$('.form-validation').delay(3000).fadeOut('slow');
			return;
		}
		// pull data from form body
		var formData = $(this).serialize();
		// pull url from form action
		var url = this.action;
		// check for location
		var location = $('#location').val();
		if (location) {
			// geocode location input value
			geocoder.geocode({ 'address': location }, function (results, status) {
				if (status == 'OK') {
					// add lat and lng to query string
					latLngQuery = '&post%5Blongitude%5D=' + results[0].geometry.location.lng() + '&post%5Blatitude%5D=' + results[0].geometry.location.lat();
					formData += latLngQuery;
					// submit GET request to form action with formData as query string
					$.ajax({
						url: url,
						data: formData,
						method: 'GET',
						formData: formData
					}).done(paintDom).fail(handleError);
				} else {
					alert('Geocode was not successful for the following reason: ' + status);
				}
			});
		} else if (window.pos) {
			// add lat and lng to query string
			latLngQuery = '&post%5Blongitude%5D=' + window.pos.lng + '&post%5Blatitude%5D=' + window.pos.lat;
			formData += latLngQuery;
			// submit GET request to form action with formData as query string
			$.ajax({
				url: url,
				data: formData,
				method: 'GET',
				formData: formData
			}).done(paintDom).fail(handleError);
		} else {
			// submit GET request to form action with formData as query string
			$.ajax({
				url: url,
				data: formData,
				method: 'GET',
				formData: formData
			}).done(paintDom).fail(handleError);
		}
	};

	function pageBtnClick(e) {
		// prevent form from submitting
		e.preventDefault();
		// pull url from link href
		var url = $(this).attr('href');
		// submit GET request to url
		$.get(url).done(paintDom).fail(handleError);
	};

	function paintDom(data) {
		// clear currently loaded posts
		$('#posts-row').html('');
		// loop over posts and append each to DOM
		data.posts.forEach(function (post) {
			$('#posts-row').append('\n\t\t\t\t<div class="col-lg-4 col-md-6 mb-4">\n\t\t\t\t  <div class="card h-100">\n\t\t\t\t    <a href="/posts/' + post._id + '"><img class="card-img-top" src="' + post.image + '" alt="' + post.title + '"></a>\n\t\t\t\t    <div class="card-body">\n\t\t\t\t      <h4 class="card-title">\n\t\t\t\t        <a href="/posts/' + post._id + '">' + post.title + '</a>\n\t\t\t\t      </h4>\n\t\t\t\t      <h5>$' + post.price + '.00</h5>\n\t\t\t\t      <p class="card-text">' + post.description.substring(0, 20) + (post.description.length > 20 ? '...' : '') + '</p>\n\t\t\t\t      <a href="/posts/' + post._id + '" class="btn btn-primary">View Board</a>\n\t\t\t\t    </div>\n\t\t\t\t    <div class="card-footer">\n\t\t\t\t      <small class="text-muted">' + post.condition + '</small>\n\t\t\t\t    </div>\n\t\t\t\t  </div>\n\t\t\t\t</div>\n\t\t\t');
		});
		// clear the current page numbers
		$('ul.pagination').html('');
		// build html string template
		var paginateTemplate = '';
		// pull filter data from the form
		var formData = $('#post-filter-form').serialize();
		// check if location input filled out
		var location = $('#location').val();
		if (location) {
			// add preexisting lat and lng values to formData query
			formData += latLngQuery;
		};
		// check if form is filled out
		if (cleanForm === formData) formData = '';
		// check if has_previous pages and add prev button
		if (data.has_prev) {
			// remove erroneous &page= from data.prevUrl
			data.prevUrl = data.prevUrl.replace('post=', '');
			paginateTemplate += '\n\t\t\t<li class="page-item">\n\t\t\t\t<a href="' + data.prevUrl + (formData ? '&' + formData : '') + '" class="page-link" aria-label="Previous">\n\t\t\t\t\t<span aria-hidden="true">&laquo;</span>\n\t\t\t\t</a>\n\t\t\t</li>\n\t\t\t';
		}
		// check is there are multiple pages and add page number buttons
		if (data.pages.length > 1) {
			data.pages.forEach(function (page) {
				// remove erroneous &page= from page.url
				page.url = page.url.replace('post=', '');
				paginateTemplate += '<li class="page-item ' + (page.number === data.pageNumber ? 'active' : '') + '"><a href="' + page.url + (formData ? '&' + formData : '') + '" class="page-link">' + page.number + '</a></li>';
			});
		}
		// check if has_next pages
		if (data.has_next) {
			// remove erroneous &page= from data.nextUrl
			data.nextUrl = data.nextUrl.replace('post=', '');
			// add next button to page numbers
			paginateTemplate += '\n\t\t\t\t<li class="page-item">\n\t\t\t\t\t<a href="' + data.nextUrl + (formData ? '&' + formData : '') + '" class="page-link" aria-label="Next">\n\t\t\t\t\t\t<span aria-hidden="true">&raquo;</span>\n\t\t\t\t\t</a>\n\t\t\t\t</li>\n\t\t\t\t';
		}
		// if paginate buttons exist then add them to the DOM
		if (paginateTemplate) $('ul.pagination').html(paginateTemplate);
		// if posts exist then update map with visible posts
		if (data.posts.length) {
			// clear existing markers
			markerCluster.clearMarkers();
			// load post markers to map
			loadMarkers(data.posts);
		} else {
			// no posts to load so remove all markers from map
			markerCluster.clearMarkers();
		}
	};

	// handle failed AJAX requests
	function handleError(jqXHR, exception) {
		alert(exception);
	};
}

window.initMap = initMap;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


$(document).ready(function () {
	window.setTimeout(function () {
		$('.alert').fadeOut('slow');
	}, 3000);
});

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var activatePlacesSearch = function activatePlacesSearch() {
  var input = document.getElementById('input-location');
  var autocomplete = new google.maps.places.Autocomplete(input);
};

window.activatePlacesSearch = activatePlacesSearch;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


$(function () {
	$('#toggle-comment').click(function () {
		var isLoggedIn = $('.dropdown-item[href="/logout"]').length;
		if (isLoggedIn) {
			$('#comment-form').slideToggle('slow');
			$('#comment-body').focus();
			$('html, body').animate({ scrollTop: $('#comment-body').offset().top }, 600);
		} else {
			$('#loginModal').modal();
			$('#loginModal').on('shown.bs.modal', function () {
				$('#inputUsername').focus();
			});
		}
	});

	$('#comment-form').submit(function (e) {
		e.preventDefault();
		var formData = $(this).serialize();
		var url = $(this).attr('action');
		$.post(url, formData).done(function (data) {
			$('#comment-body').val('');
			$('#comment-form').slideToggle('slow');
			$('#comments').prepend('\n\t\t\t\t\t<p>' + data.comment.body + '</p>\n\t\t\t\t\t<small class="text-muted">Posted by ' + data.author + ' ' + moment(data.comment.createdAt).fromNow() + '</small>\n\t\t\t\t\t<hr>\t\t\n\t\t\t\t');
			$('html, body').animate({ scrollTop: $('.delete-form').offset().top }, 600);
		}).fail(function (jqXHR, exception) {
			debugger;
			alert(exception);
		});
	});
});

/***/ })
/******/ ]);