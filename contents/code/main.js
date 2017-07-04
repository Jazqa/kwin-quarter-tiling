/*
Todo:
	- Make clients floatable with a button
	- Interactive virtual desktop removal
	- Allow clients to switch desktops
	- Support for large programs (Gimp, Krita, Kate)
		- Automatically occupies the largest tile
		- Max clients (default: 4) -= 1 per large program
*/
var plasma = false;

var gap = 10;

var screen = {
	x: 0,
	y: 0,
	width: workspace.displayWidth,
	height: workspace.displayHeight,
};

var oldPos; // The pre-movement position for the latest client.StartUserMovedResized

var currentDesktop = workspace.currentDesktop;
var activeClients = {};

function init() {
	workspace.desktops = 1;
	for (i = 1; i <= 20; i++) {
		activeClients[i] = []; // Initializes 20 empty arrays for virtual desktops to avoid crashes caused by undefined objects
		activeClients[i].max = 4;
	}
	addClients();
	workspace.clientAdded.connect(addClient);
	workspace.clientRemoved.connect(removeClient);
	workspace.currentDesktopChanged.connect(changeDesktop);
	workspace.numberDesktopsChanged.connect(adjustDesktops);
}

// Runs an ignore-check and if it passes, adds a client to activeClients[]
function addClient(client) {
	if (checkClient(client) == true) {
		client.clientStartUserMovedResized.connect(saveClientPos);
		client.clientFinishUserMovedResized.connect(moveClient);
		client.clientMinimized.connect(minimizeClient);
		client.clientUnminimized.connect(unminimizeClient);
		if (activeClients[currentDesktop].length == activeClients[currentDesktop].max) {
			// Todo: Use a workspace with space available
			workspace.desktops += 1;
			workspace.currentDesktop = workspace.desktops;
		}
		client.desktop = currentDesktop;
		activeClients[currentDesktop].push(client);
		tileClients(currentDesktop);
	}
}

// Adds all the clients that existed before the script was ran
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
		if (activeClients[currentDesktop][i] == client) {
			activeClients[currentDesktop].splice(i, 1);
			// If there are still tiles after the removal, calculates the geometries
			if (activeClients[currentDesktop].length > 0) {
				tileClients(currentDesktop);
			} else if (activeClients[currentDesktop].length == 0) {
				activeClients[currentDesktop] = [];
				workspace.currentDesktop -= 1;
				// workspace.desktops -= 1; 
			}
		}
	}
}

function checkClient(client) {
	var ignoredClients = [
		"spotify",
		"steam",
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
		"wine",
		"yakuake",
	];
	var ignoredCaptions = [
		"Spotify",
		"File Upload",
		"Move to Trash",
	];
	// Hack: Global variable to skip this step once plasma panel has been found
	// If the plasma panel has not been found yet, it's most likely the first client with resourceClass: "plasmashell" and caption: "Plasma"
		if (plasma == false) {
		var panel = {
			resourceClass: "plasmashell",
			caption: "Plasma",
		};
		if (panel.resourceClass.indexOf(client.resourceClass.toString()) > -1 &&
			panel.caption.indexOf(client.caption.toString()) > -1) {
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
			plasma = true;
			return false;
		}
	}
	if (client.comboBox == true ||
		client.desktopWindow == true ||
		client.dndIcon == true ||
		client.dock == true ||
		client.dropdownMenu == true ||
		client.menu == true ||
		client.notification == true ||
		client.popupMenu == true ||
		client.specialWindow == true ||
		client.splash == true ||
		client.toolbar == true ||
		client.tooltip == true ||
		client.utility == true ||
		client.transient == true ||
		ignoredClients.indexOf(client.resourceClass.toString()) > -1 ||
		ignoredCaptions.indexOf(client.caption.toString()) > -1) {
		return false;
	}
	return true;
}

// Calculates the geometries to maintain the layout
function tileClients(desktop) {
	if (activeClients[desktop].length > 0) { // Todo: is this needed?
		var rect = [];
		for (var i = 0; i < activeClients[desktop].length; i++) {
			rect[i] = {}; // Need to clone the properties, can't just rect = screen!
			rect[i].x = screen.x;
			rect[i].y = screen.y;
			rect[i].width = screen.width;
			rect[i].height = screen.height;
			if (i == 1) {
				rect[0].width = rect[0].width * 0.5 - gap * 0.5;
				rect[i].width = rect[0].width;
				rect[i].x = rect[i].x + rect[i].width + gap;
			}
			if (i == 2) {
				rect[1].height = rect[1].height * 0.5 - gap * 0.5;
				rect[i].height = rect[1].height;
				rect[i].y = rect[i].y + rect[i].height + gap;
				rect[i].width = rect[i].width * 0.5 - gap * 0.5;
				rect[i].x = rect[i].x + rect[i].width + gap;
			}
			if (i == 3) {
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

function tileAllClients() {
	for (i = activeClients.length; i > 0; i--) {
		if (activeClients[i].length > 0) {
			tileClients(i);
		}
	}
}

function saveClientPos(client) {
	oldPos = client.geometry;
}

// Moves clients and adjusts the layout
function moveClient(client) {
	// If the size equals the pre-movement size, user is trying to move the client, not resize it
	if (client.geometry.width == oldPos.width && client.geometry.height == oldPos.height) {
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
				if (activeClients[currentDesktop][i] == client) {
					index = i;
				}
			}
			// ...and activeClients indexes
			for (i = 0; i < activeClients[currentDesktop].length; i++) {
				if (activeClients[currentDesktop][i] != client) {
					if (activeClients[currentDesktop][i].geometry.x == geometries[0].x && activeClients[currentDesktop][i].geometry.y == geometries[0].y) {
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

// Todo: Make the minimized clients reserve their desktop
function minimizeClient(client) {
	for (i = 0; i < activeClients[currentDesktop].length; i++) {
		if (activeClients[currentDesktop][i] == client) {
			activeClients[currentDesktop].splice(i, 1);
			activeClients[currentDesktop].max -= 1;
		}
	}
	tileClients(currentDesktop);
}

// Todo: Make the clients unminimize on their reserved desktops
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
		// For that reason, the latest workspace is always the one removed
		if (activeClients[desktop].length > 0) {
			for (i = 0; i < activeClients[desktop].length; i++) {
				activeClients[desktop][i].closeWindow();
			}
		}
		activeClients[desktop] = [];
		tileClients(currentDesktop);
	}
	// Checks if a workspace is added 
	else if (workspace.desktops > desktop) {
		tileClients(currentDesktop);
	}
}

init();