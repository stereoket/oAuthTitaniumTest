 /*
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


 // load the access token for the service (if previously saved)
 // oAuthAdapter.loadAccessToken('twitter');

 // Please refer to the README for new usage and dependencies 

/*
 * The Adapter needs 2 external libraries (oauth.js, sha1.js) hosted at
 *  http://oauth.googlecode.com/svn/code/javascript/
 *
 * Save them locally in a lib subfolder
 */

// Modifications by Ketan Majmudar Spirit Quest (http://www.spiritquest.co.uk 2011)
// Github Repo: https://github.com/stereoket/oauth-adapter
// Have hacked this from multiple forks from the original I have also worked thorugh to attempt to make this android comaptible, there is more work to do, distilling this down into something that is cross compatible - if you would like to donate to the time spent making this compatible you can donate to http://goo.gl/h4UKN (pay pal link) or via my website http://www.stereoartist.com/projects.php



// create an OAuthAdapter instance
var OAuthAdapterNew = function(pConsumerSecret, pConsumerKey, pSignatureMethod, tokenFilename){
  
  Ti.API.info('*********************************************');
  Ti.API.info('If you like the OAuth Adapter, consider donating at');
  Ti.API.info('*** http://goo.gl/h4UKN (pay pal link) ***');
  Ti.API.info('(also please consider daonting to David, link at top of source)');
  Ti.API.info('*********************************************'); 

    // will hold the consumer secret and consumer key as provided by the caller
    var consumerSecret = pConsumerSecret;
    var consumerKey = pConsumerKey;

    // will set the signature method as set by the caller
    var signatureMethod = pSignatureMethod;

    // the pin or oauth_verifier returned by the authorization process window
    var pin = null;

    // will hold the request token and access token returned by the service
    var requestToken = null;
    var requestTokenSecret = null;
    var accessToken = null;
    var accessTokenSecret = null;

    // the accessor is used when communicating with the OAuth libraries to sign the messages
    var accessor = {
        consumerSecret: consumerSecret,
        tokenSecret: ''
    };

    // holds actions to perform
    var actionsQueue = [];

    // will hold UI components
    var window = null;
    var view = null;
    var webView = null;
    var receivePinCallback = null;

    var HttpClientWrapper = function (){
      this.httpMethod = 'POST';
      this.requestURL = '';
      this.async = true;
    };
    HttpClientWrapper.prototype.open = function(method, url, async){
      this.httpMethod = method;
      this.requestURL = url;
      if(async === false){
        this.async = false;
      }
    };
    HttpClientWrapper.prototype.send = function(parameters, success, failure){
      var client = Ti.Network.createHTTPClient();
      client.onload = function (){
        return success(this);
      };
      client.onerror = failure;

      client.open(this.httpMethod, this.requestURL, this.async);
      if(/android/i.test(Titanium.Platform.osname)){
        var post = [];
        for(var p in parameters){
          if(parameters.hasOwnProperty(p)){
            post.push(encodeURIComponent(p) + '=' + encodeURIComponent(parameters[p]));
          }
        }
        return client.send(post.join('&'));
      }
      return client.send(parameters);
    };
    var createHttpClient = function (){
      return new HttpClientWrapper();
    };

    this.loadAccessToken = function(pService){
        Ti.API.info('Loading access token for service [' + pService + '].');

        var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, pService);
        if (!file.exists()) {
        	accessToken = null;
        	accessTokenSecret = null;
            return;
        }

        var contents = file.read();
        if (contents == null) {
        	accessToken = null;
        	accessTokenSecret = null;
        	this.savedTokens = false;
            return;
        }

        try {
            var config = JSON.parse(contents.text);
        } catch(ex) {
            return;
        }
        if (config.accessToken) {
            accessToken = config.accessToken;
        } else {
        	accessToken = null;
        }
        if (config.accessTokenSecret) {
            accessTokenSecret = config.accessTokenSecret;
        } else {
        	accessTokenSecret = null;
        }

        Ti.API.debug('Loading access token: done [accessToken:' + accessToken + '][accessTokenSecret:' + accessTokenSecret + '].');
    };
    this.saveAccessToken = function(params){
		Ti.API.debug('Params [' + JSON.stringify(params)+ '].');
		var responseParams = OAuth.getParameterMap(params);
		Ti.API.debug('Params [' + JSON.stringify(responseParams)+ '].');
		accessToken = responseParams.oauth_token;
		accessTokenSecret = responseParams.oauth_token_secret;
		this.accessTokens = ({accessToken: accessToken, accessTokenSecret: accessTokenSecret, service: tokenFilename});
		
		
		
	 Ti.API.debug('Object passed to save [' + JSON.stringify(this.accessTokens)+ '].');
        Ti.API.debug('Saving access token [' + this.accessTokens['service'] + '].');
        var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, this.accessTokens['service']);
        if (file == null) {
            file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, this.accessTokens['service']);
        }
        file.write(JSON.stringify({
            accessToken: this.accessTokens.accessToken,
            accessTokenSecret: this.accessTokens.accessTokenSecret
        }));
        Ti.API.debug('Saving access token: done.' + this.accessTokens.accessToken + '\n'+this.accessTokens.accessTokenSecret);
    };

    // will tell if the consumer is authorized
    this.isAuthorized = function(){
        return ! (accessToken == null || accessTokenSecret == null);
    };

    // creates a message to send to the service
    this.createMessage = function(pUrl, method){
        var message = {
            action: pUrl ,
            method: (method) ? method : 'POST' ,
            parameters: []
        };
        message.parameters.push(['oauth_consumer_key', consumerKey]);
        message.parameters.push(['oauth_signature_method', signatureMethod]);
        return message;
    };

    // returns the pin
    this.getPin = function() {
        return pin;
    };
	
    // requests a requet token with the given Url
    this.getRequestToken = function(pUrl){
        accessor.tokenSecret = '';
		var message = this.createMessage(pUrl, 'POST');
		OAuth.setTimestampAndNonce(message);
		OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
		OAuth.SignatureMethod.sign(message, accessor);
		var finalUrl = OAuth.addToURL(message.action, message.parameters);
		var client = Ti.Network.createHTTPClient();
		
		client.onload = function() {
			try {
			  var responseParams = OAuth.getParameterMap(client.responseText);
		       requestToken = responseParams['oauth_token'];
		       requestTokenSecret = responseParams['oauth_token_secret'];
				this.token =  client.responseText;
				} catch(e){
					alert(e.message);
				}
		}
		client.open('POST', finalUrl, false);
		client.setTimeout(4000);
		client.send();	
		this.token = client.responseText;      
    };

	this.returnToken = function(){
		return this.token;
	};

    // unloads the UI used to have the user authorize the application
     var destroyAuthorizeUI = function(){
        Ti.API.debug('destroyAuthorizeUI');
        // if the window doesn't exist, exit
        if (window == null) {
            return;
        };

        // remove the UI
        try {
          Ti.API.debug('destroyAuthorizeUI:webView.removeEventListener');
          webView.removeEventListener('load', authorizeUICallback);
          Ti.API.debug('destroyAuthorizeUI:window.close()');
			if(Ti.Platform.osname !== 'android'){ window.close();}
			else {window.hide();}
        } catch(ex) {
          Ti.API.debug('Cannot destroy the authorize UI. Ignoring.');
        }
    };

    // looks for the PIN everytime the user clicks on the WebView to authorize the APP
    // currently works with TWITTER
    var authorizeUICallback = function(e){
      Ti.API.debug('authorizeUILoaded');

      var browser = e.source;
      var viewport = [];
      viewport.push('(function (){');
      viewport.push('  var head = document.getElementsByTagName("head")[0];');
      viewport.push('  var viewport = document.createElement("meta");');
      viewport.push('  viewport.setAttribute("name", "viewport");');
      viewport.push('  viewport.setAttribute("content", "initial-scale=1.0, maximum-scale=1.0, user-scalable=no");');
      viewport.push('  head.appendChild(viewport);');
      viewport.push('})()');
      browser.evalJS(viewport.join('\n'));

      var loc = browser.evalJS('(function (){return location.href})()');
      Titanium.API.debug('webView location: ' + loc);

	// Twitter service check
      if('https://api.twitter.com/oauth/authorize' == loc){
		 	Ti.API.debug('Twitter Authorisation');
			setTimeout(function(){
				var sourceCode = webView.evalJS("document.documentElement.innerHTML");
				setTimeout(function(){
					Ti.API.debug(sourceCode);
					var reg = /(<code\b[^>]*>)([0-9]+)(<\/code>)/gi;
					var ar = reg.exec(sourceCode);
					// var pinMatch = sourceCode.match();
					// Ti.API.info(ar[2]+ ' array match');
					// Ti.API.info(ar+ ' full match');
						if( ar[2] ){
							pin = ar[2];
							Ti.API.info('Found PIN code ' + pin + ' in source');
						}
						if(pin != ''){
							if (receivePinCallback) setTimeout(receivePinCallback, 300);
							var osname = Ti.Platform.osname; // cache information
							if(osname === 'android') {
								window.close();
							}
							destroyAuthorizeUI();
						}
						},1000); // End of pin timeout
					},500); // End of main timout loop
				
				var val = webView.evalJS("document.getElementsByTagName('code').innerHTML");
				// Ti.API.info(val);
	      }
    };

    this.setupWindow = function(childContent){
      if(!window || null == window){

        window = Ti.UI.createWindow({
      	title: 'Twitter Authentication',
        top: 0,
        height: '100%',
        backgroundImage: 'none',
        backgroundColor: 'none'
        // modal: true
        // fullscreen: true
      });
      
      
      
      window.addEventListener('close', function(e){
      	window = null;
      });
      
      }
      window.add(childContent);
      window.open({modal: true});
      if(Ti.Platform.osname === 'iphone') {
      	
      	var closeButton = Ti.UI.createButton({
      		systemButton: Ti.UI.iPhone.SystemButton.CANCEL
		});
		window.setRightNavButton(closeButton);
      	}  else {
      		closeButton = Ti.UI.createButton({
      		title: 'Cancel',
      		right: 20,
      		bottom: 50,
      		width: 100,
      		height: 44
			});

      	window.add(closeButton);
      }
		closeButton.addEventListener('click', function(e){
			window.close();
			window = null;
		});
	
    };

    // shows the authorization UI
    this.showAuthorizeUI = function(pUrl, pReceivePinCallback){
        Titanium.API.debug('showAuthroizeUI');
        receivePinCallback = pReceivePinCallback;
		

        webView = Ti.UI.createWebView({
            url: pUrl,
			width: '100%',
            height: (Ti.Platform.osname === 'android')?'50%':'100%',
            scalesPageToFit: true,
            borderRadius: 8,
            borderWidth: 4,
            touchEnabled: true,
            top: 0
        });

        webView.addEventListener('load', authorizeUICallback);
        this.setupWindow(webView);
    };

    this.getAccessToken = function(params){
        accessor.tokenSecret = params['requestTokenSecret'];
        var message = this.createMessage(params['pURL']);
        message.parameters.push(['oauth_token', params['requestToken']]);
        message.parameters.push(['oauth_verifier', pin]);

        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);

        var parameterMap = OAuth.getParameterMap(message.parameters);
        for (var p in parameterMap){
          if(parameterMap.hasOwnProperty(p)){
            Ti.API.debug(p + ': ' + parameterMap[p]);
          }
        }

        var client = Ti.Network.createHTTPClient();
		client.onload = function() {
			try {
				var text = client.responseText;
		          Ti.API.debug('*** get access token, Response: ' + text);
		          processQueue();	
			} catch(e) {
			Ti.API.debug(e);
			}
		};
		
        client.open('POST', params['pURL'], false);
        client.send(parameterMap);
		
		setTimeout(function()
		{	
			 var saveAccessToken = function(params){
			Ti.API.debug('Params [' + JSON.stringify(params)+ '].');
				var responseParams = OAuth.getParameterMap(params);
				Ti.API.debug('Params [' + JSON.stringify(responseParams)+ '].');
				accessToken = responseParams.oauth_token;
				accessTokenSecret = responseParams.oauth_token_secret;
				this.accessTokens = ({accessToken: accessToken, accessTokenSecret: accessTokenSecret, service: tokenFilename});



			 Ti.API.debug('Object passed to save [' + JSON.stringify(this.accessTokens)+ '].');
		        Ti.API.debug('Saving access token [' + this.accessTokens['service'] + '].');
		        var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, this.accessTokens['service']);
		        if (file == null) {
		            file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, this.accessTokens['service']);
		        }
		        file.write(JSON.stringify({
		            accessToken: this.accessTokens.accessToken,
		            accessTokenSecret: this.accessTokens.accessTokenSecret
		        }));
		        Ti.API.debug('Saving access token: done.' + this.accessTokens.accessToken + '\n'+this.accessTokens.accessTokenSecret);
		        this.savedTokens = true;
		    };
		
		saveAccessToken(client.responseText);
			
		},3000);
		return;
    };

    var processQueue = function(){
        Ti.API.debug('Processing queue.');
        while ((q = actionsQueue.shift()) != null){
            send(q);
        }

        Ti.API.debug('Processing queue: done.');
    };
    var oauthParams = 'OAuth realm,oauth_version,oauth_consumer_key,oauth_nonce,oauth_signature,oauth_signature_method,oauth_timestamp,oauth_token'.split(',');

    var removeOAuthParams = function(parameters) {
        var checkString = oauthParams.join(',') + ',';
        for (var p in parameters) {
            if (checkString.indexOf(p + ',') >= 0) {
              delete parameters[p];
            }
        }
    };

    var makePostURL = function(url,parameters) {
        var checkString = oauthParams.join(',') + ',';
        var query = [];
        var newParameters = [];
        for (var i = 0 , len = parameters.length; i < len ; i++) {
           var item = parameters[i];
           if (checkString.indexOf(item[0] + ',') < 0) {
               query.push(encodeURIComponent(item[0]) + '=' + encodeURIComponent(item[1])); 
           } else {
               newParameters.push(item);
           }
        }
        parameters = newParameters;
        if (query.length) {
            query = query.join('&');
            return [url + ((url.indexOf('?') >= 0) ? '&' : '?') + query, parameters];
        }
        return [url, parameters];
    };
    var makeGetURL = function(url, parameterMap) {
        var query = [];
        var keys = [];
        for (var p in parameterMap) {
          if(parameterMap.hasOwnProperty(p)){
            query.push( encodeURIComponent(p) + "=" + encodeURIComponent(parameterMap[p]) ); 
          }
        }
        query.sort();//(9.1.1.  Normalize Request Parameters)
        if (query.length) {
            query = query.join('&');
            return url + ((url.indexOf('?') >= 0) ? '&' : '?') + query;
        }
        return url;
    };
    var makeHeaderParam = function(parameterMap){
      var header = [];
      for(var p in parameterMap){
        if(parameterMap.hasOwnProperty(p)){
          header.push(encodeURIComponent(p) + '="' + encodeURIComponent(parameterMap[p]) + '"');
        }
      }
      header.sort();//(9.1.1.  Normalize Request Parameters)
      return 'OAuth ' + header.join(', ');
    };

    var self = this;
    var send = function(params) {
        var pUrl            = params.url;
        var pParameters     = params.parameters || [];
        var pTitle          = params.title;
        var pMethod         = params.method || 'POST';
        var resultByXML      = params.resultByXML || false;
        var stickOAuthParam = params.stickOAuthParam || false;

        Ti.API.info('Sending a message to the service at [' + pUrl + '] with the following params: ' + JSON.stringify(pParameters));
		
		Ti.API.info('access Tokens: ' + accessToken + ':' + accessTokenSecret);
        if (accessToken == null || accessTokenSecret == null)
        {
            Ti.API.debug('The send status cannot be processed as the client doesn\'t have an access token. The status update will be sent as soon as the client has an access token.');
            actionsQueue.push(params);
            return false;
        }

        accessor.tokenSecret = accessTokenSecret;
        var message = self.createMessage(pUrl, pMethod);
        message.parameters.push(['oauth_token', accessToken]);
        for (p in pParameters) message.parameters.push(pParameters[p]);
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);
		Ti.API.debug('Signature Signed');
        var parameterMap = OAuth.getParameterMap(message.parameters);
        for (var p in parameterMap) Ti.API.debug(p + ': ' + parameterMap[p]);
        if (pMethod == 'GET') {
            if(!stickOAuthParam){
              pUrl = makeGetURL(pUrl, parameterMap);
            }
			parameterMap = null;
            Ti.API.debug('url for GET:' + pUrl);
        }
		var client = Ti.Network.createHTTPClient();
		Ti.API.info('Network client for sending oAuth POST/GET request');
