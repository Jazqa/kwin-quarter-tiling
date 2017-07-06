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
  ];

  // Hack: The way Plasma panel is found also finds multiple other Plasma-related clients
  // Plasma panel is the first client to be found, so after it has been found, a global variable
  // is used to skip the step looking for Plasma in the checkClient() function
  var plasmaNotFound = true;

  var gap = 24; // Gap size in pixels

  var noBorders = false;

  var screen = {
  	x: 0,
  	y: 0,
  	width: workspace.displayWidth,
  	height: workspace.displayHeight,
  };

  var oldPos; // Hack: Saves the pre-movement position as a global variable

  var currentDesktop = workspace.currentDesktop;
  var activeClients = {};



  /*---------------/
 / INIT FUNCTIONS /
/---------------*/

  function init() {
  	workspace.desktops = 1;
  	for (i = 1; i <= 20; i++) {
  		activeClients[i] = []; // Initializes 20 empty arrays for virtual desktops to avoid crashes caused by undefined objects
  		activeClients[i].max = 4; // Maximum number of (tiled) clients on a virtual desktop
  	}
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
  			tileClients(currentDesktop);
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
  			tileClients(currentDesktop);
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
  			tileClients(currentDesktop);
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
  			tileClients(currentDesktop);
  		});
  }



  /*--------------------------------/
 / CLIENT ADDING, MOVING & REMOVAL /
/--------------------------------*/

  // Runs an ignore-check and if it passes, adds a client to activeClients[]
  function addClient(client) {
  	if (checkClient(client)) {
  		if (noBorders) {
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
  		if (noBorders) {
  			client.noBorder = true;
  		} else client.noBorder = false;
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
  				tileClients(currentDesktop);
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
  	client.clientStartUserMovedResized.disconnect(saveClientPos);
  	client.clientFinishUserMovedResized.disconnect(moveClient);
  	client.clientMinimized.disconnect(minimizeClient);
  	client.clientUnminimized.disconnect(unminimizeClient);
  	client.float = true;
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
  			// (it's off the grid and needs to be snapped back to the oldPos variable)
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
  		if (geometries[0] != oldPos) {
  			i = findClientIndex(client, currentDesktop);
  			var j = findGeometryIndex(geometries[0], currentDesktop);
  			swapClients(i, j, currentDesktop);
  			tileClients(currentDesktop);
  		} else client.geometry = oldPos;
  	} else client.geometry = oldPos;
  }


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


  /*-----/
 / MAIN /
/-----*/

  init();