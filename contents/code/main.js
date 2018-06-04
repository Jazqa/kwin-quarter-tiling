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
    tileClients();
  }
}

function removeClient(client) {
  var index = findClient(client);
  if (index > -1) {
    print("Removing a client");
    client.geometry = windows[index].geometry;
    windows.splice(index, 1);
    tileClients();
  }
}

function findClient(client) {
  print("Finding a client");
  for (var i = 0; i < windows.length; i++) {
    if (windows[i].client.windowId === client.windowId) {
      return i;
    }
  }
  return -1;
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
}

workspace.clientAdded.connect(addClient);
workspace.clientRemoved.connect(removeClient);
