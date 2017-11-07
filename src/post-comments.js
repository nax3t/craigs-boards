$('#comment-form').submit(function(e) {
	debugger
	e.preventDefault();
	var formData = $(this).serialize();
	var url = $(this).attr('action');
	$.post(url, formData)
		.done(function(data) {
			$('#comment-body').val('');
			$('#comment-form').slideToggle('slow');
			$('#comments').prepend(`
				<p>${ data.comment.body }</p>
				<small class="text-muted">Posted by ${ data.author } ${ moment(data.comment.createdAt).fromNow() }</small>
				<hr>		
			`);
			$('html, body').animate({ scrollTop: $('.delete-form').offset().top }, 600);
		})
		.fail(function(jqXHR, exception) {
			debugger
			alert(exception);
		});
});