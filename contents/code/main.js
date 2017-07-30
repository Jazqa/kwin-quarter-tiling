/*----------/
/ TODO-LIST /
/----------*/
/*
	- Automatic virtual desktop removal (Plasma crashes when a desktop is removed via script)
	- Respect minimum and maximum sizes set by programs (not imporant, user has a brain and can resize windows as they see fit, can also be an advantage)
	- No restart required after modifying the configuration or adjusting the number of screens
	- Figure out a way to include multiple files, this one is getting huge
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

ignoredClients = ignoredClients.concat(readConfig("ignoredClients", "wine, steam, kate").toString().split(', '));

var fixedClients = [
	"Spotify",
	"spotify",
];

fixedClients = fixedClients.concat(readConfig("fixedClients", "telegram, telegram-desktop, telegramdesktop").toString().split(', '));

// If the program can't be blacklisted via the array above (resourceClass)
// Try adding its caption to the array below
var ignoredCaptions = [
	"File Upload",
	"Move to Trash",
	"Quit GIMP",
	"Create a New Image",
];

ignoredCaptions = ignoredCaptions.concat(readConfig("ignoredCaptions", "").toString().split(', '));

// Virtual desktops that will be completely ignored
var ignoredDesktops = [-1];

// Todo: Add an configuration option for ignored desktops

var gap = readConfig("gap", 10); // Gap size in pixels
if (gap === 0) {
	gap = 2;
}

var margins = [];
margins[0] = readConfig("mt", 0);
margins[1] = readConfig("ml", 0);
margins[2] = readConfig("mb", 0);
margins[3] = readConfig("mr", 0);

var noBorders = readConfig("noBorders", false);

var ws = workspace;

var tiles = []; // tiles[desktop][screen][client]

var oldGeo; // Hack: Saves the pre-movement position as a global variable



/*---------------/
/ INIT FUNCTIONS /
/---------------*/

function init() {
	registerKeys();
	var desks = readConfig("numDesks", 2);
	if (desks < 1) {
		desks = 1;
	}
	ws.desktops = desks;
	for (var i = 1; i <= desks; i++) {
		createDesktop(i);
	}
	addClients();
	connectWorkspace();
}

