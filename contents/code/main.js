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
function fullArea(geometry) {
    var size = gaps$1.size;
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    x -= size;
    y -= size;
    width += size * 2;
    height += size * 2;
    return { x: x, y: y, width: width, height: height };
}
var geometric = {
    clone: clone,
    distance: distance,
    gapArea: gapArea,
    fullArea: fullArea
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
        var includedClients = clients.slice(0, maxClients);
        includedClients.forEach(function (client, index) {
            var tile = tiles[index];
            client.geometry = geometric.gapArea(tile);
        });
    }
    function resizeClient(client, previousGeometry) {
        var newGeometry = client.geometry;
        previousGeometry = previousGeometry;
        if (previousGeometry.x >= separators.v) {
            // Right
            separators.v += newGeometry.x - previousGeometry.x;
            if (previousGeometry.y >= separators.h[1]) {
                // Bottom right
                separators.h[1] += newGeometry.y - previousGeometry.y;
            }
            else {
                // Top right
                separators.h[1] += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
            }
        }
        else {
            separators.v += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
            // Left
            if (previousGeometry.y >= separators.h[0]) {
                // Bottom left
                separators.h[0] += newGeometry.y - previousGeometry.y;
            }
            else {
                // Top left
                separators.h[0] += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
            }
        }
        var maxV = 0.9 * (x + width);
        var minV = x + width * 0.1;
        var maxH = 0.9 * (y + height);
        var minH = y + height * 0.1;
        separators.v = Math.min(Math.max(minV, separators.v), maxV);
        separators.h[0] = Math.min(Math.max(minH, separators.h[0]), maxH);
        separators.h[1] = Math.min(Math.max(minH, separators.h[1]), maxH);
    }
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
    var layout = new SelectedLayout(workspace.clientArea(0, screen, desktop));
    return {
        screen: screen,
        desktop: desktop,
        layout: layout
    };
}

// toplevels[screen][desktop]: Toplevel
var toplevels = [];
function add() {
    workspace.desktops += 1;
    for (var i = 0; i > workspace.numScreens; i++) {
        toplevels[i][workspace.desktops] = toplevel(i, workspace.desktops);
    }
}
function addAll() {
    for (var i = 0; i < workspace.numScreens; i++) {
        toplevels[i] = [];
        for (var j = 1; j <= workspace.desktops; j++) {
            toplevels[i][j] = toplevel(i, j);
        }
    }
}
function remove() {
    toplevels.forEach(function (screen) {
        screen.splice(workspace.currentDesktop, 1);
    });
}
function tileClients(clients) {
    var screens = [];
    var desktops = [];
    clients.forEach(function (client) {
        if (screens.indexOf(client.screen) === -1) {
            screens.push(client.screen);
        }
        if (desktops.indexOf(client.desktop) === -1) {
            desktops.push(client.desktop);
        }
    });
    screens.forEach(function (screen) {
        desktops.forEach(function (desktop) {
            if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
                toplevels[screen][desktop].layout.tileClients(clients);
            }
        });
    });
}
function resizeClient(client, previousGeometry) {
    var screen = client.screen, desktop = client.desktop;
    if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        toplevels[screen][desktop].layout.resizeClient(client, previousGeometry);
    }
}
var toplevelManager = {
    add: add,
    addAll: addAll,
    remove: remove,
    tileClients: tileClients,
    resizeClient: resizeClient
};

var clients = [];
function filter(screen, desktop) {
    var includedClients = clients.filter(function (client) {
        return client.screen === screen && client.desktop && desktop;
    });
    return includedClients;
}
function find(client) {
    var index = -1;
    clients.some(function (includedClient, includedIndex) {
        if (client.windowId === includedClient.windowId) {
            index = includedIndex;
            return true;
        }
    });
    return index;
}
function add$1(client) {
    if (!blacklist.includes(client)) {
        clients.push(client);
        client.clientStartUserMovedResized.connect(startMove);
        client.clientFinishUserMovedResized.connect(finishMove);
        toplevelManager.tileClients(filter(client.screen, client.desktop));
    }
}
function addAll$1() {
    if (config.autoTile) {
        workspace.clientList().forEach(add$1);
    }
}
function remove$1(client) {
    var index = find(client);
    if (index > -1) {
        clients.splice(index, 1);
        client.clientStartUserMovedResized.disconnect(startMove);
        client.clientFinishUserMovedResized.disconnect(finishMove);
        toplevelManager.tileClients(filter(client.screen, client.desktop));
    }
}
function toggle(client) {
    var index = find(client);
    if (index > -1) {
        remove$1(client);
    }
    else {
        add$1(client);
    }
}
function maximize(client, h, v) {
    if (h && v) {
        remove$1(client);
    }
}
function fullScreen(client, fullScreen) {
    if (fullScreen) {
        remove$1(client);
    }
}
var snapshot = { geometry: { x: 0, y: 0, width: 0, height: 0 }, screen: -1 };
function findClosest(indexA, clientA) {
    var closestClientIndex = indexA;
    var closestDistance = geometric.distance(clientA.geometry, snapshot.geometry);
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
            else {
                toplevelManager.resizeClient(client, snapshot.geometry);
            }
            toplevelManager.tileClients(filter(client.screen, client.desktop));
        }
        else {
            toplevelManager.tileClients(filter(client.screen, client.desktop));
            toplevelManager.tileClients(filter(snapshot.screen, client.desktop));
        }
    }
}
var clientManager = {
    add: add$1,
    addAll: addAll$1,
    remove: remove$1,
    toggle: toggle,
    maximize: maximize,
    fullScreen: fullScreen,
    startMove: startMove,
    finishMove: finishMove
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
