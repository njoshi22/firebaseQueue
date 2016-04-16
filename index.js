var Firebase = require('firebase');
var Queue = require('firebase-queue');
var FirebaseTokenGenerator = require('firebase-token-generator');

var tokenGenerator = new FirebaseTokenGenerator('O0GVGmHWaiT4WnAIa1Vb8Gk275NaSawsGVhqop7R');
var token = tokenGenerator.createToken({
	uid: 'queue_server'
});

console.log('Process started');

var ref = new Firebase('https://nj-react.firebaseio.com/');
var queueRef = ref.child('messageQueue');
var messagesRef = ref.child('messages');

ref.authWithCustomToken(token, function(err,authData) {
	if(err) {
		console.log(err);
	}
	console.log('Logged in as: ', authData.uid);
});

var q = new Queue(queueRef, function(data,progress,resolve,reject) {
	
	console.log('Data received: ', data);
	var recipient = data.to.toString();
	var recipientRef = ref.child(recipient);
	var recipientMessages = recipientRef.child('messages');
	var recipientStatus = recipientRef.child('data').child('isAvailable');
	console.log('User data retrieved');

	var sender = data.from.toString();
	var senderRef = ref.child(sender);
	var senderMessages = senderRef.child('messages');
	console.log('Sender data retrieved');

	var recipientContactItem = recipientRef.child('contacts/' + sender);
	var senderContactItem = senderRef.child('contacts/' + recipient);
	console.log('Contact info received for both sender and recipient');


	//Send the message and update
	recipientStatus.on('value', function(snap) {
		// var messageObject = {};
		var message = transformMessage(snap.val(), data);
		var messageId = messagesRef.push(message, function(error) {
			if(error) {
				console.log(error);
				reject(error);
			} else {
				// messageObject[messageId.key()] = true;
				//Add the sender/recipient as a contact
				recipientContactItem.set(true);
				senderContactItem.set(true);
				console.log('Contacts added');
				resolve(data);
			}
		});
		recipientMessages.child(messageId.key()).set(message.from);
		senderMessages.child(messageId.key()).set(message.to);
		console.log('Message added');
	}, function(err) {
		console.log(err);
	});

});

function transformMessage(userStatus, message) {
	if(userStatus === false || userStatus === 'false') {
		console.log('Message passed through');
		return {
			to: message.to,
			from: 'Firebase Queue',
			text: message.text,
			time: Firebase.ServerValue.TIMESTAMP,
			participants: [message.to, message.from, 'Firebase Queue'],
			serverTime: Firebase.ServerValue.TIMESTAMP,
			userStatus: userStatus
		}
	} else {
		console.log('Message transformed');
		return {
			to: message.to,
			from: message.from,
			text: message.text,
			time: Firebase.ServerValue.TIMESTAMP,
			participants: [message.to, message.from],
			serverTime: Firebase.ServerValue.TIMESTAMP,
			userStatus: userStatus
		}
	}
};