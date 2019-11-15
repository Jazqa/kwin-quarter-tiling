'use strict';

var kwOptions = options ? options : {};
var kwWorkspace = workspace;
var kwReadConfig = readConfig ? readConfig : function (key, defaultValue) {
  return defaultValue;
};
var kwReadConfigString = function kwReadConfigString(key, defaultValue) {
  return kwReadConfig(key, defaultValue).toString();
};
var kwRegisterShortcut = registerShortcut;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }
var captionBlacklist = ["File Upload", "Move to Trash", "Quit GIMP", "Create a New Image", "QEMU"].concat(_toConsumableArray(kwReadConfigString("ignoredCaptions", "Quit GIMP, Create a New Image").split(", ")), [kwReadConfigString("ignoreJava", false) === "true" ? "sun-awt-x11-xframepeer" : ""]);
var clientBlacklist = ["albert", "kazam", "krunner", "ksmserver", "lattedock", "pinentry", "Plasma", "plasma", "plasma-desktop", "plasmashell", "plugin-container", "simplescreenrecorder", "yakuake"].concat(_toConsumableArray(kwReadConfigString("ignoredClients", "wine, steam, kate").split(", ")));
var minWidth = kwReadConfig("minWidth", 256);
var minHeight = kwReadConfig("minHeight", 256);
var isEligible = function isEligible(client) {
  var isFullScreen = client.geometry.width === kwWorkspace.clientArea(0, client.screen, 0).width && client.geometry.height === kwWorkspace.clientArea(0, client.screen, 0).height;
  return isFullScreen || client.comboBox || client.desktopWindow || client.dialog || client.dndIcon || client.dock || client.dropdownMenu || client.menu || client.minimized || client.notification || client.popupMenu || client.specialWindow || client.splash || client.toolbar || client.tooltip || client.utility || client["transient"] || client.geometry.width < minWidth || client.geometry.height < minHeight || captionBlacklist.indexOf(client.caption.toString()) > -1 || clientBlacklist.indexOf(client.resourceClass.toString()) > -1 || clientBlacklist.indexOf(client.resourceName.toString()) > -1;
};

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var QuarterVertical = function QuarterVertical(availableGeometry) {
  var _this = this;

  _classCallCheck(this, QuarterVertical);

  _defineProperty(this, "maxClients", 4);

  _defineProperty(this, "availableGeometry", void 0);

  _defineProperty(this, "separators", void 0);

  _defineProperty(this, "tiles", []);

  _defineProperty(this, "tileClients", function (clients) {
    clients.slice(0, _this.maxClients - 1).forEach(function (client, index) {
      client.geometry = _this.tiles[index];
    });
  });

  _defineProperty(this, "resizeClient", function (client, snapshot) {});

  this.availableGeometry = availableGeometry;
  var hs = this.availableGeometry.x + this.availableGeometry.width * 0.5;
  var vs = this.availableGeometry.y + this.availableGeometry.height * 0.5;
  this.separators = {
    h: [hs, hs],
    v: vs
  };
};

var tilingLayouts = [QuarterVertical];

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var SelectedTilingLayout = tilingLayouts[kwReadConfigString("layout", 0)];
var QTLayout = function QTLayout(screenId, desktopId) {
  var _this = this;

  _classCallCheck$1(this, QTLayout);

  _defineProperty$1(this, "screenId", void 0);

  _defineProperty$1(this, "desktopId", void 0);

  _defineProperty$1(this, "tilingLayout", void 0);

  _defineProperty$1(this, "getGeometry", function () {
    var fullGeometry = kwWorkspace.clientArea(1, _this.screenId, kwWorkspace.desktopId);
    var availableGeometry = kwWorkspace.clientArea(0, _this.screenId, kwWorkspace.desktopId);
    availableGeometry.width += fullGeometry.x < availableGeometry.x ? availableGeometry.x - fullGeometry.x : 0;
    availableGeometry.height += fullGeometry.y < availableGeometry.y ? availableGeometry.y - fullGeometry.y : 0;
    availableGeometry.width -= availableGeometry.x >= availableGeometry.width ? availableGeometry.x - availableGeometry.width : availableGeometry.x;
    availableGeometry.height -= availableGeometry.y >= availableGeometry.height ? availableGeometry.y - availableGeometry.height : availableGeometry.y;
    return availableGeometry;
  });

  _defineProperty$1(this, "getClients", function () {
    return QTClientManager$1.clients.filter(function (client) {
      return client.screen === _this.screenId && client.desktop === _this.desktopId;
    });
  });

  _defineProperty$1(this, "maxClients", this.tilingLayout.maxClients);

  _defineProperty$1(this, "tileClients", function () {
    _this.tilingLayout.tileClients(_this.getClients());
  });

  _defineProperty$1(this, "resizeClient", this.tilingLayout.resizeClient);

  this.screenId = screenId;
  this.desktopId = desktopId;
  this.tilingLayout = new SelectedTilingLayout(this.getGeometry());
};

