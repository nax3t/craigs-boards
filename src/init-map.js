let map, infoWindow, geocoder, markerCluster, latLngQuery, userLocation;
// store clean form for comparison later in paintDom
const cleanForm = $('#post-filter-form').serialize();

const initMapIndex = () => {
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('index-map'), {
		zoom: 10,
		center: new google.maps.LatLng(37.773972, -122.431297),
		mapTypeId: 'terrain'
	});

	if (!window.location.search && !posts) {
			$.get('/posts').done(data => {
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
	// listen for change on location and toggle distance
	$('#input-location').on('input', toggleDistance);
}

const toggleDistance = event => {
	if (event.target.value && !$('#distance').is(':visible')) {
			$('#distance').slideDown('slow');
			$('#distance1').prop('checked', true);
	} else if (!event.target.value && $('#distance').is(':visible') && !userLocation) {
			hideDistance();
	}
}

const hideDistance = () => {
	$('#distance').slideUp('slow');
	$('#distance1, #distance2, #distance3').prop('checked', false);
}

const initMapShow = () => {
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
  marker.addListener('click', () => {
    infowindow.open(map, marker);
  });
}

////////////////////////// Functions to be used inside of initMapIndex

// define function that handles filter form submission
const formSubmit = event => {
	// prevent default form submission behavior
	event.preventDefault();
	// pull data from form body
	let formData = $(event.target).serialize();
	// pull url from form action
	let url = event.target.action;
	// check for location
	let location = $('#input-location').val();
	if (userLocation && !location) {
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
			// select the 25mi range if none already checked
			if(!($('#distance1').is(':checked') || $('#distance2').is(':checked') || $('#distance3').is(':checked'))) {
				$('#distance1').prop('checked', true);
			}
			// geocode location input value
			geocoder.geocode({ 'address': location }, (results, status) => {
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
	      	flashError('Geocode was not successful for the following reason: ' + status);
	      }
	    });
	} else {
			// no location so remove any ranges
			$('#distance1, #distance2, #distance3').prop('checked', false);
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

function pageBtnClick(event) { // can't get this to work with event.target instead of this???
	// prevent form from submitting
	event.preventDefault();
	// pull url from link href
	let url = $(this).attr('href')
	// submit GET request to url
	$.get(url)
	  .done(paintDom)
		.fail(handleError);
};

const flashError = message => {
	$('#flash-message').append(`<div class="alert alert-danger" role="alert">${ message }</div>`);
	// fade out flash message after 3 seconds
	window.setTimeout(() => { 
		$('.alert').fadeOut('slow'); 
	}, 3000);
}

const paintDom = data => {
	// if there are no posts to load them flash an error
	if (!data.posts.length) {
		flashError('No results available for that search');
	}
	// clear currently loaded posts
	$('#posts-row').html('');
	// loop over posts and append each to DOM
	data.posts.forEach(post => {
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
				    <small class="text-muted float-left">${ post.category }</small>
			      <small class="text-muted float-right">${ post.condition }</small>
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
	let location = $('#input-location').val();
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
		data.pages.forEach(page => {
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
const handleError = (jqXHR, exception) => {
	flashError(exception);
};

const getLocation = event => {
	if (event.target.innerText !== 'use my location') {
		event.target.innerText = 'use my location';
		userLocation = null;
		hideDistance();
		return;
	}
	event.target.innerText = 'turn off my location';
	// toggle distance options and select 25mi by default
	$('#distance').slideDown('slow');
	$('#distance1').prop('checked', true);
	// clear location field in filter form
	$('#input-location').val('');
	// show loader animation
	$('#loader').show();

	infoWindow = new google.maps.InfoWindow;
  // Try HTML5 geolocation.
	// Note: This example requires that you consent to location sharing when
	// prompted by your browser. If you see the error "The Geolocation service
	// failed.", it means you probably did not give permission for the browser to
	// locate you.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      infoWindow.setPosition(userLocation);
      infoWindow.setContent('You are here.');
      infoWindow.open(map);
      window.setTimeout(() => {
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

    }, () => {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
};

const handleLocationError = (browserHasGeolocation, infoWindow, pos) => {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
};

const loadMarkers = posts => {
	let markers = [];
	let bounds = new google.maps.LatLngBounds();

	for (let i = 0; i < posts.length; i++) {
	  let latLng = new google.maps.LatLng(posts[i].coordinates[1], posts[i].coordinates[0]);
	  let marker = new google.maps.Marker({
      position: latLng,
      // label: posts[i].title, // Removed this for now! Either remove completely or add back in later
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
	if (posts.length === 1) {
			map.setZoom(10);
	}

	markerCluster = new MarkerClusterer(map, markers,
          {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
};

if (window.location.pathname === '/posts') {
		initMapIndex();
} else if (window.location.pathname.match(/\/posts\/([a-z0-9]){24}/)) {
		initMapShow();
}