function registerKeys() {
	registerShortcut(
		"Quarter: Float/Tile Desktop",
		"Quarter: Float/Tile Desktop",
		"Meta+Esc",
		function() {
			var clients = ws.clientList();
			var desk = ignoredDesktops.indexOf(ws.currentDesktop);
			if (desk > -1) {
				ignoredDesktops.splice(desk, 1);
				for (var k = 0; k < clients.length; k++) {
					if (clients[k].desktop === ws.currentDesktop) {
						addClient(clients[k]);
					}
				}
			} else {
				ignoredDesktops.push(ws.currentDesktop);
				for (var i = 0; i < clients.length; i++) {
					if (clients[i].desktop === ws.currentDesktop) {
						removeClientNoFollow(clients[i], clients[i].desktop, clients[i].screen);
					}
				}
			}
		});
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
			var i = findClientIndex(client, ws.currentDesktop, ws.activeScreen);
			if (i === 2) {
				swapClients(i, 1, ws.activeScreen, ws.activeScreen);
			} else if (i === 3) {
				swapClients(i, 0, ws.activeScreen, ws.activeScreen);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Down",
		"Quarter: Move Down",
		"Meta+Down",
		function() {
			var client = ws.activeClient;
			var i = findClientIndex(client, ws.currentDesktop, ws.activeScreen);
			if (i === 0 && tiles[ws.currentDesktop][ws.activeScreen].length === 4) {
				swapClients(i, 3, ws.activeScreen, ws.activeScreen);
			} else if (i === 1 && tiles[ws.currentDesktop][ws.activeScreen].length >= 3) {
				swapClients(i, 2, ws.activeScreen, ws.activeScreen);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Left",
		"Quarter: Move Left",
		"Meta+Left",
		function() {
			var client = ws.activeClient;
			var i = findClientIndex(client, ws.currentDesktop, ws.activeScreen);
			if (i === 1) {
				swapClients(i, 0, ws.activeScreen, ws.activeScreen);
			} else if (i === 2 && tiles[ws.currentDesktop][ws.activeScreen].length === 4) {
				swapClients(i, 3, ws.activeScreen, ws.activeScreen);
			} else if (i === 2) {
				swapClients(i, 0, ws.activeScreen, ws.activeScreen);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: Move Right",
		"Quarter: Move Right",
		"Meta+Right",
		function() {
			var client = ws.activeClient;
			var i = findClientIndex(client, ws.currentDesktop, ws.activeScreen);
			if (i === 0 && tiles[ws.currentDesktop][ws.activeScreen].length > 1) {
				swapClients(i, 1, ws.activeScreen, ws.activeScreen);
			} else if (i === 3) {
				swapClients(i, 2, ws.activeScreen, ws.activeScreen);
			} else return;
			tileClients();
		});
	registerShortcut(
		"Quarter: + Window Size",
		"Quarter: + Window Size",
		"Meta++",
		function() {
			increaseClientSize(ws.activeClient, 20, true, true);
			tileClients();
		});
		registerShortcut(
		"Quarter: - Window Size",
		"Quarter: - Window Size",
		"Meta+-",
		function() {
			decreaseClientSize(ws.activeClient, 20, true, true);
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
	registerShortcut(
		"Quarter: + Gap Size",
		"Quarter: + Gap Size",
		"Meta+O",
		function() {
			gap += 2;
			tileClients();
		});
	registerShortcut(
		"Quarter: - Gap Size",
		"Quarter: - Gap Size",
		"Meta+L",
		function() {
			if (gap > 2) {
				gap -= 2;
				tileClients();
			}
		});
}

// Connects the KWin:Workspace signals to the following functions
function connectWorkspace() {
	ws.numberScreensChanged.connect(function(scr) {
		// Todo
	});
	ws.clientAdded.connect(addClient);
	ws.clientRemoved.connect(removeClient);
	ws.clientMaximizeSet.connect(maximizeClient); // Maximize (workspace), Minimize (client)...
	ws.clientFullScreenSet.connect(fullScreenClient);
	ws.numberDesktopsChanged.connect(adjustDesktops);
	ws.currentDesktopChanged.connect(changeDesktop);
}


/*--------------------------------/
/ CLIENT ADDING, MOVING & REMOVAL /
/--------------------------------*/

// Runs an ignore-check and if it passes, adds a client to tiles[]
function addClient(client) {
	if (checkClient(client)) {
		print("attempting to add " + client.caption);
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
				var freeTile = findSpace();
				if (freeTile) {
					ws.currentDesktop = freeTile[0];
					scr = freeTile[1];
				} else {
					ws.desktops += 1;
					ws.currentDesktop = ws.desktops;
				}
			}
		}
		client.desktop = ws.currentDesktop;
		// Not needed per se, only important when activating the script with more than four clients active
		if (typeof tiles[client.desktop] == "undefined") {
			createDesktop(client.desktop);
		}
		tiles[client.desktop][scr].push(client);
		print(client.caption + " added on desktop " + client.desktop + " screen " + scr);
		connectClient(client);
		if (client.fixed) {
			fitClient(client, scr);
		} else {
			tileClients();
		}
		// If the client is minimized, trigger the minimize function
		if (client.minimized) {
			minimizeClient(client);
		}
	}
}

// Runs an ignore-check and if it passes, adds a client to tiles[]
// Unlike addClient(), takes target desktop as a parameter and does not follow or connect the client
// Runs an ignore-check and if it passes, adds a client to tiles[]
function addClientNoFollow(client, desk, scr) {
	if (checkClient(client)) {
		print("attempting to add " + client.caption + " (no follow) to desktop " + desk + " screen " + scr);
		if (noBorders == true) {
			client.noBorder = true;
		} else client.noBorder = false;
		// If tiles.length exceeds the maximum amount, creates a new virtual desktop
		if (tiles[desk][scr].length === tiles[desk][scr].max ||
			tiles[desk][scr].length === 4) {
			// Fixes a bug that makes the maximum go over 4 when removing virtual desktops
			if (tiles[desk][scr].length === 4) {
				tiles[desk][scr].max = 4;
			}
			// If the given screen is full, checks the other screens
			for (var i = 0; i < ws.numScreens; i++) {
				if (tiles[desk][i].length < tiles[desk][i].max) {
					scr = i;
					break;
				}
			}
		}
		client.desktop = desk;
		tiles[client.desktop][scr].push(client);
		print(client.caption + " added (no follow) to desktop " + desk + " screen " + scr);
		connectClient(client);
		if (client.fixed) {
			fitClient(client, scr);
		}
		tileClients();
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
		delete clients[i].float;
		addClient(clients[i]);
	}
}

// Connects the signals of the new KWin:Client to the following functions
function connectClient(client) {
	client.clientStartUserMovedResized.connect(saveClientGeo);
	client.clientFinishUserMovedResized.connect(adjustClient);
	client.clientMinimized.connect(minimizeClient);
	// Hack: client.desktopChanged can't be disconnected (for some reason calling disconnect with the same parameters fails)
	// So it's only connected when client.float is undefined, meaning it has not been connected or disconnected before
	if (typeof client.float == "undefined") {
		client.desktopChanged.connect(client, changeClientDesktop);
	}
	if (fixedClients.indexOf(client.resourceClass.toString()) > -1) {
		client.fixed = true;
	}
	client.float = false;
	client.oldIndex = -1;
	client.oldDesk = client.desktop;
}

// Removes the closed client from tiles[]
function removeClient(client) {
	print("attempting to remove " + client.caption);
	if (client.minimized) {
		client.clientUnminimized.disconnect(unminimizeClient);
		tiles[client.desktop][client.screen].max += 1;
	}
	if (client.float === true || client.float === false) {
		if (client.maxed) {
			tiles[client.desktop][client.screen].max += 1;
		}
	}
	// Avoid crashes
	if (typeof tiles[client.desktop] != "undefined") {
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
}

// Removes the closed client from tiles[]
// Unlike removeClient(), does not follow the client
function removeClientNoFollow(client, desk, scr) {
	print("attempting to remove " + client.caption + " (no follow) from desktop  " + desk + " screen " + scr);
	if (client.minimized) {
		client.clientUnminimized.disconnect(unminimizeClient);
		tiles[desk][scr].max += 1;
	}
	if (client.float === true || client.float === false) {
		if (client.maxed) {
			tiles[client.desktop][client.screen].max += 1;
		}
	}
	// Avoid crashes
	if (typeof tiles[desk] != "undefined") {
		for (var i = 0; i < tiles[desk][scr].length; i++) {
			if (sameClient(tiles[desk][scr][i], client)) {
				tiles[desk][scr].splice(i, 1);
				disconnectClient(client);
				print(client.caption + " removed (no follow) from desktop  " + desk + " screen " + scr);
				// If there are still tiles after the removal, calculates the geometries
				if (tiles[ws.currentDesktop][ws.activeScreen].length > 0) {
					tileClients();
				}
			}
		}
	}
}

function closeWindow(client) {
	client.closeWindow();
}

// "Removes" a client, reserving a spot for it by decreasing the maximum amount of clients on its desktop
function reserveClient(client) {
	client.oldIndex = findClientIndex(client, client.desktop, client.screen);
	var i = findClientIndex(client, client.desktop, client.screen);
	tiles[client.desktop][client.screen].splice(i, 1);
	tiles[client.desktop][client.screen].max -= 1;
	client.oldDesk = client.desktop;
	tileClients();
}

// "Adds" a client back to the desktop
function unreserveClient(client, unshift) {
	ws.currentDesktop = client.desktop;
	tiles[client.desktop][client.screen].max += 1;
	tiles[client.desktop][client.screen].splice(client.oldIndex, 0, client);
	tileClients();
}

// Disconnects the signals from removed clients
// So they will not trigger when a manually floated client is interacted with
// Or when a client is removed & added between desktops
function disconnectClient(client) {
	client.clientStartUserMovedResized.disconnect(saveClientGeo);
	client.clientFinishUserMovedResized.disconnect(adjustClient);
	client.clientMinimized.disconnect(minimizeClient);
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
		if (typeof tiles[ws.currentDesktop][i] != "undefined") {
			print("attempting to tile desktop " + ws.currentDesktop + " screen " + i);
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
				if (tiles[ws.currentDesktop][i][j].fixed) {
					var rect = tiles[ws.currentDesktop][i][j].geometry;
					// Tiles the "free clients" to the edge of the tile
					// The code looks ugly but works wonders
					switch (j) {
						case 0:
							if (adjusted.length === 1) {
								rect.x = adjusted[j].x + adjusted[j].width * 0.5 - rect.width * 0.5;
								rect.y = adjusted[j].y + adjusted[j].height * 0.5 - rect.height * 0.5;
							} else if (adjusted.length == 2 || adjusted.length == 3) {
								rect.x = adjusted[j].x + adjusted[j].width - rect.width;
								rect.y = adjusted[j].y + adjusted[j].height * 0.5 - rect.height * 0.5;
							} else {
								rect.x = adjusted[j].x + adjusted[j].width - rect.width;
								rect.y = adjusted[j].y + adjusted[j].height - rect.height;
							}
							break;
						case 1:
							if (adjusted.length === 2) {
								rect.x = adjusted[j].x;
								rect.y = adjusted[j].y + adjusted[j].height * 0.5 - rect.height * 0.5;
							}
							else {
								rect.x = adjusted[j].x;
								rect.y = adjusted[j].y + adjusted[j].height - rect.height;
							}
							break;
						case 2:
							rect.x = adjusted[j].x;
							rect.y = adjusted[j].y;
							break;
						case 3:
							rect.x = adjusted[j].x + adjusted[j].width - rect.width;
							rect.y = adjusted[j].y;
							break;
					}
					if (rect.width > adjusted[j].width) {
						rect.x = adjusted[j].x;
						rect.width = adjusted[j].width;
					}
					if (rect.height > adjusted[j].height) {
						rect.y = adjusted[j].y;
						rect.height = adjusted[j].height;
					}
					tiles[ws.currentDesktop][i][j].geometry = rect;
				} else {
					tiles[ws.currentDesktop][i][j].geometry = adjusted[j];
				}
			}
			print("desktop " + ws.currentDesktop + " screen " + i + " tiled");
		}
	}
}

// Saves the pre-movement position when called
function saveClientGeo(client) {
	oldGeo = client.geometry;
	oldScr = client.screen;
}

// Decides if a client is moved or resized
function adjustClient(client) {
	// If the size equals the pre-movement size, user is trying to move the client, not resize it
	if (client.geometry.width === oldGeo.width && client.geometry.height === oldGeo.height) {
		if (oldScr != client.screen) {
			if (tiles[ws.currentDesktop][client.screen].length < tiles[ws.currentDesktop][client.screen].max) {
				print("attempting to push " + client.caption + " to screen" + client.screen);
				var rect = client.geometry;
				client.geometry = oldGeo;
				removeClientNoFollow(client, client.desktop, client.screen);
				client.geometry = rect;
				addClientNoFollow(client, client.desktop, client.screen);
				print("pushed client " + client.caption + " to screen" + client.screen);
			} else moveClient(client);
		} else moveClient(client);
	} else {
		resizeClient(client);
	}
}

// Moves clients (switches places within the layout)
function moveClient(client) {
	print("attempting to move " + client.caption);
	var centerX = client.geometry.x + client.width / 2;
	var centerY = client.geometry.y + client.height / 2;
	var geometries = [];
	geometries.push(oldGeo);
	// Adds all the existing clients to the geometries[]...
	for (var i = 0; i < tiles[client.desktop][client.screen].length; i++) {
		// ...except for the client being moved
		// (it's off the grid and needs to be snapped back to the oldGeo variable)
		if (tiles[client.desktop][client.screen][i] != client) {
			geometries.push(tiles[client.desktop][client.screen][i].geometry);
			// If more geometry comparison is to be done, geometries[i].frameId = client.frameId to easily compare with sameClient
		}
	}
	// Sorts the geometries[] and finds the geometry closest to the moved client
	geometries.sort(function(a, b) {
		return Math.sqrt(Math.pow((centerX - (a.x + a.width / 2)), 2) + Math.pow((centerY - (a.y + a.height / 2)), 2)) - Math.sqrt(Math.pow((centerX - (b.x + b.width / 2)), 2) + Math.pow((centerY - (b.y + b.height / 2)), 2));
	});
	// If the closest geometry is not the client's old position, switches the geometries and indexes
	if (geometries[0] != oldGeo) {
		i = findClientIndex(client, ws.currentDesktop, oldScr);
		var j = findGeometryIndex(geometries[0], ws.currentDesktop, client.screen);
		swapClients(i, j, oldScr, client.screen);
		tileClients();
		return true;
	} else {
		client.geometry = oldGeo;
		tileClients();
		return false;
	}
}

// Resizes all the clients
function resizeClient(client) {
	print("attempting to resize " + client.caption);
	var difW = client.geometry.width - oldGeo.width;
	var difH = client.geometry.height - oldGeo.height;
	var difX = client.geometry.x - oldGeo.x;
	var difY = client.geometry.y - oldGeo.y;
	var i = findClientIndex(client, client.desktop, oldScr);
	switch (i) {
		case 0:
			if (difX === 0 && difY === 0) {
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
	print("clients resized successfully (resize initiated by: " + client.caption + ")");
	tileClients();
}

// Screen must be carried as a parameter because clients too large have a different screen (scr vs. client.screen)
function fitClient(client, scr) {
	var i = findClientIndex(client, client.desktop, scr);
	var tile = tiles[client.desktop][scr].layout[i];
	var rect = client.geometry;
	var x = rect.width - tile.width;
	var y = rect.height - tile.height;
	if (x < 0) {
		x = 0;
	}
	// If window is on a lower tile (2 or 3), fitClient is shrinking the tile and the upper tile is also fixed
	// Doesn't shrink the tile
	if (i === 2) {
		if (y < 0) {
			if (tiles[client.desktop][scr][1].fixed) {
				y *= 0.5;
			}
		}
	} else if (i === 3) {
		if (y < 0) {
			if (tiles[client.desktop][scr][0].fixed) {
				y *= 0.5;
			}
		}
	}
	adjustClientSize(client, scr, x, y + gap * 1.5);
	tileClients();
}

// TODO: Remove increaseClientSize() and decreaseClientSize() and replace them with adjustClientSize()
// Screen must be carried as a parameter because clients too large have a different screen
function adjustClientSize(client, scr, x, y) {
	switch (findClientIndex(client, client.desktop, scr)) {
		case 0:
			tiles[client.desktop][scr].layout[0].width += x;
			tiles[client.desktop][scr].layout[1].x += x;
			tiles[client.desktop][scr].layout[1].width -= x;
			tiles[client.desktop][scr].layout[2].x += x;
			tiles[client.desktop][scr].layout[2].width -= x;
			tiles[client.desktop][scr].layout[3].width += x;
			tiles[client.desktop][scr].layout[0].height += y;
			tiles[client.desktop][scr].layout[3].y += y;
			tiles[client.desktop][scr].layout[3].height -= y;
		break;
		case 1:

				tiles[client.desktop][scr].layout[0].width -= x;
				tiles[client.desktop][scr].layout[1].x -= x;
				tiles[client.desktop][scr].layout[1].width += x;
				tiles[client.desktop][scr].layout[2].x -= x;
				tiles[client.desktop][scr].layout[2].width += x;
				tiles[client.desktop][scr].layout[3].width -= x;
				tiles[client.desktop][scr].layout[1].height += y;
				tiles[client.desktop][scr].layout[2].y += y;
				tiles[client.desktop][scr].layout[2].height -= y;
			break;
		case 2:

				tiles[client.desktop][scr].layout[0].width -= x;
				tiles[client.desktop][scr].layout[1].x -= x;
				tiles[client.desktop][scr].layout[1].width += x;
				tiles[client.desktop][scr].layout[2].x -= x;
				tiles[client.desktop][scr].layout[2].width += x;
				tiles[client.desktop][scr].layout[3].width -= x;
				tiles[client.desktop][scr].layout[1].height -= y;
				tiles[client.desktop][scr].layout[2].y -= y;
				tiles[client.desktop][scr].layout[2].height += y;
			break;
		case 3:
				tiles[client.desktop][scr].layout[0].width += x;
				tiles[client.desktop][scr].layout[1].x += x;
				tiles[client.desktop][scr].layout[1].width -= x;
				tiles[client.desktop][scr].layout[2].x += x;
				tiles[client.desktop][scr].layout[2].width -= x;
				tiles[client.desktop][scr].layout[3].width += x;
				tiles[client.desktop][scr].layout[0].height -= y;
				tiles[client.desktop][scr].layout[3].y -= y;
				tiles[client.desktop][scr].layout[3].height += y;
			break;
	}
}

function increaseClientSize(client, px, x, y) {
	switch (findClientIndex(client, client.desktop, client.screen)) {
		case 0:
		if (x) {
			tiles[client.desktop][client.screen].layout[0].width += px;
			tiles[client.desktop][client.screen].layout[1].x += px;
			tiles[client.desktop][client.screen].layout[1].width -= px;
			tiles[client.desktop][client.screen].layout[2].x += px;
			tiles[client.desktop][client.screen].layout[2].width -= px;
			tiles[client.desktop][client.screen].layout[3].width += px;
		}
		if (y) {
			tiles[client.desktop][client.screen].layout[0].height += px;
			tiles[client.desktop][client.screen].layout[3].y += px;
			tiles[client.desktop][client.screen].layout[3].height -= px;
		}
		break;
		case 1:
			if (x) {
				tiles[client.desktop][client.screen].layout[0].width -= px;
				tiles[client.desktop][client.screen].layout[1].x -= px;
				tiles[client.desktop][client.screen].layout[1].width += px;
				tiles[client.desktop][client.screen].layout[2].x -= px;
				tiles[client.desktop][client.screen].layout[2].width += px;
				tiles[client.desktop][client.screen].layout[3].width -= px;
			}
			if (y) {
				tiles[client.desktop][client.screen].layout[1].height += px;
				tiles[client.desktop][client.screen].layout[2].y += px;
				tiles[client.desktop][client.screen].layout[2].height -= px;
			}
			break;
		case 2:
			if (x) {
				tiles[client.desktop][client.screen].layout[0].width -= px;
				tiles[client.desktop][client.screen].layout[1].x -= px;
				tiles[client.desktop][client.screen].layout[1].width += px;
				tiles[client.desktop][client.screen].layout[2].x -= px;
				tiles[client.desktop][client.screen].layout[2].width += px;
				tiles[client.desktop][client.screen].layout[3].width -= px;
			}
			if (y) {
				tiles[client.desktop][client.screen].layout[1].height -= px;
				tiles[client.desktop][client.screen].layout[2].y -= px;
				tiles[client.desktop][client.screen].layout[2].height += px;
			}
			break;
		case 3:
			if (x) {
				tiles[client.desktop][client.screen].layout[0].width += px;
				tiles[client.desktop][client.screen].layout[1].x += px;
				tiles[client.desktop][client.screen].layout[1].width -= px;
				tiles[client.desktop][client.screen].layout[2].x += px;
				tiles[client.desktop][client.screen].layout[2].width -= px;
				tiles[client.desktop][client.screen].layout[3].width += px;
			}
			if (y) {
				tiles[client.desktop][client.screen].layout[0].height -= px;
				tiles[client.desktop][client.screen].layout[3].y -= px;
				tiles[client.desktop][client.screen].layout[3].height += px;
			}
			break;
	}
	// Block resizing if a window is getting too small
	for (var i = 0; i < tiles[client.desktop][client.screen].layout.length; i++) {
		if (tiles[client.desktop][client.screen].layout[i].width < 100 ||
			tiles[client.desktop][client.screen].layout[i].height < 100) {
				decreaseClientSize(client, px, x, y);
		}
	}
}

function decreaseClientSize(client, px, x, y) {
	switch (findClientIndex(client, client.desktop, client.screen)) {
		case 0:
			if (x) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].width -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].x -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].width += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].x -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].width += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].width -= px;
			}
			if (y) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].height -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].y -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].height += px;
			}
			break;
		case 1:
			if (x) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].width += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].x += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].width -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].x += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].width -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].width += px;
			}
			if (y) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].height -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].y -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].height += px;
			}
			break;
		case 2:
			if (x) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].width += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].x += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].width -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].x += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].width -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].width += px;
			}
			if (y) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].height += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].y += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].height -= px;
			}
			break;
		case 3:
			if (x) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].width -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].x -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[1].width += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].x -= px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[2].width += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].width -= px;
			}
			if (y) {
				tiles[ws.currentDesktop][ws.activeScreen].layout[0].height += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].y += px;
				tiles[ws.currentDesktop][ws.activeScreen].layout[3].height -= px;
			}
			break;
	}
	// Block resizing if a window is getting too small
	for (var i = 0; i < tiles[ws.currentDesktop][ws.activeScreen].layout.length; i++) {
		if (tiles[ws.currentDesktop][ws.activeScreen].layout[i].width < 100 ||
			tiles[ws.currentDesktop][ws.activeScreen].layout[i].height < 100) {
			increaseClientSize(client, px, x, y);
		}
	}
}


