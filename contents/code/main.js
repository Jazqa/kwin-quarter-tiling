// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

// Shortcuts for KWin objects
var opt = options;
var ws = workspace;

// Shortcuts for workspace properties
var cAct;

// Array for included clients
var tiles = [];

// KWin client.resourceClasses & client.resourceNames that are not tiled
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

// Concats the hardcoded ignoredClients with the ones read from the QML interface
ignoredClients = ignoredClients.concat(
  readConfig("ignoredClients", "wine, steam, kate").toString().split(', ')
  );

// Easy way to disable all Java-based programs
if (readConfig("ignoreJava", 0) == 1) {
  var java = "sun-awt-x11-xframepeer";
  ignoredClients.push(java);
}

// KWin client.resourceClasses & client.resourceNames to which tiles are adjusted to
var fixedClients = [
  "kcalc",
];

// Concats the hardcoded fixedClients with the ones read from the QML interface
fixedClients = fixedClients.concat(
  readConfig("fixedClients", "telegram, telegram-desktop, telegramdesktop").toString().split(', ')
  );

// KWin client.captions that are not tiled
var ignoredCaptions = [
  "File Upload",
  "Move to Trash",
  "Quit GIMP",
  "Create a New Image",
  "QEMU",
];

// Concats the hardcoded ignoredCaptions with the ones read from the QML interface
if (readConfig("ignoredCaptions", "") != "") {
  ignoredCaptions = ignoredCaptions.concat(readConfig("ignoredCaptions", "").toString().split(', '));
}

// Activities that will be ignored by the script
var ignoredActivities = [];
function readIgnoredActs() {
  ignoredActivities = readConfig("ignoredActivities", "").toString().split(', ');
  if (ignoredActivities != "") {
    for (var i = 0; i < ignoredActivities.length; i++) {
      var act = parseInt(ignoredActivities[i]); // Transfers the entries to integers
      if (isNaN(act)) {
        ignoredActivities.splice(i, 0); // Removes entries that aren't integers
      } else if (ws.activities.length > act - 1) {
        ignoredActivities[i] = ws.activities[act - 1].toString();
      }
    }
  } else {
    ignoredActivities = [];
  }
}

// Virtual desktops that will be ignored by the script
var ignoredDesktops = readConfig("ignoredDesktops", "").toString().split(', ');
if (ignoredDesktops != "") {
  for (var i = 0; i < ignoredDesktops.length; i++) {
    var desk = parseInt(ignoredDesktops[i]); // Transfers the entries to integers
    if (isNaN(desk)) {
      ignoredDesktops.splice(i, 0); // Removes entries that aren't integers
    } else {
      ignoredDesktops[i] = desk; // Enters the transfered entry to the array
    }
  }
  ignoredDesktops.push(-1);
} else {
  ignoredDesktops = [-1];
}

// Screens that will be completely ignored
var ignoredScreens = readConfig("ignoredScreens", "").toString().split(', ');
if (ignoredScreens != "") {
  for (var i = 0; i < ignoredScreens.length; i++) {
    // Removes every non-number entry
    var scr = parseInt(ignoredScreens[i]); // Transfers the entries to integers
    if (isNaN(scr)) {
      ignoredScreens.splice(i, 0); // Removes entries that aren't integers
    } else {
      ignoredScreens[i] = scr - 1; // -1 for consistency with desktops
    }
  }
} else {
  ignoredScreens = [];
}

var gap = readConfig("gap", 8);

// Negative gaps are not allowed (difficulty recognizing maxed, overlapping x < 0 changes screen)
if (gap < 0) {
  gap = 0;
}

var margins = [];
margins[0] = readConfig("mt", 0);
margins[1] = readConfig("ml", 0);
margins[2] = readConfig("mb", 1);
margins[3] = readConfig("mr", 0);
if (gap == 0) {
  fixMargins();
}

// Avoids issues with ifMaxed() if gaps are set to zero
function fixMargins() {
  for (var i = 0; i < margins.length; i++) {
    if (margins[i] > 0) {
      return;
    }
  }
  margins[2] = 1; // Bottom is used because it's the least noticable and needed
}

var centerTo = readConfig("centerTo", 1); // 0 == Screen, 1 == Tile

var autoSize = readConfig("autoSize", 2); // 0 == All, 1 == Fixed, 2 == Nada

// Starts the script
function init() {
  cAct = ws.currentActivity.toString();
  registerKeys();
  var desks = readConfig("numDesks", 2);
  if (desks < 1) {
    desks = 1;
  }
  ws.desktops = desks;
  readIgnoredActs();
  for (var j = 0; j < ws.activities.length; j++) {
    var act = ws.activities[j].toString();
    if (ignoredActivities.indexOf(act) === -1) {
      tiles[act] = [];
      for (var i = 1; i <= desks; i++) {
        createDesktop(act, i);
      }
    }
  }
  addClients();
  connectWorkspace();
}

