var Firebase = require('firebase');
var Queue = require('firebase-queue');

console.log('Process started');

var ref = new Firebase('https://nj-react.firebaseio.com/');
var queueRef = ref.child('messageQueue');
var messagesRef = ref.child('messages');

var q = new Queue(queueRef, function(data,progress,resolve,reject) {
	
	console.log('Data received: ', data);

	var recipient = data.to.toString();
	var recipientRef = ref.child(recipient);
	var recipientMessages = recipientRef.child('messages');
	var recipientStatus = recipientRef.child('data').child('isAvailable');

	var sender = data.from.toString();
	var senderMessages = new Firebase('https://nj-react.firebaseio.com/' + sender + '/messages');


	/*
	 * Nested data - won't work in the long run
	 */

	// recipientStatus.on('value', function(snap) {
	// 	console.log('Status retrieved: ', snap.val());
	// 	var message = transformMessage(snap.val() ? snap.val() : false, data);
	// 	recipientMessages.push(
	// 		message, 
	// 		function(error) {
	// 			if(error) {
	// 				console.log(error);
	// 				reject(error);
	// 			} else {
	// 				senderMessages.push(message);
	// 				resolve(data);
	// 			}
	// 	});
	// });

	// /*
	//  *  This is an attempt to flatten the data. This works fine - 
	//  *  need to find a way to join it again on the client
	//  */

	recipientStatus.on('value', function(snap) {
		var messageObject = {};
		var message = transformMessage(snap.val(), data);
		var messageId = messagesRef.push(message, function(error) {
			if(error) {
				console.log(error);
				reject(error);
			} else {
				console.log('Message added');
				resolve(data);
			}
		});
		messageObject[messageId.key()] = true;
		recipientMessages.child(messageId.key()).set(message.from);
	});

});

function transformMessage(userStatus, message) {
	if(userStatus || userStatus == 'true') {
		console.log('Message transformed');
		return {
			to: message.to,
			from: message.from,
			text: message.text,
			time: message.time,
			participants: [message.to, message.from],
			serverTime: Firebase.ServerValue.TIMESTAMP,
			userStatus: userStatus
		}
	} else {
		console.log('Message transformed');
		return {
			to: message.to,
			from: 'Firebase Queue',
			text: message.text,
			time: message.time,
			participants: [message.to, message.from, 'Firebase Queue'],
			serverTime: Firebase.ServerValue.TIMESTAMP,
			userStatus: userStatus
		}
	}
};