// Minimize and Unminimize-functions are a mess because client.desktopChanged signal does not return a client
function minimizeClient(client) {
	print("attempting to minimize " + client.caption);
	if (client.maxed) {
		print(client.caption + " is maximized, no need to reserve spot anymore");
		return;
	}
	reserveClient(client);
	client.clientUnminimized.connect(unminimizeClient);
	if (tiles[client.desktop][client.screen].length == 0) {
		ws.currentDesktop -= 1;
	}
	print(client.caption + " minimized");
}

function unminimizeClient(client) {
	print("attempting to unminimize " + client.caption);
	client.clientUnminimized.disconnect(unminimizeClient);
	if (client.float === true) {
		return;
	} else if (client.float === false) {
		unreserveClient(client);
	} else {
		addClient(client);
	}
	print(client.caption + " unminimized");
}

function maximizeClient(client, h, v) {
	ws.activeClient = client;
	if (h && v) {
		if (client.float === true) {
			return;
		}
		print("attempting to maximize client " + client.caption);
		reserveClient(client);
		client.maxed = true;
		print(client.caption + " maximized");
	} else {
		print("attempting to unmaximize client " + client.caption);
		// Checks if the client has already existed (to avoid the dumb changeClientDesktop shenanigans)
		if (client.float === true) {
			return;
		} else if (client.float === false) {
			client.maxed = false;
			unreserveClient(client);
		} else addClient(client);
		print(client.caption + " unmaximized");
	}
}

