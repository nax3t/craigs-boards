$(function() {
	$('#toggle-review').click(function() {
		$('#review-form').slideToggle('slow');
		$('#review-body').focus();
		$('html, body').animate({ scrollTop: $('#review-body').offset().top }, 600);
	});

	$('#review-form').submit(function(e) {
		e.preventDefault();
		var formData = $(this).serialize();
		var url = $(this).attr('action');
		$.post(url, formData)
			.done(function(data) {
				$('#review-body').val('');
				$('#review-form').slideToggle('slow');
				$('#reviews').prepend(`
					<p>${ data.review.body }</p>
					<small class="text-muted">Posted by ${ data.author } ${ moment(data.review.createdAt).fromNow() }</small>
					<hr>		
				`);
				$('html, body').animate({ scrollTop: $('.delete-form').offset().top }, 600);
			})
			.fail(function(jqXHR, exception) {
				alert(exception);
			});
	});
});