// Registers all the shortcuts used for the script
function registerKeys() {
  registerShortcut(
    "Quarter: Float/Tile Desktop",
    "Quarter: Float/Tile Desktop",
    "Meta+Esc",
    function() {
      // Floats the whole desktop and aligns windows to the middle
      var clients = ws.clientList();
      var client;
      var desk = ws.currentDesktop;
      var i = ignoredDesktops.indexOf(desk);
      if (i > -1) {
        ignoredDesktops.splice(i, 1);
        for (var k = 0; k < clients.length; k++) {
          client = clients[k];
          if (client.desktop == desk && client.included !== true) {
            addClient(client, true, client.desktop, client.screen);
          }
        }
      } else {
        ignoredDesktops.push(desk);
        var scrs = [];
        for (var l = 0; l < ws.numScreens; l++) {
          scrs[l] = 1; // Align each screen separately
        }
        for (var j = 0; j < clients.length; j++) {
          client = clients[j];
          if (client.desktop === desk && client.included) {
            removeClient(client, false, client.desktop, client.screen);
            resetClient(client, scrs[client.screen]);
            scrs[client.screen] += 1;
          }
        }
      }
    });

  registerShortcut(
    "Quarter: Float On/Off",
    "Quarter: Float On/Off",
    "Meta+F",
    function() {
      var client = ws.activeClient;
      if (client.included) {
        removeClient(client, false, client.desktop, client.screen);
      } else {
        addClient(client, true, client.desktop, client.screen);
      }
    });

  registerShortcut(
    "Quarter: Move Up",
    "Quarter: Move Up",
    "Meta+K",
    function() {
      var client = ws.activeClient;
      var desk = client.desktop;
      var scr = client.screen;
      if (cAct !== client.act) {
        removeClient(client, false, desk, scr);
      }

      if (client.included && ignoredScreens.indexOf(client.screen) === -1) {
        var i = findClientIndex(client, ws.currentDesktop, scr);
        if (i === 2) {
          swapClients(i, 1, scr, scr);
        } else if (i === 3) {
          swapClients(i, 0, scr, scr);
        } else {
          return;
        }
        tileClients();
      } else {
        var tile = screenGeo(scr);
        var rect = client.geometry;
        rect.x = tile.x + gap + margins[1];
        rect.y = tile.y + gap + margins[0];
        rect.width = tile.width - gap * 2 - margins[1] - margins[3];
        rect.height = tile.height * 0.5 - gap - margins[0];
        if (client.geometry.x === rect.x && client.geometry.y === rect.y &&
            client.geometry.width === rect.width && client.geometry.height === rect.height) {
          client.geometry = screenGeo(scr, true);
        } else {
          client.geometry = rect;
        }
      }
    });

  registerShortcut(
    "Quarter: Move Down",
    "Quarter: Move Down",
    "Meta+J",
    function() {
      var client = ws.activeClient;
      var act = client.act;
      var desk = client.desktop;
      var scr = client.screen;
      if (cAct !== client.act) {
        removeClient(client, false, desk, scr);
      }

      if (client.included && ignoredScreens.indexOf(client.screen) === -1) {
        var i = findClientIndex(client, desk, scr);
        if (i === 0 && tiles[act][desk][scr].length === 4) {
          swapClients(i, 3, scr, scr);
        } else if (i === 1 && tiles[act][desk][scr].length >= 3) {
          swapClients(i, 2, scr, scr);
        } else {
          return;
        }
        tileClients();
      } else {
        var tile = screenGeo(scr);
        var rect = client.geometry;
        rect.x = tile.x + gap + margins[1];
        rect.y = tile.y + gap + margins[0];
        rect.width = tile.width - gap * 2 - margins[1] - margins[3];
        rect.height = tile.height * 0.5 - gap - margins[2];
        rect.y += rect.height;
        if (client.geometry.x === rect.x && client.geometry.y === rect.y &&
            client.geometry.width === rect.width && client.geometry.height === rect.height) {
          client.geometry = screenGeo(scr, true);
        } else {
          client.geometry = rect;
        }
      }
    });

  registerShortcut(
    "Quarter: Move Left",
    "Quarter: Move Left",
    "Meta+H",
    function() {
      var client = ws.activeClient;
      var act = client.act;
      var desk = client.desktop;
      var scr = client.screen;
      if (cAct !== client.act) {
        removeClient(client, false, desk, scr);
      }

      if (client.included && ignoredScreens.indexOf(client.screen) === -1) {
        var i = findClientIndex(client, desk, scr);
        if (i === 1) {
          swapClients(i, 0, scr, scr);
        } else if (i === 2 && tiles[act][desk][scr].length === 4) {
          swapClients(i, 3, scr, scr);
        } else if (i === 2) {
          swapClients(i, 0, scr, scr);
        } else {
          return;
        }
        tileClients();
      } else {
        var tile = screenGeo(scr);
        var rect = client.geometry;
        rect.x = tile.x + gap + margins[1];
        rect.y = tile.y + gap + margins[0];
        rect.width = tile.width * 0.5 - gap - margins[1];
        rect.height = tile.height - gap * 2 - margins[0] - margins[2];
        if (client.geometry.x === rect.x && client.geometry.y === rect.y &&
            client.geometry.width === rect.width && client.geometry.height === rect.height) {
          client.geometry = screenGeo(scr, true);
        } else {
          client.geometry = rect;
        }
      }
    });

  registerShortcut(
    "Quarter: Move Right",
    "Quarter: Move Right",
    "Meta+L",
    function() {
      var client = ws.activeClient;
      var act = client.act;
      var desk = client.desktop;
      var scr = client.screen;
      if (cAct !== client.act) {
        removeClient(client, false, desk, scr);
      }

      if (client.included && ignoredScreens.indexOf(client.screen) === -1) {
        var i = findClientIndex(client, desk, scr);
        if (i === 0 && tiles[act][desk][scr].length > 1) {
          swapClients(i, 1, scr, scr);
        } else if (i === 3) {
          swapClients(i, 2, scr, scr);
        } else {
          return;
        }
        tileClients();
      } else {
        var tile = screenGeo(scr);
        var rect = client.geometry;
        rect.x = tile.x + gap + margins[1];
        rect.y = tile.y + gap + margins[0];
        rect.width = tile.width * 0.5 - gap - margins[3];
        rect.height = tile.height - gap * 2 - margins[0] - margins[2];
        rect.x += rect.width;
        if (client.geometry.x === rect.x && client.geometry.y === rect.y &&
            client.geometry.width === rect.width && client.geometry.height === rect.height) {
          client.geometry = screenGeo(scr, true);
        } else {
          client.geometry = rect;
        }
      }
    });

  registerShortcut(
    "Quarter: Move to Next Screen",
    "Quarter: Move to Next Screen",
    "Meta+Right",
    function() {
      var client = ws.activeClient;
      var scr = client.screen + 1;
      if (scr >= ws.numScreens) {
        scr = 0;
      }
      throwClient(client, client.desktop, client.screen, client.desktop, scr);
      tileClients();
    });

  registerShortcut(
    "Quarter: Move to Previous Screen",
    "Quarter: Move to Previous Screen",
    "Meta+Left",
    function() {
      var client = ws.activeClient;
      var scr = client.screen - 1;
      if (scr < 0) {
        scr = ws.numScreens - 1;
      }
      throwClient(client, client.desktop, client.screen, client.desktop, scr);
      tileClients();
    });

  registerShortcut(
    "Quarter: + Window Size",
    "Quarter: + Window Size",
    "Meta+Y",
    function() {
      // TODO: Implement for fixed clients
      var client = ws.activeClient;
      if (client.fixed) {
        return;
      }
      var scr = client.screen;
      var x = Math.round(screenWidth(scr) * 0.01);
      var y = Math.round(screenHeight(scr) * 0.01);
      if (client.included && ignoredScreens.indexOf(scr) === -1) {
        resizeClient(client, scr, x, y);
        tileClients();
      } else {
        var rect = client.geometry;
        rect.width += x;
        rect.height += y;
        rect.x -= x * 0.5;
        rect.y -= y * 0.5;
        client.geometry = rect;
      }
    });

  registerShortcut(
    "Quarter: - Window Size",
    "Quarter: - Window Size",
    "Meta+N",
    function() {
      // TODO: Implement for fixed clients
      var client = ws.activeClient;
      if (client.fixed) {
        return;
      }
      var scr = client.screen;
      var x = Math.round(screenWidth(scr) * 0.01);
      var y = Math.round(screenHeight(scr) * 0.01);
      if (client.included && ignoredScreens.indexOf(scr) === -1) {
        resizeClient(client, scr, -x, -y);
        tileClients();
      } else {
        var rect = client.geometry;
        rect.width -= x;
        rect.height -= y;
        rect.x += x * 0.5;
        rect.y += y * 0.5;
        client.geometry = rect;
      }
    });

  registerShortcut(
    "Quarter: Reset Layout",
    "Quarter: Reset Layout",
    "Meta+R",
    function() {
      tiles[cAct][ws.currentDesktop][ws.activeScreen].layout = newLayout(ws.activeScreen);
      tileClients();
    });

  registerShortcut(
    "Quarter: Toggle Gaps On/Off",
    "Quarter: Toggle Gaps On/Off",
    "Meta+G",
    function() {
      if (gap <= 1) {
        gap = readConfig("gap", 8);
      } else {
        for (var i = 0; i < margins.length; i++) {
          if (margins[i] > 0) {
            gap = 0;
            tileClients();
            return;
          }
        }
        gap = 1; /* If margins are set to zero, gaps can't be zero
                    or the last window will be recognized as maximized */
      }
      tileClients();
    });

  registerShortcut(
    "Quarter: + Gap Size",
    "Quarter: + Gap Size",
    "Meta+PgUp",
    function() {
      gap += 2;
      tileClients();
    });

  registerShortcut(
    "Quarter: - Gap Size",
    "Quarter: - Gap Size",
    "Meta+Down",
    function() {
      gap -= 2;
      if (gap < 0) {
        gap = 0;
      }
      tileClients();
    });
}

