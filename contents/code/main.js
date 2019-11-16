'use strict';

var __spreadArrays = (undefined && undefined.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var readConfig = 
// @ts-ignore, KWin global
readConfig ||
    function (key, defaultValue) {
        return defaultValue;
    };
function readConfigString(key, defaultValue) {
    return readConfig(key, defaultValue).toString();
}
var ignoredCaptions = __spreadArrays([
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
], readConfigString("ignoredClients", "wine, steam, kate").split(", "));
var ignoredClients = __spreadArrays([
    "File Upload",
    "Move to Trash",
    "Quit GIMP",
    "Create a New Image",
    "QEMU"
], readConfigString("ignoredCaptions", "Quit GIMP, Create a New Image").split(", "), [readConfigString("ignoreJava", false) === "true" ? "sun-awt-x11-xframepeer" : ""]);
var ignoredDesktops = readConfigString("ignoredDesktops", "").split(", ");
var ignoredScreens = readConfigString("ignoredScreens", "").split(", ");
var minWidth = readConfig("minWidth", 256);
var minHeight = readConfig("minHeight", 256);
var gaps = readConfig("gaps", 8);
var autoTile = readConfigString("autoTile", true) === "true";
var layout = readConfigString("layout", 0);
var config = {
    ignoredCaptions: ignoredCaptions,
    ignoredClients: ignoredClients,
    ignoredDesktops: ignoredDesktops,
    ignoredScreens: ignoredScreens,
    minWidth: minWidth,
    minHeight: minHeight,
    gaps: gaps,
    autoTile: autoTile,
    layout: layout
};

// @ts-ignore, KWin global
// @ts-ignore, KWin global
var workspace = workspace || {};

function includes(client) {
    var isMaximized = client.geometry.width === workspace.clientArea(0, client.screen, 0).width &&
        client.geometry.height === workspace.clientArea(0, client.screen, 0).height;
    return isMaximized ||
        client.comboBox ||
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
        client.desktop < 1 ||
        client.screen < 0 ||
        client.geometry.width < config.minWidth ||
        client.geometry.height < config.minHeight ||
        config.ignoredCaptions.indexOf(client.caption.toString()) > -1 ||
        config.ignoredClients.indexOf(client.resourceClass.toString()) > -1 ||
        config.ignoredClients.indexOf(client.resourceName.toString()) > -1 ||
        config.ignoredDesktops.indexOf(client.desktop.toString()) > -1 ||
        config.ignoredScreens.indexOf(client.screen.toString()) > -1
        ? true
        : false;
}
var blacklist = {
    includes: includes
};

var size = config.gaps;
var adjust = function (amount) {
    // Note: Gap size can't be zero, because it would screw up the maximized window logic
    var min = 2;
    var max = 64;
    size = Math.min(Math.max(size + amount, min), max);
};
function increase() {
    adjust(2);
}
function decrease() {
    adjust(-2);
}
var gaps$1 = {
    size: size,
    increase: increase,
    decrease: decrease
};

function clone(geometry) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    return { x: x, y: y, width: width, height: height };
}
function distance(geometryA, geometryB) {
    return Math.abs(geometryA.x - geometryB.x) + Math.abs(geometryA.y - geometryB.y);
}
function gapArea(geometry) {
    var size = gaps$1.size;
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    x += size;
    y += size;
    width -= size * 2;
    height -= size * 2;
    return { x: x, y: y, width: width, height: height };
}
function freeArea(geometryA, geometryB) {
    geometryA.width += geometryB.x < geometryA.x ? geometryA.x - geometryB.x : 0;
    geometryA.height += geometryB.y < geometryA.y ? geometryA.y - geometryB.y : 0;
    geometryA.width -= geometryA.x >= geometryA.width ? geometryA.x - geometryA.width : geometryA.x;
    geometryA.height -= geometryA.y >= geometryA.height ? geometryA.y - geometryA.height : geometryA.y;
    return geometryA;
}
var geometric = {
    clone: clone,
    distance: distance,
    gapArea: gapArea,
    freeArea: freeArea
};

