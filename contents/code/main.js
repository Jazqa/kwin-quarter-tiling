/*----------/
/ TODO-LIST /
/----------*/
/*
	- Automatic virtual desktop removal (Plasma crashes when a desktop is removed via script)
	- Windows will fill desktops with space, instead of creating new ones
	- Support for large programs (Gimp, Krita, Kate)
		- Automatically occupies the largest tile
		- Max clients (default: 4) -= 1 per large program
	- Minimizing (when a minimized client is closed and when the desktop of a minimized client is removed)
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
// Todo: Recognize these and reduce tiles[].max by one
var largeClients = [];

largeClients = largeClients.concat(readConfig("largeClients", "gimp").toString().split(','));



var gap = readConfig("gap", 10); // Gap size in pixels

var noBorders = readConfig("noBorders", false);

var ws = workspace;

var tiles = []; // tiles[desktop][screen][client]

var oldGeo; // Hack: Saves the pre-movement position as a global variable

/*---------------/
/ INIT FUNCTIONS /
/---------------*/

function init() {
	registerKeys();
	for (var i = 1; i <= ws.desktops; i++) {	
		createDesktop(i);
	}
	addClients();
	connectWorkspace();
}

function registerKeys() {
	// Todo: Shortcut for +/- gapsize?
	// Todo: Shortcut for moving clients
	registerShortcut(
		"Quarter: Float On/Off",
		"Quarter: Float On/Off",
		"Meta+F",
		function() {
			if (ws.activeClient.float) {
				addClient(ws.activeClient);
			} else {
				removeClient(ws.activeClient);
			}
		});
	registerShortcut(
		"Quarter: Move Up",
		"Quarter: Move Up",
		"Meta+Up",
		function() {
			var client = ws.activeClient;
			var i = findClientIndex(client, ws.currentDesktop);
			if (i === 2) {
				swapClients(i, 1, ws.currentDesktop);
			} else if (i === 3) {
				swapClients(i, 0, ws.currentDesktop);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Down",
		"Quarter: Move Down",
		"Meta+Down",
		function() {
			var client = ws.activeClient;
			var i = findClientIndex(client, ws.currentDesktop);
			if (i === 0 && tiles[ws.currentDesktop][ws.activeScreen].length === 4) {
				swapClients(i, 3, ws.currentDesktop);
			} else if (i === 1 && tiles[ws.currentDesktop][ws.activeScreen].length >= 3) {
				swapClients(i, 2, ws.currentDesktop);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Left",
		"Quarter: Move Left",
		"Meta+Left",
		function() {
			var client = ws.activeClient;
			var i = findClientIndex(client, ws.currentDesktop);
			if (i === 1) {
				swapClients(i, 0, ws.currentDesktop);
			} else if (i === 2 && tiles[ws.currentDesktop][ws.activeScreen].length === 4) {
				swapClients(i, 3, ws.currentDesktop);
			} else if (i === 2) {
				swapClients(i, 0, ws.currentDesktop);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Right",
		"Quarter: Move Right",
		"Meta+Right",
		function() {
			var client = ws.activeClient;
			var i = findClientIndex(client, ws.currentDesktop);
			if (i === 0 && tiles[ws.currentDesktop][ws.activeScreen].length > 1) {
				swapClients(i, 1, ws.currentDesktop);
			} else if (i === 3) {
				swapClients(i, 2, ws.currentDesktop);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Reset Layout",
		"Quarter: Reset Layout",
		"Meta+R",
		function() {
			tiles[ws.currentDesktop][ws.activeScreen].layout = newLayout(ws.activeScreen);
			tileClients();
		});
}

// Connects the KWin:Workspace signals to the following functions
function connectWorkspace() {
	ws.clientAdded.connect(addClient);
	ws.clientRemoved.connect(removeClient);
	// workspace.clientMaximizeSet.connect(maximizeClient);
	ws.currentDesktopChanged.connect(changeDesktop);
	ws.numberDesktopsChanged.connect(adjustDesktops);
}


/*--------------------------------/
/ CLIENT ADDING, MOVING & REMOVAL /
/--------------------------------*/

// Runs an ignore-check and if it passes, adds a client to tiles[]
function addClient(client) {
	if (checkClient(client)) {
		if (noBorders == true) {
			client.noBorder = true;
		} else client.noBorder = false;
		var scr = ws.activeScreen;
		// If tiles.length exceeds the maximum amount, creates a new virtual desktop
		if (tiles[ws.currentDesktop][scr].length === tiles[ws.currentDesktop][scr].max ||
			tiles[ws.currentDesktop][scr].length === 4) {
			// Fixes a bug that makes the maximum go over 4 when removing virtual desktops
			if (tiles[ws.currentDesktop][scr].length === 4) {
				tiles[ws.currentDesktop][scr].max = 4;
			}
			for (var i = 0; i < ws.numScreens; i++) {
				if (tiles[ws.currentDesktop][i].length < tiles[ws.currentDesktop][i].max) {
					scr = i;
					break;
				}
			}
			// If client isn't thrown to another screen, it's thrown into an other desktop
			if (scr === ws.activeScreen) {		
				ws.desktops += 1;
				ws.currentDesktop += 1;
			}
		}
		client.desktop = ws.currentDesktop;
		// Not needed per se, only important when activating the script with more than four clients active
		if (typeof tiles[client.desktop] == "undefined") {
			createDesktop(client.desktop);
		}
		tiles[client.desktop][scr].push(client);
		print(client.caption + " added");
		tileClients();
		connectClient(client);
		// If the client is minimized, trigger the minimize function
		if (client.minimized) {
			minimizeClient(client);
		}
	}
}

// Runs an ignore-check and if it passes, adds a client to tiles[]
// Unlike addClient(), takes target desktop as a parameter and does not follow or connect the client
// Runs an ignore-check and if it passes, adds a client to tiles[]
function addClientNoFollow(client, desktop) {
	if (checkClient(client)) {
		if (noBorders == true) {
			client.noBorder = true;
		} else client.noBorder = false;
		var scr = client.screen;
		// If tiles.length exceeds the maximum amount, creates a new virtual desktop
		if (tiles[desktop][scr].length === tiles[desktop][scr].max ||
			tiles[desktop][scr].length === 4) {
			// Fixes a bug that makes the maximum go over 4 when removing virtual desktops
			if (tiles[desktop][scr].length === 4) {
				tiles[desktop][scr].max = 4;
			}
			for (var i = 0; i < ws.numScreens; i++) {
				if (tiles[desktop][i].length < tiles[desktop][i].max) {
					scr = i;
					break;
				}
			}
		}
		client.desktop = desktop;
		tiles[client.desktop][scr].push(client);
		print(client.caption + " added (no follow)");
		tileClients();
		connectClient(client);
		// If the client is minimized, trigger the minimize function
		if (client.minimized) {
			minimizeClient(client);
		}
	}
}
// Adds all the clients that existed before the script was executed
function addClients() {
	var clients = ws.clientList();
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
		removeClientNoFollow(client, ws.currentDesktop);
		if (tiles[client.desktop][client.screen].length < tiles[client.desktop][client.screen].max) {
			addClientNoFollow(client, client.desktop);
		}
	});
	client.float = false;
}

// Removes the closed client from tiles[]
function removeClient(client) {
	// First for- and if-loops find the closed client 
	for (var i = 0; i < tiles[client.desktop][client.screen].length; i++) {
		if (sameClient(tiles[client.desktop][client.screen][i], client)) {
			tiles[client.desktop][client.screen].splice(i, 1);
			disconnectClient(client);
			print(client.caption + " removed");
			// If there are still tiles after the removal, calculates the geometries
			if (tiles[client.desktop][client.screen].length > 0) {
				tileClients();
			} else if (tiles[client.desktop][client.screen].length === 0) {
				if (ws.currentDesktop > 1) {
					// client.desktop = null;
					ws.currentDesktop -= 1;
					// ws.activeClient = tiles[ws.currentDesktop][ws.activeScreen][0];
					// ws.desktops -= 1;
				}
			}
		}
	}
}

// Removes the closed client from tiles[]
// Unlike removeClient(), does not follow the client
function removeClientNoFollow(client, desktop) {
	// First for- and if-loops find the closed client 
	for (var i = 0; i < tiles[desktop][client.screen].length; i++) {
		if (sameClient(tiles[desktop][client.screen][i], client)) {
			tiles[desktop][client.screen].splice(i, 1);
			disconnectClient(client);
			print(client.caption + " removed (no follow)");
			// If there are still tiles after the removal, calculates the geometries
			if (tiles[desktop][client.screen].length > 0) {
				tileClients();
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
	for (var i = 0; i < ws.numScreens; i++) {
		// Creates new layouts whenever a desktop is empty or contains only a single client
		// Ideally, this should be done in createDesktop(), but currently, it causes an insane amount of bugs
		// Todo: Move to createDesktop()
		if (tiles[ws.currentDesktop][i].length <= 1) {
			tiles[ws.currentDesktop][i].layout = newLayout(i);
		}
		var adjusted = [];
		if (tiles[ws.currentDesktop][i].length === 1) {
			adjusted[0] = {};
			adjusted[0].x = tiles[ws.currentDesktop][i].layout[0].x + gap;
			adjusted[0].y = tiles[ws.currentDesktop][i].layout[0].y + gap;
			adjusted[0].width = tiles[ws.currentDesktop][i].layout[0].width + tiles[ws.currentDesktop][i].layout[1].width - gap * 2;
			adjusted[0].height = tiles[ws.currentDesktop][i].layout[0].height + tiles[ws.currentDesktop][i].layout[3].height - gap * 2;
		} else if (tiles[ws.currentDesktop][i].length === 2) {
			adjusted[0] = {};
			adjusted[0].x = tiles[ws.currentDesktop][i].layout[0].x + gap;
			adjusted[0].y = tiles[ws.currentDesktop][i].layout[0].y + gap;
			adjusted[0].width = tiles[ws.currentDesktop][i].layout[0].width - gap * 1.5;
			adjusted[0].height = tiles[ws.currentDesktop][i].layout[0].height + tiles[ws.currentDesktop][i].layout[3].height - gap * 2;

			adjusted[1] = {};
			adjusted[1].x = tiles[ws.currentDesktop][i].layout[1].x + gap * 0.5;
			adjusted[1].y = tiles[ws.currentDesktop][i].layout[1].y + gap;
			adjusted[1].width = tiles[ws.currentDesktop][i].layout[1].width - gap * 1.5;
			adjusted[1].height = tiles[ws.currentDesktop][i].layout[1].height + tiles[ws.currentDesktop][i].layout[2].height - gap * 2;
		} else if (tiles[ws.currentDesktop][i].length === 3) {
			adjusted[0] = {};
			adjusted[0].x = tiles[ws.currentDesktop][i].layout[0].x + gap;
			adjusted[0].y = tiles[ws.currentDesktop][i].layout[0].y + gap;
			adjusted[0].width = tiles[ws.currentDesktop][i].layout[0].width - gap * 1.5;
			adjusted[0].height = tiles[ws.currentDesktop][i].layout[0].height + tiles[ws.currentDesktop][i].layout[3].height - gap * 2;

			adjusted[1] = {};
			adjusted[1].x = tiles[ws.currentDesktop][i].layout[1].x + gap * 0.5;
			adjusted[1].y = tiles[ws.currentDesktop][i].layout[1].y + gap;
			adjusted[1].width = tiles[ws.currentDesktop][i].layout[1].width - gap * 1.5;
			adjusted[1].height = tiles[ws.currentDesktop][i].layout[1].height - gap * 1.5;

			adjusted[2] = {};
			adjusted[2].x = tiles[ws.currentDesktop][i].layout[2].x + gap * 0.5;
			adjusted[2].y = tiles[ws.currentDesktop][i].layout[2].y + gap * 0.5;
			adjusted[2].width = tiles[ws.currentDesktop][i].layout[2].width - gap * 1.5;
			adjusted[2].height = tiles[ws.currentDesktop][i].layout[2].height - gap * 1.5;	
		} else if (tiles[ws.currentDesktop][i].length === 4) {
			adjusted[0] = {};
			adjusted[0].x = tiles[ws.currentDesktop][i].layout[0].x + gap;
			adjusted[0].y = tiles[ws.currentDesktop][i].layout[0].y + gap;
			adjusted[0].width = tiles[ws.currentDesktop][i].layout[0].width - gap * 1.5;
			adjusted[0].height = tiles[ws.currentDesktop][i].layout[0].height - gap * 1.5;

			adjusted[1] = {};
			adjusted[1].x = tiles[ws.currentDesktop][i].layout[1].x + gap * 0.5;
			adjusted[1].y = tiles[ws.currentDesktop][i].layout[1].y + gap;
			adjusted[1].width = tiles[ws.currentDesktop][i].layout[1].width - gap * 1.5;
			adjusted[1].height = tiles[ws.currentDesktop][i].layout[1].height - gap * 1.5;

			adjusted[2] = {};
			adjusted[2].x = tiles[ws.currentDesktop][i].layout[2].x + gap * 0.5;
			adjusted[2].y = tiles[ws.currentDesktop][i].layout[2].y + gap * 0.5;
			adjusted[2].width = tiles[ws.currentDesktop][i].layout[2].width - gap * 1.5;
			adjusted[2].height = tiles[ws.currentDesktop][i].layout[2].height - gap * 1.5;

			adjusted[3] = {};
			adjusted[3].x = tiles[ws.currentDesktop][i].layout[3].x + gap;
			adjusted[3].y = tiles[ws.currentDesktop][i].layout[3].y + gap * 0.5;
			adjusted[3].width = tiles[ws.currentDesktop][i].layout[3].width - gap * 1.5;
			adjusted[3].height = tiles[ws.currentDesktop][i].layout[3].height - gap * 1.5;
		}
		for (var j = 0; j < adjusted.length; j++) {
			tiles[ws.currentDesktop][i][j].geometry = adjusted[j];
		}
		print("desktop " + ws.currentDesktop + " screen " + i + " tiled");
	}
}

// Saves the pre-movement position when called
function saveClientGeo(client) {
	oldGeo = client.geometry;
	oldGeo.screen = client.screen;
}

// Decides if a client is moved or resized
function adjustClient(client) {
	// If the size equals the pre-movement size, user is trying to move the client, not resize it
	if (client.geometry.width === oldGeo.width && client.geometry.height === oldGeo.height) {
		moveClient(client);
	} else {
		resizeClient(client);
}

// Moves clients (switches places within the layout)
function moveClient(client) {
	var centerX = client.geometry.x + client.width / 2;
	var centerY = client.geometry.y + client.height / 2;
	var geometries = [];
	geometries.push(oldGeo);
	// Adds all the existing clients to the geometries[]...
	for (var i = 0; i < tiles[ws.currentDesktop][ws.activeScreen].length; i++) {
		// ...except for the client being moved
		// (it's off the grid and needs to be snapped back to the oldGeo variable)
		if (tiles[ws.currentDesktop][ws.activeScreen][i] != client) {
			geometries.push(tiles[ws.currentDesktop][ws.activeScreen][i].geometry);
			// If more geometry comparison is to be done, geometries[i].frameId = client.frameId to easily compare with sameClient
		}
	}
	// Sorts the geometries[] and finds the geometry closest to the moved client
	geometries.sort(function(a, b) {
		return Math.sqrt(Math.pow((centerX - (a.x + a.width / 2)), 2) + Math.pow((centerY - (a.y + a.height / 2)), 2)) - Math.sqrt(Math.pow((centerX - (b.x + b.width / 2)), 2) + Math.pow((centerY - (b.y + b.height / 2)), 2));
	});
	// If the closest geometry is not the client's old position, switches the geometries and indexes
	if (geometries[0] != oldGeo) {
		i = findClientIndex(client, ws.currentDesktop);
		var j = findGeometryIndex(geometries[0], ws.currentDesktop);
		swapClients(i, j, ws.currentDesktop);
		tileClients();
	} else {
		client.geometry = oldGeo;
	}
}

// Resizes all the clients
function resizeClient(client) {
	var difX = client.geometry.x - oldGeo.x;
	var difY = client.geometry.y - oldGeo.y;
	var difW = client.geometry.width - oldGeo.width;
	var difH = client.geometry.height - oldGeo.height;
	switch (findClientIndex(client, ws.currentDesktop)) {
		case 0:
			if (difX === 0 && difY == 0) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].width += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].x += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].width -= difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].x += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].width -= difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].width += difW;
				if (tiles[ws.currentDesktop][ws.activeScreen].length === 4) {
					tiles[ws.currentDesktop][ws.activeScreen].layout[0].height += difH;
					tiles[ws.currentDesktop][ws.activeScreen].layout[3].height -= difH;
					tiles[ws.currentDesktop][ws.activeScreen].layout[3].y += difH;
				}
			} // Allows resizing even if Y is dragged above the screen, doesn't alter height
			else if (difX === 0) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].width += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].x += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].width -= difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].x += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].width -= difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].width += difW;
			}
			break;
		case 1:
			tiles[ws.currentDesktop][ws.activeScreen].layout[0].width += difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[1].x += difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[1].width -= difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[2].x += difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[2].width -= difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[3].width += difX;
			if (difY === 0) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].height += difH;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].y += difH;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].height -= difH;
			}
			break;
		case 2:
			tiles[ws.currentDesktop][ws.activeScreen].layout[0].width += difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[1].x += difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[1].width -= difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[1].height += difY;
			tiles[ws.currentDesktop][ws.activeScreen].layout[2].x += difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[2].y += difY;
			tiles[ws.currentDesktop][ws.activeScreen].layout[2].width -= difX;
			tiles[ws.currentDesktop][ws.activeScreen].layout[2].height -= difY;
			tiles[ws.currentDesktop][ws.activeScreen].layout[3].width += difX;
			break;
		case 3:
			if (difX === 0) {				
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].width += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].height += difY;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].x += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].width -= difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].x += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].width -= difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].y += difY;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].width += difW;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].height -= difY;
			}
			break;
		}
	}
	print("clients resized successfully (resize initiated by: " + client.caption + ")")
	tileClients();
}

