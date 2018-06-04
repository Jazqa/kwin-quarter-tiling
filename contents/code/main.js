// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

print("Quarter Tiling initialized");

var gap = 8;

var windows = [];
var screens = [];
for (var i = 0; i < workspace.numScreens; i++) {
  screens[i] = new Screen(i);
}

function isEligible(client) {
  print("Checking eligibility of a client");
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
  var index = findClient(client, windows);
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

var startGeometry;
var startScreen;
function startMoveClient(client) {
  startGeometry = client.geometry;
  startScreen = client.screen;
}

function finishMoveClient(client) {
  if (client.screen === startScreen) {
    if (
      client.geometry.width === startGeometry.width &&
      client.geometry.height === startGeometry.height
    ) {
      // Move
      var closest = [-1, -9999];
      var tiles = screens[startScreen].getTiles(client);
      for (var i = 0; i < tiles.length; i++) {
        var distance =
          client.geometry.x -
          tiles[i].geometry.x +
          (client.geometry.y - tiles[i].geometry.y);
        if (distance > closest[1]) {
          closest = [i, distance];
        }
        // Switch places with closest
      }
    } else {
      // Resize
      screens[startScreen].resize(client);
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
  var self = this;

  this.id = i;
  this.geometry = workspace.clientArea(0, i, 0);

  this.geometry.x += gap;
  this.geometry.y += gap;
  this.geometry.width -= gap * 2;
  this.geometry.height -= gap * 2;

  this.separator = {
    x: this.geometry.x + this.geometry.width / 2,
    y: this.geometry.y + this.geometry.height / 2
  };

  this.getTiles = function(length) {
    switch (length) {
      case 1:
        return [
          {
            x: self.geometry.x,
            y: self.geometry.y,
            width: self.geometry.width,
            height: self.geometry.height
          }
        ];
      case 2:
        return [
          {
            x: self.geometry.x,
            y: self.geometry.y,
            width: self.separator.x,
            height: self.geometry.height
          },
          {
            x: self.geometry.x + self.separator.x,
            y: self.geometry.y,
            width: self.geometry.width - self.separator.x,
            height: self.geometry.height
          }
        ];
      case 3:
        return [
          {
            x: self.geometry.x,
            y: self.geometry.y,
            width: self.separator.x,
            height: self.geometry.height
          },
          {
            x: self.geometry.x + self.separator.x,
            y: self.geometry.y,
            width: self.geometry.width - self.separator.x,
            height: self.separator.y
          },
          {
            x: self.geometry.x + self.separator.x,
            y: self.geometry.y + self.separator.y,
            width: self.geometry.width - self.separator.x,
            height: self.geometry.height - self.separator.y
          }
        ];
      case 4:
        return [
          {
            x: self.geometry.x,
            y: self.geometry.y,
            width: self.separator.x,
            height: self.separator.y
          },
          {
            x: self.geometry.x + self.separator.x,
            y: self.geometry.y,
            width: self.geometry.width - self.separator.x,
            height: self.separator.y
          },
          {
            x: self.geometry.x + self.separator.x,
            y: self.geometry.y + self.separator.y,
            width: self.geometry.width - self.separator.x,
            height: self.geometry.height - self.separator.y
          },
          {
            x: self.geometry.x,
            y: self.geometry.y + self.separator.y,
            width: self.separator.x,
            height: self.geometry.height - self.separator.y
          }
        ];
    }
  };

  this.getWindows = function() {
    return windows.filter(function(window) {
      return (
        window.client.desktop === workspace.currentDesktop &&
        window.client.screen === self.id
      );
    });
  };

  this.tile = function() {
    var included = this.getWindows().slice(0, 4);
    var tiles = this.getTiles(included.length);
    for (var i = 0; i < included.length; i++) {
      included[i].client.geometry = tiles[i];
    }
  };

  this.resize = function(client) {
    var x;
    var y;
    var included = this.getWindows().slice(0, 4);
    switch (findClient(client, included)) {
      case 0:
        x =
          included.length < 2 ? 0 : client.geometry.width - startGeometry.width;
        y =
          included.length < 4
            ? 0
            : client.geometry.height - startGeometry.height;
        break;
      case 1:
        x = startGeometry.width - client.geometry.width;
        y =
          included.length < 3
            ? 0
            : client.geometry.height - startGeometry.height;
        break;
      case 2:
        x = startGeometry.width - client.geometry.width;
        y = startGeometry.height - client.geometry.height;
        break;
      case 3:
        x = client.geometry.width - startGeometry.width;
        y = startGeometry.height - client.geometry.height;
        break;
    }
    self.separator.x += x;
    self.separator.y += y;
    self.tile();
  };
}

workspace.clientAdded.connect(addClient);
workspace.clientRemoved.connect(removeClient);
