// CREATE
$('#comment-form').submit(function(e) {
	e.preventDefault();
	var formData = $(this).serialize();
	var url = $(this).attr('action');
	$.post(url, formData)
		.done(function(data) {
			$('#comment-body').val('');
			$('#comment-form').before(`
				<p>${ data.comment.body }</p>
				<small class="text-muted">Posted by ${ data.author } ${ moment(data.comment.createdAt).fromNow() }</small>
				<hr>		
			`);
		})
		.fail(function(jqXHR, exception) {
			alert(exception);
		});
});

// EDIT
$('#comments').on('click', '.edit-comment', function(e) {
	if (!$('input[name="body"]').length) {	
			// find comment parent element
			var $commentDiv = $(this).closest('.col-md-4').siblings('.col-md-8');
			// store comment body value and hide
			var commentBody = $commentDiv.children('p').text();
			$commentDiv.children('p').hide();
			// append form
			$commentDiv.prepend(`
				<form action="#" class="form-inline">
					<div class="form-group">
						<input type="text" name="body" class="form-control" value="${ commentBody }">
					</div>
					<button type="submit" class="btn btn-outline-primary ml-1">Update</button>
				</form>	
			`);
			// focus on input
			$('input[name="body"]').focus();
	} else {
			// show comment body
			$('input[name="body"]').closest('form').siblings('p').show();
			// remove the form
			$('input[name="body"]').closest('form').remove();
	}
});

// DELETE
$('#comments').on('submit', '.delete-comment', function(e) {
	e.preventDefault();
	var url = $(this).attr('action');
	var $form = $(this);
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
});