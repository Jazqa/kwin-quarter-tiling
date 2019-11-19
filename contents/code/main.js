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
var margins = {
    top: readConfig("marginTop", 0),
    left: readConfig("marginLeft", 0),
    bottom: readConfig("marginBottom", 0),
    right: readConfig("marginRight", 0)
};
var config = {
    ignoredCaptions: ignoredCaptions,
    ignoredClients: ignoredClients,
    ignoredDesktops: ignoredDesktops,
    ignoredScreens: ignoredScreens,
    minWidth: minWidth,
    minHeight: minHeight,
    gaps: gaps,
    margins: margins,
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
    increase: increase,
    decrease: decrease,
    get size() {
        return size;
    }
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

function getTiles(geometry, separators, count) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    var v = separators.v, h = separators.h;
    var tiles = [
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
    if (count < 4) {
        tiles[0].height = tiles[3].y + tiles[3].height - tiles[0].y;
    }
    if (count < 3) {
        tiles[1].height = tiles[2].y + tiles[2].height - tiles[1].y;
    }
    if (count < 2) {
        tiles[0].width = tiles[1].x + tiles[1].width - tiles[0].x;
    }
    return tiles;
}
function QuarterVertical(geometry) {
    var maxClients = 4;
    var hs = geometry.y + geometry.height * 0.5;
    var vs = geometry.x + geometry.width * 0.5;
    var separators = { h: [hs, hs], v: vs };
    function adjustGeometry(newGeometry) {
        separators.v += (geometry.width - newGeometry.width) * 0.5;
        separators.h[0] += (geometry.height - newGeometry.height) * 0.5;
        separators.h[1] += (geometry.height - newGeometry.height) * 0.5;
        geometry = newGeometry;
    }
    function tileClients(clients) {
        var includedClients = clients.slice(0, maxClients);
        var tiles = getTiles(geometry, separators, includedClients.length);
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
        var maxV = 0.9 * (geometry.x + geometry.width);
        var minV = geometry.x + geometry.width * 0.1;
        var maxH = 0.9 * (geometry.y + geometry.height);
        var minH = geometry.y + geometry.height * 0.1;
        separators.v = Math.min(Math.max(minV, separators.v), maxV);
        separators.h[0] = Math.min(Math.max(minH, separators.h[0]), maxH);
        separators.h[1] = Math.min(Math.max(minH, separators.h[1]), maxH);
    }
    return {
        maxClients: maxClients,
        tileClients: tileClients,
        resizeClient: resizeClient,
        geometry: geometry,
        separators: separators,
        adjustGeometry: adjustGeometry
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
function availableArea(geometry) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    y += gaps$1.size + config.margins.top;
    x += gaps$1.size + config.margins.left;
    height -= gaps$1.size * 2 + config.margins.top + config.margins.bottom;
    width -= gaps$1.size * 2 + config.margins.left + config.margins.right;
    return { x: x, y: y, width: width, height: height };
}
function toplevel(screen, desktop) {
    var geometry = availableArea(workspace.clientArea(0, screen, desktop));
    var layout = new SelectedLayout(geometry);
    function tileClients(clients) {
        var currentGeometry = availableArea(workspace.clientArea(0, screen, desktop));
        if (geometry.width !== currentGeometry.width || geometry.height !== currentGeometry.height) {
            layout.adjustGeometry(currentGeometry);
            geometry = currentGeometry;
        }
        layout.tileClients(clients);
    }
    return {
        screen: screen,
        desktop: desktop,
        layout: layout,
        tileClients: tileClients
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
                toplevels[screen][desktop].tileClients(clients.filter(function (client) {
                    return client.screen === screen && client.desktop === desktop;
                }));
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
function maxClients(screen, desktop) {
    if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        return toplevels[screen][desktop].layout.maxClients;
    }
}
function isFull(clients, screen, desktop) {
    if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        return clients.length >= toplevels[screen][desktop].layout.maxClients;
    }
}
function isEmpty(clients, screen, desktop) {
    if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        return clients.length === 0;
    }
}
var toplevelManager = {
    add: add,
    addAll: addAll,
    remove: remove,
    tileClients: tileClients,
    resizeClient: resizeClient,
    maxClients: maxClients,
    isFull: isFull,
    isEmpty: isEmpty
};

var clients = [];
function filter(screen, desktop) {
    var includedClients = clients.filter(function (client) {
        return client.screen === screen && client.desktop === desktop;
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
    var screen = client.screen, desktop = client.desktop;
    if (!blacklist.includes(client)) {
        clients.push(client);
        client.clientStartUserMovedResized.connect(startMove);
        client.clientFinishUserMovedResized.connect(finishMove);
        tileAll(screen, desktop);
    }
}
function addAll$1() {
    if (config.autoTile) {
        workspace.clientList().forEach(add$1);
    }
}
function remove$1(client, index) {
    index = index || find(client);
    if (index > -1) {
        clients.splice(index, 1);
        client.clientStartUserMovedResized.disconnect(startMove);
        client.clientFinishUserMovedResized.disconnect(finishMove);
        tileAll(client.screen, client.desktop);
    }
}
function toggle(client, index) {
    index = index || find(client);
    if (index > -1) {
        remove$1(client, index);
    }
    else {
        add$1(client);
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
                resize(client, snapshot.geometry);
            }
        }
        else {
            tileAll(snapshot.screen, client.desktop);
        }
        tileAll(client.screen, client.desktop);
    }
}
function swap(i, j) {
    var t = clients[i];
    clients[i] = clients[j];
    clients[j] = t;
}
function resize(client, previousGeometry) {
    toplevelManager.resizeClient(client, previousGeometry);
}
function tileAll(screen, desktop) {
    var includedClients = filter(screen, desktop);
    // Removes extra clients that exist on the toplevel
    while (includedClients.length > toplevelManager.maxClients(screen, desktop)) {
        var removableClient = includedClients.splice(includedClients.length - 1, 1)[0];
        remove$1(removableClient);
    }
    toplevelManager.tileClients(includedClients);
}
var clientManager = {
    add: add$1,
    addAll: addAll$1,
    remove: remove$1,
    toggle: toggle,
    startMove: startMove,
    finishMove: finishMove,
    resize: resize,
    tileAll: tileAll
};

var registerShortcut = 
// @ts-ignore, KWin global
registerShortcut ||
    function () {
        // This is never called
        // Exists as a dumb workaround to make this file have a "side-effect" on the project and be included in rollup
        workspace.currentDesktop = workspace.currentDesktop;
    };
function registerShortcuts() {
    registerShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", function () {
        return clientManager.toggle(workspace.activeClient);
    });
    registerShortcut("Quarter: + Gap Size", "Quarter: + Gap Size", "Meta+Shift+PgUp", function () {
        gaps$1.increase();
        for (var i = 0; i < workspace.numScreens; i++) {
            clientManager.tileAll(i, workspace.currentDesktop);
        }
    });
    registerShortcut("Quarter: - Gap Size", "Quarter: - Gap Size", "Meta+Shift+PgDown", function () {
        gaps$1.decrease();
        for (var i = 0; i < workspace.numScreens; i++) {
            clientManager.tileAll(i, workspace.currentDesktop);
        }
    });
}
var shortcuts = {
    registerShortcuts: registerShortcuts
};

