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