var clients = [];
function find(client) {
    var index = -1;
    this.clients.some(function (includedClient, includedIndex) {
        if (client.windowId === includedClient.windowId) {
            index = includedIndex;
            return true;
        }
    });
    return index;
}
function add(client) {
    if (!blacklist.includes(client)) {
        clients.push(client);
        client.clientStartUserMovedResized.connect(this.startMoveClient);
        client.clientFinishUserMovedResized.connect(this.finishMoveClient);
        // TODO: tile(clients, client.screen, client.desktop);
    }
}
function addAll() {
    if (config.autoTile) {
        workspace.clientList().forEach(add);
    }
}
function remove(client) {
    var index = this.findClient(client);
    if (index > -1) {
        this.clients.splice(index, 1);
        client.clientStartUserMovedResized.disconnect(this.startMoveClient);
        client.clientFinishUserMovedResized.disconnect(this.finishMoveClient);
        // TODO: tile(clients, client.screen, client.desktop);
    }
}
function toggle(client) {
    var index = this.findClient(client);
    if (index > -1) {
        this.removeClient(client);
    }
    else {
        this.addClient(client);
    }
}
function maximize(client, h, v) {
    if (h && v) {
        this.removeClient(client);
    }
}
function fullScreen(client, fullScreen) {
    if (fullScreen) {
        this.removeClient(client);
    }
}
var snapshot = { geometry: { x: 0, y: 0, width: 0, height: 0 }, screen: -1 };
function findClosest(indexA, clientA) {
    var closestClientIndex = indexA;
    var closestDistance = geometric.distance(clientA.geometry, this.snapshot.geometry);
    clients.forEach(function (clientB, indexB) {
        if (clientA.windowId !== clientB.windowId &&
            clientA.screen === clientB.screen &&
            clientA.desktop &&
            clientB.desktop) {
            var distance = geometric.distance(clientA.geometry, clientB.geometry);
            if (distance < closestDistance) {
                closestClientIndex = indexB;
                closestDistance = distance;
            }
        }
    });
    return closestClientIndex;
}
function swap(i, j) {
    var t = clients[i];
    clients[i] = clients[j];
    clients[j] = t;
}
function startMove(client) {
    snapshot.geometry = client.geometry;
    snapshot.screen = client.screen;
}
function finishMove(client) {
    var index = find(client);
    if (index > -1) {
        if (client.screen === snapshot.screen) {
            if (client.geometry.width === snapshot.geometry.width && client.geometry.height === snapshot.geometry.height) {
                swap(index, findClosest(index, client));
            }
        }
    }
}
var clientManager = {
    add: add,
    addAll: addAll,
    remove: remove,
    toggle: toggle,
    maximize: maximize,
    fullScreen: fullScreen,
    startMove: startMove,
    finishMove: finishMove
};

function getTiles(geometry, separators) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    var v = separators.v, h = separators.h;
    return [
        {
            x: x,
            y: y,
            width: v - x,
            height: h[0] - y
        },
        {
            x: v,
            y: y,
            width: x + width - v,
            height: h[1] - y
        },
        {
            x: v,
            y: h[1],
            width: x + width - v,
            height: y + height - h[1]
        },
        {
            x: x,
            y: h[0],
            width: v - x,
            height: y + height - h[0]
        }
    ];
}
function QuarterVertical(geometry) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    var maxClients = 4;
    var hs = y + height * 0.5;
    var vs = x + width * 0.5;
    var separators = { h: [hs, hs], v: vs };
    function tileClients(clients) {
        var tiles = getTiles(geometry, separators);
        var includedClients = clients.slice(0, maxClients - 1);
        includedClients.forEach(function (client, index) {
            var tile = tiles[index];
            client.geometry = geometric.gapArea(tile);
        });
    }
    function resizeClient(client, previousGeometry) { }
    return {
        maxClients: maxClients,
        tileClients: tileClients,
        resizeClient: resizeClient,
        geometry: geometry,
        separators: separators
    };
}

/*
 * Adding a new layout to the script and its options:
 *
 *  1. Create a new class that inside src/layouts folder, make sure it implements the Layout interface as seen in /src/layout.ts
 *  2. Add an entry to the layouts object in src/layouts/layouts.ts, increasing the key by one:
 *      { "0": QuarterVertical, "1": NewLayout }
 *  3. Add a new entry to the kcfg_layouts entry in contents/code/config.ui:
 *      <property name="text">
 *          <string>NewLayout</string>
 *      </property>
 */
var layouts = { "0": QuarterVertical };

var SelectedLayout = layouts[config.layout];
function toplevel(screen, desktop) {
    var screenGeometry = geometric.freeArea(workspace.clientArea(1, screen, desktop), workspace.clientArea(0, screen, desktop));
    var layout = new SelectedLayout(screenGeometry);
    return {
        screen: screen,
        desktop: desktop,
        layout: layout
    };
}

// toplevels[screen][desktop]: Toplevel
var toplevels = [];
function add$1() {
    workspace.desktops += 1;
    for (var i = 0; i > workspace.numScreens; i++) {
        toplevels[i][workspace.desktops] = toplevel(i, workspace.desktops);
    }
}
function addAll$1() {
    for (var i = 0; i < workspace.numScreens; i++) {
        this.layouts[i] = [];
        for (var j = 1; j <= workspace.desktops; j++) {
            this.layouts[i][j] = toplevel(i, j);
        }
    }
}
function remove$1() {
    toplevels.forEach(function (screen) {
        screen.splice(workspace.currentDesktop, 1);
    });
}
var toplevelManager = {
    add: add$1,
    addAll: addAll$1,
    remove: remove$1
};

function registerSignals() {
    if (config.autoTile) {
        workspace.clientAdded.connect(clientManager.add);
    }
    workspace.clientRemoved.connect(clientManager.remove);
    workspace.clientMaximizeSet.connect(clientManager.maximize);
    workspace.clientFullScreenSet.connect(clientManager.fullScreen);
    workspace.clientUnminimized.connect(clientManager.add);
    workspace.clientMinimized.connect(clientManager.remove);
    // workspace.currentDesktopChanged.connect(currentDesktopChanged);
    // workspace.desktopPresenceChanged.connect(desktopPresenceChanged);
}
var signals = {
    registerSignals: registerSignals
};

clientManager.addAll();
toplevelManager.addAll();
signals.registerSignals();
