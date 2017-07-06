/*
Todo:
	- Configuration interface
	- Automatic virtual desktop removal (Plasma crashes when a desktop is removed via script)
	- Windows will fill desktops with space, instead of creating new ones
	- Support for large programs (Gimp, Krita, Kate)
		- Automatically occupies the largest tile
		- Max clients (default: 4) -= 1 per large program
	- Resizing the layout
*/

// Add programs that don't tile well
// Names usually in lowercase with no spaces
var ignoredClients = [
	"kate",
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
	"spotify",
	"steam",
	"wine",
	"yakuake",
];

// If the program can't be blacklisted via the array above (resourceClass)
// Try adding its caption to the array below
var ignoredCaptions = [
	"File Upload",
	"Move to Trash",
];

// Clients that don't play well when reduced to a quarter
// Todo: Recognize these and reduce activeClients[].max by one
var largeClients = [
	"gimp",
	"krita",
];

// Hack: The way Plasma panel is found also finds multiple other Plasma-related clients
// Plasma panel is the first client to be found, so after it has been found, a global variable
// is used to skip the step looking for Plasma in the checkClient() function
var plasmaNotFound = true;

var gap = readConfig("gap", 14); // Gap size in pixels

var noBorders = readConfig("noBorders", false); // Due to readConfig(), always if (noBorders === true) vs. if (noBorders)

var screen = {
	x: 0,
	y: 0,
	width: workspace.displayWidth,
	height: workspace.displayHeight,
};

var oldPos; // Hack: Saves the pre-movement position as a global variable

var currentDesktop = workspace.currentDesktop;
var activeClients = {};
function init() {
	workspace.desktops = 1;
	for (i = 1; i <= 20; i++) {
		activeClients[i] = []; // Initializes 20 empty arrays for virtual desktops to avoid crashes caused by undefined objects
		activeClients[i].max = 4; // Maximum number of (tiled) clients on a virtual desktop
	}
	registerShortcut(
		"Float On/Off",
		"Float On/Off",
		"Meta+F",
		function () {
			if (workspace.activeClient.float) {
				addClient(workspace.activeClient);
			} else {
				removeClient(workspace.activeClient);
			}
	});
	// Todo: Shortcut for +/- gapsize?
	addClients();
	// Connects the KWin:Workspace signals to the following functions
	workspace.clientAdded.connect(addClient);
	workspace.clientRemoved.connect(removeClient);
	// workspace.clientMaximizeSet.connect(maximizeClient);
	workspace.currentDesktopChanged.connect(changeDesktop);
	workspace.numberDesktopsChanged.connect(adjustDesktops);
}