function minimizeClient(client) {
	for (var i = 0; i < tiles[client.desktop][client.screen].length; i++) {
		if (sameClient(tiles[client.desktop][client.screen][i], client))  {
			tiles[client.desktop][client.screen].splice(i, 1);
			tiles[client.desktop][client.screen].max -= 1;
			if (tiles[client.desktop][client.screen].length == 0) {
				ws.currentDesktop -= 1;
			}
		}
	}
	print(client.caption + " minimized");
	tileClients();
}

function unminimizeClient(client) {
	ws.currentDesktop = client.desktop;
	tiles[client.desktop][client.screen].max += 1;
	tiles[client.desktop][client.screen].push(client);
	print(client.caption + " unminimized");
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
	} else return true;
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

// Finds tiles[desktop][ws.activeScreen] index of a client
function findClientIndex(client, desktop) {
	for (i = 0; i < tiles[desktop][ws.activeScreen].length; i++) {
		if (sameClient(tiles[desktop][ws.activeScreen][i], client)) {
			return i;
		}
	}
}

// Finds tiles[desktop][ws.activeScreen] index by geometry
function findGeometryIndex(geo, desktop) {
	for (i = 0; i < tiles[desktop][ws.activeScreen].length; i++) {
		if (sameGeometry(tiles[desktop][ws.activeScreen][i], geo)) {
			return i;
		}
	}
}

