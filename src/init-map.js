let map, infoWindow, geocoder, markerCluster, latLngQuery, userLocation;
// store clean form for comparison later in paintDom
const cleanForm = $('#post-filter-form').serialize();

if (window.location.pathname === '/posts') {
		initMapIndex();
} else if (window.location.pathname.match(/\/posts\/([a-z0-9]){24}/)) {
		initMapShow();
}

function initMapIndex() {
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('index-map'), {
		zoom: 10,
		center: new google.maps.LatLng(37.773972, -122.431297),
		mapTypeId: 'terrain'
	});

	if (!window.location.search && !posts) {
			$.get('/posts').done(function(data) {
				// load all post markers
				loadMarkers(data.posts);
			});
	} else {
			loadMarkers(posts);
	}

	// listen for submit event on post filter form from /posts index
	$('#post-filter-form').on('submit', formSubmit);
	// add click listener for any pagination button clicks and submit query
	$('ul.pagination').on('click', '.page-link', pageBtnClick);
	// get user location on link click from filter form
	$('#use-my-location').on('click', getLocation);
}

function initMapShow() {
  let lat = post.coordinates[1];
  let lng = post.coordinates[0];
  let center = {lat: lat, lng: lng };
  let map = new google.maps.Map(document.getElementById('show-map'), {
      zoom: 8,
      center: center,
      scrollwheel: false
  });
  let contentString = `
    <p>
      <strong>${ post.title }</strong><br>
      <small>${ post.location }</small>
    </p>
  `
  let infowindow = new google.maps.InfoWindow({
    content: contentString
  });
  let marker = new google.maps.Marker({
      position: center,
      map: map
  });
  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });
}

////////////////////////// Functions to be used inside of initMapIndex

// define function that handles filter form submission
function formSubmit(e) {
	// prevent default form submission behavior
	e.preventDefault();
	// if there's no user location defned then validate distance & location
	if(!userLocation) {
		// if distance radio is selected then make sure location is also filled out
		if(($('#distance1').val() || $('#distance2').val() || $('#distance3').val()) && !$('#location').val()) {
			if(!$('.form-validation').length) {
				$('#location').focus().after('<div class="form-validation">Location required</div>');
			}
			$('.form-validation').delay(3000).fadeOut('slow', function() {
				$(this).remove();
			});
			return;
		}
	}
	// pull data from form body
	let formData = $(this).serialize();
	// pull url from form action
	let url = this.action;
	// check for location
	let location = $('#location').val();
	if(userLocation) {
			latLngQuery = `&post%5Blongitude%5D=${ userLocation.lng }&post%5Blatitude%5D=${ userLocation.lat }`;
			formData += latLngQuery;
			$.ajax({
					url: url,
					data: formData,
					method: 'GET',
					formData: formData
				})
			  .done(paintDom)
	  		.fail(handleError);
	} else if (location) {
			// geocode location input value
			geocoder.geocode( { 'address': location }, function(results, status) {
	      if (status == 'OK') {
	      		// add lat and lng to query string
	      		latLngQuery = `&post%5Blongitude%5D=${ results[0].geometry.location.lng() }&post%5Blatitude%5D=${ results[0].geometry.location.lat() }`;
	        	formData += latLngQuery;
						// submit GET request to form action with formData as query string
						$.ajax({
								url: url,
								data: formData,
								method: 'GET',
								formData: formData
							})
						  .done(paintDom)
				  		.fail(handleError);
	      } else {
	        	alert('Geocode was not successful for the following reason: ' + status);
	      }
	    });
	} else {
			// submit GET request to form action with formData as query string
			$.ajax({
					url: url,
					data: formData,
					method: 'GET',
					formData: formData
				})
			  .done(paintDom)
	  		.fail(handleError);
	}
};

function pageBtnClick(e) {
	// prevent form from submitting
	e.preventDefault();
	// pull url from link href
	let url = $(this).attr('href')
	// submit GET request to url
	$.get(url)
	  .done(paintDom)
		.fail(handleError);
};

