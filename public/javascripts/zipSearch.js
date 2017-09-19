$('#address-form').on('submit', function(e) {
	e.preventDefault();
	var zip = $(this).serialize();
	var geocoderUri = 'http://maps.googleapis.com/maps/api/geocode/json?';
	var fullUrl = geocoderUri + zip;
	$.get(fullUrl, function(data) {
		// if there's an error message visible then remove it
		$('#zip-error') ? $('#zip-error').fadeOut('slow') : '';
		if(!data.results.length) {
				// append error to the DOM
				var $error = $('<h4 style="color: red;" id="zip-error">Unable to find that adresss/zip code</h4>')
				    .hide()
				    .appendTo('#address-form')
				    .fadeIn('slow');
		} else {
				console.log("Location:", data.results[0].geometry.location);
				map.setCenter(data.results[0].geometry.location);
		}
	});
});