// Swaps tiles[desktop][ws.activeScreen][i] and tiles[desktop][ws.activeScreen][j]
function swapClients(i, j, desktop) {
	var temp = tiles[desktop][ws.activeScreen][i];
	tiles[desktop][ws.activeScreen][i] = tiles[desktop][ws.activeScreen][j];
	tiles[desktop][ws.activeScreen][j] = temp;
}


/*--------------------------/
/ VIRTUAL DESKTOP FUNCTIONS /
/--------------------------*/

function changeDesktop(desktop) {
	for (var i = 0; i < ws.numScreens; i++) {	
		if (tiles[desktop][i].length === 0) {
			createDesktop(desktop, i);
		}
	}
	print("desktop switched to " + desktop);
	tileClients();
}

function adjustDesktops(desktop) {
	// Checks if a workspace is removed
	if (ws.desktops < desktop) {
		removeDesktop(desktop);
	}
	// Checks if a workspace is added 
	else if (ws.desktops > desktop) {
		createDesktop(ws.desktops);
	}
}

function createDesktop(desktop) {
	tiles[desktop] = [];
	for (var i = 0; i < ws.numScreens; i++) {	
		tiles[desktop][i] = [];
		tiles[desktop][i].max = 4;
	}
	print("desktop " + desktop + " created");
	tileClients();
}

