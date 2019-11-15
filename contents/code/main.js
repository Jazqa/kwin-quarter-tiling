'use strict';

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var kwGlobals = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.kwPrint = exports.kwRegisterShortcut = exports.kwReadConfigString = exports.kwReadConfig = exports.kwWorkspace = exports.kwOptions = void 0;
var kwOptions = options ? options : {};
exports.kwOptions = kwOptions;
var kwWorkspace = workspace;
exports.kwWorkspace = kwWorkspace;
var kwReadConfig = readConfig ? readConfig : function (key, defaultValue) {
  return defaultValue;
};
exports.kwReadConfig = kwReadConfig;

var kwReadConfigString = function kwReadConfigString(key, defaultValue) {
  return kwReadConfig(key, defaultValue).toString();
};

exports.kwReadConfigString = kwReadConfigString;
var kwRegisterShortcut = registerShortcut;
exports.kwRegisterShortcut = kwRegisterShortcut;
var kwPrint = print;
exports.kwPrint = kwPrint;
});

unwrapExports(kwGlobals);
var kwGlobals_1 = kwGlobals.kwPrint;
var kwGlobals_2 = kwGlobals.kwRegisterShortcut;
var kwGlobals_3 = kwGlobals.kwReadConfigString;
var kwGlobals_4 = kwGlobals.kwReadConfig;
var kwGlobals_5 = kwGlobals.kwWorkspace;
var kwGlobals_6 = kwGlobals.kwOptions;

var qtBlacklist = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isEligible = void 0;



function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var captionBlacklist = ["File Upload", "Move to Trash", "Quit GIMP", "Create a New Image", "QEMU"].concat(_toConsumableArray((0, kwGlobals.kwReadConfigString)("ignoredCaptions", "Quit GIMP, Create a New Image").split(", ")), [(0, kwGlobals.kwReadConfigString)("ignoreJava", false) === "true" ? "sun-awt-x11-xframepeer" : ""]);
var clientBlacklist = ["albert", "kazam", "krunner", "ksmserver", "lattedock", "pinentry", "Plasma", "plasma", "plasma-desktop", "plasmashell", "plugin-container", "simplescreenrecorder", "yakuake"].concat(_toConsumableArray((0, kwGlobals.kwReadConfigString)("ignoredClients", "wine, steam, kate").split(", ")));
var minWidth = (0, kwGlobals.kwReadConfig)("minWidth", 256);
var minHeight = (0, kwGlobals.kwReadConfig)("minHeight", 256);

var isEligible = function isEligible(client) {
  var isFullScreen = client.geometry.width === kwGlobals.kwWorkspace.clientArea(0, client.screen, 0).width && client.geometry.height === kwGlobals.kwWorkspace.clientArea(0, client.screen, 0).height;

  return isFullScreen || client.comboBox || client.desktopWindow || client.dialog || client.dndIcon || client.dock || client.dropdownMenu || client.menu || client.minimized || client.notification || client.popupMenu || client.specialWindow || client.splash || client.toolbar || client.tooltip || client.utility || client["transient"] || client.geometry.width < minWidth || client.geometry.height < minHeight || captionBlacklist.indexOf(client.caption.toString()) > -1 || clientBlacklist.indexOf(client.resourceClass.toString()) > -1 || clientBlacklist.indexOf(client.resourceName.toString()) > -1;
};

exports.isEligible = isEligible;
});

unwrapExports(qtBlacklist);
var qtBlacklist_1 = qtBlacklist.isEligible;

var quarterVertical = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QuarterVertical = void 0;

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

exports.QuarterVertical = QuarterVertical;
});

unwrapExports(quarterVertical);
var quarterVertical_1 = quarterVertical.QuarterVertical;

var tilingLayouts = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;



var _default = [quarterVertical.QuarterVertical];
exports["default"] = _default;
});

unwrapExports(tilingLayouts);

var qtLayout = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QTLayout = void 0;



var _qtClientManager = _interopRequireDefault(qtClientManager);