//		client.setTimeout(25000);
        client.onerror = function(e){
			Ti.API.debug('Error Returned from Server');
			Ti.API.debug('Status:'+client.status);
			Ti.API.debug(e);
			if(params.onError){
				params.onError(e);
			}
        };
        client.onload = function(){
		Ti.API.info('connection load');
          Ti.API.debug('*** sendStatus, Response: [' + client.status + '] ' + client.responseText);
          if (('' + client.status).match(/^20[0-9]/)) {
            if(params.onSuccess){
              
				var httpResponse = {
					successMessage: 'Success',
					httpStatus: client.status,
					responseText: client.responseText
				}
				params.onSuccess(httpResponse);
			  	return httpResponse;
            };
          } else {
            if(params.onError){
				var httpResponse = {
					errorMessage: JSON.parse(client.responseText).error,
					httpStatus: client.status,
					responseText: client.responseText
				};
			Ti.API.debug(httpResponse);
              params.onError(httpResponse);
			  return httpResponse;
            };
          }
        };
		var finalUrl = OAuth.addToURL(pUrl, parameterMap);
        client.open(pMethod, finalUrl, false);
		Ti.API.info('oAuth POST/GET request connection Opened');
        if(stickOAuthParam){ // Google Auth
          var header = makeHeaderParam(parameterMap);

          Ti.API.debug('header = ' + header);
          client.setRequestHeader('Authorization', header);
        } else {
		client.setRequestHeader('Content-Type',"application/x-www-form-urlencoded");
		}
		 ;
        client.send();
		Ti.API.info('oAuth POST/GET request Sent to network service');
        return client.responseText;
    };
    this.send = send;
};