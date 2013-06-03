var oa = {};

var auth = require('/lib/oauth_adapter');
var OAuth = auth.OAuth;
oa.consumerSecret = 'jny9vWw1fRlYOfhWnUKNARUg7SigPhPFl4Vg679h0';
oa.consumerKey = 'TcAMphZqskYGaeoK1ABaWw';
oa.serviceName = 'twitter';

oa.twitterTokenFilename = 'twitterTokens';
oa.oAuthAdapter = new auth.OAuthAdapterNew(
	oa.consumerSecret,
	oa.consumerKey,
	'HMAC-SHA1',
	oa.serviceName);

function Twitter() {



	// load the access token for the service (if previously saved)
	oa.twitterLogout = function () {
		var w = Ti.UI.createWindow({
			title: 'Twitter Authentication',
			top: 0,
			height: '100%',
			backgroundImage: 'none',
			backgroundColor: 'none'
			// modal: true
			// fullscreen: true
		});

		webView = Ti.UI.createWebView({
			url: 'https://twitter.com/logout',
			width: '100%',
			height: '100%',
			scalesPageToFit: true,
			borderRadius: 8,
			borderWidth: 4,
			touchEnabled: true,
			top: 0
		});

		w.add(webView);

		if (Ti.Platform.osname === 'iphone') {

			var closeButton = Ti.UI.createButton({
				systemButton: Ti.UI.iPhone.SystemButton.CANCEL
			});
			w.setRightNavButton(closeButton);
		} else {
			closeButton = Ti.UI.createButton({
				title: 'Cancel',
				right: 20,
				bottom: 50,
				width: 100,
				height: 44
			});

			w.add(closeButton);
		}
		closeButton.addEventListener('click', function (e) {
			w.close();
			w = null;
		});
		w.open({
			modal: true
		});
	}



	this.checkAccessTokenFile();
}

var checkAccessTokenFile = function () {
	var tokenCheck = Ti.App.Properties.getObject('oAuthTokens-' + oa.serviceName, false);
	Ti.API.info('Saved Pers data / : ' + 'oAuthTokens-' + oa.serviceName + JSON.stringify(tokenCheck, null, 2));

	if (tokenCheck) {
		oa.TokensPresent = true;
	} else {
		oa.TokensPresent = false;
	}
};

var auth = function () {
	Ti.API.warn("auth function fired");
	var accessor = {
		consumerSecret: oa.consumerSecret,
		tokenSecret: ''
	};

	var message = oa.oAuthAdapter.createMessage('https://api.twitter.com/oauth/request_token', 'POST');

	OAuth.setTimestampAndNonce(message);
	OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
	OAuth.SignatureMethod.sign(message, accessor);
	var finalUrl = OAuth.addToURL(message.action, message.parameters);
	var client = Ti.Network.createHTTPClient();

	client.onload = function () {
		try {
			// authCallback(true);
			oa.authTokens = client.responseText;
			var responseParams = OAuth.getParameterMap(oa.authTokens);
			oa.requestToken = responseParams.oauth_token;
			oa.requestTokenSecret = responseParams.oauth_token_secret;
			Ti.API.info('Status: ' + client.status);
			//	Ti.API.info('Reponse text: '+ oa.authTokens);
			setTimeout(function () {
				Ti.API.info('Request tokens from twitter first stage: ' + oa.authTokens);
				oa.oAuthAdapter.showAuthorizeUI('https://api.twitter.com/oauth/authorize?' + oa.authTokens);

			}, 400);

		} catch (e) {
			alert(e);
		}
	};
	//Ti.API.info(finalUrl+ ' Is the finalURL for auth step 1');
	client.open('POST', finalUrl, false);
	client.setRequestHeader('X-Requested-With', null);
	// client.setTimeout(3000);
	client.send();
	// have to use a settimeout function to allow ANDROID to get the return value to pass onto the next function.
}

exports.oa = oa;
exports.Twitter = Twitter;
exports.auth = auth;
exports.checkAccessTokenFile = checkAccessTokenFile;