var _tilingLayouts = _interopRequireDefault(tilingLayouts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var SelectedTilingLayout = _tilingLayouts["default"][(0, kwGlobals.kwReadConfigString)("layout", 0)];

var QTLayout = function QTLayout(screenId, desktopId) {
  var _this = this;

  _classCallCheck(this, QTLayout);

  _defineProperty(this, "screenId", void 0);

  _defineProperty(this, "desktopId", void 0);

  _defineProperty(this, "tilingLayout", void 0);

  _defineProperty(this, "getGeometry", function () {
    var fullGeometry = kwGlobals.kwWorkspace.clientArea(1, _this.screenId, kwGlobals.kwWorkspace.desktopId);

    var availableGeometry = kwGlobals.kwWorkspace.clientArea(0, _this.screenId, kwGlobals.kwWorkspace.desktopId);

    availableGeometry.width += fullGeometry.x < availableGeometry.x ? availableGeometry.x - fullGeometry.x : 0;
    availableGeometry.height += fullGeometry.y < availableGeometry.y ? availableGeometry.y - fullGeometry.y : 0;
    availableGeometry.width -= availableGeometry.x >= availableGeometry.width ? availableGeometry.x - availableGeometry.width : availableGeometry.x;
    availableGeometry.height -= availableGeometry.y >= availableGeometry.height ? availableGeometry.y - availableGeometry.height : availableGeometry.y;
    return availableGeometry;
  });

  _defineProperty(this, "getClients", function () {
    return _qtClientManager["default"].clients.filter(function (client) {
      return client.screen === _this.screenId && client.desktop === _this.desktopId;
    });
  });

  _defineProperty(this, "maxClients", this.tilingLayout.maxClients);

  _defineProperty(this, "tileClients", function () {
    _this.tilingLayout.tileClients(_this.getClients());
  });

  _defineProperty(this, "resizeClient", this.tilingLayout.resizeClient);

  this.screenId = screenId;
  this.desktopId = desktopId;
  this.tilingLayout = new SelectedTilingLayout(this.getGeometry());
};

exports.QTLayout = QTLayout;
});

unwrapExports(qtLayout);
var qtLayout_1 = qtLayout.QTLayout;

var qtLayoutManager = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;





function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var QTLayoutManager = function QTLayoutManager() {
  var _this = this;

  _classCallCheck(this, QTLayoutManager);

  _defineProperty(this, "layouts", []);

  _defineProperty(this, "resizeClient", function (client, snapshot) {
    _this.layouts[client.screen][client.desktop].resizeClient(client, snapshot);
  });

  _defineProperty(this, "tileLayout", function (screen, desktop) {
    _this.layouts[screen][desktop].tileClients();
  });

  _defineProperty(this, "tileLayoutForDesktop", function (desktop) {
    _this.layouts.forEach(function (screen) {
      screen.forEach(function (desktop) {
        desktop.tileClients();
      });
    });
  });

  _defineProperty(this, "createDesktop", function () {
    kwGlobals.kwWorkspace.desktops += 1;

    for (var i = 0; i > kwGlobals.kwWorkspace.numScreens; i++) {
      _this.layouts[i][kwGlobals.kwWorkspace.desktops] = new qtLayout.QTLayout(i, kwGlobals.kwWorkspace.desktops);
    }
  });

  _defineProperty(this, "removeDesktop", function () {
    _this.layouts.forEach(function (screen) {
      screen.splice(kwGlobals.kwWorkspace.currentDesktop, 1);
    });
  });

  for (var _i = 0; _i < kwGlobals.kwWorkspace.numScreens; _i++) {
    this.layouts[_i] = [];

    for (var j = 1; j <= kwGlobals.kwWorkspace.desktops; j++) {
      this.layouts[_i][j] = new qtLayout.QTLayout(_i, j);
    }
  }

  kwGlobals.kwWorkspace.currentDesktopChanged.connect(this.tileLayoutForDesktop); // kwWorkspace.desktopPresenceChanged.connect(changeDesktop);

};

