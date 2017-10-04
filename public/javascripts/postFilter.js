// document ready
$(function() {
	// store clean form for comparison later
	var cleanForm = $('#post-filter-form').serialize();

	function formListener(e) {
		// prevent form from submitting
		e.preventDefault();
		// pull data from form body
		var formData = $(this).serialize();
		// pull url from form action
		var url = this.action;
		// submit GET request to form action with formData as query string
		$.ajax({
				url: url,
				data: formData,
				method: 'GET',
				formData: formData
			})
		  .done(paintDom)
  		.fail(handleError);
	};

	function pageBtnListener(e) {
		// prevent form from submitting
		e.preventDefault();
		// pull url from link href
		var url = $(this).attr('href')
		// submit GET request to url
		$.get(url)
		  .done(paintDom)
  		.fail(handleError);
	};

	function paintDom(data) {
		console.log(data);
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
		var paginateTemplate = ``;
		// pull filter data from the form
		var formData = $('#post-filter-form').serialize();
		// check if form is filled out
		if (cleanForm === formData) formData = '';
		// check if has_previous pages and add prev button
		if (data.has_prev) {
			paginateTemplate += `
			<li class="page-item">
				<a href="${ data.prevUrl }${ formData ? '&' + formData : '' }" class="page-link" aria-label="Previous">
					<span aria-hidden="true">&laquo;</span>
				</a>
			</li>
			`
		}
		// check is there are multiple pages and add page number buttons
		if (data.pages.length > 1) {
			data.pages.forEach(function(page) {
				paginateTemplate += `<li class="page-item ${ page.number === data.pageNumber ? 'active' : '' }"><a href="${ page.url }${ formData ? '&' + formData : '' }" class="page-link">${ page.number }</a></li>`;
			});
		}
		// check if has_next pages
		if (data.has_next) {
		// add next button to page numbers
		paginateTemplate += `
			<li class="page-item">
				<a href="${ data.nextUrl }${ formData ? '&' + formData : '' }" class="page-link" aria-label="Next">
					<span aria-hidden="true">&raquo;</span>
				</a>
			</li>
			`
		}
		// if paginate buttons exist then add them to the DOM
		if (paginateTemplate) $('ul.pagination').html(paginateTemplate);

		// update map with visible posts
		posts = data.posts;
		initMap();
	};

	// handle failed AJAX requests
	function handleError(jqXHR, exception) {
		alert(exception);
	};

	// listen for submit event on post filter form from /posts index
	$('#post-filter-form').on({
		'change submit': formListener
	});
	// add click listener for any pagination button clicks and submit query
	$('ul.pagination').on('click', '.page-link', pageBtnListener);
});