function registerSignals() {
    if (config.autoTile) {
        workspace.clientAdded.connect(function (client) {
            if (client) {
                clientManager.add(client);
            }
        });
    }
    workspace.clientUnminimized.connect(function (client) {
        if (client) {
            clientManager.add(client);
        }
    });
    workspace.clientRemoved.connect(function (client) {
        if (client) {
            clientManager.remove(client);
        }
    });
    workspace.clientMinimized.connect(function (client) {
        if (client) {
            clientManager.remove(client);
        }
    });
    workspace.clientMaximizeSet.connect(function (client, h, v) {
        if (client && h && v) {
            clientManager.remove(client);
        }
        else if (client && !h && !v) {
            clientManager.add(client);
        }
    });
    workspace.clientFullScreenSet.connect(function (client, fs) {
        if (client && fs) {
            clientManager.remove(client);
        }
    });
    workspace.desktopPresenceChanged.connect(function (client, desktop) {
        if (client) {
            clientManager.tileAll(client.screen, desktop);
        }
    });
    workspace.clientActivated.connect(function (client) {
        if (client) {
            clientManager.tileAll(client.screen, client.desktop);
        }
    });
    /*
  
    workspace.screenResized.connect((screen: number) => {
      clientManager.tileAll(screen, workspace.currentDesktop);
    });
  
    workspace.currentDesktopChanged.connect((desktop: number, client: Client) => {
      for (var i = 0; i < workspace.numScreens; i++) {
        clientManager.tileAll(i, desktop);
      }
    });
  
    */
}
var signals = {
    registerSignals: registerSignals
};

toplevelManager.addAll();
clientManager.addAll();
shortcuts.registerShortcuts();
signals.registerSignals();