var _default = new QTLayoutManager();

exports["default"] = _default;
});

unwrapExports(qtLayoutManager);

var qtClientManager = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;





var _qtLayoutManager = _interopRequireDefault(qtLayoutManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

  _classCallCheck(this, QTClientManager);

  _defineProperty(this, "clients", []);

  _defineProperty(this, "findClient", function (client) {
    return _this.clients.findIndex(function (tiledClient) {
      return client.windowId === tiledClient.windowId;
    });
  });

  _defineProperty(this, "addClient", function (client) {
    if ((0, qtBlacklist.isEligible)(client)) {
      _this.clients.push(client);

      client.clientStartUserMovedResized.connect(_this.startMoveClient);
      client.clientFinishUserMovedResized.connect(_this.finishMoveClient);

      _qtLayoutManager["default"].tileLayout(client.screen, client.desktop);
    }
  });

  _defineProperty(this, "removeClient", function (client) {
    var index = _this.findClient(client);

    if (index > -1) {
      _this.clients.splice(index, 1);

      client.clientStartUserMovedResized.disconnect(_this.startMoveClient);
      client.clientFinishUserMovedResized.disconnect(_this.finishMoveClient);

      _qtLayoutManager["default"].tileLayout(client.screen, client.desktop);
    }
  });

  _defineProperty(this, "floatClient", function (client) {
    var index = _this.findClient(client);

    if (index > -1) {
      _this.removeClient(client);
    } else {
      _this.addClient(client);
    }
  });

  _defineProperty(this, "maximizeClient", function (client, h, v) {
    if (h && v) {
      _this.removeClient(client);
    }
  });

  _defineProperty(this, "fullScreenClient", function (client, fullScreen) {
    if (fullScreen) {
      _this.removeClient(client);
    }
  });

  _defineProperty(this, "snapshot", void 0);

  _defineProperty(this, "startMoveClient", function (client) {
    _this.snapshot.geometry = client.geometry;
    _this.snapshot.screen = client.screen;
  });

  _defineProperty(this, "finishMoveClient", function (client) {
    var index = _this.findClient(client);

    if (index > -1) {
      if (client.screen === _this.snapshot.screen) {
        if (client.geometry.width === _this.snapshot.geometry.width && client.geometry.height === _this.snapshot.geometry.height) {
          swapClientGeometry(client, _this.findClosestClient(client));
        } else {
          _qtLayoutManager["default"].resizeClient(client, _this.snapshot.geometry);
        }
      } else {
        _qtLayoutManager["default"].tileLayout(client.screen, client.desktop);

        _qtLayoutManager["default"].tileLayout(_this.snapshot.screen, client.desktop);
      }
    }
  });

  _defineProperty(this, "findClosestClient", function (clientA) {
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

  (0, kwGlobals.kwRegisterShortcut)("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", this.floatClient);

  if ((0, kwGlobals.kwReadConfigString)("autoTile", true) === "true") {
    kwGlobals.kwWorkspace.clientList().forEach(this.addClient);

    kwGlobals.kwWorkspace.clientAdded.connect(this.addClient);
  }

  kwGlobals.kwWorkspace.clientRemoved.connect(this.removeClient);

  kwGlobals.kwWorkspace.clientMaximizeSet.connect(this.maximizeClient);

  kwGlobals.kwWorkspace.clientFullScreenSet.connect(this.fullScreenClient);

  kwGlobals.kwWorkspace.clientUnminimized.connect(this.addClient);

  kwGlobals.kwWorkspace.clientMinimized.connect(this.removeClient);
} // Add/Remove clients
;

var _default = new QTClientManager();

exports["default"] = _default;
});

unwrapExports(qtClientManager);

var compiled = createCommonjsModule(function (module) {

var _qtClientManager = _interopRequireDefault(qtClientManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
});

var index = unwrapExports(compiled);

module.exports = index;
