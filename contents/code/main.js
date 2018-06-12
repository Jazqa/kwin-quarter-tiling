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
const snapshot = {};

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
        if (index !== closest[0]) {
          // Swap with the closest
          swapClients(findClient(snapshot.windows[index], windows), findClient(snapshot.windows[closest[0]], windows));
        }
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
    const index = findClient(client, windows);
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
  const masters = [];
  const panes = [];

  this.getMaster = function() {
    const location = workspace.currentActivity.toString() + workspace.currentDesktop.toString();
    masters[location] = masters[location] ? masters[location] : { n: 1 };
    return masters[location];
  };

  this.getPane = function() {
    const location = workspace.currentActivity.toString() + workspace.currentDesktop.toString();
    panes[location] = panes[location] ? panes[location] : { x: 0, y: [] };
    return panes[location];
  };

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
    const master = this.getMaster();

    if (increase) {
      master.n += 1;
    } else {
      master.n = master.n > 1 ? master.n - 1 : 1;
    }

    this.tile();
  };

  this.getTiles = function(length) {
    print("Getting tiles");
    const geometry = this.getGeometry(true);
    const master = this.getMaster().n;
    const pane = this.getPane();

    const x = length > master ? geometry.width / 2 - pane.x : geometry.width;

    const tiles = [];

    const leftTiles = length > master ? master : length;
    for (var i = 0; i < leftTiles; i++) {
      var y = geometry.y + (geometry.height / leftTiles) * i;
      if (i !== 0 && pane.y[i]) {
        y += pane.y[i];
      }

      if (i === leftTiles - 1) {
        height = geometry.height - y + gap;
      } else {
        var yn = (geometry.y + geometry.height / leftTiles) * (i + 1);
        yn += pane.y[i + 1] ? pane.y[i + 1] : 0;
        height = yn - y - gap * i;
      }

      tiles.push({
        x: geometry.x,
        y: y,
        width: x,
        height: height
      });
    }

    const rightTiles = length - master;
    for (var i = 0; i < rightTiles; i++) {
      const j = i + master;

      var y = geometry.y + (geometry.height / rightTiles) * i;
      if (i !== 0 && pane.y[j]) {
        y += pane.y[j];
      }

      if (i === rightTiles - 1) {
        height = geometry.height - y + gap;
      } else {
        var yn = (geometry.y + geometry.height / rightTiles) * (i + 1);
        yn += pane.y[j + 1] ? pane.y[j + 1] : 0;
        height = yn - y - gap * i;
      }

      tiles.push({
        x: geometry.x + x,
        y: y,
        width: geometry.width - x,
        height: height
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
      const tile = tiles[i];
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
      const pane = this.getPane();

      // Width
      if (index < this.getMaster().n) {
        pane.x += snapshot.geometry.width - client.geometry.width;
      } else {
        pane.x += client.geometry.width - snapshot.geometry.width;
      }

      //Height
      if (client.geometry.y !== snapshot.geometry.y) {
        pane.y[index] = pane.y[index] ? pane.y[index] : 0;
        pane.y[index] += client.geometry.y - snapshot.geometry.y;
      } else {
        pane.y[index + 1] = pane.y[index + 1] ? pane.y[index + 1] : 0;
        pane.y[index + 1] += client.geometry.height - snapshot.geometry.height;
      }

      this.tile();
    }
  };
}
