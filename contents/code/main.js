// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

var ws = workspace;
var opt = options;

var tiles = [];

var started = false;

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
ignoredClients = ignoredClients.concat(readConfig("ignoredClients", "wine, steam, kate").toString().split(', '));

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
fixedClients = fixedClients.concat(readConfig("fixedClients", "telegram, telegram-desktop, telegramdesktop").toString().split(', '));

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

var ignoredActivities = [];
function readIgnoredActs() {
  // Activities that will be ignored by the script
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

// Negative gaps are not allowed because of isMaxed()
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
  margins[2] = 1;
}

var centerTo = readConfig("centerTo", 0); // 0 == Screen, 1 == Tile

var autoSize = readConfig("autoSize", 1); // 0 == True, 1 == False

// Starts the script
function init() {
  started = true;
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
          scrs[l] = 1;
        }
        for (var j = 0; j < clients.length; j++) {
          client = clients[j];
          if (client.desktop == desk && client.included && client != ws.activeClient) {
            removeClient(client, false, client.desktop, client.screen);
            resetClient(client, scrs[client.screen]);
            scrs[client.screen] += 1;
          }
        }
        client = ws.activeClient;
        if (client.desktop == desk && client.included) {
          removeClient(client, false, client.desktop, client.screen);
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
      if (client.included && ignoredScreens.indexOf(client.screen) === -1) {
        var i = findClientIndex(client, ws.currentDesktop, ws.activeScreen);
        if (i === 2) {
          swapClients(i, 1, ws.activeScreen, ws.activeScreen);
        } else if (i === 3) {
          swapClients(i, 0, ws.activeScreen, ws.activeScreen);
        } else {
          return;
        }
        tileClients();
      } else {
        var tile = screenGeo(ws.activeScreen);
        var rect = client.geometry;
        rect.x = tile.x + gap + margins[1];
        rect.y = tile.y + gap + margins[0];
        rect.width = tile.width - gap * 2 - margins[1] - margins[3];
        rect.height = tile.height * 0.5 - gap - margins[0];
        if (client.geometry.x == rect.x && client.geometry.y == rect.y && client.geometry.width == rect.width && client.geometry.height == rect.height) {
          rect = tile;
          rect.x += gap + margins[1];
          rect.y += gap + margins[0];
          rect.width -= gap * 2 + margins[1] + margins[3];
          rect.height -= gap * 2 + margins[0] + margins[2];
          client.geometry = rect;
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
      if (client.included && ignoredScreens.indexOf(client.screen) === -1) {
        var i = findClientIndex(client, ws.currentDesktop, ws.activeScreen);
        if (i === 0 && tiles[curAct()][ws.currentDesktop][ws.activeScreen].length === 4) {
          swapClients(i, 3, ws.activeScreen, ws.activeScreen);
        } else if (i === 1 && tiles[curAct()][ws.currentDesktop][ws.activeScreen].length >= 3) {
          swapClients(i, 2, ws.activeScreen, ws.activeScreen);
        } else {
          return;
        }
        tileClients();
      } else {
        var tile = screenGeo(ws.activeScreen);
        var rect = client.geometry;
        rect.x = tile.x + gap + margins[1];
        rect.y = tile.y + gap + margins[0];
        rect.width = tile.width - gap * 2 - margins[1] - margins[3];
        rect.height = tile.height * 0.5 - gap - margins[2];
        rect.y += rect.height;
        if (client.geometry.x == rect.x && client.geometry.y == rect.y && client.geometry.width == rect.width && client.geometry.height == rect.height) {
          rect = tile;
          rect.x += gap + margins[1];
          rect.y += gap + margins[0];
          rect.width -= gap * 2 + margins[1] + margins[3];
          rect.height -= gap * 2 + margins[0] + margins[2];
          client.geometry = rect;
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
      if (client.included && ignoredScreens.indexOf(client.screen) === -1) {
        var i = findClientIndex(client, ws.currentDesktop, ws.activeScreen);
        if (i === 1) {
          swapClients(i, 0, ws.activeScreen, ws.activeScreen);
        } else if (i === 2 && tiles[curAct()][ws.currentDesktop][ws.activeScreen].length === 4) {
          swapClients(i, 3, ws.activeScreen, ws.activeScreen);
        } else if (i === 2) {
          swapClients(i, 0, ws.activeScreen, ws.activeScreen);
        } else {
          return;
        }
        tileClients();
      } else {
        var tile = screenGeo(ws.activeScreen);
        var rect = client.geometry;
        rect.x = tile.x + gap + margins[1];
        rect.y = tile.y + gap + margins[0];
        rect.width = tile.width * 0.5 - gap - margins[1];
        rect.height = tile.height - gap * 2 - margins[0] - margins[2];
        if (client.geometry.x == rect.x && client.geometry.y == rect.y && client.geometry.width == rect.width && client.geometry.height == rect.height) {
          rect = tile;
          rect.x += gap + margins[1];
          rect.y += gap + margins[0];
          rect.width -= gap * 2 + margins[1] + margins[3];
          rect.height -= gap * 2 + margins[0] + margins[2];
          client.geometry = rect;
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
      if (client.included && ignoredScreens.indexOf(client.screen) === -1) {
        var i = findClientIndex(client, ws.currentDesktop, ws.activeScreen);
        if (i === 0 && tiles[curAct()][ws.currentDesktop][ws.activeScreen].length > 1) {
          swapClients(i, 1, ws.activeScreen, ws.activeScreen);
        } else if (i === 3) {
          swapClients(i, 2, ws.activeScreen, ws.activeScreen);
        } else {
          return;
        }
        tileClients();
      } else {
        var tile = screenGeo(ws.activeScreen);
        var rect = client.geometry;
        rect.x = tile.x + gap + margins[1];
        rect.y = tile.y + gap + margins[0];
        rect.width = tile.width * 0.5 - gap - margins[3];
        rect.height = tile.height - gap * 2 - margins[0] - margins[2];
        rect.x += rect.width;
        if (client.geometry.x == rect.x && client.geometry.y == rect.y && client.geometry.width == rect.width && client.geometry.height == rect.height) {
          rect = tile;
          rect.x += gap + margins[1];
          rect.y += gap + margins[0];
          rect.width -= gap * 2 + margins[1] + margins[3];
          rect.height -= gap * 2 + margins[0] + margins[2];
          client.geometry = rect;
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
      // TODO: Fix for fixed clients
      var client = ws.activeClient;
      if (client.fixed) {
        return;
      }
      var desk = client.desktop;
      var scr = client.screen;
      var act = curAct(client);
      var x = Math.round(screenWidth(scr) * 0.01);
      var y = Math.round(screenHeight(scr) * 0.01);
      if (client.included && ignoredScreens.indexOf(scr) === -1) {
        adjustClientSize(client, scr, x, y);
        tileClients();
        // Block resizing if a window is getting too small
        for (var i = 0; i < tiles[act][desk][scr].layout.length; i++) {
          if (tiles[act][desk][scr].layout[i].width < 100 || tiles[act][desk][scr].layout[i].height < 100) {
            adjustClientSize(client, scr, -x, -y);
          }
        }
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
      // TODO: Fix for fixed clients
      var client = ws.activeClient;
      if (client.fixed) {
        return;
      }
      var desk = client.desktop;
      var scr = client.screen;
      var act = curAct(client);
      var x = Math.round(screenWidth(scr) * 0.01);
      var y = Math.round(screenHeight(scr) * 0.01);
      if (client.included && ignoredScreens.indexOf(scr) === -1) {
        adjustClientSize(client, scr, -x, -y);
        tileClients();
        // Block resizing if a window is getting too small
        for (var i = 0; i < tiles[act][desk][scr].layout.length; i++) {
          if (tiles[act][desk][scr].layout[i].width < 100 || tiles[act][desk][scr].layout[i].height < 100) {
            adjustClientSize(client, scr, x, y);
          }
        }
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
      tiles[curAct()][ws.currentDesktop][ws.activeScreen].layout = newLayout(ws.activeScreen);
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
        gap = 1;
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
    if (ignoredActivities.indexOf(act) === -1) {
      tileClients();
    }
  });
}


// -------------------
// Client Manipulation
// -------------------

// Runs an ignore-check and if it passes, adds a client to tiles[]
function addClient(client, follow, desk, scr) {
  if (checkClient(client)) {
    print("attempting to add " + client.caption);
    var act = curAct(client);
    // If tiles.length exceeds the maximum amount, moves to another screen or another desktop
    if (tiles[act][desk][scr].length === tiles[act][desk][scr].max || tiles[act][desk][scr].length === 4 ||  tiles[act][desk][scr].blocked) {
      if (tiles[act][desk][scr].length === 4) {
        tiles[act][desk][scr].max = 4;
      } // Fixes a bug that makes the maximum go over 4 when removing virtual desktops
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
    connectClient(client, desk, scr); // Connect client before checking its attributes
    tiles[act][desk][scr].push(client); // Normally, just push the client to the end of the array
    print(client.caption + " added on desktop " + desk + " screen " + scr); // Client is already added here, just space optimization and/or maximization/minimization left
    if (client.minimized) {
      reserveClient(client, desk, scr);
    } else if (client.fullScreen || isMaxed(client)) {
      tiles[act][desk][scr].blocked = true;
      client.geometry = screenGeo(scr); // Moves the client to the next screen before tileClients() (otherwise a maximized window would get tiled)
      reserveClient(client, desk, scr);
    } else {
      if (client.fixed !== true) { resetClient(client, "center", scr); }
      fitClient(client, desk, scr, "add");
      tileClients();
    }
  }
}

// Adds all the clients that existed before the script was executed
function addClients() {
  var clients = ws.clientList();
  for (var i = 0; i < clients.length; i++) {
    addClient(clients[i], false, clients[i].desktop, clients[i].screen);
  }
}

// Connects the signals of the new KWin:Client to the following functions
function connectClient(client, desk, scr) {
  client.clientStartUserMovedResized.connect(saveClientGeo);
  client.clientFinishUserMovedResized.connect(adjustClient);
  client.activeChanged.connect(tileClients);
  client.activitiesChanged.connect(removeClient);
  client.desktopChanged.connect(function() {
    if (ignoredDesktops.indexOf(client.desktop) > -1) {
      removeClient(client, false, client.oldDesk, client.oldScr);
    } else {
      if (client.included !== true) {
        addClient(client, true, client.desktop, client.screen);
      }
    }
  });
  if (fixedClients.indexOf(client.resourceClass.toString()) > -1 || fixedClients.indexOf(client.resourceClass.toString()) > -1) {
    client.fixed = true;
  }
  client.included = true;
  client.reserved = false;
  client.oldIndex = -1;
  client.oldAct = curAct(client);
  client.oldDesk = desk;
  client.oldScr = scr;
}

// Removes the closed client from tiles[]
function removeClient(client, follow, desk, scr) {
  print("attempting to remove " + client.caption);
  if (client.included) {

    try { resetClient(client, "center"); } catch(err) { print(err); }
    if (typeof follow === "undefined") { follow = false; }
    if (typeof desk === "undefined") { desk = client.oldDesk; }
    if (typeof scr === "undefined") { scr = client.oldScr; }
    var act = client.oldAct;
    if (client.reserved) {
      tiles[act][desk][scr].max += 1;
      if (client.minimized !== true) {
        tiles[act][desk][scr].blocked = false;
      }
    } else {
      var i = findClientIndex(client, desk, scr);
      tiles[act][desk][scr].splice(i, 1);
    }
    disconnectClient(client);
    print(client.caption + " removed");
    if (tiles[act][desk][scr].length === 0 && follow) {
      ws.currentDesktop = findBusy(); // If follow = true, change the desktop if the removed client was the last one
    }
    fitClients(desk, scr, "remove");
    tileClients();
  } else {
    print(client.caption + " not included");
  }
}

// Disconnects the signals from removed clients
// So they will not trigger when a manually floated client is interacted with
// Or when a client is removed & added between desktops
function disconnectClient(client) {
  client.included = false;
  client.clientStartUserMovedResized.disconnect(saveClientGeo);
  client.clientFinishUserMovedResized.disconnect(adjustClient);
  client.activitiesChanged.disconnect(removeClient);
}

// Closes the client, triggering the removal signal
function closeWindow(client) {
  client.closeWindow();
}

// "Removes" a client, reserving a spot for it by decreasing the maximum amount of clients on its desktop
function reserveClient(client, desk, scr) {
  print("attempting to reserve " + client.caption);
  if (client.included && client.reserved === false && ignoredScreens.indexOf(scr) === -1) {
    var i = findClientIndex(client, desk, scr);
    tiles[curAct(client)][desk][scr].max -= 1;
    tiles[curAct(client)][desk][scr].splice(i, 1);
    client.oldIndex = i;
    client.oldDesk = desk;
    client.oldScr = scr;
    client.reserved = true;
    tileClients();
  }
  print("succesfully reserved " + client.caption);
}

// "Adds" a client back to the desktop on its reserved tile
function unreserveClient(client) {
  print("attempting to unreserve " + client.caption);
  if (client.included && client.reserved && ignoredScreens.indexOf(client.screen) === -1) {
    var act = curAct(client);
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
  print("succesfully unreserved " + client.caption);
}


// Finds out which clients of a desktop should be fit
function fitClients(desk, scr, action) {
  var act = curAct();
  if (tiles[act][desk][scr].length < 2) { return; }
  fitClient(tiles[act][desk][scr][0], desk, scr, action);
  fitClient(tiles[act][desk][scr][1], desk, scr, action);
}

// Adjusts the layout according to the size of a client
function fitClient(client, desk, scr, action) {
  // Only fits the vertical size, if a horizontal layout is ever implemented, it needs to be fit instead
  if (autoSize == 1) { return; }

  // If opposite client is fixed and this one is not, fits it instead in order to shrink it
  var opposite = oppositeClient(client, scr);
  var neighbour = neighbourClient(client, scr);

  var act = curAct();
  var tile = tiles[act][desk][scr].layout[findClientIndex(client, desk, scr)];

  var x = 0;
  if (action === "move" || action === "throw" || action === "add" || action === "remove") {   
    x = client.geometry.width + gap * 1.5 - tile.width;
    if (client.fixed && neighbour && neighbour[0].fixed) {
      x = 0.5 * (x - (neighbour[0].geometry.width + gap * 1.5 - tiles[act][desk][scr].layout[neighbour[1]].width)); // If client and opposite fixed, center the tiles
    } else if (opposite && opposite[0].geometry.width > client.geometry.width) {
      if (client.fixed) {
        x = opposite[0].geometry.width + gap * 1.5 - tiles[act][desk][scr].layout[neighbour[1]].width; // Perceive the width of the wider tile
      }
    }
    if (x > newTile(scr).width - tile.width) { 
      x = newTile(scr).width - tile.width; // Stops a tile from getting too large
    }
  }

  var y = client.geometry.height + gap * 1.5 - tile.height;
  if (client.fixed !== true && opposite && opposite[0].fixed) {
    y = -1 * (opposite[0].geometry.height + gap * 1.5 - tiles[act][desk][scr].layout[opposite[1]].height); // If opposite client is fixed, fit to its height instead
  } else if (client.fixed && opposite && opposite[0].fixed) {
    y = 0.5 * (y - (opposite[0].geometry.height + gap * 1.5 - tiles[act][desk][scr].layout[opposite[1]].height)); // If client and opposite fixed, center the tiles
  } else if (action !== "resize" && client.fixed !== true) {
    y = newTile(scr).height - tile.height; // Stops a tile from getting too large
  }

  adjustClientSize(client, scr, x, y);
  lineHorizontally(desk, scr);
}

function lineHorizontally(desk, scr) {
  var act = curAct();
  var ts = tiles[act][desk][scr];
  var left;
  var right;

  // Find the widest clients on the left and the right side of the layout
  for (var i = 0; i < ts.length; i++) {
    if (i === 0) {
      left = [ts[i], i];
    } else if (i === 1) {
      right = [ts[i], i];
    } else if (i === 2 && ts[i].geometry.width > right[0].geometry.width) {
      right = [ts[i], i];
    } else if (i === 3 && ts[i].geometry.width > left[0].geometry.width) {
      left = [ts[i], i];
    }
  }

  // Adjusts the axis
  var x;
  if (left && right && left[0].fixed && right[0].fixed) {
    return;
  } else if (left && left[0].fixed) {
    x = left[0].geometry.width + gap * 1.5 - tiles[act][desk][scr].layout[left[1]].width;
    adjustClientSize(left[0], scr, x, 0);
  } else if (right && right[0].fixed) {
    x = right[0].geometry.width + gap * 1.5 - tiles[act][desk][scr].layout[right[1]].width;
    adjustClientSize(right[0], scr, x, 0);
  }
}

// Calculates the geometries to maintain the layout
// Geometry calculation is a mess and pre-existing client geometries should NEVER be used
// Layout is always the fullscreen - no plasma and no gaps layout
// Plasma is impossible to calculate on init() so it has to be calculated repeatedly
function tileClients(desk) {
  // Let's just pretend this doesn't exist, okay?
  // Calculating the gaps and plasma each time something moves is the best and least buggy approach
  // Believe me, I've tried EVERYTHING
  // Since it's just four, switch is also the easiest approach
  // TODO: Clean this up, big time
  var act = curAct();
  if (typeof tiles[act] === "undefined") { return; } // Don't tile ignored activities
  if (typeof desk === "undefined") { desk = ws.currentDesktop; }
  for (var i = 0; i < ws.numScreens; i++) {
    if (ignoredScreens.indexOf(i) > -1) {
      // Don't tile ignored screens
    } else if (typeof tiles[act][desk][i] !== "undefined") {
      print("attempting to tile desktop " + desk + " screen " + i);
      var adjusted = [];
      if (tiles[act][desk][i].length === 1) {
        adjusted[0] = {};
        adjusted[0].x = tiles[act][desk][i].layout[0].x + gap;
        adjusted[0].y = tiles[act][desk][i].layout[0].y + gap;
        adjusted[0].width = tiles[act][desk][i].layout[0].width + tiles[act][desk][i].layout[1].width - gap * 2;
        adjusted[0].height = tiles[act][desk][i].layout[0].height + tiles[act][desk][i].layout[3].height - gap * 2;
      } else if (tiles[act][desk][i].length === 2) {
        adjusted[0] = {};
        adjusted[0].x = tiles[act][desk][i].layout[0].x + gap;
        adjusted[0].y = tiles[act][desk][i].layout[0].y + gap;
        adjusted[0].width = tiles[act][desk][i].layout[0].width - gap * 1.5;
        adjusted[0].height = tiles[act][desk][i].layout[0].height + tiles[act][desk][i].layout[3].height - gap * 2;

        adjusted[1] = {};
        adjusted[1].x = tiles[act][desk][i].layout[1].x + gap * 0.5;
        adjusted[1].y = tiles[act][desk][i].layout[1].y + gap;
        adjusted[1].width = tiles[act][desk][i].layout[1].width - gap * 1.5;
        adjusted[1].height = tiles[act][desk][i].layout[1].height + tiles[act][desk][i].layout[2].height - gap * 2;
      } else if (tiles[act][desk][i].length === 3) {
        adjusted[0] = {};
        adjusted[0].x = tiles[act][desk][i].layout[0].x + gap;
        adjusted[0].y = tiles[act][desk][i].layout[0].y + gap;
        adjusted[0].width = tiles[act][desk][i].layout[0].width - gap * 1.5;
        adjusted[0].height = tiles[act][desk][i].layout[0].height + tiles[act][desk][i].layout[3].height - gap * 2;

        adjusted[1] = {};
        adjusted[1].x = tiles[act][desk][i].layout[1].x + gap * 0.5;
        adjusted[1].y = tiles[act][desk][i].layout[1].y + gap;
        adjusted[1].width = tiles[act][desk][i].layout[1].width - gap * 1.5;
        adjusted[1].height = tiles[act][desk][i].layout[1].height - gap * 1.5;

        adjusted[2] = {};
        adjusted[2].x = tiles[act][desk][i].layout[2].x + gap * 0.5;
        adjusted[2].y = tiles[act][desk][i].layout[2].y + gap * 0.5;
        adjusted[2].width = tiles[act][desk][i].layout[2].width - gap * 1.5;
        adjusted[2].height = tiles[act][desk][i].layout[2].height - gap * 1.5;
      } else if (tiles[act][desk][i].length === 4) {
        adjusted[0] = {};
        adjusted[0].x = tiles[act][desk][i].layout[0].x + gap;
        adjusted[0].y = tiles[act][desk][i].layout[0].y + gap;
        adjusted[0].width = tiles[act][desk][i].layout[0].width - gap * 1.5;
        adjusted[0].height = tiles[act][desk][i].layout[0].height - gap * 1.5;

        adjusted[1] = {};
        adjusted[1].x = tiles[act][desk][i].layout[1].x + gap * 0.5;
        adjusted[1].y = tiles[act][desk][i].layout[1].y + gap;
        adjusted[1].width = tiles[act][desk][i].layout[1].width - gap * 1.5;
        adjusted[1].height = tiles[act][desk][i].layout[1].height - gap * 1.5;

        adjusted[2] = {};
        adjusted[2].x = tiles[act][desk][i].layout[2].x + gap * 0.5;
        adjusted[2].y = tiles[act][desk][i].layout[2].y + gap * 0.5;
        adjusted[2].width = tiles[act][desk][i].layout[2].width - gap * 1.5;
        adjusted[2].height = tiles[act][desk][i].layout[2].height - gap * 1.5;

        adjusted[3] = {};
        adjusted[3].x = tiles[act][desk][i].layout[3].x + gap;
        adjusted[3].y = tiles[act][desk][i].layout[3].y + gap * 0.5;
        adjusted[3].width = tiles[act][desk][i].layout[3].width - gap * 1.5;
        adjusted[3].height = tiles[act][desk][i].layout[3].height - gap * 1.5;
      }
      for (var j = 0; j < adjusted.length; j++) {
        if (tiles[act][desk][i][j].fixed) {
          var rect = tiles[act][desk][i][j].geometry;
          // Tiles the "free clients" to the edge of the tile
          // The code looks ugly but works wonders
          if (centerTo == 1) {
            rect.x = adjusted[j].x + adjusted[j].width * 0.5 - rect.width * 0.5;
            rect.y = adjusted[j].y + adjusted[j].height * 0.5 - rect.height * 0.5;
          } else {
            switch (j) {
              case 0:
                if (adjusted.length === 1) {
                  rect.x = adjusted[j].x + adjusted[j].width * 0.5 - rect.width * 0.5;
                  rect.y = adjusted[j].y + adjusted[j].height * 0.5 - rect.height * 0.5;
                } else if (adjusted.length == 2 || adjusted.length == 3) {
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
                } else {
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
          }
          if (rect.width > adjusted[j].width) {
            rect.x = adjusted[j].x;
            rect.width = adjusted[j].width;
          }
          if (rect.height > adjusted[j].height) {
            rect.y = adjusted[j].y;
            rect.height = adjusted[j].height;
          }
          tiles[act][desk][i][j].geometry = rect;
        } else {
          tiles[act][desk][i][j].geometry = adjusted[j];
        }
      }
      print("desktop " + desk + " screen " + i + " tiled");
    }
  }
}

// Decides if a client is moved or resized
function adjustClient(client) {
  if (ignoredScreens.indexOf(client.screen) > -1) {
    // If oldScr === client.screen, nothing needs to be done as both are ignored
    if (oldScr !== client.screen) {
      // However, if oldScr !== client.screen, client needs to be removed from the old screen and moved to the new one
      if (tiles[curAct()][ws.currentDesktop][client.screen].length < tiles[curAct()][ws.currentDesktop][client.screen].max && tiles[curAct()][ws.currentDesktop][client.screen].blocked !== true ) {
        print("attempting to push " + client.caption + " to screen" + client.screen);
        throwClient(client, client.desktop, oldScr, client.desktop, client.screen);
        print("pushed client " + client.caption + " to screen" + client.screen);
        return;
      }
    }
  } else if (ignoredScreens.indexOf(oldScr) > -1) {
    // Same as above but reversed, in case a client is moved *from* and ignored screen *to* an actual screen
    if (oldScr !== client.screen) {
      if (tiles[curAct()][ws.currentDesktop][client.screen].length < tiles[curAct()][ws.currentDesktop][client.screen].max &&  tiles[curAct()][ws.currentDesktop][client.screen].blocked !== true) {
        print("attempting to push " + client.caption + " to screen" + client.screen);
        throwClient(client, client.desktop, oldScr, client.desktop, client.screen);
        print("pushed client " + client.caption + " to screen" + client.screen);
        return;
      }
    }
  }
  // If none of the above are triggered but the client *is* and *was* on an ignored screen, returns without triggering the normal client adjustments
  if (ignoredScreens.indexOf(client.screen) > -1 && ignoredScreens.indexOf(oldScr) > -1) {
    print(client.caption + " on ignored screen");
    return;
  }
  // If the size equals the pre-movement size, user is trying to move the client, not resize it
  if (client.geometry.width === oldGeo.width && client.geometry.height === oldGeo.height) {
    // If screen has changed, removes the client from the old screen and adds it to the new one
    if (oldScr !== client.screen && tiles[curAct()][client.desktop][client.screen].length < tiles[curAct()][client.desktop][client.screen].max &&
      tiles[curAct()][client.desktop][client.screen].blocked !== true) {
      throwClient(client, client.desktop, oldScr, client.desktop, client.screen);
    } else {
      moveClient(client);
    }
  } else {
    var area = screenGeo(client.screen);
    if (client.geometry.width <= area.width && client.geometry.height <= area.height && client.geometry.x >= area.x && client.geometry.y >= area.y && oldScr === client.screen) {
      resizeClient(client);
    } else {
      var rect = oldGeo;
      client.geometry = rect;
    }
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
  for (var i = 0; i < tiles[curAct(client)][client.desktop][client.screen].length; i++) {
    // ...except for the client being moved
    // (it's off the grid and needs to be snapped back to the oldGeo variable)
    if (tiles[curAct(client)][client.desktop][client.screen][i] != client) {
      geometries.push(tiles[curAct(client)][client.desktop][client.screen][i].geometry);
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

// Swaps tiles[desktop][ws.activeScreen][i] and tiles[desktop][ws.activeScreen][j]
function swapClients(i, j, scrI, scrJ) {
  print("attempting to swap clients " + i + " " + j);
  var act = curAct();
  var desk = ws.currentDesktop;
  var temp = tiles[act][desk][scrI][i];
  tiles[act][desk][scrI][i] = tiles[act][desk][scrJ][j];
  fitClients(desk, scrI, "move");
  tiles[act][desk][scrJ][j] = temp;
  fitClients(desk, scrJ, "move");
  print("successfully swapped clients " + i + " " + j);
}

// Moves client between desktops and screens (TODO: activities)
function throwClient(client, fDesk, fScr, tDesk, tScr) {
  print("attempting to throw " + client.caption + " to desktop " + tDesk + " screen " + tScr);
  var act = curAct(client);
  if (client.included) {
    if (tiles[act][tDesk][tScr].length < tiles[act][tDesk][tScr].max &&  tiles[act][tDesk][tScr].blocked !== true) {
      var i = findClientIndex(client, fDesk, fScr);
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
        tiles[act][fDesk][fScr].splice(i, 1);
        tiles[act][tDesk][tScr].push(client);
      }
      client.oldDesk = tDesk;
      client.oldScr = tScr;
      if (ignoredScreens.indexOf(tScr) > -1) {
        resetClient(client); // If the client is thrown to an ignored screen, reset it
      }
      fitClient(client, tDesk, tScr, "throw");
      fitClients(fDesk, fScr);
      tileClients(fDesk);
      tileClients(tDesk);
      print("successfully thrown" + client.caption + " to desktop " + tDesk + " screen " + tScr);
    } else {
      removeClient(client, false, fDesk, fScr);
      resetClient(client, "center", tScr);
    }
  } else {
    if (ignoredScreens.indexOf(tScr) > -1 || tiles[act][tDesk][tScr].blocked || tiles[act][tDesk][tScr].length >= tiles[act][tDesk][tScr].max) {
      resetClient(client, "center", tScr);
    } else {
      addClient(client, false, tDesk, tScr);
    }
  }
}

// Resizes client and alters all tiles accordingly
function resizeClient(client) {
  print("attempting to resize " + client.caption);
  var desk = client.desktop;
  var scr = oldScr;
  var i = findClientIndex(client, client.desktop, oldScr);
  var difW, difH, difX, difY;
  if (client.fixed) {
    difW = client.geometry.width - tiles[curAct()][desk][scr].layout[i].width;
    difH = client.geometry.height - tiles[curAct()][desk][scr].layout[i].height;
    difX = client.geometry.x - tiles[curAct()][desk][scr].layout[i].x;
    difY = client.geometry.y - tiles[curAct()][desk][scr].layout[i].y;
    if (difW < 0) {
      difW = 0;
    }
    if (difH < 0) {
      difH = 0;
    }
    if (difX > 0) {
      difX = 0;
    }
    if (difY > 0) {
      difY = 0;
    }
  } else {
    difW = client.geometry.width - oldGeo.width;
    difH = client.geometry.height - oldGeo.height;
    difX = client.geometry.x - oldGeo.x;
    difY = client.geometry.y - oldGeo.y;
  }
  switch (i) {
    case 0:
      if (difX === 0 && difY === 0) {
        tiles[curAct()][desk][scr].layout[0].width += difW;
        tiles[curAct()][desk][scr].layout[1].x += difW;
        tiles[curAct()][desk][scr].layout[1].width -= difW;
        tiles[curAct()][desk][scr].layout[2].x += difW;
        tiles[curAct()][desk][scr].layout[2].width -= difW;
        tiles[curAct()][desk][scr].layout[3].width += difW;
        if (tiles[curAct()][desk][scr].length === 4) {
          tiles[curAct()][desk][scr].layout[0].height += difH;
          tiles[curAct()][desk][scr].layout[3].height -= difH;
          tiles[curAct()][desk][scr].layout[3].y += difH;
        }
      } // Allows resizing even if Y is dragged above the screen, doesn't alter height
      else if (difX === 0) {
        tiles[curAct()][desk][scr].layout[0].width += difW;
        tiles[curAct()][desk][scr].layout[1].x += difW;
        tiles[curAct()][desk][scr].layout[1].width -= difW;
        tiles[curAct()][desk][scr].layout[2].x += difW;
        tiles[curAct()][desk][scr].layout[2].width -= difW;
        tiles[curAct()][desk][scr].layout[3].width += difW;
      }
      break;
    case 1:
      tiles[curAct()][desk][scr].layout[0].width += difX;
      tiles[curAct()][desk][scr].layout[1].x += difX;
      tiles[curAct()][desk][scr].layout[1].width -= difX;
      tiles[curAct()][desk][scr].layout[2].x += difX;
      tiles[curAct()][desk][scr].layout[2].width -= difX;
      tiles[curAct()][desk][scr].layout[3].width += difX;
      if (difY === 0) {
        tiles[curAct()][desk][scr].layout[1].height += difH;
        tiles[curAct()][desk][scr].layout[2].y += difH;
        tiles[curAct()][desk][scr].layout[2].height -= difH;
      }
      break;
    case 2:
      tiles[curAct()][desk][scr].layout[0].width += difX;
      tiles[curAct()][desk][scr].layout[1].x += difX;
      tiles[curAct()][desk][scr].layout[1].width -= difX;
      tiles[curAct()][desk][scr].layout[1].height += difY;
      tiles[curAct()][desk][scr].layout[2].x += difX;
      tiles[curAct()][desk][scr].layout[2].y += difY;
      tiles[curAct()][desk][scr].layout[2].width -= difX;
      tiles[curAct()][desk][scr].layout[2].height -= difY;
      tiles[curAct()][desk][scr].layout[3].width += difX;
      break;
    case 3:
      if (difX === 0) {
        tiles[curAct()][desk][scr].layout[0].width += difW;
        tiles[curAct()][desk][scr].layout[0].height += difY;
        tiles[curAct()][desk][scr].layout[1].x += difW;
        tiles[curAct()][desk][scr].layout[1].width -= difW;
        tiles[curAct()][desk][scr].layout[2].x += difW;
        tiles[curAct()][desk][scr].layout[2].width -= difW;
        tiles[curAct()][desk][scr].layout[3].y += difY;
        tiles[curAct()][desk][scr].layout[3].width += difW;
        tiles[curAct()][desk][scr].layout[3].height -= difY;
      }
      break;
  }
  fitClient(client, desk, scr, "resize");
  tileClients();
  print("clients resized successfully (resize initiated by: " + client.caption + ")");
}


// Screen must be carried as a parameter because once a client gets too large, its screen will change
function adjustClientSize(client, scr, x, y) {
  var desk = client.desktop;
  switch (findClientIndex(client, desk, scr)) {
    case 0:
      tiles[curAct(client)][desk][scr].layout[0].width += x;
      tiles[curAct(client)][desk][scr].layout[1].x += x;
      tiles[curAct(client)][desk][scr].layout[1].width -= x;
      tiles[curAct(client)][desk][scr].layout[2].x += x;
      tiles[curAct(client)][desk][scr].layout[2].width -= x;
      tiles[curAct(client)][desk][scr].layout[3].width += x;
      tiles[curAct(client)][desk][scr].layout[0].height += y;
      tiles[curAct(client)][desk][scr].layout[3].y += y;
      tiles[curAct(client)][desk][scr].layout[3].height -= y;
      break;
    case 1:
      tiles[curAct(client)][desk][scr].layout[0].width -= x;
      tiles[curAct(client)][desk][scr].layout[1].x -= x;
      tiles[curAct(client)][desk][scr].layout[1].width += x;
      tiles[curAct(client)][desk][scr].layout[2].x -= x;
      tiles[curAct(client)][desk][scr].layout[2].width += x;
      tiles[curAct(client)][desk][scr].layout[3].width -= x;
      tiles[curAct(client)][desk][scr].layout[1].height += y;
      tiles[curAct(client)][desk][scr].layout[2].y += y;
      tiles[curAct(client)][desk][scr].layout[2].height -= y;
      break;
    case 2:
      tiles[curAct(client)][desk][scr].layout[0].width -= x;
      tiles[curAct(client)][desk][scr].layout[1].x -= x;
      tiles[curAct(client)][desk][scr].layout[1].width += x;
      tiles[curAct(client)][desk][scr].layout[2].x -= x;
      tiles[curAct(client)][desk][scr].layout[2].width += x;
      tiles[curAct(client)][desk][scr].layout[3].width -= x;
      tiles[curAct(client)][desk][scr].layout[1].height -= y;
      tiles[curAct(client)][desk][scr].layout[2].y -= y;
      tiles[curAct(client)][desk][scr].layout[2].height += y;
      break;
    case 3:
      tiles[curAct(client)][desk][scr].layout[0].width += x;
      tiles[curAct(client)][desk][scr].layout[1].x += x;
      tiles[curAct(client)][desk][scr].layout[1].width -= x;
      tiles[curAct(client)][desk][scr].layout[2].x += x;
      tiles[curAct(client)][desk][scr].layout[2].width -= x;
      tiles[curAct(client)][desk][scr].layout[3].width += x;
      tiles[curAct(client)][desk][scr].layout[0].height -= y;
      tiles[curAct(client)][desk][scr].layout[3].y -= y;
      tiles[curAct(client)][desk][scr].layout[3].height += y;
      break;
  }
}

function resetClient(client, pos, scr) {
  if (typeof scr === "undefined") { scr = client.screen; }
  var tile = screenGeo(scr);
  var rect = client.geometry;
  if (client.fixed !== true) {
    rect.width = newTile(scr).width - gap * 2;
    rect.height = newTile(scr).height - gap * 2;
  }
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
  if (client.fullScreen ||  isMaxed(client)) {
    tiles[curAct(client)][client.desktop][client.screen].blocked = false;
  }
  reserveClient(client, client.desktop, client.screen);
}

function unminimizeClient(client) {
  if (client.fullScreen ||  isMaxed(client)) {
    tiles[curAct(client)][client.desktop][client.screen].blocked = true;
  }
  unreserveClient(client, client.desktop, client.screen);
}

function maximizeClient(client, h, v) {
  if (h && v) {
    tiles[curAct(client)][client.desktop][client.screen].blocked = true;
    reserveClient(client, client.desktop, client.screen);
  } else {
    tiles[curAct(client)][client.oldDesk][client.oldScr].blocked = false;
    unreserveClient(client, client.desktop, client.screen);
  }
}

function fullScreenClient(client, full, user) {
  if (full) {
    tiles[curAct(client)][client.desktop][client.screen].blocked = true;
    reserveClient(client, client.desktop, client.screen);
  } else {
    tiles[curAct(client)][client.desktop][client.screen].blocked = false;
    unreserveClient(client, client.desktop, client.screen);
  }
}


// -----------------
// Client Properties
// -----------------

var oldGeo;
var oldScr;
// Saves the pre-movement position when called
function saveClientGeo(client) {
  print("saving " + client.caption + "'s geometry");
  oldGeo = client.geometry;
  oldScr = client.screen;
}

// Ignore-check to see if the client is valid for the script
function checkClient(client) {
  print("checking " + client.caption);
  // If a client is a "dialog", tiles all clients before returning false
  // Most noticeable on confirmation windows, which usually break tiling momentarily
  if (client.dialog) {
    if (started) {
      tileClients();
    }
    print(client.caption + " not suitable");
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
    ignoredActivities.indexOf(curAct(client)) > -1 ||
    ignoredDesktops.indexOf(client.desktop) > -1) {
    print(client.caption + " not suitable");
    return false;
  } else {
    for (var i = 0; i < ignoredCaptions.length; i++) {
      // ignoredCaptions.indexOf(client.caption.toString()) would be exact match, while this solution is a substring match (#25)
      var caption = client.caption.toString();
      if (caption.indexOf(ignoredCaptions[i]) > -1 && client.included !== true) {
        // client.included === "undefined" to avoid ignoring a caption "Blahblah" to also ignore Spotify while listening to a song called "Blahblah" and Firefox while googling "Blahblah"
        print(client.caption + " not suitable");
        return false;
      }
    }
    print(client.caption + " passed");
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

// Compare two geometries without unnecessary type conversion
function sameGeometry(geo1, geo2) {
  if (geo1.x === geo2.x && geo1.y === geo2.y) {
    return true;
  } else {
    return false;
  }
}

// Finds tiles[desktop][ws.activeScreen] index of a client
function findClientIndex(client, desk, scr) {
  print("attempting to find " + client.caption + " index on desktop " + desk + " screen " + scr);
  var act = curAct(client);
  for (var i = 0; i < tiles[act][desk][scr].length; i++) {
    if (sameClient(tiles[act][desk][scr][i], client)) {
      print("found " + client.caption + " index on desktop " + desk + " screen " + scr);
      return i;
    }
  }
}

// Finds tiles[desktop][ws.activeScreen] index by geometry
function findGeometryIndex(geo, desk, scr) {
  print("attempting to find geometry on desktop " + desk + " screen " + scr);
  for (i = 0; i < tiles[curAct()][desk][scr].length; i++) {
    if (sameGeometry(tiles[curAct()][desk][scr][i], geo)) {
      print("found geometry on " + desk + " screen " + scr);
      return i;
    }
  }
}

// Returns the vertical opposite index
function oppositeClient(client, scr) {
  var act = curAct(client);
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
  var act = curAct(client);
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
      if(length === 4) { return [tiles[act][desk][scr][3], 3]; }
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
  print("attempting to create activity " + act);
  tiles[act.toString()] = [];
  for (var i = 1; i <= ws.desktops; i++) {
    createDesktop(act.toString(), i);
  }
  print("activitiy " + act.toString() + " created");
}

// Returns the client's current act if a parameter is given, otherwise returns the workspace's current act
function curAct(client) {
  if (client) {
    if (client.activities[0]) {
      return client.activities[0].toString();
    } else {
      return ws.currentActivity.toString();
    }
  } else {
    return ws.currentActivity.toString();
  }
}

// Detects whether a desktop is added or removed, called whenever the number of desktops changes
function adjustDesktops(desktop) {
  // Checks if a workspace is removed
  if (ws.desktops < desktop) {
    tileClients();
  }
  // Checks if a workspace is added
  else if (ws.desktops > desktop) {
    for (var i = 0; i < ws.activities.length; i++) {
      createDesktop(ws.activities[i].toString(), ws.desktops);
    }
    tileClients();
  }
}

// Creates a new desktops
function createDesktop(act, desk) {
  print("attempting to create desktop " + desk);
  tiles[act][desk] = [];
  for (var i = 0; i < ws.numScreens; i++) {
    tiles[act][desk][i] = [];
    if (ignoredScreens.indexOf(i) > -1) {
      tiles[act][desk][i].max = Number.MAX_VALUE; // TODO: Ignored screens to work like desktops and activities
    } else {
      tiles[act][desk][i].max = 4;
    }
    tiles[act][desk][i].layout = newLayout(i);
  }
  print("desktop " + desk + " created");
}


// Removes a desktop
function removeDesktop(act, desk) {
  print("attempting to remove desktop " + desk);
  for (var i = 0; i < tiles[act][desk].length; i++) {
    for (var j = 0; j < tiles[act][desk][i].length; j++) {
      closeWindow(tiles[act][desk][i][j]);
    }
  }
  print("desktop " + desk + " removed");
}

// Finds a desktop and a screen with space left for a new client
function findSpace() {
  print("attempting to find space on existing desktops");
  // Tries the current desktop first
  for (var k = 0; k < ws.numScreens; k++) {
    if (ignoredScreens.indexOf(k) === -1) {
      if (tiles[curAct()][ws.currentDesktop][k].length < tiles[curAct()][ws.currentDesktop][k].max && tiles[curAct()][ws.currentDesktop][k].blocked !== true) {
        print("found space on desktop " + ws.currentDesktop + " screen " + k);
        return [ws.currentDesktop, k];
      }
    }
  }
  for (var i = 1; i <= ws.desktops; i++) {
    if (i !== ws.currentDesktop) {
      for (var j = 0; j < ws.numScreens; j++) {
        if (ignoredScreens.indexOf(j) === -1) {
          if (tiles[curAct()][i][j].length < tiles[curAct()][i][j].max && tiles[curAct()][i][j].blocked !== true) {
            print("found space on desktop " + i + " screen " + j);
            return [i, j];
          }
        }
      }
    }
  }
  print("no space found");
  return false;
}

// Find the desktop with the most clients open
function findBusy() {
  print("attempting to find a busy desktop");
  var busyDesk = 1;
  var busyTotal = 0;
  for (var i = 1; i <= ws.desktops; i++) {
    var curTotal = 0;
    for (var j = 0; j < ws.numScreens; j++) {
      curTotal += tiles[curAct()][i][j].length;
    }
    if (curTotal > busyTotal) {
      busyDesk = i;
      busyTotal = curTotal;
    }
  }
  print("busiest desktop: " + busyDesk);
  return busyDesk;
}

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

function screenGeo(scr) {
  return ws.clientArea(0, scr, 0);
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
  print("instant init");
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

// Hack: Waits for client connections, then attempts to initiate the script
// If client is valid for the script, the script is initiated
// The most reliable way to start the script thus far
// TODO: Find a better and more reliable way to start the script
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
      print("script initiated with " + client.caption);
    } else client.windowShown.disconnect(check);
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
