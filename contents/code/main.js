// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

print("Quarter Tiling initialized");

// Disable some default options that don't play nicely with the script
options.windowSnapZone = 0;
options.electricBorderMaximize = false;
options.electricBorderTiling = false;

var gap = readConfig("gap", 8);

function adjustGapSize(amount) {
  gap += amount;
  if (gap < 1) {
    gap = 1;
  } else if (gap > 64) {
    gap = 64;
  }

  tileClients();
}

var windows = [];
var screens = [];
for (var i = 0; i < workspace.numScreens; i++) {
  screens[i] = new Tall(i);
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

function isEligible(client) {
  print("Checking eligibility of a client");

  return client.comboBox ||
    client.desktopWindow ||
    client.dialog ||
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
    (client.geometry.width === workspace.clientArea(0, client.screen, 0).width &&
      client.geometry.height === workspace.clientArea(0, client.screen, 0).height) ||
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
  if (client.screen === snapshot.screen && index > -1) {
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

      swapClients(index, closest[0]);
      screens[snapshot.screen].tile();
    } else {
      // Resize
      screens[snapshot.screen].resize(client);
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

function Quarter(i) {
  print("Creating a new screen");
  const id = i;
  var max = 4;
  var offset = {
    x: 0,
    y: 0
  };

  this.adjustMaster = function(increase) {};

  this.adjustCapacity = function(increase) {
    if (increase) {
      this.max = this.max < 4 ? this.max + 1 : this.max;
    } else {
      this.max = this.max > 1 ? this.max - 1 : 1;
    }

    this.tile();
  };

  this.getTiles = function(length) {
    print("Getting tiles");
    const geometry = workspace.clientArea(0, id, 0);
    const separator = {
      x: geometry.x + geometry.width * 0.5 + offset.x,
      y: geometry.y + geometry.height * 0.5 + offset.y
    };
    switch (length) {
      case 1:
        return [
          {
            x: geometry.x + gap,
            y: geometry.y + gap,
            width: geometry.width - gap * 2,
            height: geometry.height - gap * 2
          }
        ];
      case 2:
        return [
          {
            x: geometry.x + gap,
            y: geometry.y + gap,
            width: separator.x - gap * 1.5,
            height: geometry.height - gap * 2
          },
          {
            x: geometry.x + separator.x + gap * 0.5,
            y: geometry.y + gap,
            width: geometry.width - separator.x - gap * 1.5,
            height: geometry.height - gap * 2
          }
        ];
      case 3:
        return [
          {
            x: geometry.x + gap,
            y: geometry.y + gap,
            width: separator.x - gap * 1.5,
            height: geometry.height - gap * 2
          },
          {
            x: geometry.x + separator.x + gap * 0.5,
            y: geometry.y + gap,
            width: geometry.width - separator.x - gap * 1.5,
            height: separator.y - gap * 1.5
          },
          {
            x: geometry.x + separator.x + gap * 0.5,
            y: geometry.y + separator.y + gap * 0.5,
            width: geometry.width - separator.x - gap * 1.5,
            height: geometry.height - separator.y - gap * 1.5
          }
        ];
      case 4:
        return [
          {
            x: geometry.x + gap,
            y: geometry.y + gap,
            width: separator.x - gap * 1.5,
            height: separator.y - gap * 1.5
          },
          {
            x: geometry.x + separator.x + gap * 0.5,
            y: geometry.y + gap,
            width: geometry.width - separator.x - gap * 1.5,
            height: separator.y - gap * 1.5
          },
          {
            x: geometry.x + separator.x + gap * 0.5,
            y: geometry.y + separator.y + gap * 0.5,
            width: geometry.width - separator.x - gap * 1.5,
            height: geometry.height - separator.y - gap * 1.5
          },
          {
            x: geometry.x + gap,
            y: geometry.y + separator.y + gap * 0.5,
            width: separator.x - gap * 1.5,
            height: geometry.height - separator.y - gap * 1.5
          }
        ];
    }
  };

  this.getWindows = function() {
    const included = windows.filter(function(window) {
      return (
        window.activities.indexOf(workspace.currentActivity > -1) &&
        window.desktop === workspace.currentDesktop &&
        window.screen === id
      );
    });

    return included.slice(0, max);
  };

  this.tile = function() {
    print("Tiling screen");
    const included = this.getWindows();
    const tiles = this.getTiles(included.length);
    for (var i = 0; i < included.length; i++) {
      included[i].geometry = tiles[i];
    }
  };

  this.resize = function(client) {
    var x;
    var y;
    const included = this.getWindows();
    const index = findClient(client, included);
    if (index > -1) {
      switch (findClient(client, included)) {
        case 0:
          x = client.geometry.width - snapshot.geometry.width;
          y = client.geometry.height - snapshot.geometry.height;
          break;
        case 1:
          x = snapshot.geometry.width - client.geometry.width;
          y = client.geometry.height - snapshot.geometry.height;
          break;
        case 2:
          x = snapshot.geometry.width - client.geometry.width;
          y = snapshot.geometry.height - client.geometry.height;
          break;
        case 3:
          x = client.geometry.width - snapshot.geometry.width;
          y = snapshot.geometry.height - client.geometry.height;
          break;
      }
      offset.x += x;
      offset.y += y;
      this.tile();
    }
  };
}

// Workspace signals

if (readConfig("autoTile", true).toString() === "true") {
  workspace.clientAdded.connect(addClient);
}

workspace.clientRemoved.connect(removeClient);
workspace.clientMaximizeSet.connect(maximizeClient);
workspace.clientMinimized.connect(removeClient);
workspace.currentDesktopChanged.connect(tileClients);
workspace.desktopPresenceChanged.connect(tileClients);

// Keybindings

registerShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", function() {
  var client = workspace.activeClient;
  if (findClient(client, windows) > -1) {
    removeClient(client);
  } else {
    addClient(client);
  }
});

registerShortcut("Quarter: + Gap Size", "Quarter: + Gap Size", "Meta+PgUp", function() {
  adjustGapSize(2);
});

registerShortcut("Quarter: - Gap Size", "Quarter: - Gap Size", "Meta+PgDown", function() {
  adjustGapSize(-2);
});

registerShortcut("Quarter: + Master Column", "Quarter: + Master Column", "Meta+F", function() {
  screens[workspace.activeScreen].adjustMaster(true);
});

registerShortcut("Quarter: - Master Column", "Quarter: - Master Column", "Meta+F", function() {
  screens[workspace.activeScreen].adjustMaster(false);
});

registerShortcut("Quarter: + Screen Capacity", "Quarter: + Screen Capacity", "Meta+F", function() {
  screens[workspace.activeScreen].adjustCapacity(true);
});

registerShortcut("Quarter: - Screen Capacity", "Quarter: - Screen Capacity", "Meta+F", function() {
  screens[workspace.activeScreen].adjustCapacity(false);
});

// Additional layouts

function Tall(i) {
  print("Creating a new screen");
  const id = i;
  var master = 1;
  var max = 4;
  var offset = 0;

  this.adjustMaster = function(increase) {
    if (increase) {
      this.master += 1;
    } else {
      this.master = this.master > 1 ? this.master - 1 : 1;
    }
  };

  this.adjustCapacity = function(increase) {
    if (increase) {
      this.max += 1;
    } else {
      this.max = this.max > 1 ? this.max - 1 : 1;
    }

    this.tile();
  };

  this.getTiles = function(length) {
    print("Getting tiles");
    const geometry = workspace.clientArea(0, id, 0);
    const separator = geometry.x + geometry.width * 0.5 + offset;

    var tiles = [];

    const shorter = master >= length ? length : master;
    for (var i = 0; i < master; i++) {
      tiles.push({
        x: geometry.x + gap,
        y: geometry.y + gap / (i + 1) + geometry.height * (1 / shorter) * i,
        width: length <= master ? geometry.width - gap * 2 : separator - gap * 1.5,
        height: geometry.height * (1 / shorter) - gap * (1 + 1 / shorter)
      });
    }

    length -= master;
    for (var i = 0; i < length; i++) {
      tiles.push({
        x: geometry.x + separator + gap * 0.5,
        y: geometry.y + gap / (i + 1) + geometry.height * (1 / length) * i,
        width: geometry.width - separator - gap * 1.5,
        height: geometry.height * (1 / length) - gap * (1 + 1 / length)
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

    return included.slice(0, max);
  };

  this.tile = function() {
    print("Tiling screen");
    const included = this.getWindows();
    const tiles = this.getTiles(included.length);
    for (var i = 0; i < included.length; i++) {
      included[i].geometry = tiles[i];
    }
  };

  this.resize = function(client) {
    var x;
    const included = this.getWindows();
    const index = findClient(client, included);
    if (index > -1) {
      if (index < master) {
        x = client.geometry.width - snapshot.geometry.width;
      } else {
        x = snapshot.geometry.width - client.geometry.width;
      }
      offset += x;
      this.tile();
    }
  };
}