function paintDom(data) {
	// clear currently loaded posts
	$('#posts-row').html('');
	// loop over posts and append each to DOM
	data.posts.forEach(function(post) {
		$('#posts-row').append(`
			<div class="col-lg-4 col-md-6 mb-4">
			  <div class="card h-100">
			    <a href="/posts/${ post._id }"><img class="card-img-top" src="${ post.image }" alt="${ post.title }"></a>
			    <div class="card-body">
			      <h4 class="card-title">
			        <a href="/posts/${ post._id }">${ post.title }</a>
			      </h4>
			      <h5>$${ post.price }.00</h5>
			      <p class="card-text">${ post.description.substring(0, 20) }${ post.description.length > 20 ? '...' : '' }</p>
			      <a href="/posts/${ post._id }" class="btn btn-primary">View Board</a>
			    </div>
			    <div class="card-footer">
			      <small class="text-muted">${ post.condition }</small>
			    </div>
			  </div>
			</div>
		`)
	});
	// clear the current page numbers
	$('ul.pagination').html('');
	// build html string template
	let paginateTemplate = ``;
	// pull filter data from the form
	let formData = $('#post-filter-form').serialize();
	// check if location input filled out
	let location = $('#location').val();
	if(location) {
		// add preexisting lat and lng values to formData query
		formData += latLngQuery;	
	};
	if (userLocation) {
		formData += `&post%5Blongitude%5D=${ userLocation.lng }&post%5Blatitude%5D=${ userLocation.lat }`;
	}
	// check if form is filled out
	if (cleanForm === formData) formData = '';
	// check if has_previous pages and add prev button
	if (data.has_prev) {
		// remove erroneous &page= from data.prevUrl
		data.prevUrl = data.prevUrl.replace('post=', '');
		paginateTemplate += `
		<li class="page-item">
			<a href="${ data.prevUrl }${ formData ? '&' + formData : '' }" class="page-link" aria-label="Previous">
				<span aria-hidden="true">&laquo;</span>
			</a>
		</li>
		`;
	}
	// check is there are multiple pages and add page number buttons
	if (data.pages.length > 1) {
		data.pages.forEach(function(page) {
			// remove erroneous &page= from page.url
			page.url = page.url.replace('post=', '');
			paginateTemplate += `<li class="page-item ${ page.number === data.pageNumber ? 'active' : '' }"><a href="${ page.url }${ formData ? '&' + formData : '' }" class="page-link">${ page.number }</a></li>`;
		});
	}
	// check if has_next pages
	if (data.has_next) {
		// remove erroneous &page= from data.nextUrl
		data.nextUrl = data.nextUrl.replace('post=', '');
		// add next button to page numbers
		paginateTemplate += `
			<li class="page-item">
				<a href="${ data.nextUrl }${ formData ? '&' + formData : '' }" class="page-link" aria-label="Next">
					<span aria-hidden="true">&raquo;</span>
				</a>
			</li>
			`;
	}
	// if paginate buttons exist then add them to the DOM
	if (paginateTemplate) $('ul.pagination').html(paginateTemplate);
	// if posts exist then update map with visible posts
	if(data.posts.length) {
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

function getLocation() {
	// clear location field in filter form
	$('#location').val('');
	// show loader animation
	$('#loader').show();

	infoWindow = new google.maps.InfoWindow;
  // Try HTML5 geolocation.
	// Note: This example requires that you consent to location sharing when
	// prompted by your browser. If you see the error "The Geolocation service
	// failed.", it means you probably did not give permission for the browser to
	// locate you.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      infoWindow.setPosition(userLocation);
      infoWindow.setContent('You are here.');
      infoWindow.open(map);
      window.setTimeout(function() {
      	infoWindow.close();
      }, 3000);

      map.setCenter(userLocation);
      map.setZoom(10);
      // hide loader animation
      $('#loader').hide();

      let formData = '/posts?';
      formData += $('#post-filter-form').serialize();
     	formData += `&post%5Blongitude%5D=${ userLocation.lng }&post%5Blatitude%5D=${ userLocation.lat }`;
  		// Update DOM with posts near user location
  		$.get(formData)
  		  .done(paintDom)
    		.fail(handleError);

    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
};

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
};

function loadMarkers(posts) {
	let markers = [];
	let bounds = new google.maps.LatLngBounds();

	for (let i = 0; i < posts.length; i++) {
	  let latLng = new google.maps.LatLng(posts[i].coordinates[1], posts[i].coordinates[0]);
	  let marker = new google.maps.Marker({
      position: latLng,
      label: posts[i].title,
      animation: google.maps.Animation.DROP,
      url: '/posts/' + posts[i]._id
    });
    google.maps.event.addListener(marker, 'click', function() {
        window.location.href = this.url;
    });
	  markers.push(marker);
	  bounds.extend(markers[i].getPosition());
	}

	map.fitBounds(bounds);

	markerCluster = new MarkerClusterer(map, markers,
          {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
};