function createScreen(desktop, scr) {
	tiles[desktop] = [];
	tiles[desktop][scr] = [];
	tiles[desktop][scr].max = 4;
	tiles[desktop][scr].layout = newLayout(i);
}

function removeDesktop(desktop) {
	// Because the API returns desktops as an integer, they can not be recognized
	// which is why the latest workspace is always the one removed
	// Todo: recognize desktops by comparing tiles[] and switching desktops before removal
	for (var i = 0; i < tiles[desktop].length; i++) {	
		for (var j = 0; j < tiles[desktop][i].length; j++) {
			tiles[desktop][i][j].closeWindow();
		}
	}
	print("desktop " + desktop + " removed");
	tileClients();
}

function newLayout(screen) {
	var area = ws.clientArea(0, screen, 0);
	var layout = [];
	for (var i = 0; i < 4; i++) {
		layout[i] = {}; // Note: Need to clone the properties!
		layout[i].x = area.x;
		layout[i].y = area.y;
		layout[i].width = area.width;
		layout[i].height = area.height;
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

ws.clientAdded.connect(stand);
// Hack: Waits for a valid client to initiate the script 
// The most reliable way to start the script thus far
function stand(client) {
	client.windowShown.connect(wait);
}

function wait(client) {
	if (checkClient(client)) {
		ws.clientAdded.disconnect(stand);
		client.windowShown.disconnect(wait);
		print("script initiated with " + client.caption);
		init();
		return;
	}
	client.windowShown.disconnect(wait);
}