function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var QTLayoutManager = function QTLayoutManager() {
  var _this = this;

  _classCallCheck$2(this, QTLayoutManager);

  _defineProperty$2(this, "layouts", []);

  _defineProperty$2(this, "resizeClient", function (client, snapshot) {
    _this.layouts[client.screen][client.desktop].resizeClient(client, snapshot);
  });

  _defineProperty$2(this, "tileLayout", function (screen, desktop) {
    _this.layouts[screen][desktop].tileClients();
  });

  _defineProperty$2(this, "tileLayoutForDesktop", function (desktop) {
    _this.layouts.forEach(function (screen) {
      screen.forEach(function (desktop) {
        desktop.tileClients();
      });
    });
  });

  _defineProperty$2(this, "createDesktop", function () {
    kwWorkspace.desktops += 1;

    for (var i = 0; i > kwWorkspace.numScreens; i++) {
      _this.layouts[i][kwWorkspace.desktops] = new QTLayout(i, kwWorkspace.desktops);
    }
  });

  _defineProperty$2(this, "removeDesktop", function () {
    _this.layouts.forEach(function (screen) {
      screen.splice(kwWorkspace.currentDesktop, 1);
    });
  });

  for (var _i = 0; _i < kwWorkspace.numScreens; _i++) {
    this.layouts[_i] = [];

    for (var j = 1; j <= kwWorkspace.desktops; j++) {
      this.layouts[_i][j] = new QTLayout(_i, j);
    }
  }

  kwWorkspace.currentDesktopChanged.connect(this.tileLayoutForDesktop); // kwWorkspace.desktopPresenceChanged.connect(changeDesktop);
};

var QTLayoutManager$1 = new QTLayoutManager();

function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty$3(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var calculateDistance = function calculateDistance(geometryA, geometryB) {
  return Math.abs(geometryA.x - geometryB.x) + Math.abs(geometryA.y - geometryB.y);
};

var swapClientGeometry = function swapClientGeometry(clientA, clientB) {
  if (clientA.windowId !== clientB.windowId) {
    var temporaryGeometry = _objectSpread({}, clientB.geometry);

    clientB.geometry = _objectSpread({}, clientA.geometry);
    clientA.geometry = temporaryGeometry;
  }
};

var QTClientManager = function QTClientManager() {
  var _this = this;

  _classCallCheck$3(this, QTClientManager);

  _defineProperty$3(this, "clients", []);

  _defineProperty$3(this, "findClient", function (client) {
    return _this.clients.findIndex(function (tiledClient) {
      return client.windowId === tiledClient.windowId;
    });
  });

  _defineProperty$3(this, "addClient", function (client) {
    if (isEligible(client)) {
      _this.clients.push(client);

      client.clientStartUserMovedResized.connect(_this.startMoveClient);
      client.clientFinishUserMovedResized.connect(_this.finishMoveClient);
      QTLayoutManager$1.tileLayout(client.screen, client.desktop);
    }
  });

  _defineProperty$3(this, "removeClient", function (client) {
    var index = _this.findClient(client);

    if (index > -1) {
      _this.clients.splice(index, 1);

      client.clientStartUserMovedResized.disconnect(_this.startMoveClient);
      client.clientFinishUserMovedResized.disconnect(_this.finishMoveClient);
      QTLayoutManager$1.tileLayout(client.screen, client.desktop);
    }
  });

  _defineProperty$3(this, "floatClient", function (client) {
    var index = _this.findClient(client);

    if (index > -1) {
      _this.removeClient(client);
    } else {
      _this.addClient(client);
    }
  });

  _defineProperty$3(this, "maximizeClient", function (client, h, v) {
    if (h && v) {
      _this.removeClient(client);
    }
  });

  _defineProperty$3(this, "fullScreenClient", function (client, fullScreen) {
    if (fullScreen) {
      _this.removeClient(client);
    }
  });

  _defineProperty$3(this, "snapshot", void 0);

  _defineProperty$3(this, "startMoveClient", function (client) {
    _this.snapshot.geometry = client.geometry;
    _this.snapshot.screen = client.screen;
  });

  _defineProperty$3(this, "finishMoveClient", function (client) {
    var index = _this.findClient(client);

    if (index > -1) {
      if (client.screen === _this.snapshot.screen) {
        if (client.geometry.width === _this.snapshot.geometry.width && client.geometry.height === _this.snapshot.geometry.height) {
          swapClientGeometry(client, _this.findClosestClient(client));
        } else {
          QTLayoutManager$1.resizeClient(client, _this.snapshot.geometry);
        }
      } else {
        QTLayoutManager$1.tileLayout(client.screen, client.desktop);
        QTLayoutManager$1.tileLayout(_this.snapshot.screen, client.desktop);
      }
    }
  });

  _defineProperty$3(this, "findClosestClient", function (clientA) {
    var closestClient = clientA;
    var closestDistance = calculateDistance(clientA.geometry, _this.snapshot.geometry);

    _this.clients.forEach(function (clientB) {
      if (clientA.windowId !== clientB.windowId && clientA.screen === clientB.screen && clientA.desktop && clientB.desktop) {
        var distance = calculateDistance(clientA.geometry, clientB.geometry);

        if (distance < closestDistance) {
          closestClient = clientB;
          closestDistance = distance;
        }
      }
    });

    return closestClient;
  });

  kwRegisterShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", this.floatClient);

  if (kwReadConfigString("autoTile", true) === "true") {
    kwWorkspace.clientList().forEach(this.addClient);
    kwWorkspace.clientAdded.connect(this.addClient);
  }

  kwWorkspace.clientRemoved.connect(this.removeClient);
  kwWorkspace.clientMaximizeSet.connect(this.maximizeClient);
  kwWorkspace.clientFullScreenSet.connect(this.fullScreenClient);
  kwWorkspace.clientUnminimized.connect(this.addClient);
  kwWorkspace.clientMinimized.connect(this.removeClient);
} // Add/Remove clients
;

var QTClientManager$1 = new QTClientManager();
