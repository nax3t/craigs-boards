// CREATE
$('#comment-form').submit(function(e) {
	e.preventDefault();
	let formData = $(this).serialize();
	let url = $(this).attr('action');
	$.post(url, formData)
		.done(function(data) {
			$('#comment-body').val('');
			$('#comment-form').before(`
				<div class="row">
					<div class="col-md-8">
					  <p>${ data.comment.body }</p>
					  <small class="text-muted">Posted by ${ data.author } ${ moment(data.comment.createdAt).fromNow() }</small>
					</div>
					<div class="col-md-4">
					  <div class="float-md-right mt-2 mt-md-0">
					    <button class="btn btn-sm btn-outline-warning edit-comment" data-comment-id="${ data.comment._id }">Edit</button>
					    <form action="/posts/${ data.post._id }/comments/${ data.comment._id }" class="delete-comment">
					      <input type="submit" class="btn btn-sm btn-outline-danger" value="Delete">
					    </form>
					  </div>
					</div>
					<div class="col-md-12">
					  <hr>
					</div>
				</div>
			`);
		})
		.fail(function(jqXHR, exception) {
			alert(exception);
		});
});

// EDIT
$('#comments').on('click', '.edit-comment', function(e) {
	// toggle edit form
	if (!$('input[name="comment[body]"]').length) {	
			// find comment parent element
			let $commentDiv = $(this).closest('.col-md-4').siblings('.col-md-8');
			// store comment body value and hide
			let commentBody = $commentDiv.children('p').text();
			$commentDiv.children('p').hide();
			// append form
			let action = $('#comment-form').attr('action');
			let commentId = $(this).attr('data-comment-id');
			$commentDiv.prepend(`
				<form action="${ action }/${ commentId }" class="form-inline">
					<div class="form-group">
						<input type="text" name="comment[body]" class="form-control" value="${ commentBody }">
					</div>
					<button type="submit" class="btn btn-outline-primary ml-1">Update</button>
				</form>	
			`);
			// focus on input
			$('input[name="comment[body]"]').focus();
	} else {
			// show comment body
			$('input[name="comment[body]"]').closest('form').siblings('p').show();
			// remove the form
			$('input[name="comment[body]"]').closest('form').remove();
	}
});

// UPDATE
$('#comments').on('submit', '.form-inline', function(e) {
	e.preventDefault();
	let url = $(this).attr('action');
	let formData = $(this).serialize();
	$.ajax({
		url: url,
		data: formData,
		method: 'PUT'
	})
	.done(function(data) {
		// show comment body
		$('input[name="comment[body]"]').closest('form').siblings('p').text(data.comment.body).show();
		// remove the form
		$('input[name="comment[body]"]').closest('form').remove();
	})
	.fail(function(jqXHR, exception) {
		alert(exception);
	});
});

// DELETE
$('#comments').on('submit', '.delete-comment', function(e) {
	e.preventDefault();
	let response = confirm('Are you sure?');
	if (response) {
		let url = $(this).attr('action');
		let $form = $(this);
		$.ajax({
			url: url,
			method: 'DELETE',
			$form: $form 
		})
		.done(function(data) {
			console.log('Successfully deleted!');
			$form.closest('.row').remove();
		})
		.fail(function(jqXHR, exception) {
			alert(exception);
		});
	}
});