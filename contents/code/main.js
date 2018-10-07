// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

options.windowSnapZone = 0;
options.electricBorderMaximize = false;
options.electricBorderTiling = false;

const gap = readConfig("gap", 8) * 0.5;

function adjustGapSize(amount) {
  gap += amount;
  if (gap < 2) {
    // Gaps are forced, because maximized clients are identified by their size
    gap = 2;
  } else if (gap > 64) {
    gap = 64;
  }

  tileClients();
}

function withGaps(geometry) {
  const newGeo = copyGeometry(geometry);
  newGeo.x += gap;
  newGeo.y += gap;
  newGeo.width -= gap * 2;
  newGeo.height -= gap * 2;
  return newGeo;
}

var windows = [];
var screens = [];

function getGeometry(id, gaps) {
  const availGeo = workspace.clientArea(0, id, workspace.currentDesktop);
  const fullGeo = workspace.clientArea(1, id, workspace.currentDesktop);

  availGeo.width += fullGeo.x < availGeo.x ? availGeo.x - fullGeo.x : 0;
  availGeo.height += fullGeo.y < availGeo.y ? availGeo.y - fullGeo.y : 0;

  availGeo.width -= availGeo.width - (availGeo.width - availGeo.x);
  availGeo.height -= availGeo.height - (availGeo.height - availGeo.y);

  return withGaps(availGeo);
}

function copyGeometry(geometry) {
  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height
  };
}

initScreens();
function initScreens() {
  const layout = readConfig("layout", 0).toString();
  for (var i = 0; i < workspace.numScreens; i++) {
    switch (layout) {
      // case "1":
      //  screens[i] = new Quarter(i);
      //  break;
      // case "2":
      //  screens[i] = new Quarter(i);
      //  break;
      default:
        screens[i] = new Quarter(i);
    }
  }
}

// KWin client.resourceClasses || client.rersourcNames that are not tiled
const ignoredClients = [
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
  "yakuake"
];

ignoredClients = ignoredClients.concat(
  readConfig("ignoredClients", "wine, steam, kate")
    .toString()
    .split(", ")
);

// KWin client.captions that are not tiled
const ignoredCaptions = ["File Upload", "Move to Trash", "Quit GIMP", "Create a New Image", "QEMU"];

ignoredCaptions = ignoredCaptions.concat(
  readConfig("ignoredCaptions", "Quit GIMP, Create a New Image")
    .toString()
    .split(", ")
);

// Some Java programs may cause problems with tiling and can be difficult to ignore manually
// Following code is meant to help adding Java programs to the ignore list
if (readConfig("ignoreJava", false).toString() === "true") {
  ignoredClients.push("sun-awt-x11-xframepeer");
}

const minimumGeometry = {
  width: readConfig("minWidth", 256),
  height: readConfig("minHeight", 256)
};

function isEligible(client) {
  return client.comboBox ||
    client.desktopWindow ||
    client.dialog ||
    client.dndIcon ||
    client.dock ||
    client.dropdownMenu ||
    client.menu ||
    client.minimized ||
    client.notification ||
    client.popupMenu ||
    client.specialWindow ||
    client.splash ||
    client.toolbar ||
    client.tooltip ||
    client.utility ||
    client.transient ||
    (client.geometry.width === workspace.clientArea(0, client.screen, 0).width &&
      client.geometry.height === workspace.clientArea(0, client.screen, 0).height) ||
    client.geometry.width < minimumGeometry.width ||
    client.geometry.height < minimumGeometry.height ||
    ignoredCaptions.indexOf(client.caption.toString()) > -1 ||
    ignoredClients.indexOf(client.resourceClass.toString()) > -1 ||
    ignoredClients.indexOf(client.resourceName.toString()) > -1
    ? false
    : true;
}

function addClient(client) {
  if (isEligible(client)) {
    windows.push(client);

    // Connect
    client.clientStartUserMovedResized.connect(startMoveClient);
    client.clientFinishUserMovedResized.connect(finishMoveClient);

    screens[client.screen].tile();
  }
}

function removeClient(client) {
  const index = findClient(client, windows);
  if (index > -1) {
    windows.splice(index, 1);

    // Disconnect
    client.clientStartUserMovedResized.disconnect(startMoveClient);
    client.clientFinishUserMovedResized.disconnect(finishMoveClient);

    screens[client.screen].tile();
  }
}

function maximizeClient(client, h, v) {
  if (h && v) {
    removeClient(client);
  }
}

function fullScreenClient(client, fullScreen) {
  if (fullScreen) {
    removeClient(client);
  }
}

function findClient(client, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].windowId === client.windowId) {
      return i;
    }
  }
  return -1;
}

// Saves a snapshot of the screen when moving starts
var snapshot = {};