// Connects the KWin:Workspace signals to the following functions
function connectWorkspace() {
  ws.clientAdded.connect(function(client) {
    addClient(client, true, ws.currentDesktop, ws.activeScreen);
  });
  ws.clientRemoved.connect(function(client) {
    removeClient(client, true, client.desktop, client.screen);
  });
  ws.desktopPresenceChanged.connect(function(client, desk) {
    if (client && client.included) {
      if (ws.desktops < client.oldDesk) {
        removeClient(client, false, client.oldDesk, client.oldScr);
        client.closeWindow();
      } else if (client.desktop !== client.oldDesk){
        throwClient(client, client.oldDesk, client.oldScr, client.desktop, client.screen);
      }
    } else {
      tileClients();
    }
  });
  ws.currentDesktopChanged.connect(function(client, desk) {
    if (client && client.included) {
      if (ws.desktops < client.oldDesk) {
        removeClient(client, false, client.oldDesk, client.oldScr);
        client.closeWindow();
      } else if (client.desktop !== client.oldDesk){
        throwClient(client, client.oldDesk, client.oldScr, client.desktop, client.screen);
      }
    } else {
      tileClients();
    }
  });
  ws.clientMaximizeSet.connect(function(client, h, v) {
    if (client.included) {
      maximizeClient(client, h, v);
    }
  });
  ws.clientFullScreenSet.connect(function(client, full, user) {
    if (client.included) {
      fullScreenClient(client, full, user);
    }
  });
  ws.clientMinimized.connect(function(client, full, user) {
    if (client.included) {
      minimizeClient(client);
    }
  });
  ws.clientUnminimized.connect(function(client) {
    if (client.included) {
      unminimizeClient(client);
    }
  });
  ws.numberDesktopsChanged.connect(adjustDesktops);
  ws.activityAdded.connect(function(act) {
      createActivity(act);
  });
  ws.currentActivityChanged.connect(function(act) {
      cAct = curAct();
      tileClients();
  });
}


// -------------------
// Client Manipulation
// -------------------

// Runs an ignore-check and if it passes, adds a client to tiles[]
function addClient(client, follow, desk, scr) {
  if (checkClient(client)) {
    print("START: addClient(" + client + ", " + follow + ", " + desk + ", " + scr + ")");
    var act = cAct;

    // If tiles.length exceeds the maximum amount, moves to another screen or another desktop
    if (tiles[act][desk][scr].length === tiles[act][desk][scr].max || 
        tiles[act][desk][scr].length === 4 ||  tiles[act][desk][scr].blocked) {
      // Fixes a bug that makes the maximum go over 4 when removing virtual desktops
      if (tiles[act][desk][scr].length === 4) {
        tiles[act][desk][scr].max = 4;
      }
      var freeTile = findSpace(); // Looks for a free space on existing desktops
      if (freeTile) {
        desk = freeTile[0];
        scr = freeTile[1];
      } else {
        ws.desktops += 1;
        desk = ws.desktops;
      }
    }

    if (follow) {
      ws.currentDesktop = desk;
    }
    client.desktop = desk;
    ws.activeClient = client;
    var unshift = false;
    connectClient(client, desk, scr);

    // Fixed clients make space for regular ones
    if (autoSize == 0 && tiles[act][desk][scr].length > 0 && 
        tiles[act][desk][scr][0].fixed && client.fixed !== true) {
      tiles[act][desk][scr].unshift(client);
      unshift = true;
    } else {
      tiles[act][desk][scr].push(client);
    }

    if (client.minimized) {
      reserveClient(client, desk, scr);
    } else if (client.fullScreen || isMaxed(client)) {
      tiles[act][desk][scr].blocked = true;
      // Moves the client to the next screen before tiling (to avoid tiling a maxed client)
      client.geometry = screenGeo(scr);
      reserveClient(client, desk, scr);
    } else {
      if (client.fixed !== true) { 
        resetClient(client, "center", scr); 
      } else if (client.geometry.width > newTile(scr).width) { 
        var rect = client.geometry;
        rect.width = newTile(scr).width;
        client.geometry = rect;
      }
      fitClient(client, desk, scr, "add");
      if (unshift) {
        fitClient(tiles[act][desk][scr][1], desk, scr, "add");
      }
      tileClients();
    }
    print("END: addClient(" + client + ", " + follow + ", " + desk + ", " + scr + ")");
  }
}

// Adds all the clients that existed before the script was executed
function addClients() {
  var clients = ws.clientList();
  for (var i = 0; i < clients.length; i++) {
    addClient(clients[i], false, clients[i].desktop, clients[i].screen);
  }
  /*
  // Sorts clients by their y-coordinate
  clients.sort(function(a, b) {
    return a.geometry.y - b.geometry.y;
  });

  // Split the sorted list in half (two rows)
  var upperClients = [];
  var lowerClients = [];
  for (var i = 0; i < Math.max(clients.length * 0.5); i++) {
    upperClients[i] = clients[i];
  }
  var j = 0;
  for (i = clients.length - 1; i >= Math.max(clients.length * 0.5); i--) {
    lowerClients[j] = clients[i];
    j++;
  }

  // Sort the split lists by x-coordinate
  upperClients.sort(function(a, b) {
    return a.geometry.x - b.geometry.x;
  });
  lowerClients.sort(function(a, b) {
    return (-1 * a.geometry.x) - (-1 * b.geometry.x);
  });

  // Add the clients in proper order
  for (i = 0; i < upperClients.length; i++) {
    addClient(upperClients[i], false, upperClients[i].desktop, upperClients[i].screen);
  }
  for (i = 0; i < lowerClients.length; i++) {
    addClient(lowerClients[i], false, lowerClients[i].desktop, lowerClients[i].screen);
  }
  */
}

// Connects the signals of the new KWin:Client to the following functions
function connectClient(client, desk, scr) {
  client.clientStartUserMovedResized.connect(startMove);
  client.clientFinishUserMovedResized.connect(endMove);
  client.activeChanged.connect(tileClients);
  client.desktopChanged.connect(function() {
    if (ignoredDesktops.indexOf(client.desktop) > -1) {
      removeClient(client, false, client.oldDesk, client.oldScr);
    } else {
      if (client.included !== true) {
        addClient(client, true, client.desktop, client.screen);
      }
    }
  });

  if (fixedClients.indexOf(client.resourceClass.toString()) > -1 || 
      fixedClients.indexOf(client.resourceName.toString()) > -1) {
    client.fixed = true;
  }
  client.included = true;
  client.reserved = false;
  client.act = cAct;
  client.oldDesk = desk;
  client.oldScr = scr;
  client.oldIndex = -1;
  client.oldGeo = client.geometry;
}

