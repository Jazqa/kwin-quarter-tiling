// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

print("Quarter Tiling initialized");

// Disable some default options that don't play nicely with the script
options.windowSnapZone = 0;
options.electricBorderMaximize = false;
options.electricBorderTiling = false;

var gap = 8;

var windows = [];
var screens = [];
for (var i = 0; i < workspace.numScreens; i++) {
  screens[i] = new Screen(i);
}

function isEligible(client) {
  print("Checking eligibility of a client");
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
    (client.geometry.width ===
      workspace.clientArea(0, client.screen, 0).width &&
      client.geometry.height ===
        workspace.clientArea(0, client.screen, 0).height) ||
    ignoredClients.indexOf(client.resourceClass.toString()) > -1 ||
    ignoredClients.indexOf(client.resourceName.toString()) > -1
    ? false
    : true;
}

function addClient(client) {
  if (isEligible(client)) {
    print("Adding a client");
    windows.push({
      client: client,
      geometry: client.geometry
    });

    // Connect
    client.clientStartUserMovedResized.connect(startMoveClient);
    client.clientFinishUserMovedResized.connect(finishMoveClient);

    tileClients();
  }
}

function removeClient(client) {
  const index = findClient(client, windows);
  if (index > -1) {
    print("Removing a client");
    client.geometry = windows[index].geometry;
    windows.splice(index, 1);

    // Disconnect
    client.clientStartUserMovedResized.disconnect(startMoveClient);
    client.clientFinishUserMovedResized.disconnect(finishMoveClient);

    tileClients();
  }
}

function findClient(client, array) {
  print("Finding a client");
  for (var i = 0; i < array.length; i++) {
    if (array[i].client.windowId === client.windowId) {
      return i;
    }
  }
  return -1;
}

// Saves a snapshot of the screen when moving starts
var snapshot = {
  geometry: { x: 0, y: 0, width: 0, height: 0 },
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
  if (client.screen === snapshot.screen) {
    if (
      client.geometry.width === snapshot.geometry.width &&
      client.geometry.height === snapshot.geometry.height
    ) {
      // Calculate the closest tile
      var closest = [-1, 9999];
      for (var i = 0; i < snapshot.tiles.length; i++) {
        const distance =
          Math.abs(client.geometry.x - snapshot.tiles[i].x) +
          Math.abs(client.geometry.y - snapshot.tiles[i].y);
        if (distance < closest[1]) {
          closest = [i, distance];
        }
      }

      // Swap clients
      const i = findClient(client, windows);
      var temp = windows[i];
      windows[i] = windows[closest[0]];
      windows[closest[0]] = temp;

      tileClients();
    } else {
      // Resize
      screens[snapshot.screen].resize(client);
    }
  }

  tileClients();
}

function tileClients() {
  print("Tiling clients");
  for (var i = 0; i < screens.length; i++) {
    screens[i].tile();
  }
}

function Screen(i) {
  print("Creating a new screen");
  const id = i;
  var geometry = workspace.clientArea(0, i, 0);
  var separator = {
    x: geometry.x + geometry.width / 2,
    y: geometry.y + geometry.height / 2
  };

  // Gap cheat sheet:
  // If the first window Position += gap
  // If occupying the whole width/height Size -= gap * 2
  // If not occupying the whole width/height Size -= gap * 1.5
  // If not the first window Position += gap * 0.5
  this.getTiles = function(length) {
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
        window.client.desktop === workspace.currentDesktop &&
        window.client.screen === id
      );
    });

    return included.slice(0, 4);
  };

  this.tile = function() {
    const included = this.getWindows();
    const tiles = this.getTiles(included.length);
    for (var i = 0; i < included.length; i++) {
      included[i].client.geometry = tiles[i];
    }
  };

  this.resize = function(client) {
    var x;
    var y;
    const included = this.getWindows();
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
    separator.x += x;
    separator.y += y;
    this.tile();
  };
}

workspace.clientAdded.connect(addClient);
workspace.clientRemoved.connect(removeClient);
workspace.screenResized.connect(function() {
  for (var i = 0; i < screens.length; i++) {
    screens[i].geometry = workspace.clientArea(0, i, 0);
  }
});
