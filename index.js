var Firebase = require('firebase');
var Queue = require('firebase-queue');

var ref = new Firebase('https://nj-react.firebaseio.com');
var queueRef = ref.child('messageQueue');

var q = new Queue(queueRef, function(data,progress,resolve,reject) {
	var user = data.to;
	var userRef = new Firebase('https://nj-react.firebaseio.com/' + user);
	var userMessages = userRef.child('messages');
	var userStatus = userRef.child('data');

	userStatus.on('value', function(snap) {
		userMessages.push(
			transformMessage(snap.val().isAvailable, data), 
			function(error) {
				if(error) {
					console.log(error);
					reject(error);
				} else {
					resolve(data);
				}
		});
	});
});

function transformMessage(userStatus, message) {
	console.log({
		status: userStatus,
		message: message
	});

	if(userStatus == true) {
		return {
			to: message.to,
			from: message.from,
			text: message.text,
			time: message.time,
			serverTime: Firebase.ServerValue.TIMESTAMP,
			userStatus: userStatus
		};
	} else {
		return {
		to: message.to,
		from: 'Firebase Queue',
		text: message.text,
		time: message.time,
		serverTime: Firebase.ServerValue.TIMESTAMP,
		userStatus: userStatus
	};
	}
};