function startMoveClient(client) {
  snapshot.geometry = client.geometry;
  snapshot.screen = client.screen;
  snapshot.windows = screens[snapshot.screen].getWindows();
  snapshot.tiles = screens[snapshot.screen].getTiles(snapshot.windows.length);
}

function findClosestClient(client) {
  var closest = [-1, 9999];
  for (var i = 0; i < snapshot.tiles.length; i++) {
    const distance = Math.abs(client.geometry.x - snapshot.tiles[i].x) + Math.abs(client.geometry.y - snapshot.tiles[i].y);
    if (distance < closest[1]) {
      closest = [i, distance];
    }
  }
  return closest;
}

function finishMoveClient(client) {
  const index = findClient(client, snapshot.windows);

  if (index > -1) {
    if (client.screen === snapshot.screen) {
      if (client.geometry.width === snapshot.geometry.width && client.geometry.height === snapshot.geometry.height) {
        // Moves the client
        swapClients(findClient(snapshot.windows[index], windows), findClient(snapshot.windows[findClosestClient(client)[0]], windows));
      } else {
        // Resizes the client
        screens[snapshot.screen].resize(client);
      }
    } else {
      // Pushes the client to the end of the array
      windows.push(windows.splice(index, 1)[0]);
    }
  }

  tileClients();
}

function changeDesktop(client, desktop) {
  if (client) {
    const index = findClient(client, windows);

    if (index > -1) {
      // Push the client to the end of the array
      windows.push(windows.splice(index, 1)[0]);
    }
  }

  tileClients();
}

function swapClients(i, j) {
  if (i !== j) {
    var t = windows[i];
    windows[i] = windows[j];
    windows[j] = t;
  }
}

function tileClients() {
  for (var i = 0; i < screens.length; i++) {
    screens[i].tile();
  }
}

// Workspace signals
if (readConfig("autoTile", true).toString() === "true") {
  workspace.clientAdded.connect(addClient);
}

workspace.clientRemoved.connect(removeClient);
workspace.clientMaximizeSet.connect(maximizeClient);
workspace.clientFullScreenSet.connect(fullScreenClient);
workspace.clientUnminimized.connect(addClient);
workspace.clientMinimized.connect(removeClient);
workspace.currentDesktopChanged.connect(tileClients);
workspace.desktopPresenceChanged.connect(changeDesktop);

// Keybindings
registerShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", function() {
  const client = workspace.activeClient;
  if (findClient(client, windows) > -1) {
    removeClient(client);
  } else {
    addClient(client);
  }
});

registerShortcut("Quarter: Increase Gap Size", "Quarter: Increase Gap Size", "Meta+Shift+PgUp", function() {
  adjustGapSize(2);
});

registerShortcut("Quarter: Decrease Gap Size", "Quarter: Decrease Gap Size", "Meta+Shift+PgDown", function() {
  adjustGapSize(-2);
});

// Adds all the existing windows on startup
workspace.clientList().forEach(addClient);

// Layouts

// BSP
function Quarter(i) {
  const id = i;
  var tiles = [];

  this.getParent = function(i) {
    return i === 0 ? getGeometry(id) : tiles[i - 1];
  };

  this.getNeighbor = function(tile, dir) {
    for (var i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (dir === "left" && t.x === tile.x + tile.width) return t[i];
      if (dir === "right" && tile.x === t[i].x + t[i].width) return t[i];
      if (dir === "top" && t.y === tiles.y + tile.height) return t[i];
      if (dir === "bottom" && tile.y === t[i].y + t[i].height) return t[i];
    }
    return null;
  };

  this.splitGeometry = function(parent, dir) {
    var child = copyGeometry(parent);
    if (dir === "h") {
      parent.width *= 0.5;
      child.width *= 0.5;
      child.x += parent.width;
    }
    return child;
  };

  this.addTile = function(i, dir) {
    tiles[i] = i === 0 ? getGeometry(id) : this.splitGeometry(this.getParent(i), dir);
  };

  this.removeTile = function(i) {
    tiles.splice(i, 1);
  };

  this.getTiles = function(length) {
    if (length > tiles.length) {
      for (var i = tiles.length; i < length; i++) {
        this.addTile(i, "h");
      }
    } else if (tiles.length > length) {
      // for (var i = length; i <= tiles.length; i++) {
      //  this.removeTile(i);
      // }
    }

    return tiles;
  };

  this.getWindows = function() {
    const included = windows.filter(function(window) {
      return (
        window.activities.indexOf(workspace.currentActivity > -1) && window.desktop === workspace.currentDesktop && window.screen === id
      );
    });

    return included;
  };

  this.tile = function() {
    const included = this.getWindows();
    const tiles = this.getTiles(included.length);
    for (var i = 0; i < included.length; i++) {
      included[i].geometry = withGaps(tiles[i], false);
    }
  };

  this.resize = function(client) {
    const included = this.getWindows();
    const index = findClient(client, included);

    if (index > -1) {
      // Resizing logic here
    }
  };
}
