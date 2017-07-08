/*----------/
/ TODO-LIST /
/----------*/
/*
	- Configuration interface
	- Automatic virtual desktop removal (Plasma crashes when a desktop is removed via script)
	- Windows will fill desktops with space, instead of creating new ones
	- Support for large programs (Gimp, Krita, Kate)
		- Automatically occupies the largest tile
		- Max clients (default: 4) -= 1 per large program
	- Resizing the layout
*/



/*-----------------/
/ GLOBAL VARIABLES /
/-----------------*/

// Add programs that don't tile well
// Names usually in lowercase with no spaces
var ignoredClients = [
	"albert",
	"kazam",
	"krunner",
	"ksmserver",
	"lattedock",
	"pinentry",
	"Plasma",
	"plasma",
	"plasma-desktop",
	"plasmashell",
	"plugin-container",
	"simplescreenrecorder",
	"yakuake",
];

ignoredClients = ignoredClients.concat(readConfig("ignoredClients", "wine,steam,kate").toString().split(','));

// If the program can't be blacklisted via the array above (resourceClass)
// Try adding its caption to the array below
var ignoredCaptions = [
	"File Upload",
	"Move to Trash",
];

ignoredCaptions = ignoredCaptions.concat(readConfig("ignoredCaptions", "").toString().split(','));


// Clients that don't play well when reduced to a quarter
// Todo: Recognize these and reduce activeClients[].max by one
var largeClients = [];

largeClients = largeClients.concat(readConfig("largeClients", "gimp").toString().split(','));

// Hack: The way Plasma panel is found also finds multiple other Plasma-related clients
// Plasma panel is the first client to be found, so after it has been found, a global variable
// is used to skip the step looking for Plasma in the checkClient() function
var plasma = {
	x: 0,
	y: 0,
	height: 0,
	width: 0,
	notFound: true,
};

var gap = readConfig("gap", 10); // Gap size in pixels

var noBorders = readConfig("noBorders", false);

var screen = {
	x: 0,
	y: 0,
	width: workspace.displayWidth,
	height: workspace.displayHeight,
};

var oldGeo; // Hack: Saves the pre-movement position as a global variable

var currentDesktop = workspace.currentDesktop;
var activeClients = {};

/*---------------/
/ INIT FUNCTIONS /
/---------------*/

function init() {
	workspace.desktops = 1;
	createDesktop(1);
	registerKeys();
	addClients();
	// Connects the KWin:Workspace signals to the following functions
	workspace.clientAdded.connect(addClient);
	workspace.clientRemoved.connect(removeClient);
	// workspace.clientMaximizeSet.connect(maximizeClient);
	workspace.currentDesktopChanged.connect(changeDesktop);
	workspace.numberDesktopsChanged.connect(adjustDesktops);
}

