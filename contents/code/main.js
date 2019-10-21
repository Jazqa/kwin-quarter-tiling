// ------------
// DEV-SPECIFIC
// ------------

// Prints x, y, width and height of a geometry
function printGeo(geometry) {
  print("x " + geometry.x);
  print("y " + geometry.y);
  print("width " + geometry.width);
  print("height " + geometry.height);
}

// Options object doesn't exist when running the debugger
const options = options ? options : {};

// ReadConfig method doesn't exist when running the debugger
const readConfig = readConfig
  ? readConfig
  : function(key, defaultValue) {
      return defaultValue;
    };

function readConfigString(key, defaultValue) {
  return readConfig(key, defaultValue).toString();
}

// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

var windows = [];
var screens = [];

// Gaps

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

// Geometry

function copyGeometry(geometry) {
  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height
  };
}

function withGaps(geometry) {
  const newGeo = copyGeometry(geometry);
  newGeo.x += gap;
  newGeo.y += gap;
  newGeo.width -= gap * 2;
  newGeo.height -= gap * 2;
  return newGeo;
}

// Screen

function getScreenWindows(screenId) {
  const included = windows.filter(function(window) {
    return (
      window.activities.indexOf(workspace.currentActivity > -1) &&
      window.desktop === workspace.currentDesktop &&
      window.screen === screenId
    );
  });

  return included;
}

function getScreenGeometry(screenId, gaps) {
  const availGeo = workspace.clientArea(0, screenId, workspace.currentDesktop);
  const fullGeo = workspace.clientArea(1, screenId, workspace.currentDesktop);

  availGeo.width += fullGeo.x < availGeo.x ? availGeo.x - fullGeo.x : 0;
  availGeo.height += fullGeo.y < availGeo.y ? availGeo.y - fullGeo.y : 0;

  availGeo.width -= availGeo.x >= availGeo.width ? availGeo.x - availGeo.width : availGeo.x;
  availGeo.height -= availGeo.y >= availGeo.height ? availGeo.y - availGeo.height : availGeo.y;

  return gaps ? withGaps(availGeo) : availGeo;
}

function initScreens() {
  const layout = readConfigString("layout", 0);
  for (var i = 0; i < workspace.numScreens; i++) {
    switch (layout) {
      // case "1":
      //  screens[i] = new QuarterLayout(i);
      //  break;
      // case "2":
      //  screens[i] = new QuarterLayout(i);
      //  break;
      default:
        screens[i] = new QuarterVertical(i);
    }
  }
}

// Blacklist

// KWin client.resourceClasses || client.rersourceNames that are not tiled
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

ignoredClients = ignoredClients.concat(readConfigString("ignoredClients", "wine, steam, kate").split(", "));

// KWin client.captions that are not tiled
const ignoredCaptions = ["File Upload", "Move to Trash", "Quit GIMP", "Create a New Image", "QEMU"];

ignoredCaptions = ignoredCaptions.concat(
  readConfigString("ignoredCaptions", "Quit GIMP, Create a New Image").split(", ")
);

// Some Java programs may cause problems with tiling and can be difficult to ignore manually
// Following code is meant to help adding Java programs to the ignore list
if (readConfigString("ignoreJava", false) === "true") {
  ignoredClients.push("sun-awt-x11-xframepeer");
}

const minimumGeometry = {
  width: readConfig("minWidth", 256),
  height: readConfig("minHeight", 256)
};

