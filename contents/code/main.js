// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

print("Quarter Tiling initialized");

// Disable some default options that don't play nicely with the script
options.windowSnapZone = 0;
options.electricBorderMaximize = false;
options.electricBorderTiling = false;

var gap = readConfig("gap", 8) / 2;

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
        screens[i] = new Tall(i);
        break;
      case "2":
        screens[i] = new Tall(i);
        break;
      default:
        screens[i] = new Tall(i);
    }
  }
}

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
  "yakuake"
];

ignoredClients = ignoredClients.concat(
  readConfig("ignoredClients", "wine, steam, kate")
    .toString()
    .split(", ")
);

// KWin client.captions that are not tiled
var ignoredCaptions = ["File Upload", "Move to Trash", "Quit GIMP", "Create a New Image", "QEMU"];

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
  print("Checking eligibility of a client");

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
    print("Adding a client");
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
    print("Removing a client");
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
  print("Finding a client");
  for (var i = 0; i < array.length; i++) {
    if (array[i].windowId === client.windowId) {
      return i;
    }
  }
  return -1;
}

// Saves a snapshot of the screen when moving starts
var snapshot = {
  geometry: {},
  screen: 0,
  windows: [],
  tiles: []
};

function startMoveClient(client) {
  snapshot.geometry = client.geometry;
  snapshot.screen = client.screen;
  snapshot.windows = screens[snapshot.screen].getWindows();
  snapshot.tiles = screens[snapshot.screen].getTiles(snapshot.windows.length);
}

function finishMoveClient(client) {
  const index = findClient(client, snapshot.windows);
  if (index > -1) {
    if (client.screen === snapshot.screen) {
      if (client.geometry.width === snapshot.geometry.width && client.geometry.height === snapshot.geometry.height) {
        // Calculate the closest tile
        var closest = [-1, 9999];
        for (var i = 0; i < snapshot.tiles.length; i++) {
          const distance =
            Math.abs(client.geometry.x - snapshot.tiles[i].x) + Math.abs(client.geometry.y - snapshot.tiles[i].y);
          if (distance < closest[1]) {
            closest = [i, distance];
          }
        }
        // Swap with the closest
        swapClients(index, closest[0]);
        screens[snapshot.screen].tile();
      } else {
        // Resize
        screens[snapshot.screen].resize(client);
      }
    } else {
      // Push the client to the end of the array
      windows.push(windows.splice(index, 1)[0]);
      screens[snapshot.screen].tile();
      screens[client.screen].tile();
    }
  }
}

function changeDesktop(client, desktop) {
  print("Changing desktop");

  if (client) {
    var index = findClient(client, windows);
    if (index > -1) {
      // Push the client to the end of the array
      windows.push(windows.splice(index, 1)[0]);
    }
  }

  tileClients();
}

function swapClients(i, j) {
  var t = windows[i];
  windows[i] = windows[j];
  windows[j] = t;
}

function tileClients() {
  print("Tiling clients");
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
  var client = workspace.activeClient;
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

registerShortcut("Quarter: Switch Active With Master", "Quarter: Switch Active With Master", "Meta+Enter", function() {
  swapClients(
    findClient(workspace.activeClient, windows),
    findClient(screens[workspace.activeClient.screen].getWindows()[0], windows)
  );
  screens[workspace.activeClient.screen].tile();
});

registerShortcut(
  "Quarter: Increase Master Pane Capacity",
  "Quarter: Increase Master Pane Capacity",
  "Meta+<",
  function() {
    screens[workspace.activeScreen].adjustMaster(true);
  }
);

registerShortcut(
  "Quarter: Decrease Master Pane Capacity",
  "Quarter: Decrease Master Pane Capacity",
  "Meta+>",
  function() {
    screens[workspace.activeScreen].adjustMaster(false);
  }
);

workspace.clientList().forEach(addClient);

// Tall layout with two columns
function Tall(i) {
  print("Creating a new screen");
  const id = i;
  var master = 1;
  var offsets = { x: 0 };

  this.getGeometry = function(gaps) {
    const geometry = workspace.clientArea(0, id, 0);
    if (gaps) {
      geometry.x += gap;
      geometry.y += gap;
      geometry.width -= gap * 2;
      geometry.height -= gap * 2;
    }
    return geometry;
  };

  this.adjustMaster = function(increase) {
    if (increase) {
      master += 1;
    } else {
      master = master > 1 ? master - 1 : 1;
    }

    this.tile();
  };

  this.getTiles = function(length) {
    print("Getting tiles");
    const geometry = this.getGeometry(true);

    var separators = {
      x: length > master ? geometry.width / 2 - offsets.x : geometry.width
    };

    var tiles = [];

    const leftTiles = length > master ? master : length;
    for (var i = 0; i < leftTiles; i++) {
      tiles.push({
        x: geometry.x,
        y: geometry.y + (geometry.height / leftTiles) * i,
        width: separators.x,
        height: geometry.height / leftTiles
      });
    }

    const rightTiles = length - master;
    for (var i = 0; i < rightTiles; i++) {
      tiles.push({
        x: geometry.x + separators.x,
        y: geometry.y + (geometry.height / rightTiles) * i,
        width: geometry.width - separators.x,
        height: geometry.height / rightTiles
      });
    }

    return tiles;
  };

  this.getWindows = function() {
    const included = windows.filter(function(window) {
      return (
        window.activities.indexOf(workspace.currentActivity > -1) &&
        window.desktop === workspace.currentDesktop &&
        window.screen === id
      );
    });

    return included;
  };

  this.tile = function() {
    print("Tiling screen");
    const included = this.getWindows();
    const tiles = this.getTiles(included.length);
    for (var i = 0; i < included.length; i++) {
      var tile = tiles[i];
      tile.x += gap;
      tile.y += gap;
      tile.width -= gap * 2;
      tile.height -= gap * 2;
      included[i].geometry = tile;
    }
  };

  this.resize = function(client) {
    const included = this.getWindows();
    const index = findClient(client, included);
    if (index > -1) {
      if (index < master) {
        offsets.x += snapshot.geometry.width - client.geometry.width;
      } else {
        offsets.x += client.geometry.width - snapshot.geometry.width;
      }

      // Don't let the windows grow out of bounds
      const geometry = this.getGeometry(false);
      if (offsets.x < -1 * (geometry.width / 2 - 256)) {
        offsets.x = -1 * (geometry.width / 2 - 256);
      } else if (offsets.x > geometry.width / 2 - 256) {
        offsets.x = geometry.width / 2 - 256;
      }

      this.tile();
    }
  };
}