function registerKeys() {
	// Todo: Shortcut for +/- gapsize?
	// Todo: Shortcut for moving clients
	registerShortcut(
		"Quarter: Float On/Off",
		"Quarter: Float On/Off",
		"Meta+F",
		function() {
			if (workspace.activeClient.float) {
				addClient(workspace.activeClient);
			} else {
				removeClient(workspace.activeClient);
			}
		});
	registerShortcut(
		"Quarter: Move Up",
		"Quarter: Move Up",
		"Meta+Up",
		function() {
			var client = workspace.activeClient;
			var i = findClientIndex(client, currentDesktop);
			if (i === 2) {
				swapClients(i, 1, currentDesktop);
			} else if (i === 3) {
				swapClients(i, 0, currentDesktop);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Down",
		"Quarter: Move Down",
		"Meta+Down",
		function() {
			var client = workspace.activeClient;
			var i = findClientIndex(client, currentDesktop);
			if (i === 0 && activeClients[currentDesktop].length === 4) {
				swapClients(i, 3, currentDesktop);
			} else if (i === 1 && activeClients[currentDesktop].length >= 3) {
				swapClients(i, 2, currentDesktop);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Left",
		"Quarter: Move Left",
		"Meta+Left",
		function() {
			var client = workspace.activeClient;
			var i = findClientIndex(client, currentDesktop);
			if (i === 1) {
				swapClients(i, 0, currentDesktop);
			} else if (i === 2 && activeClients[currentDesktop].length === 4) {
				swapClients(i, 3, currentDesktop);
			} else if (i === 2) {
				swapClients(i, 0, currentDesktop);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Right",
		"Quarter: Move Right",
		"Meta+Right",
		function() {
			var client = workspace.activeClient;
			var i = findClientIndex(client, currentDesktop);
			if (i === 0 && activeClients[currentDesktop].length > 1) {
				swapClients(i, 1, currentDesktop);
			} else if (i === 3) {
				swapClients(i, 2, currentDesktop);
			} else return;
			tileClients();
		});
}


/*--------------------------------/
/ CLIENT ADDING, MOVING & REMOVAL /
/--------------------------------*/

// Runs an ignore-check and if it passes, adds a client to activeClients[]
function addClient(client) {
	if (checkClient(client)) {
		if (noBorders == true) {
			client.noBorder = true;
		} else client.noBorder = false;
		// If activeClients.length exceeds the maximum amount, creates a new virtual desktop
		if (activeClients[currentDesktop].length === activeClients[currentDesktop].max ||
			activeClients[currentDesktop].length === 4) {
			// Makes sure that desktops can't get a max value higher than four
			if (activeClients[currentDesktop].length === 4) {
				activeClients[currentDesktop].max = 4;
			}
			workspace.desktops += 1;
			workspace.currentDesktop = workspace.desktops;
		}
		client.desktop = currentDesktop;
		activeClients[currentDesktop].push(client);
		tileClients();	
		connectClient(client);
		// If the client is minimized, triggers the minimization signal after it's added
		if (client.minimized) {
			minimizeClient(client);
		}
	}
}

// Runs an ignore-check and if it passes, adds a client to activeClients[]
// Unlike addClient(), takes target desktop as a parameter and does not follow or connect the client
function addClientNoFollow(client, desktop) {
	if (checkClient(client)) {
		if (noBorders == true) {
			client.noBorder = true;
		} else client.noBorder = false;
		client.desktop = desktop;
		activeClients[desktop].push(client);
		tileClients();
		connectClient(client);
		// If the client is minimized, triggers the minimization signal after it's added
		if (client.minimized) {
			minimizeClient(client);
		}
	}
}
// Adds all the clients that existed before the script was executed
function addClients() {
	var clients = workspace.clientList();
	for (var i = 0; i < clients.length; i++) {
		addClient(clients[i]);
	}
}

// Connects the signals of the new KWin:Client to the following functions
function connectClient(client) {
	client.clientStartUserMovedResized.connect(saveClientGeo);
	client.clientFinishUserMovedResized.connect(adjustClient);
	client.clientMinimized.connect(minimizeClient);
	client.clientUnminimized.connect(unminimizeClient);
	// desktopChanged function is declared here, because unlike other client signals,
	// this one doesn't keep client as a parameter if calling a function
	client.desktopChanged.connect(function() {
		removeClientNoFollow(client);
		if (activeClients[client.desktop].length < activeClients[client.desktop].max) {
			addClientNoFollow(client, client.desktop);
		}
	});
	client.float = false;
}

// Removes the closed client from activeClients[]
function removeClient(client) {
	// First for- and if-loops find the closed client 
	for (var i = 0; i < activeClients[currentDesktop].length; i++) {
		if (sameClient(activeClients[currentDesktop][i], client)) {
			activeClients[currentDesktop].splice(i, 1);
			disconnectClient(client);
			// If there are still tiles after the removal, calculates the geometries
			if (activeClients[currentDesktop].length > 0) {
				tileClients();
			} else if (activeClients[currentDesktop].length === 0) {
				if (workspace.currentDesktop > 1) {
					// client.desktop = null;
					workspace.currentDesktop -= 1;
					// workspace.activeClient = activeClients[currentDesktop][0];
					// workspace.desktops -= 1;
				}
			}
		}
	}
}

// Removes the closed client from activeClients[]
// Unlike removeClient(), does not follow the client
function removeClientNoFollow(client) {
	// First for- and if-loops find the closed client 
	for (var i = 0; i < activeClients[currentDesktop].length; i++) {
		if (sameClient(activeClients[currentDesktop][i], client)) {
			activeClients[currentDesktop].splice(i, 1);
			disconnectClient(client);
			// If there are still tiles after the removal, calculates the geometries
			if (activeClients[currentDesktop].length > 0) {
				tileClients();
			} else if (activeClients[currentDesktop].length === 0) {
				activeClients[currentDesktop] = [];
				activeClients[currentDesktop].max = 4;
			}
		}
	}
}

// Disconnects the signals from removed clients
// So they will not trigger when a manually floated client is interacted with
// Or when a client is removed & added between desktops
function disconnectClient(client) {
	client.clientStartUserMovedResized.disconnect(saveClientGeo);
	client.clientFinishUserMovedResized.disconnect(adjustClient);
	client.clientMinimized.disconnect(minimizeClient);
	client.clientUnminimized.disconnect(unminimizeClient);
	client.float = true;
}

// Calculates the geometries to maintain the layout
// Geometry calculation is a mess and pre-existing client geometries should NEVER be used
// Layout is always the fullscreen - no plasma and no gaps layout
// Plasma is impossible to calculate on init() so it has to be calculated repeatedly
function tileClients() {
	// Let's just pretend this doesn't exist, okay?
	// Calculating the gaps and plasma each time something moves is the best and least buggy approach
	// Believe me, I've tried EVERYTHING
	// Since it's just four, switch is also the easiest approach
	// Todo: Clean this up, big time
	var adjusted = [];
	switch(activeClients[currentDesktop].length) {
		case 0:
			break;
		case 1:
			adjusted[0] = {};
			adjusted[0].x = activeClients[currentDesktop].layout[0].x + plasma.x + gap;
			adjusted[0].y = activeClients[currentDesktop].layout[0].y + plasma.y + gap;
			adjusted[0].width = activeClients[currentDesktop].layout[0].width + activeClients[currentDesktop].layout[1].width - plasma.width - gap * 2;
			adjusted[0].height = activeClients[currentDesktop].layout[0].height + activeClients[currentDesktop].layout[3].height - plasma.height - gap * 2;
			break;
		case 2:
			adjusted[0] = {};
			adjusted[0].x = activeClients[currentDesktop].layout[0].x + plasma.x + gap;
			adjusted[0].y = activeClients[currentDesktop].layout[0].y + plasma.y + gap;
			adjusted[0].width = activeClients[currentDesktop].layout[0].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[0].height = activeClients[currentDesktop].layout[0].height + activeClients[currentDesktop].layout[3].height - plasma.height - gap * 2;

			adjusted[1] = {};
			adjusted[1].x = activeClients[currentDesktop].layout[1].x + plasma.x * 0.5 + gap * 0.5;
			adjusted[1].y = activeClients[currentDesktop].layout[1].y + plasma.y + gap;
			adjusted[1].width = activeClients[currentDesktop].layout[1].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[1].height = activeClients[currentDesktop].layout[1].height + activeClients[currentDesktop].layout[2].height - plasma.height - gap * 2;
			break;
		case 3:
			adjusted[0] = {};
			adjusted[0].x = activeClients[currentDesktop].layout[0].x + plasma.x + gap;
			adjusted[0].y = activeClients[currentDesktop].layout[0].y + plasma.y + gap;
			adjusted[0].width = activeClients[currentDesktop].layout[0].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[0].height = activeClients[currentDesktop].layout[0].height + activeClients[currentDesktop].layout[3].height - plasma.height - gap * 2;

			adjusted[1] = {};
			adjusted[1].x = activeClients[currentDesktop].layout[1].x + plasma.x * 0.5 + gap * 0.5;
			adjusted[1].y = activeClients[currentDesktop].layout[1].y + plasma.y + gap;
			adjusted[1].width = activeClients[currentDesktop].layout[1].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[1].height = activeClients[currentDesktop].layout[1].height - plasma.height * 0.5 - gap * 1.5;

			adjusted[2] = {};
			adjusted[2].x = activeClients[currentDesktop].layout[2].x + plasma.x * 0.5 + gap * 0.5;
			adjusted[2].y = activeClients[currentDesktop].layout[2].y + plasma.y * 0.5 + gap * 0.5;
			adjusted[2].width = activeClients[currentDesktop].layout[2].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[2].height = activeClients[currentDesktop].layout[2].height - plasma.height * 0.5 - gap * 1.5;
			break;
		case 4:
			adjusted[0] = {};
			adjusted[0].x = activeClients[currentDesktop].layout[0].x + plasma.x + gap;
			adjusted[0].y = activeClients[currentDesktop].layout[0].y + plasma.y + gap;
			adjusted[0].width = activeClients[currentDesktop].layout[0].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[0].height = activeClients[currentDesktop].layout[0].height - plasma.height * 0.5 - gap * 1.5;

			adjusted[1] = {};
			adjusted[1].x = activeClients[currentDesktop].layout[1].x + plasma.x * 0.5 + gap * 0.5;
			adjusted[1].y = activeClients[currentDesktop].layout[1].y + plasma.y + gap;
			adjusted[1].width = activeClients[currentDesktop].layout[1].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[1].height = activeClients[currentDesktop].layout[1].height - plasma.height * 0.5 - gap * 1.5;

			adjusted[2] = {};
			adjusted[2].x = activeClients[currentDesktop].layout[2].x + plasma.x * 0.5 + gap * 0.5;
			adjusted[2].y = activeClients[currentDesktop].layout[2].y + plasma.y * 0.5 + gap * 0.5;
			adjusted[2].width = activeClients[currentDesktop].layout[2].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[2].height = activeClients[currentDesktop].layout[2].height - plasma.height * 0.5 - gap * 1.5;

			adjusted[3] = {};
			adjusted[3].x = activeClients[currentDesktop].layout[3].x + plasma.x + gap;
			adjusted[3].y = activeClients[currentDesktop].layout[3].y + plasma.y * 0.5 + gap * 0.5;
			adjusted[3].width = activeClients[currentDesktop].layout[3].width - plasma.width * 0.5 - gap * 1.5;
			adjusted[3].height = activeClients[currentDesktop].layout[3].height - plasma.height * 0.5 - gap * 1.5;
			break; 
	}
	for (var j = 0; j < adjusted.length; j++) {
		activeClients[currentDesktop][j].geometry = adjusted[j];
	}
}

// Saves the pre-movement position when called
function saveClientGeo(client) {
	oldGeo = client.geometry;
}

// Moves clients and adjusts the layout
function adjustClient(client) {
	// If the size equals the pre-movement size, user is trying to move the client, not resize it
	if (client.geometry.width === oldGeo.width && client.geometry.height === oldGeo.height) {
		moveClient(client);
	} else {
		resizeClient(client);
}

function moveClient(client) {
	var centerX = client.geometry.x + client.width / 2;
	var centerY = client.geometry.y + client.height / 2;
	var geometries = [];
	geometries.push(oldGeo);
	// Adds all the existing clients to the geometries[]...
	for (var i = 0; i < activeClients[currentDesktop].length; i++) {
		// ...except for the client being moved
		// (it's off the grid and needs to be snapped back to the oldGeo variable)
		if (activeClients[currentDesktop][i] != client) {
			geometries.push(activeClients[currentDesktop][i].geometry);
			// If more geometry comparison is to be done, geometries[i].frameId = client.frameId to easily compare with sameClient
		}
	}
	// Sorts the geometries[] and finds the geometry closest to the moved client
	geometries.sort(function(a, b) {
		return Math.sqrt(Math.pow((centerX - (a.x + a.width / 2)), 2) + Math.pow((centerY - (a.y + a.height / 2)), 2)) - Math.sqrt(Math.pow((centerX - (b.x + b.width / 2)), 2) + Math.pow((centerY - (b.y + b.height / 2)), 2));
	});
	// If the closest geometry is not the client's old position, switches the geometries and indexes
	if (geometries[0] != oldGeo) {
		i = findClientIndex(client, currentDesktop);
		var j = findGeometryIndex(geometries[0], currentDesktop);
		swapClients(i, j, currentDesktop);
		tileClients();
	} else {
		client.geometry = oldGeo;
	}
}

function resizeClient(client) {
	var difX = client.geometry.x - oldGeo.x;
	var difY = client.geometry.y - oldGeo.y;
	var difW = client.geometry.width - oldGeo.width;
	var difH = client.geometry.height - oldGeo.height;
	switch (findClientIndex(client, currentDesktop)) {
		case 0:
			if (difX === 0) {				
				activeClients[currentDesktop].layout[0].width += difW;
				activeClients[currentDesktop].layout[1].x += difW;
				activeClients[currentDesktop].layout[1].width -= difW;
				activeClients[currentDesktop].layout[2].x += difW;
				activeClients[currentDesktop].layout[2].width -= difW;
				activeClients[currentDesktop].layout[3].width += difW;
				if (activeClients[currentDesktop].length === 4) {
					activeClients[currentDesktop].layout[0].height += difH;
					activeClients[currentDesktop].layout[3].height -= difH;
					activeClients[currentDesktop].layout[3].y += difH;
				}
			}
			break;
		case 1:
			activeClients[currentDesktop].layout[0].width += difX;
			activeClients[currentDesktop].layout[1].x += difX;
			activeClients[currentDesktop].layout[1].width -= difX;
			activeClients[currentDesktop].layout[2].x += difX;
			activeClients[currentDesktop].layout[2].width -= difX;
			activeClients[currentDesktop].layout[3].width += difX;
			if (difY === 0) {
				activeClients[currentDesktop].layout[1].height += difH;
				activeClients[currentDesktop].layout[2].y += difH;
				activeClients[currentDesktop].layout[2].height -= difH;
			}
			break;
		case 2:
			activeClients[currentDesktop].layout[0].width += difX;
			activeClients[currentDesktop].layout[1].x += difX;
			activeClients[currentDesktop].layout[1].width -= difX;
			activeClients[currentDesktop].layout[1].height += difY;
			activeClients[currentDesktop].layout[2].x += difX;
			activeClients[currentDesktop].layout[2].y += difY;
			activeClients[currentDesktop].layout[2].width -= difX;
			activeClients[currentDesktop].layout[2].height -= difY;
			activeClients[currentDesktop].layout[3].width += difX;
			break;
		case 3:
			if (difX === 0) {				
				activeClients[currentDesktop].layout[0].width += difW;
				activeClients[currentDesktop].layout[0].height += difY;
				activeClients[currentDesktop].layout[1].x += difW;
				activeClients[currentDesktop].layout[1].width -= difW;
				activeClients[currentDesktop].layout[2].x += difW;
				activeClients[currentDesktop].layout[2].width -= difW;
				activeClients[currentDesktop].layout[3].y += difY;
				activeClients[currentDesktop].layout[3].width += difW;
				activeClients[currentDesktop].layout[3].height -= difY;
			}
			break;
		}
	}
	tileClients();
}

function minimizeClient(client) {
	for (var i = 0; i < activeClients[currentDesktop].length; i++) {
		if (sameClient(activeClients[currentDesktop][i], client))  {
			activeClients[currentDesktop].splice(i, 1);
			activeClients[currentDesktop].max -= 1;
		}
	}
	tileClients();
}

function unminimizeClient(client) {
	activeClients[client.desktop].push(client);
	activeClients[client.desktop].max += 1;
	workspace.currentDesktop = client.desktop;
	tileClients();
}

/*--------------------- TODO -----------------------------------
- Figure out what to do with maximized clients
- Maximize stays on after closing
- Maximized property does not exist
- Knowing which clients are maximized is problematic
- Currently the best solution: compare to the screen size
- Problem: User has no gaps, first window would always be "maximized"

function maximizeClient(client, h, v) {
	if (h && v) {
		removeClient(client);
	} else {
		addClient(client);
	}
}
--------------------------------------------------------------*/



/*--------------/
/ CLIENT CHECKS /
/--------------*/

// Ignore-check to see if the client is valid for the script
function checkClient(client) {
	// Hack: Global variable to skip this step once plasma panel has been found, script starts before Plasma so it can't be found on init()
	// If the plasma panel has not been found yet, it's most likely the first client with resourceClass: "plasmashell" and caption: "Plasma"
	if (plasma.notFound) {
		var panel = {
			resourceClass: "plasmashell",
			caption: "Plasma",
		};
		if (panel.resourceClass.indexOf(client.resourceClass.toString()) > -1 &&
			panel.caption.indexOf(client.caption.toString()) > -1) {
			if (client.geometry.width > client.geometry.height) {
				if (client.geometry.y < workspace.displayHeight / 2) {
					plasma = {
						x: 0,
						y: client.geometry.height,
						width: 0,
						height: client.geometry.height,
					};
				} else {
					plasma = {
						x: 0,
						y: 0,
						width: 0,
						height: client.geometry.height,
					};
				}
			} else {
				if (client.geometry.x < workspace.displayWidth / 2) {
					plasma = {
						x: client.geometry.width,
						y: 0,
						width: client.geometry.width,
						height: 0,
					};
				} else {
					plasma = {
						x: 0,
						y: 0,
						width: 0,
						height: client.geometry.height,
					};
				}
			}
			plasma.notFound = false;
			return false;
		}
	}
	if (client.comboBox ||
		client.desktopWindow ||
		client.dndIcon ||
		client.dock ||
		client.dropdownMenu ||
		client.menu ||
		client.notification ||
		client.popupMenu ||
		client.specialWindow ||
		client.splash ||
		client.toolbar ||
		client.tooltip ||
		client.utility ||
		client.transient ||
		ignoredClients.indexOf(client.resourceClass.toString()) > -1 ||
		ignoredCaptions.indexOf(client.caption.toString()) > -1) {
		return false;
	}
	return true;
}

// Todo: Unify clients & geometries for readability, optimization and coherence

// Compare two clients without unnecessary type conversion (see issue #1)
function sameClient(client1, client2) {
	if (client1.frameId === client2.frameId) {
		return true;
	} else return false;
}

// Compare two geometries without unnecessary type conversion
function sameGeometry(geo1, geo2) {
	if (geo1.x === geo2.x && geo1.y === geo2.y) {
		return true;
	} else return false;
}

// Finds activeClients[desktop] index of a client
function findClientIndex(client, desktop) {
	for (i = 0; i < activeClients[desktop].length; i++) {
		if (sameClient(activeClients[desktop][i], client)) {
			return i;
		}
	}
}

// Finds activeClients[desktop] index by geometry
function findGeometryIndex(geo, desktop) {
	for (i = 0; i < activeClients[desktop].length; i++) {
		if (sameGeometry(activeClients[desktop][i], geo)) {
			return i;
		}
	}
}

// Swaps activeClients[desktop][i] and activeClients[desktop][j]
function swapClients(i, j, desktop) {
	var temp = activeClients[desktop][i];
	activeClients[desktop][i] = activeClients[desktop][j];
	activeClients[desktop][j] = temp;
}


/*--------------------------/
/ VIRTUAL DESKTOP FUNCTIONS /
/--------------------------*/

function changeDesktop() {
	currentDesktop = workspace.currentDesktop;
	tileClients();
}

function adjustDesktops(desktop) {
	// Checks if a workspace is removed
	if (workspace.desktops < desktop) {
		removeDesktop(desktop);
	}
	// Checks if a workspace is added 
	else if (workspace.desktops > desktop) {
		createDesktop(desktop);
	}
}

function createDesktop(desktop) {
		activeClients[workspace.desktops] = [];
		activeClients[workspace.desktops].max = 4;
		activeClients[workspace.desktops].layout = newLayout();
		tileClients();
}

function removeDesktop(desktop) {
	// Because the API returns desktops as an integer, they can not be recognized
	// which is why the latest workspace is always the one removed
	// Todo: recognize desktops by comparing activeClients[] and switching desktops before removal
	if (activeClients[desktop].length > 0) {
		for (i = 0; i < activeClients[desktop].length; i++) {
			activeClients[desktop][i].closeWindow();
		}
	}
	tileClients();
}

function newLayout() {
	var layout = [];
	for (var i = 0; i < 4; i++) {
		layout[i] = {}; // Note: Need to clone the properties, can't just layout = screen!
		layout[i].x = screen.x;
		layout[i].y = screen.y;
		layout[i].width = screen.width;
		layout[i].height = screen.height;
		if (i === 1) {
			layout[0].width = layout[0].width * 0.5;
			layout[i].width = layout[0].width;
			layout[i].x = layout[i].x + layout[i].width;
		}
		if (i === 2) {
			layout[1].height = layout[1].height * 0.5 ;
			layout[i].height = layout[1].height;
			layout[i].y = layout[i].y + layout[i].height;
			layout[i].width = layout[i].width * 0.5;
			layout[i].x = layout[i].x + layout[i].width;
		}
		if (i === 3) {
			layout[0].height = layout[0].height * 0.5;
			layout[i].height = layout[0].height;
			layout[i].width = layout[i].width * 0.5;
			layout[i].y = layout[i].y + layout[i].height;
		}
	}
	return layout;
}

/*-----/
/ MAIN /
/-----*/

init();