// Removes the closed client from tiles[]
function removeClient(client, follow, desk, scr) {
  print("START: removeClient(" + client + ", " + follow + ", " + desk + ", " + scr + ")");
  if (client.included) {
    resetClient(client, "center");
    if (typeof follow === "undefined") { follow = false; }
    if (typeof desk === "undefined") { desk = client.oldDesk; }
    if (typeof scr === "undefined") { scr = client.oldScr; }
    var act = client.act;

    if (client.reserved) {
      tiles[act][desk][scr].max += 1;
      if (client.minimized !== true) {
        tiles[act][desk][scr].blocked = false;
      }
    } else {
      var i = findClientIndex(client, desk, scr);
      tiles[act][desk][scr].splice(i, 1);
      for (var j = 0; j < tiles[act][desk].length; j++) {
        if (tiles[act][desk][j].length > 0) { 
          follow = false; 
          break;
        }
      } if (follow) {
          ws.currentDesktop = findBusy();
      } else if (tiles[act][desk][scr].length > i && client.fixed) {
        // Fits the client filling removed client's spot
        fitClient(tiles[act][desk][scr][i], desk, scr, "remove");
      }
    }

    disconnectClient(client);
    print("END: removeClient(" + client + ", " + follow + ", " + desk + ", " + scr + ")");
    fitClients(act, desk, scr, "remove");
    tileClients();
  } else {
    print("END: removeClient() " + client + " NOT INCLUDED");
  }
}


// Disconnects the signals from removed clients,
// so they will not trigger when a manually floated client is interacted with 
function disconnectClient(client) {
  client.included = false;
  client.clientStartUserMovedResized.disconnect(startMove);
  client.clientFinishUserMovedResized.disconnect(endMove);
}

// "Reserves" a spot for client on its current desktop and screen
function reserveClient(client, desk, scr) {
  print("START: reserveClient(" + client + ", " + desk + ", " + scr + ")");
  var act = client.act;
  if (client.included && client.reserved === false && ignoredScreens.indexOf(scr) === -1) {
    var i = findClientIndex(client, desk, scr);
    tiles[act][desk][scr].max -= 1;
    tiles[act][desk][scr].splice(i, 1);
    client.oldIndex = i;
    client.oldDesk = desk;
    client.oldScr = scr;
    client.reserved = true;
    tileClients();
  }
  print("END: reserveClient(" + client + ", " + desk + ", " + scr + ")");
}

// "Adds" a client back to the desktop on its reserved tile
function unreserveClient(client) {
  print("START: unreserveClient(" + client + ")");
  if (client.included && client.reserved && ignoredScreens.indexOf(client.screen) === -1) {
    var act = cAct;
    ws.currentDesktop = client.oldDesk;
    client.reserved = false;
    tiles[act][client.oldDesk][client.oldScr].max += 1;
    if (client.oldIndex >= 0) {
      tiles[act][client.oldDesk][client.oldScr].splice(client.oldIndex, 0, client);
    } else {
      tiles[act][client.oldDesk][client.oldScr].push(client);
    }
    tileClients();
  }
  print("END: unreserveClient(" + client + ")");
}


// Finds out which clients of a desktop should be fit
function fitClients(act, desk, scr, action) {
  if (ignoredActivities.indexOf(act) > -1) { return; }
  var t = tiles[act][desk][scr];
  switch (t.length) {
    case 2:
      fitClient(t[0], desk, scr, action, true);
      fitClient(t[1], desk, scr, action, true);
      break;
    case 3:
      fitClient(t[0], desk, scr, action, true);
      if (t[2].geometry.height > t[1].geometry.height) {
        fitClient(t[2], desk, scr, action, true);
      } else {
        fitClient(t[1], desk, scr, action, true);
      }
      break;
    case 4:
      if (t[3].geometry.height > t[0].geometry.height) {
        fitClient(t[3], desk, scr, action, true);
      } else {
        fitClient(t[0], desk, scr, action, true);
      }
      if (t[2].geometry.height > t[1].geometry.height) {
        fitClient(t[2], desk, scr, action, true);
      } else {
        fitClient(t[1], desk, scr, action, true);
      }
  }
}

// Adjusts the layout according to the size of a client
function fitClient(client, desk, scr, action, all) {
  print("START: fitClient(" + client + ", " + desk + ", " +
        scr + ", " + action + ", " + all + ")");

  // Cases where autosizing does not happen
  if (autoSize == 2 || client.reserved ||
      ignoredActivities.indexOf(client.act) > -1) {
    return;
  }

  // If a client is not fixed, check if it's adjacent ones are
  var opposite = oppositeClient(client, scr);
  var neighbour = neighbourClient(client, scr);
  if (autoSize == 1) {
    if (client.fixed !== true) {
      if (opposite && neighbour) {
        if (opposite[0].fixed !== true && neighbour[0].fixed !== true) { 
          return; 
        }
      } else if (opposite && neighbour == false) {
        if (opposite[0].fixed !== true) { return; }
      } else if (neighbour && opposite == false) {
        if (neighbour[0].fixed !== true) { return; }
      }
    }
  }

  var act = client.act;
  var tile = tiles[act][desk][scr].layout[findClientIndex(client, desk, scr)];

  // Vertical adjustment
  var y = client.geometry.height + gap * 1.5 - tile.height;
  if (client.fixed !== true && opposite && opposite[0].fixed) {
    tile = tiles[act][desk][scr].layout[opposite[1]];
    // If opposite client is fixed, fit to its height instead
    y = -1 * (opposite[0].geometry.height + gap * 1.5 - tile.height);
  } else if (client.fixed && opposite && opposite[0].fixed) {
    // If client and opposite fixed, center the tiles
    y = 0.5 * (y - (opposite[0].geometry.height + gap * 1.5 - 
                    tiles[act][desk][scr].layout[opposite[1]].height));
  } else if (action !== "resize" && client.fixed !== true && 
             y > newTile(scr).height - tile.height) {
    if (autoSize == 1) {
      y = 0;
    } else {
      if (all) {
        // If fitClients() is called, don't adjust the vertical size of previous clients
        y = 0;
      } else {
        y = newTile(scr).height - tile.height; // Stops a tile from getting too large
      }
    }
  }

  // Horizontal adjustment
  var x = 0;
  if (client.fixed !== true && all || 
      client.fixed !== true && action === "swap") {
    x = 0;
  } else if (action === "move" ||
             action === "throw" || 
             action === "add" || 
             action === "remove" || 
             action === "resize" && client.fixed) {
    x = client.geometry.width + gap * 1.5 - tile.width;
    if (client.fixed && neighbour && neighbour[0].fixed) {
      // If client and opposite fixed, center the tiles
      x = 0.5 * (x - (neighbour[0].geometry.width + gap * 1.5 - 
                      tiles[act][desk][scr].layout[neighbour[1]].width));
    } else if (opposite && opposite[0].geometry.width > client.geometry.width) {
      // Perceive the width of the wider tile
      x = opposite[0].geometry.width + gap * 1.5 - 
          tiles[act][desk][scr].layout[opposite[1]].width;
    } else if (x > newTile(scr).width - tile.width) { 
      if (autoSize == 1) {
        x = 0;
      } else {
        x = newTile(scr).width - tile.width; // Stops a tile from getting too large
      }
    }
  }

  // Plain tile swap if horizontal swap happens when three clients are active
  if (action === "move" && x < 0 && client.fixed !== true && 
      tiles[act][desk][scr].length === 3) {
    x = 0;
  }
  print("END: fitClient(" + client + ", " + desk + ", " +
        scr + ", " + action + ", " + all + ")");
  resizeClient(client, scr, x, y);
}

