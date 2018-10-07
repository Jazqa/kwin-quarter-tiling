// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

options.windowSnapZone = 0;
options.electricBorderMaximize = false;
options.electricBorderTiling = false;

const gap = readConfig("gap", 8) / 2;

function adjustGapSize(amount) {
  gap += amount;
  if (gap < 2) {
    // Gaps are forced, because maximized clients are identified by their size
    gap = 2;
  } else if (gap > 32) {
    gap = 32;
  }

  tileClients();
}

function withGaps(geometry) {
  const geoWithGaps = geometry;
  geoWithGaps.x += gap;
  geoWithGaps.y += gap;
  geoWithGaps.width -= gap * 2;
  geoWithGaps.height -= gap * 2;
  return geoWithGaps;
}

var windows = [];
var screens = [];

function getGeometry(id, gaps) {
  const availGeo = workspace.clientArea(0, id, workspace.currentDesktop);
  const fullGeo = workspace.clientArea(1, id, workspace.currentDesktop);

  if (fullGeo.x < availGeo.x) {
    availGeo.width += availGeo.x - fullGeo.x;
  }

  if (fullGeo.y < availGeo.y) {
    availGeo.height += availGeo.y - fullGeo.y;
  }

  if (gaps) {
    // withGaps() not used because x and y are aware of the available area (e.g. Plasma bar), but the width and height are not
    availGeo.x += gap;
    availGeo.y += gap;
    availGeo.width -= availGeo.width - (availGeo.width - availGeo.x) + gap;
    availGeo.height -= availGeo.height - (availGeo.height - availGeo.y) + gap;
  }

  return availGeo;
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
    return i === 0 ? getGeometry(id, false) : i - 1;
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

  this.addTile = function(i) {
    var tile = {
      x: parent.x,
      y: parent.y,
      width: parent.width,
      height: parent.height
    };
  };

  this.removeTile = function(i) {
    tiles.splice(i, 1);
  };

  this.getTiles = function(length) {
    const geometry = getGeometry(id, true);
    const tiles = [];

    if (length > tiles.length) {
      // for length - tiles.length
      //  add tiles
    } else if (tiles.length > length) {
      // for tiles.length - length
      //  remove tiles
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
      included[i].geometry = withGaps(tiles[i]);
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
