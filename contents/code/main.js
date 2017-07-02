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

var activeClients = [];

var gap = 10;

var screen = {
	x: 0 + gap,
	y: 26 + gap,
	width: workspace.displayWidth - gap * 2,
	height: workspace.displayHeight - 26 - gap * 2,
};

function addClient(client) {
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
	activeClients.push(client);
	tileClients(client);
}

function removeClient(client) {
	for (var i = 0; i < activeClients.length; i++) {
		if (activeClients[i] == client) {
			activeClients.splice(i, 1);
			splitClients();
		}
	}
}

function tileClients(client) {
	var rect = client.geometry;
	rect.x = screen.x;
	rect.y = screen.y;
	rect.width = screen.width;
	rect.height = screen.height;
	client.geometry = rect;
	splitClients();
}

function splitClients() {
	var rect = [];
	for (var i = 0; i < activeClients.length; i++) {
		rect[i] = activeClients[i].geometry;
		rect[i].x = screen.x;
		rect[i].y = screen.y;
		rect[i].width = screen.width;
		rect[i].height = screen.height;
		if (i == 1) {
			rect[0].width = rect[0].width / 2 - gap / 2;
			rect[1].width = rect[0].width;
			rect[1].x = rect[1].x + rect[1].width + gap;
		}
		if (i == 2) {
			rect[1].height = rect[1].height / 2 - gap / 2;
			rect[2].height = rect[1].height;
			rect[2].width = rect[2].width / 2;
			rect[2].y = rect[2].y + rect[2].height + gap;
			rect[2].x = rect[2].x + rect[2].width + gap;
		}
		if (i == 3) {
			rect[0].height = rect[0].height / 2 - gap / 2;
			rect[3].height = rect[0].height;
			rect[3].width = rect[3].width / 2 - gap / 2;
			rect[3].y = rect[3].y + rect[3].height + gap;
		}
	}

	for (i = 0; i < activeClients.length; i++) {
		activeClients[i].geometry = rect[i];
	}
}

// Cloning function by A. Levy (https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object)
function clone(obj) {
	var copy;

	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = clone(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		}
		return copy;
	}

	throw new Error("Unable to copy obj! Its type isn't supported.");
}



workspace.clientAdded.connect(addClient);
workspace.clientRemoved.connect(removeClient);