// Client types, sizes etc. that are not tiled
function isEligible(client) {
  return getScreenWindows(client.screen, client.desktop).length === screens[client.screen].getMaxClients() ||
    client.comboBox ||
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

// Desktops
function createDesktop() {
  workspace.desktops += 1;
  return workspace.desktops.length;
}

function findDesktopForClient(client) {
  var newDesktop = client.desktop;

  const maxClients = screens[client.screen].getMaxClients();

  if (getScreenWindows(client.screen).length >= maxClients) {
    for (var i = 1; i <= workspace.desktops; i++) {
      if (getScreenWindows(client.screen, i).length < maxClients) {
        newDesktop = i;
        break;
      }
    }

    if (newDesktop === client.desktop) {
      newDesktop = createDesktop();
    }
  }

  if (newDesktop !== client.desktop && readConfigString("followClients", true) === "true") {
    workspace.currentDesktop = newDesktop;
  }

  return newDesktop;
}

// Clients

function addClient(client) {
  if (isEligible(client)) {
    windows.push(client);

    client.clientStartUserMovedResized.connect(startMoveClient);
    client.clientFinishUserMovedResized.connect(finishMoveClient);

    screens[client.screen].tileClients();
  }
}

function removeClient(client) {
  const index = findClient(client, windows);
  if (index > -1) {
    windows.splice(index, 1);

    client.clientStartUserMovedResized.disconnect(startMoveClient);
    client.clientFinishUserMovedResized.disconnect(finishMoveClient);

    screens[client.screen].tileClients();
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
  snapshot.windows = getScreenWindows(snapshot.screen);
  snapshot.tiles = screens[snapshot.screen].getTiles(snapshot.windows.length);
}

function findClosestClient(client) {
  var closest = [-1, 9999];
  for (var i = 0; i < snapshot.tiles.length; i++) {
    const distance =
      Math.abs(client.geometry.x - snapshot.tiles[i].x) + Math.abs(client.geometry.y - snapshot.tiles[i].y);
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
        swapClients(
          findClient(snapshot.windows[index], windows),
          findClient(snapshot.windows[findClosestClient(client)[0]], windows)
        );
      } else {
        // Resizes the client
        screens[snapshot.screen].resizeClient(client);
      }
    } else {
      // Pushes the client to the end of the array
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
    screens[i].tileClients();
  }
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

// Init

function connectWorkspace() {
  if (readConfigString("autoTile", true) === "true") {
    workspace.clientAdded.connect(addClient);
  }

  workspace.clientRemoved.connect(removeClient);
  workspace.clientMaximizeSet.connect(maximizeClient);
  workspace.clientFullScreenSet.connect(fullScreenClient);
  workspace.clientUnminimized.connect(addClient);
  workspace.clientMinimized.connect(removeClient);
  workspace.currentDesktopChanged.connect(tileClients);
  workspace.desktopPresenceChanged.connect(changeDesktop);
}

function registerShortcuts() {
  // Float
  registerShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", function() {
    const client = workspace.activeClient;
    if (findClient(client, windows) > -1) {
      removeClient(client);
    } else {
      addClient(client);
    }
  });

  // Gap +
  registerShortcut("Quarter: Increase Gap Size", "Quarter: Increase Gap Size", "Meta+Shift+PgUp", function() {
    adjustGapSize(2);
  });

  // Gap -
  registerShortcut("Quarter: Decrease Gap Size", "Quarter: Decrease Gap Size", "Meta+Shift+PgDown", function() {
    adjustGapSize(-2);
  });
}

function init() {
  options.windowSnapZone = 0;
  options.electricBorderMaximize = false;
  options.electricBorderTiling = false;

  connectWorkspace();
  registerShortcuts();
  initScreens();

  if (readConfigString("autoTile", true) === "true") {
    workspace.clientList().forEach(addClient);
  }
}

init();

// Layouts

function QuarterVertical(i) {
  const id = i;
  this.getId = function() {
    return id;
  };

  const maxClients = 4;
  this.getMaxClients = function() {
    return maxClients;
  };

  var tiles = [];
  this.getTiles = function(included) {
    if (included.length > tiles.length) {
      for (var i = tiles.length; i < included.length; i++) {
        this.addTile(i);
      }
    } else if (tiles.length > included.length) {
      for (var i = included.length; i < tiles.length; i++) {
        this.removeTile(i);
      }
    }

    return tiles;
  };

  this.addTile = function(i) {
    var tile;

    switch (i) {
      case 0:
        tile = getScreenGeometry(id, false);
        break;
      case 1:
        tile = this.splitTile(0);
        break;
      case 2:
        tile = this.splitTile(1);
        break;
      case 3:
        tile = this.splitTile(0);
        break;
    }

    tiles[i] = tile;
  };

  this.removeTile = function(i) {
    print(i);
    switch (i) {
      case 1:
        tiles[0].width += tiles[i].width;
        break;
      case 2:
        tiles[1].height += tiles[i].height;
        break;
      case 3:
        tiles[0].height += tiles[i].height;
        break;
    }

    tiles.splice(i, 1);
  };

  this.splitTile = function(i) {
    var parent = tiles[i];
    var child = copyGeometry(parent);

    if (parent.width > parent.height) {
      parent.width *= 0.5;
      child.width *= 0.5;
      child.x += parent.width;
    } else {
      parent.height *= 0.5;
      child.height *= 0.5;
      child.y += parent.height;
    }

    return child;
  };

  this.resizeClient = function(client) {
    const included = getScreenWindows(id);
    const index = findClient(client, included);

    // Resizing logic here
  };

  this.tileClients = function() {
    const included = getScreenWindows(id);
    const tiles = this.getTiles(included);

    for (var i = 0; i < included.length; i++) {
      included[i].geometry = withGaps(tiles[i]);
    }
  };
}
