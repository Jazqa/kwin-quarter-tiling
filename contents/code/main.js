// -----------------------------------------------------------------
// KWin - Quarter Tiling: A Tiling Script for the KWin Window Manager
// -----------------------------------------------------------------

print("Quarter Tiling initialized");

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
  this.separator = {
    x: this.geometry.x + this.geometry.width / 2,
    y: this.geometry.y + this.geometry.height / 2
  };

  this.tiles = [
    {
      x: this.geometry.x,
      y: this.geometry.y,
      width: this.separator.x,
      height: this.separator.y
    },
    {
      x: this.geometry.x - this.separator.x,
      y: this.geometry.y,
      width: this.geometry.width - this.separator.x,
      height: this.separator.y
    },
    {
      x: this.geometry.x,
      y: this.geometry.y - this.separator.y,
      width: this.separator.x,
      height: this.geometry.height - this.separator.y
    },
    {
      x: this.geometry.x - this.separator.x,
      y: this.geometry.y - this.separator.y,
      width: this.geometry.width - this.separator.x,
      height: this.geometry.height - this.separator.y
    }
  ];
  
  this.windows = [];
  
  this.getWindows = function() {
    self.windows = windows.filter(function(window) {
      return window.client.desktop === workspace.currentDesktop && window.client.screen === self.id
    });
  }
  
  this.tile = function() {
    this.getWindows();
    for (var i = 0; i < self.windows.length; i++) {
      if (i < 3) {
        self.windows[i].client.geometry = self.tiles[i]
      }
    }
  }
}

workspace.clientAdded.connect(addClient);
workspace.clientRemoved.connect(removeClient);