// Aligns clients to the layout
function tileClients(desk) {
  var act = cAct;
  if (ignoredActivities.indexOf(act) > -1) { return; }
  if (typeof desk === "undefined") { desk = ws.currentDesktop; }

  print("START: tileClients(" + desk + ")");
  for (var i = 0; i < ws.numScreens; i++) {
    if (ignoredScreens.indexOf(i) > -1) {
      // Don't tile ignored screens
    } else if (typeof tiles[act][desk][i] !== "undefined") {
      var t = tiles[act][desk][i];
      var adj = [];

      switch (t.length) {
        case 1:
          adj[0] = {};
          adj[0].x = t.layout[0].x + gap;
          adj[0].y = t.layout[0].y + gap;
          adj[0].width = t.layout[0].width + t.layout[1].width - gap * 2;
          adj[0].height = t.layout[0].height + t.layout[3].height - gap * 2;
          break;
        case 2:
          adj[0] = {};
          adj[0].x = t.layout[0].x + gap;
          adj[0].y = t.layout[0].y + gap;
          adj[0].width = t.layout[0].width - gap * 1.5;
          adj[0].height = t.layout[0].height + t.layout[3].height - gap * 2;

          adj[1] = {};
          adj[1].x = t.layout[1].x + gap * 0.5;
          adj[1].y = t.layout[1].y + gap;
          adj[1].width = t.layout[1].width - gap * 1.5;
          adj[1].height = t.layout[1].height + t.layout[2].height - gap * 2;
          break;
        case 3:
          adj[0] = {};
          adj[0].x = t.layout[0].x + gap;
          adj[0].y = t.layout[0].y + gap;
          adj[0].width = t.layout[0].width - gap * 1.5;
          adj[0].height = t.layout[0].height + t.layout[3].height - gap * 2;

          adj[1] = {};
          adj[1].x = t.layout[1].x + gap * 0.5;
          adj[1].y = t.layout[1].y + gap;
          adj[1].width = t.layout[1].width - gap * 1.5;
          adj[1].height = t.layout[1].height - gap * 1.5;

          adj[2] = {};
          adj[2].x = t.layout[2].x + gap * 0.5;
          adj[2].y = t.layout[2].y + gap * 0.5;
          adj[2].width = t.layout[2].width - gap * 1.5;
          adj[2].height = t.layout[2].height - gap * 1.5;
          break;
        case 4:
          adj[0] = {};
          adj[0].x = t.layout[0].x + gap;
          adj[0].y = tiles[act][desk][i].layout[0].y + gap;
          adj[0].width = t.layout[0].width - gap * 1.5;
          adj[0].height = t.layout[0].height - gap * 1.5;

          adj[1] = {};
          adj[1].x = t.layout[1].x + gap * 0.5;
          adj[1].y = t.layout[1].y + gap;
          adj[1].width = t.layout[1].width - gap * 1.5;
          adj[1].height = t.layout[1].height - gap * 1.5;

          adj[2] = {};
          adj[2].x = t.layout[2].x + gap * 0.5;
          adj[2].y = t.layout[2].y + gap * 0.5;
          adj[2].width = t.layout[2].width - gap * 1.5;
          adj[2].height = t.layout[2].height - gap * 1.5;

          adj[3] = {};
          adj[3].x = t.layout[3].x + gap;
          adj[3].y = t.layout[3].y + gap * 0.5;
          adj[3].width = t.layout[3].width - gap * 1.5;
          adj[3].height = t.layout[3].height - gap * 1.5;
          break;
      }

      // Regular clients always have the size of their tile
      // Fixed clients get further adjusted to their tile
      for (var j = 0; j < adj.length; j++) {
        if (tiles[act][desk][i][j].fixed) {
          var rect = tiles[act][desk][i][j].geometry;

          // Center the clients according to the tile (1) or screen (2)
          if (centerTo == 1) {
            rect.x = adj[j].x + adj[j].width * 0.5 - rect.width * 0.5;
            rect.y = adj[j].y + adj[j].height * 0.5 - rect.height * 0.5;
          } else {
            switch (j) {
              case 0:
                if (adj.length === 1) {
                  rect.x = adj[j].x + adj[j].width * 0.5 - rect.width * 0.5;
                  rect.y = adj[j].y + adj[j].height * 0.5 - rect.height * 0.5;
                } else if (adj.length == 2 || adj.length == 3) {
                  rect.x = adj[j].x + adj[j].width - rect.width;
                  rect.y = adj[j].y + adj[j].height * 0.5 - rect.height * 0.5;
                } else {
                  rect.x = adj[j].x + adj[j].width - rect.width;
                  rect.y = adj[j].y + adj[j].height - rect.height;
                }
                break;
              case 1:
                if (adj.length === 2) {
                  rect.x = adj[j].x;
                  rect.y = adj[j].y + adj[j].height * 0.5 - rect.height * 0.5;
                } else {
                  rect.x = adj[j].x;
                  rect.y = adj[j].y + adj[j].height - rect.height;
                }
                break;
              case 2:
                rect.x = adj[j].x;
                rect.y = adj[j].y;
                break;
              case 3:
                rect.x = adj[j].x + adj[j].width - rect.width;
                rect.y = adj[j].y;
                break;
            }
          }

          // Stops a fixed client from getting too large
          if (rect.width > adj[j].width) {
            rect.x = adj[j].x;
            rect.width = adj[j].width;
          }
          if (rect.height > adj[j].height) {
            rect.y = adj[j].y;
            rect.height = adj[j].height;
          }

          // Fixed
          tiles[act][desk][i][j].geometry = rect;
        } else {
          // Regular
          tiles[act][desk][i][j].geometry = adj[j];
        }
      }
    }
  }
  print("END: tileClients(" + desk + ")");
}

