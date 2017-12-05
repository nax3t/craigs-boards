const activatePlacesSearch = () => {
  let input = document.getElementById('input-location');
  let autocomplete = new google.maps.places.Autocomplete(input);
}

if (window.location.pathname === '/posts' || window.location.pathname === '/posts/new') {
	activatePlacesSearch();
}
