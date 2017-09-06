$(document).ready(() => {
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
					<span>${data.author}</span> - <strong>${data.comment.body}</strong>
				</p>
				<hr>
			`);
			$('#comment-body').val('');
			$('#comment-submit').blur();
		});
	});
});