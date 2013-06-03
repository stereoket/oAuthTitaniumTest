var Twitter = require('/lib/Twitter');
var oa = Twitter.oa;

var t = {
	init: function () {
		t.win2 = Ti.UI.currentWindow;
		t.win2.exitOnClose = true;
		t.win2.backgroundColor = "#336699";
		t.win2.borderRadius = 10;
		Ti.API.debug('Using an ' + Ti.Platform.osname + ' device');

		// set scroll view 
		t.addViews();

	},
	addViews: function () {
		var newHeight = Ti.Platform.displayCaps.platformHeight - (20 * (Ti.Platform.displayCaps.platformHeight / 100));

		t.sview = Titanium.UI.createScrollView({
			contentWidth: 'auto',
			contentHeight: 'auto',
			borderRadius: 10,
			height: (Ti.Platform.osname === 'iphone') ? 220 : '70%',
			width: '90%',
			backgroundColor: '#000',
			top: 10,
			showVerticalScrollIndicator: true
		});

		t.view = Ti.UI.createView({
			backgroundColor: '#336699',
			borderRadius: 10,
			width: Ti.Platform.displayCaps.platformWidth,
			height: 2000,
			top: 10
		});
		// t.sview.add(t.view);
		if (t.refreshed !== true) {
			t.addtestButtons();
			t.addButtonListeners();
		};
		t.printMessage('**** Clear Window ****');
		t.win2.add(t.sview);
		t.sview.layout = 'vertical';
	},
	printMessage: function (message, height) {
		Ti.API.info(message);
		if (height == null) {
			height = 25;
		};
		if (Ti.Platform.displayCaps.platformWidth > 340) {
			var fSize = 25;
			var hAdj = 25;
		} else {
			fSize = 11;
			hAdj = 0;
		}
		var printLabel = Titanium.UI.createLabel({
			text: message,
			color: '#fff',
			top: 15,
			left: 10,
			height: height + hAdj,
			width: '90%',
			zIndex: 10,
			font: {
				fontSize: fSize
			}
		});
		t.sview.add(printLabel);
	},
	addtestButtons: function () {
		t.postButton = Ti.UI.createButton({
			width: '40%',
			title: 'POST tweet',
			backgroundColor: '#FF9933',
			color: '#fff',
			borderColor: '#000',
			backgroundImage: 'none',
			left: 10,
			height: 50,
			top: 10
		});

		t.win2.add(t.postButton);

		t.getButton = Ti.UI.createButton({
			width: '40%',
			title: 'GET profile',
			backgroundColor: '#FF9933',
			backgroundImage: 'none',
			borderColor: '#000',
			color: '#fff',
			right: 10,
			height: 50,
			top: -50
		});

		t.win2.add(t.getButton);

		t.refreshButton = Ti.UI.createButton({
			width: '40%',
			title: 'CLEAR ALL',
			backgroundColor: '#FF9933',
			borderColor: '#000',
			color: '#fff',
			backgroundImage: 'none',
			left: 10,
			height: 50,
			top: 15
		});

		t.win2.add(t.refreshButton);

		t.signOutButton = Ti.UI.createButton({
			width: '40%',
			title: '',
			backgroundColor: '#FF9933',
			borderColor: '#000',
			backgroundImage: 'none',
			color: '#fff',
			right: 10,
			height: 50,
			top: -50
		});
		t.win2.add(t.signOutButton);

	},
	setStateButtonText: function () {
		if (!t.signOutButton) {
			return false
		};
		oa.oAuthAdapter.loadAccessToken(oa.twitterTokenFilename);
		t.signOutButton.title = 'Sign In';
	},
	addButtonListeners: function () {
		t.refreshButton.addEventListener('click', function () {
			// this just clears the views so you can start from scratch
			// t.sview.remove(t.view);
			t.refreshed = true;
			t.win2.remove(t.sview);
			t.addViews();
			t.sview.layout = 'vertical';
			var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, oa.twitterTokenFilename);
			Ti.API.info(file);
			if (file == null) {
				oa.twitterAuth();
				// t.signOutButton.title='Sign In';
			} else {
				file.deleteFile();
				t.printMessage('**** Deleted access token ****');
			}

			t.setStateButtonText();
		});

		t.getButton.addEventListener('click', function (e) {
			oa.checkAccessTokenFile();
			t.printMessage('**** GET button clicked ****');
			// First check for authentication
			if (oa.TokensPresent === true) {
				t.printMessage('**** Attempting a GET request with Twitter ****');
				t.printMessage('**** API Call - verify_credentials  ****');
				oa.oAuthAdapter.send({
					url: 'http://api.twitter.com/1/account/verify_credentials.json',
					parameters: [],
					method: 'GET',
					onSuccess: function (response) {
						t.printMessage('**** GET Success ' + response.httpStatus + ' ****');
						rText = JSON.parse(response.responseText);
						t.printMessage('****  ' + rText.screen_name + ' - ' + rText.description + ' authenticated  ****');
						alert(response.successMessage + response.responseText);
					}
				});
			} else {
				oa.twitterAuth();
			}



		});

		t.postButton.addEventListener('click', function (e) {
			// t.tState = oa.oAuthAdapter.isAuthorized();

			if (oa.TokensPresent === true) {
				t.printMessage('**** Attempting POST request to Twitter ****');
				var d = new Date();
				oa.oAuthAdapter.send({
					url: 'https://api.twitter.com/1/statuses/update.json',
					parameters: [
						['display_coordinates', 'true'],
						['place_id', '8ef32ff56ef11c22'],
						['include_entities', 1],
						['status', 'It\'s now ' + d + '. Testing twitter mobile app using http://goo.gl/sQxUE on ' + Ti.Platform.name + ' #appcelerator']
					],
					method: 'POST',
					onSuccess: function (response) {
						t.printMessage('**** POST Success ' + response.httpStatus + ' ****');
						rText = JSON.parse(response.responseText);
						t.printMessage('**** ' + rText.id_str + ' ID of tweet    ****');
					},
					onError: function (response) {
						t.printMessage('**** POST Error ' + response.httpStatus + ' ****');
						alert(response.errorMessage);
						rText = JSON.parse(response.responseText);
						t.printMessage('**** ' + response.errorMessage + '   ****');
					}
				});
			} else {
				oa.twitterAuth();
			}
			// t.printMessage('**** Current twitter auth state: '+ t.tState +' ****');
			// if(t.tState === true) {
			// t.signOutButton.title='Sign Out';
			// } else {
			// t.signOutButton.title='Sign In';
			// }
			// if (oa.oAuthAdapter.isAuthorized() !== false) {
			// t.printMessage('**** Twitter tokens present ****');
			// 	
			// 				
			// }
		});


		t.signOutButton.addEventListener('click', function (e) {
			Twitter.auth();
		});
	}
};
t.init();

t.printMessage('**** START ****');
t.printMessage('**** Loading buttons ****');

t.printMessage('**** Attaching Event Listeners ****');
// t.addButtonListeners();


t.printMessage('**** Initialise Twitter Libraries ****');
// Write ytour test here or within the class above. Make sure to t.printMessage("TEXT"); at breakpoints within your test.
// Ti.include('lib/sha1.js');
// t.printMessage('**** Loaded SHA1 ****');
// Ti.include('lib/oauth.js');
// t.printMessage('**** Loaded oauth ****');
// Ti.include('lib/oauth_adapter.js');
// t.printMessage('**** Loaded adapter ****');
// Ti.include('lib/twitter_api.js');
// t.printMessage('**** Loaded api bridge ****');

t.printMessage('**** Waiting for Button Press ****');

t.setStateButtonText();