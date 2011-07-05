var t = {
	init: function(){
		t.win2 = Ti.UI.currentWindow;
		t.win2.exitOnClose = true;
		t.win2.backgroundColor = "#000";
		Ti.API.debug('Using an '+Ti.Platform.osname+' device');				
		// set scroll view 
		t.addViews();
	},
	addViews: function(){
		var newHeight = Ti.Platform.displayCaps.platformHeight - (20* (Ti.Platform.displayCaps.platformHeight/100));
		
		t.sview = Titanium.UI.createScrollView({
		    contentWidth:'auto',
		    contentHeight:'auto',
			borderRadius:10,
			height: newHeight,
			backgroundColor: '#000',
		    top:0,
		    showVerticalScrollIndicator:true
		});
		
		t.view = Ti.UI.createView({
		    backgroundColor:'#336699',
		    borderRadius:10,
		    width: Ti.Platform.displayCaps.platformWidth,
			height: 2000,
		    top:10
		});
		t.sview.add(t.view);
		t.win2.add(t.sview);
	},
	printMessage: function(message, height){
		Ti.API.info('Print Message to screen');
		if(height == null) height = 25;
		if(Ti.Platform.displayCaps.platformWidth > 340) {
			var fSize = 25;
			var hAdj = 25;
		} else {
			fSize = 11;
			hAdj = 0;
		}
		var printLabel = Titanium.UI.createLabel({
			text:message,
			color:'#fff',
			top:5,
			left: 10,
			height:height+ hAdj,
			width:'90%',
			zIndex:10,
			font:{fontSize: fSize}
		});
		t.view.add(printLabel);
	},
	addtestButtons: function(){
		t.postButton = Ti.UI.createButton({
			width: '40%',
			title: 'POST tweet',
			backgroundColor: '#FF9933',
			color: '#fff',
			borderColor: '#000',
			backgroundImage: 'none',
			left: 10,
			height: 50,
			top: 20
		});
		
		t.view.add(t.postButton);
		
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

		t.view.add(t.getButton);
		
		t.refreshButton = Ti.UI.createButton({
			width: '40%',
			title: 'CLEAR ALL',
			backgroundColor: '#FF9933',
			borderColor: '#000',
			color: '#fff',
			backgroundImage: 'none',
			left: 10,
			height: 50,
			top: 20
		});

		t.view.add(t.refreshButton);
		
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
		t.view.add(t.signOutButton);
		
		
		t.view.layout = 'vertical';
	},
	addButtonListeners: function(){
		t.refreshButton.addEventListener('click',function(){
			// this just clears the views so you can start from scratch
				t.sview.remove(t.view);
				t.win2.remove(t.sview);
				t.addViews();
				t.addtestButtons();
				t.addButtonListeners();
		});

		t.getButton.addEventListener('click',function(e){
			t.printMessage('***** Attempting to find authorized twitter details *****');
			// First check for authentication
			t.tState = oa.oAuthAdapter.isAuthorized();
			t.printMessage('***** Current twitter auth state: '+ t.tState +' *****');
			if(t.tState === true) {
				t.signOutButton.title='Sign Out';
			} else {
				t.signOutButton.title='Sign In';
			}
			if (t.tState != false) {
				
				t.printMessage('***** Twitter tokens present *****');
	
				t.printMessage('***** Attempting GET request to Twitter *****');
				t.printMessage('***** API Call - verify_credentials  *****');
				oa.oAuthAdapter.send({
					url:'http://api.twitter.com/1/account/verify_credentials.json', 
					parameters:[
					],
					method:'GET',
					onSuccess:function(response){
						t.printMessage('***** GET Success '+response.httpStatus + ' *****');
						rText = JSON.parse(response.responseText);
						t.printMessage('*****  '+  rText.screen_name+ ' - '+ rText.description + ' authenticated  *****');	
						alert(response.successMessage);
					}
				});
			}
		});
		
		t.postButton.addEventListener('click',function(e){
			t.tState = oa.oAuthAdapter.isAuthorized();
			t.printMessage('***** Current twitter auth state: '+ t.tState +' *****');
			if(t.tState === true) {
				t.signOutButton.title='Sign Out';
			} else {
				t.signOutButton.title='Sign In';
			}
			if (oa.oAuthAdapter.isAuthorized() != false) {
				t.printMessage('***** Twitter tokens present *****');
	
				t.printMessage('***** Attempting POST request to Twitter *****');
				var d=new Date();
				oa.oAuthAdapter.send({
					url:'https://api.twitter.com/1/statuses/update.json', 
					parameters:[
						['display_coordinates','true'],
						['place_id','8ef32ff56ef11c22'],
						['include_entities',1],
						['status', 'It\'s now '+d+'. I am testing that my twitter app using http://goo.gl/sQxUE works #appcelerator']
					],
					method:'POST',
					onSuccess:function(response){
						t.printMessage('***** POST Success '+response.httpStatus + ' *****');
						rText = JSON.parse(response.responseText);
						t.printMessage('***** '+rText.id_str + ' ID of tweet    *****');	
					},
					onError:function(response){
						t.printMessage('***** POST Error '+response.httpStatus + ' *****');
						alert(response.errorMessage);
						rText = JSON.parse(response.responseText);
						t.printMessage('***** '+response.errorMessage + '   *****');	
					}
				});
			}
		});
		
		
		t.signOutButton.addEventListener('click',function(e){
			if(t.tState === true) {
				var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'twitter.config');
        	if (file == null) {
            	oa.oAuthAdapter.isAuthorized();
            	t.signOutButton.title='Sign In';
        	}
        	file.deleteFile();
        	t.printMessage('***** Deleted access token *****');
			t.signOutButton.title='Sign In';
			} else {
				oa.oAuthAdapter.isAuthorized();
			}
			
			
		});
	}
};
t.init();
t.printMessage('***** START *****');
t.printMessage('***** Loading buttons *****');
t.addtestButtons();
t.printMessage('***** Attaching Event Listeners *****');
t.addButtonListeners();


t.printMessage('***** Initialise Twitter Libraries *****');
// Write ytour test here or within the class above. Make sure to t.printMessage("TEXT"); at breakpoints within your test.
Ti.include('lib/sha1.js');
t.printMessage('***** Loaded SHA1 *****');
Ti.include('lib/oauth.js');
t.printMessage('***** Loaded oauth *****');
Ti.include('lib/oauth_adapter.js');
t.printMessage('***** Loaded adapter *****');
Ti.include('lib/twitter_api.js');
t.printMessage('***** Loaded api bridge *****');

t.printMessage('***** Waiting for Button Press *****');