// Decides if a client is moved or resized
function endMove(client) {
  if (client.screen !== client.oldScr) { 
    throwClient(client, client.oldDesk, client.oldScr, client.desktop, client.screen);
  } else if (client.geometry.width === client.oldGeo.width && 
             client.geometry.height === client.oldGeo.height) {
    /* If the size equals the pre-movement size, 
       user is trying to move the client, not resize it */
    moveClient(client);
  } else if (client.reserved !== true) {
    var i = findClientIndex(client, client.oldDesk, client.oldScr);
    var x = client.geometry.width - 
            tiles[client.act][client.oldDesk][client.oldScr].layout[i].width + gap * 1.5;
    var y = client.geometry.height - 
            tiles[client.act][client.oldDesk][client.oldScr].layout[i].height + gap * 1.5;
    resizeClient(client, client.oldScr, x, y);
    fitClient(client, client.desktop, client.oldScr, "resize");
    tileClients();
  }
}

// Moves clients (switches places within the layout)
function moveClient(client) {
  print("START: moveClient(" + client + ")");
  if (client.fullScreen) { return; }
  var act = client.act;
  var desk = client.desktop;
  var scr = client.screen;
  var index = findClientIndex(client, desk, scr);
  var tile = tiles[act][desk][scr].layout[index];
  var geometries = [];
  geometries.push(tile);
  geometries[0].index = index;

  // Adds all the existing clients to the geometries[]...
  for (var i = 0; i < tiles[act][desk][scr].length; i++) {
    // ...except for the client being moved (adds its tile instead)
    if (i !== index) {
      geometries.push(tiles[act][desk][scr].layout[i]);
      geometries[geometries.length - 1].index = i;
    }
  }

  // Sorts the geometries[] and finds the geometry closest to the moved client
  geometries.sort(function(a, b) {
    var centerX = client.geometry.x + client.width * 0.5;
    var centerY = client.geometry.y + client.height * 0.5;
    return Math.sqrt(Math.pow((centerX - (a.x + a.width / 2)), 2) + 
           Math.pow((centerY - (a.y + a.height / 2)), 2)) - 
           Math.sqrt(Math.pow((centerX - (b.x + b.width / 2)), 2) + 
           Math.pow((centerY - (b.y + b.height / 2)), 2));
  });

  // If the closest client is not the moved client itself, swaps clients
  if (index !== geometries[0].index) { 
    swapClients(index, geometries[0].index, scr, scr);
  }

  tileClients();
  print("END: moveClient(" + client + ")");
}

/* Swaps tiles[desktop][ws.activeScreen][i] and tiles[desktop][ws.activeScreen][j]
   TODO: Deprecate switching between screens (new: swapClients(i, j)) */
function swapClients(i, j, scrI, scrJ) {
  print("START: swapClients(" + i +  ", " + j + ")");
  var act = cAct;
  var desk = ws.currentDesktop;
  var temp = tiles[act][desk][scrI][i];
  tiles[act][desk][scrI][i] = tiles[act][desk][scrJ][j];
  tiles[act][desk][scrJ][j] = temp;

  // If the clients are adjacent, fits the smaller one
  if (i === 3 && j === 0 || 
      i === 0 && j === 3 || 
      i === 1 && j === 2 || 
      i === 2 && j === 1) {
    if (scrI === scrJ) {
      if (tiles[act][desk][scrJ][j].geometry.width < 
          tiles[act][desk][scrI][i].geometry.width) {
        fitClient(tiles[act][desk][scrJ][j], desk, scrJ, "swap");
      } else {
        fitClient(tiles[act][desk][scrJ][j], desk, scrJ, "swap");
      }
    } else {
      fitClient(tiles[act][desk][scrJ][j], desk, scrJ, "move");
    }
  } else {
    fitClient(tiles[act][desk][scrJ][j], desk, scrJ, "move");
  }
  fitClients(act, desk, scrJ, "move");

  /* If the clients were swapped between screens,
     the other screen must be fit as well */
  if (scrI !== scrJ) {
    fitClient(tiles[act][desk][scrI][i], desk, scrI, "move");
    fitClients(act, desk, scrI, "move");
  }
  print("END: swapClients(" + i +  ", " + j + ")");
}

// Moves client between desktops and screens (TODO: activities)
function throwClient(client, fDesk, fScr, tDesk, tScr) {
  print("START: throwClient(" + client + ", " + fDesk + ", " +
        fScr + ", " + tDesk + ", " + tScr + ")");
  var act = client.act;
  if (client.included) {

    // Safety net to avoid empty tiles
    if (findClientIndex(client, tDesk, tScr) !== false) {
      tileClients();
      return;
    }

    if (tiles[act][tDesk][tScr].length < tiles[act][tDesk][tScr].max && 
        tiles[act][tDesk][tScr].blocked !== true) {

      if (client.reserved) {
        tiles[act][fDesk][fScr].max += 1; 
        client.oldIndex = -1;
        if (client.minimized !== true)  {
          tiles[act][fDesk][fScr].blocked = false;
          var area = screenGeo(tScr);
          client.geometry = area;
          tiles[act][tDesk][tScr].blocked = true;
        }
      } else {
        var i = findClientIndex(client, fDesk, fScr);
        tiles[act][fDesk][fScr].splice(i, 1);
        tiles[act][tDesk][tScr].push(client);
      }

      client.oldDesk = tDesk;
      client.oldScr = tScr;

      // If the client is thrown to an ignored screen, reset it
      if (ignoredScreens.indexOf(tScr) > -1) {
        resetClient(client);
      }

      fitClient(client, tDesk, tScr, "throw");
      fitClients(act, fDesk, fScr, "throw");
      tileClients(fDesk);
      tileClients(tDesk);
    } else {
      removeClient(client, false, fDesk, fScr);
      resetClient(client, "center", tScr);
    }
  } else {
    if (ignoredScreens.indexOf(tScr) > -1 || tiles[act][tDesk][tScr].blocked || 
        tiles[act][tDesk][tScr].length >= tiles[act][tDesk][tScr].max) {
      resetClient(client, "center", tScr);
    } else {
      addClient(client, false, tDesk, tScr);
    }
  }
  print("END: throwClient(" + client + ", " + fDesk + ", " +
        fScr + ", " + tDesk + ", " + tScr + ")");
}

