$(document).ready(() => {
	$('.edit-comment').click(function(e) {
		// toggle comment and comment edit form
		$(this).closest('div').find('form').fadeToggle('slow');
		$(this).closest('p').fadeToggle('slow');
	});


	let commentForm = $('#comment-form');
	commentForm.submit(function(e) {
		e.preventDefault();
		let formData = $(this).serialize()
		$.post(this.action, formData, (data) => {
			if(data.loginError) {
					// redirect to login if not logged in
					window.location.href = '/login';
			}
			$('#comments').prepend(`
				<p>
					<strong>${data.author}</strong> - ${data.comment.body}
				</p>
				<hr>
			`);
			$('#comment-body').val('');
			$('#comment-submit').blur();
		});
	});
});