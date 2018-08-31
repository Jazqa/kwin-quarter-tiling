// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

print("Quarter Tiling initialized");

// Disable some default options that don't play nicely with the script
options.windowSnapZone = 0;
options.electricBorderMaximize = false;
options.electricBorderTiling = false;

// Divided by two, because gaps are applied to each tile and the screen
const gap = readConfig("gap", 8) / 2;

function adjustGapSize(amount) {
  gap += amount;
  if (gap < 2) {
    gap = 2;
  } else if (gap > 32) {
    gap = 32;
  }

  tileClients();
}

var windows = [];
var screens = [];

initScreens();
function initScreens() {
  const layout = readConfig("layout", 0).toString();
  for (var i = 0; i < workspace.numScreens; i++) {
    switch (layout) {
      case "1":
        screens[i] = new Quarter(i);
        break;
      // case "2":
      //  screens[i] = new Quarter(i);
      //  break;
      default:
        screens[i] = new Quarter(i);
    }
  }
}

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

workspace.clientList().forEach(addClient);

// Original Quarter layout
function Quarter(i) {
  const id = i;
}