// Scr must be carried as a parameter because x < 0 means client.screen changes
function resizeClient(client, scr, x, y) {
  var act = client.act;
  var desk = client.desktop;
  var area = screenGeo(scr);
  var i = findClientIndex(client, desk, scr);

  // Stop clients from getting too large
  area.width -= margins[1] + margins[3] + gap * 2 + area.width * 0.1;
  area.height -= margins[0] + margins[2] + gap * 2 + area.height * 0.1;
  if (tiles[act][desk][scr].layout[i].width + x > area.width) { 
    x = area.width - tiles[act][desk][scr].layout[i].width; 
  }
  if (tiles[act][desk][scr].layout[i].height + y > area.height) { 
    y = area.height - tiles[act][desk][scr].layout[i].height; 
  }

  switch (i) {
    case 0:
      tiles[act][desk][scr].layout[0].width += x;
      tiles[act][desk][scr].layout[1].x += x;
      tiles[act][desk][scr].layout[1].width -= x;
      tiles[act][desk][scr].layout[2].x += x;
      tiles[act][desk][scr].layout[2].width -= x;
      tiles[act][desk][scr].layout[3].width += x;
      tiles[act][desk][scr].layout[0].height += y;
      tiles[act][desk][scr].layout[3].y += y;
      tiles[act][desk][scr].layout[3].height -= y;
      break;
    case 1:
      tiles[act][desk][scr].layout[0].width -= x;
      tiles[act][desk][scr].layout[1].x -= x;
      tiles[act][desk][scr].layout[1].width += x;
      tiles[act][desk][scr].layout[2].x -= x;
      tiles[act][desk][scr].layout[2].width += x;
      tiles[act][desk][scr].layout[3].width -= x;
      tiles[act][desk][scr].layout[1].height += y;
      tiles[act][desk][scr].layout[2].y += y;
      tiles[act][desk][scr].layout[2].height -= y;
      break;
    case 2:
      tiles[act][desk][scr].layout[0].width -= x;
      tiles[act][desk][scr].layout[1].x -= x;
      tiles[act][desk][scr].layout[1].width += x;
      tiles[act][desk][scr].layout[2].x -= x;
      tiles[act][desk][scr].layout[2].width += x;
      tiles[act][desk][scr].layout[3].width -= x;
      tiles[act][desk][scr].layout[1].height -= y;
      tiles[act][desk][scr].layout[2].y -= y;
      tiles[act][desk][scr].layout[2].height += y;
      break;
    case 3:
      tiles[act][desk][scr].layout[0].width += x;
      tiles[act][desk][scr].layout[1].x += x;
      tiles[act][desk][scr].layout[1].width -= x;
      tiles[act][desk][scr].layout[2].x += x;
      tiles[act][desk][scr].layout[2].width -= x;
      tiles[act][desk][scr].layout[3].width += x;
      tiles[act][desk][scr].layout[0].height -= y;
      tiles[act][desk][scr].layout[3].y -= y;
      tiles[act][desk][scr].layout[3].height += y;
      break;
  }
}

// Resets client's position and size
function resetClient(client, pos, scr) {
  if (client.fullScreen) { return; }
  if (typeof scr === "undefined") { scr = client.screen; }
  var tile = screenGeo(scr);
  var rect = client.geometry;

  // Don't reset the size of fixed clients
  if (client.fixed !== true) {
    rect.width = newTile(scr).width - gap * 1.5;
    rect.height = newTile(scr).height - gap * 1.5;
  }

  // Coordinates depend on the "center" rule
  if (pos === "center") {
    rect.x = tile.x + tile.width * 0.5 - rect.width * 0.5;
    rect.y = tile.y + tile.height * 0.5 - rect.height * 0.5;
  } else if (pos === "random") {
    rect.x = Math.floor((Math.random() * (tile.width - rect.width)) + tile.x);
    rect.y = Math.floor((Math.random() * (tile.height - rect.height)) + tile.y);
  } else if (pos) {
    rect.x = tile.x + pos * (tile.width * 0.1);
    rect.y = tile.y + pos * (tile.height * 0.1);
  }

  client.geometry = rect;
}

function minimizeClient(client) {
  if (client.fullScreen || isMaxed(client)) {
    tiles[client.act][client.desktop][client.screen].blocked = false;
  }
  reserveClient(client, client.desktop, client.screen);
}

function unminimizeClient(client) {
  if (client.fullScreen || isMaxed(client)) {
    tiles[client.act][client.desktop][client.screen].blocked = true;
  }
  unreserveClient(client);
}

function maximizeClient(client, h, v) {
  if (h && v) {
    ws.activeClient = client; // Obvious, yet KWin doesn't do this automatically
    tiles[client.act][client.desktop][client.screen].blocked = true;
    reserveClient(client, client.desktop, client.screen);
  } else {
    tiles[client.act][client.oldDesk][client.oldScr].blocked = false;
    unreserveClient(client);
  }
}

function fullScreenClient(client, full, user) {
  if (full) {
    tiles[client.act][client.desktop][client.screen].blocked = true;
    reserveClient(client, client.desktop, client.screen);
  } else {
    tiles[client.act][client.desktop][client.screen].blocked = false;
    unreserveClient(client);
  }
}


// -----------------
// Client Properties
// -----------------

function startMove(client) {
  ws.activeClient = client; // This should be the default
  if (curAct() !== client.act) {
    removeClient(client, false, client.desktop, client.screen);
  } else if (isMaxed(client) && client.fullScreen !== true) { 
    maximizeClient(client); // Clients can be unmaxed by moving
  }
  client.oldGeo = client.geometry;
  client.oldScr = client.screen;
}

// Ignore-check to see if the client is valid for the script
function checkClient(client) {
  print("START: checkClient(" + client + ")");
  /* Dialogs tend to break tiling momentarily,
     but calling tileClients() after solves the issue */
  if (client.dialog) {
    // If cAct is a string, the script has been initialized
    if (typeof cAct === "string") {
      tileClients();
    }
    print("END: checkClient(" + client + ")" + "RETURN: false");
    return false;
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
      ignoredClients.indexOf(client.resourceName.toString()) > -1 ||
      ignoredActivities.indexOf(curAct()) > -1 ||
      ignoredDesktops.indexOf(client.desktop) > -1) {
    print("END: checkClient(" + client + ")" + "RETURN: false");
    return false;
  } else {
    for (var i = 0; i < ignoredCaptions.length; i++) {
      // captions are very specific, thus a substring match is enough (#25)
      var caption = client.caption.toString();
      if (caption.indexOf(ignoredCaptions[i]) > -1 && client.included !== true) {
        /* don't re-check already included clients in order to avoid ignoring clients such as Firefox
           when a website including a substring of an ignored caption is browsed */
    print("END: checkClient(" + client + ")" + "RETURN: false");
        return false;
      }
    }
    print("END: checkClient(" + client + ")" + "RETURN: true");
    return true;
  }
}

function isMaxed(client) {
  var area = ws.clientArea(0, client.screen, 0);
  if (client.geometry.height >= area.height && client.geometry.width >= area.width) {
    return true;
  } else {
    return false;
  }
}

// Compare two clients without unnecessary type conversion (see issue #1)
function sameClient(client1, client2) {
  if (client1.frameId === client2.frameId) {
    return true;
  } else {
    return false;
  }
}

// Finds tiles[desktop][ws.activeScreen] index of a client
function findClientIndex(client, desk, scr) {
  print("START: findClientIndex(" + client + ", " + desk + ", " + scr + ")");
  var act = client.act;
  for (var i = 0; i < tiles[act][desk][scr].length; i++) {
    if (sameClient(tiles[act][desk][scr][i], client)) {
      print("END: findClientIndex(" + client + ", " + desk + ", " + scr + ")");
      return i;
    }
  }
  print("FAIL: findClientIndex(" + client + ", " + desk + ", " + scr + ")");
  return false;
}

// Returns the vertical opposite index
function oppositeClient(client, scr) {
  var act = client.act;
  var desk = client.desktop;
  if (typeof scr === "undefined") { scr = client.screen; }
  var index = findClientIndex(client, client.desktop, scr);
  var length = tiles[act][desk][scr].length;

  switch (index) {
    case 0:
      if (length === 4) { return [tiles[act][desk][scr][3], 3]; }
      else { return false; }
      break;
    case 1:
      if (length >= 3) { return [tiles[act][desk][scr][2], 2]; }
      else { return false; }
      break;
    case 2:
      if (length >= 2) { return [tiles[act][desk][scr][1], 1]; }
      else { return false; }
      break;
    case 3:
      return [tiles[act][desk][scr][0], 0];
  }
}

