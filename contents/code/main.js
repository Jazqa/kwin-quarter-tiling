var panel = null;

var ignoredClients = [
	"spotify",
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

var gap = 10;

var screen = {
	x: 0,
	y: 0,
	width: workspace.displayWidth,
	height: workspace.displayHeight,
};

var currentDesktop = workspace.currentDesktop;
var activeClients = {};

activeClients[currentDesktop] = [];

// Adds all the clients that existed before the script was ran
function addClients() {
	var clients = workspace.clientList();
	for (var i = 0; i < clients.length; i++) {
		addClient(clients[i]);
	}
}

// Runs an ignore-check and if it passes, adds a client to activeClients[]
function addClient(client) {
	// Find the panel and calculates the available screen space
	if (panel == null) {
		var plasmaClass = "plasmashell";
		var plasmaCaption = "Plasma";
		if (plasmaClass.indexOf(client.resourceClass.toString()) > -1 &&
			plasmaCaption.indexOf(client.caption.toString()) > -1) {
			panel = client;
			if (panel.geometry.y < workspace.displayHeight / 2) {
				screen = {
					x: gap,
					y: panel.geometry.height + gap,
					width: workspace.displayWidth - gap * 2,
					height: workspace.displayHeight - panel.geometry.height - gap * 2,
				};
			} else {
				screen = {
					x: gap,
					y: gap,
					width: workspace.displayWidth - gap * 2,
					height: workspace.displayHeight - panel.geometry.height - gap * 2,
				};
			}
		}
	}
	// Ignore-check for client types and resourceClasses
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
		return;
	}
	client.clientStartUserMovedResized.connect(saveOldPos);
	client.clientFinishUserMovedResized.connect(moveClient);
	if (activeClients[currentDesktop].length == 4) {
		workspace.desktops += 1;
		workspace.currentDesktop = workspace.desktops;
		if (typeof activeClients[currentDesktop] == "undefined") {
			activeClients[currentDesktop] = [];
		}
		client.desktop = currentDesktop;
		activeClients[currentDesktop].push(client);
		tileClients(currentDesktop);
	} else {
		client.desktop = currentDesktop;
		activeClients[currentDesktop].push(client);
		tileClients(currentDesktop);
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
			}
		}
	}
}

function adjustDesktops(desktop) {
	// Checks if a workspace is removed
	if (workspace.desktops < desktop) {
		if (typeof activeClients[desktop] != "undefined" && activeClients[desktop].length > 0) {
			for (i = 0; i < activeClients[desktop].length; i++) {
				activeClients[desktop][i].closeWindow();
			}
			activeClients[desktop] = [];
			tileClients(currentDesktop);
		}
	}
	// Checks if a workspace is added 
	else if (workspace.desktops > desktop) {
		tileClients(currentDesktop);
	}
}

// Calculates the geometries to maintain the layout
function tileClients(desktop) {
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

function tileAll() {
	for (i = activeClients.length; i > 0; i--) {
		if (activeClients[i].length > 0) {
			tileClients(i);
		}
	}
}

var oldPos; // The pre-movement position for the latest client.StartUserMovedResized
// This function gets called every time a resize or move event starts
function saveOldPos(client) {
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

addClients();
workspace.clientAdded.connect(addClient);
workspace.clientRemoved.connect(removeClient);
workspace.currentDesktopChanged.connect(function() {
	currentDesktop = workspace.currentDesktop;
	if (typeof activeClients[currentDesktop] != "undefined") {
		tileClients(currentDesktop);
	}
});
workspace.numberDesktopsChanged.connect(adjustDesktops);