// Basically the same as above, different parameters needed for ws.clientFullScreenSet-signal
function fullScreenClient(client, full, user) {
	ws.activeClient = client;
	if (full) {
		print("attempting to fullscreen client " + client.caption);
		reserveClient(client);
		client.maxed = true;
		print(client.caption + " fullscreened");
	} else {
		print("attempting to unfullscreen client " + client.caption);
		// Checks if the client has already existed (to avoid the dumb changeClientDesktop shenanigans)
		if (client.float === true) {
			return;
		} else if (client.float === false) {
			client.maxed = false;
			unreserveClient(client);
		} else addClient(client);
		print(client.caption + " unfullscreened");
	}
}


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
		ignoredCaptions.indexOf(client.caption.toString()) > -1 ||
		ignoredDesktops.indexOf(client.desktop) > -1 ||
		isMaxed(client)) {
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
function findClientIndex(client, desk, scr) {
	print("attempting to find " + client.caption + " index on desktop " + desk + " screen " + scr);
	for (var i = 0; i < tiles[desk][scr].length; i++) {
		if (sameClient(tiles[desk][scr][i], client)) {
			print("found " + client.caption + " index on desktop " + desk + " screen " + scr);
			return i;
		}
	}
}

// Finds tiles[desktop][ws.activeScreen] index by geometry
function findGeometryIndex(geo, desk, scr) {
	print("attempting to find geometry on desktop " + desk + " screen " + scr);
	for (i = 0; i < tiles[desk][scr].length; i++) {
		if (sameGeometry(tiles[desk][scr][i], geo)) {
			print("found geometry on " + desk + " screen " + scr);
			return i;
		}
	}
}

// Swaps tiles[desktop][ws.activeScreen][i] and tiles[desktop][ws.activeScreen][j]
function swapClients(i, j, scrI, scrJ) {
	print("attempting to swap clients " + i + " " + j);
	var temp = tiles[ws.currentDesktop][scrI][i];
	tiles[ws.currentDesktop][scrI][i] = tiles[ws.currentDesktop][scrJ][j];
	tiles[ws.currentDesktop][scrJ][j] = temp;
	print("successfully swapped clients " + i + " " + j);
}

function changeClientDesktop() {
	if (this.minimized) {
		// Closes clients if their workspace gets removed
		if (this.oldDesk > ws.desktops) {
			this.closeWindow();
		} else {
			print("attempting to change the desktop of minimized" + this.caption + " to desktop " + this.desktop);
			removeClientNoFollow(this, this.oldDesk, this.screen);
			print("successfully changed the desktop of minimized " + this.caption + " to desktop " + this.desktop);
		}
	} else if (this.maxed) {
		// Closes clients if their workspace gets removed
		if (this.oldDesk > ws.desktops) {
			this.closeWindow();
		} else {
			print("attempting to change the desktop of maximized" + this.caption + " to desktop " + this.desktop);
			removeClientNoFollow(this, this.oldDesk, this.screen);
			print("successfully changed the desktop of maximized" + this.caption + " to desktop " + this.desktop);
		}
	} else {
		// Closes clients if their workspace gets removed
		if (this.oldDesk > ws.desktops) {
			this.closeWindow();
			return;
		}
		print("attempting to change the desktop of " + this.caption + " to desktop " + this.desktop);
		removeClientNoFollow(this, this.oldDesk, this.screen);
		if (ignoredDesktops.indexOf(this.desktop) > -1) {
			print(this.caption + " on ignored desktop");
			return;
		} else if (tiles[this.desktop][this.screen].length < tiles[this.desktop][this.screen].max) {
			addClientNoFollow(this, this.desktop, this.screen);
			print("successfully changed the desktop of " + this.caption + " to desktop " + this.desktop);
		}
	}
}

// The client.maxed property has to be given before the client is added
// That's why this function gives the property and returns a boolean for checkClient()
function isMaxed(client) {
	var area = ws.clientArea(0, client.screen, 0);
	if (client.geometry.height == area.height && client.geometry.width == area.width) {
		client.maxed = true;
		return true;
	} else {
		client.maxed = false;
		return false;
	}
}


/*--------------------------/
/ VIRTUAL DESKTOP FUNCTIONS /
/--------------------------*/

function changeDesktop(desktop) {
	print("attempting to switch desktop to " + desktop);
	tileClients();
	print("desktop switched to " + desktop);
}

function adjustDesktops(desktop) {
	// Checks if a workspace is removed
	if (ws.desktops < desktop) {
		tileClients();
	}
	// Checks if a workspace is added
	else if (ws.desktops > desktop) {
		createDesktop(ws.desktops);
	}
}

function createDesktop(desktop) {
	print("attempting to create desktop " + desktop);
	tiles[desktop] = [];
	for (var i = 0; i < ws.numScreens; i++) {
		tiles[desktop][i] = [];
		tiles[desktop][i].max = 4;
		tiles[desktop][i].layout = newLayout(i);
	}
	print("desktop " + desktop + " created");
	tileClients();
}

function findSpace() {
	print("attempting to find space on existing desktops");
	for (var i = 1; i <= ws.desktops; i++) {
		for (var j = 0; j < ws.numScreens; j++) {
			if (tiles[i][j].length < tiles[i][j].max) {
				print("found space on desktop " + i + " screen " + j);
				return [i, j];
			}
		}
	}
	print("no space found");
	return false;
}

function newLayout(screen) {
	var area = ws.clientArea(0, screen, 0);
	area.x += margins[1];
	area.y += margins[0];
	area.width -= margins[1] + margins[3];
	area.height -= margins[0] + margins[2];
	var layout = [];
	// layout[-1] = screen
	for (var i = -1; i < 4; i++) {
		layout[i] = {}; // Note: Need to clone the properties!
		layout[i].x = area.x;
		layout[i].y = area.y;
		layout[i].width = area.width;
		layout[i].height = area.height;
		// Todo: Horizontal layout
		// Layouts = "Objects"
		// Layout.newLayout(); Layout.tileClients(); Layout.resizeClients(); etc.
		if (i === 1) {
			layout[0].width = layout[0].width * 0.5;
			layout[i].width = layout[0].width;
			layout[i].x = layout[i].x + layout[i].width;
		}
		if (i === 2) {
			layout[1].height = layout[1].height * 0.5;
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

ws.clientAdded.connect(wait);

// Hack: Waits for client connections, then attempts to initiate the script
// If client is valid for the script, the script is initiated
// The most reliable way to start the script thus far
// Todo: Find a better and more reliable way to start the script
function wait(client) {
	if (options.useCompositing) {
		client.windowShown.connect(check);
	} else {
		ws.clientAdded.disconnect(wait);
		ws.clientActivated.connect(check);
	}
}

function check(client) {
	if (options.useCompositing) {
		if (checkClient(client)) {
			ws.clientAdded.disconnect(wait);
			client.windowShown.disconnect(check);
			init();
			print("script initiated with " + client.caption);
		} else {
			client.windowShown.disconnect(check);
		}
	} else {
		if (client != null) {
			if (checkClient(client)) {
				ws.clientActivated.disconnect(check);
				init();
				print("script initiated with " + client.caption);
			}
		}
	}
}
