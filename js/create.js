$('#create-user').on('submit', function(event) {
	var email = $('#email').val();
	var password = $('#password').val();
	createAccount(email, password);

	event.preventDefault();
	event.returnValue = false;
	return false;
});

var createAccount = function(email, password) {
	firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
		console.log(errorMessage);
	});
}