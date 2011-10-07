// namespace created for issues with android in the initial oAuth process, need to refactor all code into namespace for all twitter api calls.
var oa={};
(function(){
	oa.consumerSecret = 'xxxxxx';
	oa.consumerKey = 'xxxxxx';
})();

oa.oAuthAdapter = new OAuthAdapterNew(
 oa.consumerSecret,
 oa.consumerKey,
 'HMAC-SHA1');

// load the access token for the service (if previously saved)
 oa.oAuthAdapter.loadAccessToken('twitter');
 if (oa.oAuthAdapter.isAuthorized() == false) {
	// this function will be called as soon as the application is authorized
	var receivePin = function() {
 	// get the access token with the provided pin/oauth_verifier
		var accessTokens = oa.oAuthAdapter.getAccessToken({pURL: 'https://api.twitter.com/oauth/access_token', requestToken: requestToken, requestTokenSecret: requestTokenSecret});

		setTimeout(function()
		{
			Ti.API.debug(JSON.stringify(accessTokens));
			Ti.API.debug('Access Tokens: '+ accessTokens); // Losing one of the tokens at this stage prior to saving.
			// oa.oAuthAdapter.saveAccessToken('twitter');
		},4000);
	}; 

	var accessor = {
        consumerSecret: oa.consumerSecret,
        tokenSecret: ''
    };

	accessor.tokenSecret = '';
    var message = oa.oAuthAdapter.createMessage('https://api.twitter.com/oauth/request_token', 'POST');
Ti.API.info('message is '+ message);
	OAuth.setTimestampAndNonce(message);
	OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
	OAuth.SignatureMethod.sign(message, accessor);
	var finalUrl = OAuth.addToURL(message.action, message.parameters);

	var client = Ti.Network.createHTTPClient();

	client.onload = function() {
	try {
		oa.authTokens =  client.responseText;
		var responseParams = OAuth.getParameterMap(oa.authTokens);
		requestToken = responseParams.oauth_token;
		requestTokenSecret = responseParams.oauth_token_secret;
		Ti.API.debug('Ready State: '+client.readyState);
		Ti.API.debug('Status: '+client.status);
		Ti.API.debug('Reponse text: '+ oa.authTokens);
		setTimeout(function()
		{
			Ti.API.debug(oa.authTokens);

			// Ti.API.info('Request token from twitter.js settings: ' + client.responseText);
		    oa.oAuthAdapter.showAuthorizeUI('https://api.twitter.com/oauth/authorize?' + oa.authTokens, receivePin);
		},4000);
		
		} catch(e){
			alert(e);
		}
	};
	Ti.API.debug(finalUrl+ ' Is the finalURL for auth step 1');
    client.open('POST', finalUrl, false);
	client.setRequestHeader('X-Requested-With',null);
	// client.setTimeout(3000);
    client.send();	
	// have to use a settimeout function to allow ANDROID to get the return value to pass onto the next function.
	
}