// Runs an ignore-check and if it passes, adds a client to activeClients[]
function addClient(client) {
	if (checkClient(client)) {
		if (noBorders === true) {
			client.noBorder = true;
		}
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
		tileClients(currentDesktop);
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
		if (noBorders === true) {
			client.noBorder = true;
		}
		client.desktop = desktop;
		activeClients[desktop].push(client);
		// If the client is minimized, triggers the minimization signal after it's added
		tileClients(currentDesktop);
		connectClient(client);
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

// Removes the closed client from activeClients[]
function removeClient(client) {
	// First for- and if-loops find the closed client 
	for (var i = 0; i < activeClients[currentDesktop].length; i++) {
		if (sameClient(activeClients[currentDesktop][i], client)) {
			activeClients[currentDesktop].splice(i, 1);	
			disconnectClient(client);
			// If there are still tiles after the removal, calculates the geometries
			if (activeClients[currentDesktop].length > 0) {
				tileClients(currentDesktop);
			} else if (activeClients[currentDesktop].length === 0) {
				activeClients[currentDesktop] = [];
				activeClients[currentDesktop].max = 4;
				if (currentDesktop != 1) {
					workspace.currentDesktop -= 1;
					// workspace.desktops -= 1; Despite crashing plasma, this works as its supposed to (plasma bug?)
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
				tileClients(currentDesktop);
			} else if (activeClients[currentDesktop].length === 0) {
				activeClients[currentDesktop] = [];
				activeClients[currentDesktop].max = 4;
			}
		}
	}
}

// Connects the signals of the new KWin:Client to the following functions
function connectClient(client) {
	client.clientStartUserMovedResized.connect(saveClientPos);
	client.clientFinishUserMovedResized.connect(moveClient);
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

// Disconnects the signals from removed clients
// So they will not trigger when a manually floated client is interacted with
// Or when a client is removed & added between desktops
function disconnectClient(client) {
	client.clientStartUserMovedResized.disconnect(saveClientPos);
	client.clientFinishUserMovedResized.disconnect(moveClient);
	client.clientMinimized.disconnect(minimizeClient);
	client.clientUnminimized.disconnect(unminimizeClient);
	client.float = true;
}

// Ignore-check to see if the client is valid for the script
function checkClient(client) {
	// Hack: Global variable to skip this step once plasma panel has been found
	// If the plasma panel has not been found yet, it's most likely the first client with resourceClass: "plasmashell" and caption: "Plasma"
	if (plasmaNotFound) {
		var panel = {
			resourceClass: "plasmashell",
			caption: "Plasma",
		};
		if (panel.resourceClass.indexOf(client.resourceClass.toString()) > -1 &&
			panel.caption.indexOf(client.caption.toString()) > -1) {
			if (client.geometry.width > client.geometry.height) {			
				if (client.geometry.y < workspace.displayHeight / 2) {
					screen = {
						x: gap,
						y: client.geometry.height + gap,
						width: workspace.displayWidth - gap * 2,
						height: workspace.displayHeight - client.geometry.height - gap * 2,
					};
				} else {
					screen = {
						x: gap,
						y: gap,
						width: workspace.displayWidth - gap * 2,
						height: workspace.displayHeight - client.geometry.height - gap * 2,
					};
				}
			} else {
				if (client.geometry.x < workspace.displayWidth / 2) {
					screen = {
						x: client.geometry.width + gap,
						y: gap,
						width: workspace.displayWidth - client.geometry.width - gap * 2,
						height: workspace.displayHeight - gap * 2,
					};
				} else {
					screen = {
						x: gap,
						y: gap,
						width: workspace.displayWidth - client.geometry.width - gap * 2,
						height: workspace.displayHeight - gap * 2,
					};
				}
			}
			plasmaNotFound = false;
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
		client.specialWindow  ||
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

// Compare two clients without unnecessary type conversion (see issue #1)
function sameClient(client1, client2) {
	if (typeof client1.frameId !== undefined && typeof client2.frameId !== undefined) {
		if (client1.frameId === client2.frameId) {
			return true;
		} else return false;
	}
}

// Calculates the geometries to maintain the layout
// Note: All the geometries are currently calculated from the screen size
// Calculating the geometries from the older geometries messes things up
function tileClients(desktop) {
	if (activeClients[desktop].length > 0) {
		var rect = [];
		for (var i = 0; i < activeClients[desktop].length; i++) {
			rect[i] = {}; // Note: Need to clone the properties, can't just rect = screen!
			rect[i].x = screen.x;
			rect[i].y = screen.y;
			rect[i].width = screen.width;
			rect[i].height = screen.height;
			if (i === 1) {
				rect[0].width = rect[0].width * 0.5 - gap * 0.5;
				rect[i].width = rect[0].width;
				rect[i].x = rect[i].x + rect[i].width + gap;
			}
			if (i === 2) {
				rect[1].height = rect[1].height * 0.5 - gap * 0.5;
				rect[i].height = rect[1].height;
				rect[i].y = rect[i].y + rect[i].height + gap;
				rect[i].width = rect[i].width * 0.5 - gap * 0.5;
				rect[i].x = rect[i].x + rect[i].width + gap;
			}
			if (i === 3) {
				rect[0].height = rect[0].height * 0.5 - gap * 0.5;
				rect[i].height = rect[0].height;
				rect[i].width = rect[i].width * 0.5 - gap * 0.5;
				rect[i].y = rect[i].y + rect[i].height + gap;
			}
		}
		for (i = 0; i < activeClients[desktop].length; i++) {
			activeClients[desktop][i].geometry = rect[i];
		}
	}
}

// Saves the pre-movement position when called
function saveClientPos(client) {
	oldPos = client.geometry;
}

// Moves clients and adjusts the layout
function moveClient(client) {
	// If the size equals the pre-movement size, user is trying to move the client, not resize it
	if (client.geometry.width === oldPos.width && client.geometry.height === oldPos.height) {
		var centerX = client.geometry.x + client.width / 2;
		var centerY = client.geometry.y + client.height / 2;
		var geometries = [];
		geometries.push(oldPos);
		// Adds all the existing clients to the geometries[]...
		for (var i = 0; i < activeClients[currentDesktop].length; i++) {
			// ...except for the client being moved
			// (it's of the grid and needs to be snapped back to the oldPos variable)
			if (activeClients[currentDesktop][i] != client) {
				geometries.push(activeClients[currentDesktop][i].geometry);
				// If more geometry comparison is to be done, geometries[i].frameId = client.frameId to easily compare with sameClient
			}
		}
		// Sorts the geometries[] and finds the geometry closest to the moved client
		geometries.sort(function(a, b) {
			return Math.sqrt(Math.pow((centerX - (a.x + a.width / 2)), 2) + Math.pow((centerY - (a.y + a.height / 2)), 2)) - Math.sqrt(Math.pow((centerX - (b.x + b.width / 2)), 2) + Math.pow((centerY - (b.y + b.height / 2)), 2));
		});
		// If the closest geometry is not the client's old position...
		if (geometries[0] != oldPos) {
			// ...switches the geometries...
			var index;
			for (i = 0; i < activeClients[currentDesktop].length; i++) {
				if (sameClient(activeClients[currentDesktop][i], client)) {
					index = i;
				}
			}
			// ...and activeClients indexes
			for (i = 0; i < activeClients[currentDesktop].length; i++) {
				if (sameClient(activeClients[currentDesktop][i], client) !== true) {
					// Can't call sameClient() again because geometries[] doesn't save clients, only their geometries
					if (activeClients[currentDesktop][i].geometry.x === geometries[0].x &&
						activeClients[currentDesktop][i].geometry.y === geometries[0].y) {
						client.geometry = activeClients[currentDesktop][i].geometry;
						activeClients[currentDesktop][i].geometry = oldPos;
						var temp = activeClients[currentDesktop][index];
						activeClients[currentDesktop][index] = activeClients[currentDesktop][i];
						activeClients[currentDesktop][i] = temp;
					}
				}
			}
			tileClients(currentDesktop);
		} else {
			client.geometry = oldPos;
		}
	} else client.geometry = oldPos;
}


/* Todo: - Figure out what to do with maximized clients
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
*/

function minimizeClient(client) {
	for (var i = 0; i < activeClients[currentDesktop].length; i++) {
		if (sameClient(activeClients[currentDesktop][i], client))  {
			activeClients[currentDesktop].splice(i, 1);
			activeClients[currentDesktop].max -= 1;
		}
	}
	tileClients(currentDesktop);
}

function unminimizeClient(client) {
	activeClients[client.desktop].push(client);
	activeClients[client.desktop].max += 1;
	workspace.currentDesktop = client.desktop;
	tileClients(currentDesktop);
}

function changeDesktop() {
	currentDesktop = workspace.currentDesktop;
	tileClients(currentDesktop);
}

function adjustDesktops(desktop) {
	// Checks if a workspace is removed
	if (workspace.desktops < desktop) {
		// Because the API returns desktops as an integer, they can not be recognized
		// which is why the latest workspace is always the one removed
		if (activeClients[desktop].length > 0) {
			for (i = 0; i < activeClients[desktop].length; i++) {
				activeClients[desktop][i].closeWindow();
			}
		}
		activeClients[desktop]  = [];
		tileClients(currentDesktop);
	}
	// Checks if a workspace is added 
	else if (workspace.desktops > desktop) {
		activeClients[workspace.desktops].max = 4;
		tileClients(currentDesktop);
	}
}

init();
