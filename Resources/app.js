Ti.App.Properties.setString("version",'0.3.3');
var shortDescription = 'oAuth Test';
var startWin = Ti.UI.createWindow({
	title: shortDescription,
	url: 'testWindow.js',
	titleid: 'start',
	layout: 'vertical'
});
var tab1 = Ti.UI.createTab({
	title: 'Run Test',
	window: startWin,
	titleid: 'start'
});


var aboutTest = Ti.UI.createWindow({
title: 'About the test'	
});
var tab2 = Ti.UI.createTab({
	title: 'About',
	window: aboutTest
});
var version = Ti.App.Properties.getString("version");
// Create HTML to populate about window, describe the test and what the app is trying to achieve
var htmlContent = '<h2>Outline</h2>';
htmlContent += '<p>Creating a simple test app to check functionality between android and iOS</p>';
htmlContent += '<p>Use the <strong>Run Test</strong> tab below to run the tests</p>';
htmlContent += '<h2>Revisions</h2><p>Currently running version : <strong>'+version+'</strong></p>';

var wv = Ti.UI.createWebView({
	width: '100%',
	height: '100%',
	html: htmlContent
});
aboutTest.add(wv);

var tabgroup = Ti.UI.createTabGroup();

tabgroup.addTab(tab2);
tabgroup.addTab(tab1);
tabgroup.setActiveTab(0);
tabgroup.open();