// Returns the horizontal opposite index
function neighbourClient(client, scr) {
  var act = client.act;
  var desk = client.desktop;
  if (typeof scr === "undefined") { scr = client.screen; }
  var index = findClientIndex(client, client.desktop, scr);
  var length = tiles[act][desk][scr].length;

  switch (index) {
    case 0:
      if (length >= 2) { return [tiles[act][desk][scr][1], 1]; }
      else { return false; }
      break;
    case 1:
      return [tiles[act][desk][scr][0], 0];
    case 2:
      if (length === 4) { return [tiles[act][desk][scr][3], 3]; }
      else { return [tiles[act][desk][scr][0], 0]; }
      break;
    case 3:
      if (length >= 3) { return [tiles[act][desk][scr][2], 2]; }
      else { return false; }
  }
}


// ------------------------
// Action, Desktop & Screen
// ------------------------

function createActivity(act) {
  print("START: createActivity(" + act + ")");
  tiles[act.toString()] = [];
  for (var i = 1; i <= ws.desktops; i++) {
    createDesktop(act.toString(), i);
  }
  print("END: createActivity(" + act + ")");
}

function curAct() {
    return ws.currentActivity.toString();
}

// Detects whether a desktop is added or removed
function adjustDesktops(desktop) {
  if (ws.desktops < desktop) {
    // Desktop added
    tileClients();
  } else if (ws.desktops > desktop) {
    // Desktop removed
    for (var i = 0; i < ws.activities.length; i++) {
      if (ignoredActivities.indexOf(ws.activities[i].toString()) === -1) {
        createDesktop(ws.activities[i].toString(), ws.desktops);
      }
    }
    tileClients();
  }
}

// Creates a new desktops
function createDesktop(act, desk) {
  print("START: createDesktop(" + act + ", " + desk + ")");
  tiles[act][desk] = [];
  for (var i = 0; i < ws.numScreens; i++) {
    tiles[act][desk][i] = [];
    if (ignoredScreens.indexOf(i) > -1) {
      // TODO: Ignored screens to work like desktops and activities
      tiles[act][desk][i].max = Number.MAX_VALUE;
    } else {
      tiles[act][desk][i].max = 4;
    }
    tiles[act][desk][i].layout = newLayout(i);
  }
  print("END: createDesktop(" + act + ", " + desk + ")");
}

// Finds a desktop and a screen with space left for a new client
function findSpace() {
  print("START: findSpace()");
  var act = cAct;
  var desk = ws.currentDesktop; 

  // Tries the current desktop first
  for (var k = 0; k < ws.numScreens; k++) {
    if (ignoredScreens.indexOf(k) === -1) {
      if (tiles[act][desk][k].length < tiles[act][desk][k].max &&
          tiles[act][desk][k].blocked !== true) {
        print("END: findSpace() RETURN: " + desk + ", " + k);
        return [desk, k];
      }
    }
  }

  // Tries the other desktops after
  for (var i = 1; i <= ws.desktops; i++) {
    if (i !== ws.currentDesktop) {
      for (var j = 0; j < ws.numScreens; j++) {
        if (ignoredScreens.indexOf(j) === -1) {
          if (tiles[act][i][j].length < tiles[act][i][j].max && 
              tiles[act][i][j].blocked !== true) {
            print("END: findSpace() RETURN: " + i + ", " + j);
            return [i, j];
          }
        }
      }
    }
  }

  print("FAILED: findSpace() RETURN: false");
  return false;
}

// Find the desktop with the most clients open
function findBusy() {
  print("START: findBusy()");
  var busyDesk = 1;
  var busyTotal = 0;

  for (var i = 1; i <= ws.desktops; i++) {
    var curTotal = 0;
    for (var j = 0; j < ws.numScreens; j++) {
      curTotal += tiles[cAct][i][j].length;
    }
    if (curTotal > busyTotal) {
      busyDesk = i;
      busyTotal = curTotal;
    }
  }

  print("END: findBusy() RETURN: " + busyDesk);
  return busyDesk;
}

// Returns the geometry of the screen's default tile
function newTile(scr) {
  var area = ws.clientArea(0, scr, 0);
  area.x += margins[1];
  area.y += margins[0];
  area.width -= margins[1] + margins[3];
  area.height -= margins[0] + margins[2];
  area.width *= 0.5;
  area.height *= 0.5;
  return area;
}

function newLayout(scr) {
  var area = ws.clientArea(0, scr, 0);
  area.x += margins[1];
  area.y += margins[0];
  area.width -= margins[1] + margins[3];
  area.height -= margins[0] + margins[2];
  var layout = [];
  for (var i = 0; i < 4; i++) {
    layout[i] = {}; // Note: Need to clone the properties!
    layout[i].x = area.x;
    layout[i].y = area.y;
    layout[i].width = area.width;
    layout[i].height = area.height;
    // TODO: Horizontal layout
    // Layouts = "Objects"
    // Layout.newLayout(), Layout.tileClients(), Layout.resizeClients() etc.
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

// Returns the screen geometry, with or without gaps
function screenGeo(scr, gaps) {
  var area = ws.clientArea(0, scr, 0);
  if (gaps) {
    area.x += gap + margins[1];
    area.y += gap + margins[0];
    area.width -= gap * 2 + margins[1] + margins[3];
    area.height -= gap * 2 + margins[0] + margins[2];
  }
  return area;
}

function screenWidth(scr) {
  var area = ws.clientArea(0, scr, 0);
  return area.width;
}

function screenHeight(scr) {
  var area = ws.clientArea(0, scr, 0);
  return area.height;
}


// ----
// Init
// ----

if (instantInit()) {
  print("instantInit()");
  init();
} else {
  ws.clientAdded.connect(wait);
}

function instantInit() {
  var clients = ws.clientList();
  for (var i = 0; i < clients.length; i++) {
    if (checkClient(clients[i])) {
      return true;
    }
  }
  return false;
}

/* Hack: Waits for client connections, then attempts to initiate the script:
   if client is valid for the script, the script is initiated
   TODO: Find a better and more reliable way to start the script */
function wait(client) {
  if (opt.useCompositing) {
    client.windowShown.connect(check);
  } else {
    ws.clientAdded.disconnect(wait);
    ws.clientActivated.connect(check);
  }
}

function check(client) {
  if (opt.useCompositing) {
    if (checkClient(client)) {
      ws.clientAdded.disconnect(wait);
      client.windowShown.disconnect(check);
      init();
      print("init() CAUSED BY: " + client.caption);
    } else client.windowShown.disconnect(check);
  } else {
    if (client != null) {
      if (checkClient(client)) {
        ws.clientActivated.disconnect(check);
        init();
        print("init() CAUSED BY: " + client.caption);
      }
    }
  }
}
