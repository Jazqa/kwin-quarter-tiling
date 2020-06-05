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
var ignoredClients = __spreadArrays([
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
    "yakuake",
    "ksmserver-logout-greeter",
    "QEMU",
    "Latte Dock"
], readConfigString("ignoredClients", "wine, steam").split(", "), [readConfigString("ignoreJava", false) === "true" ? "sun-awt-x11-xframepeer" : ""]);
var ignoredCaptions = __spreadArrays([
    "File Upload",
    "Move to Trash",
    "Quit GIMP",
    "Create a New Image"
], readConfigString("ignoredCaptions", "Quit GIMP, Create a New Image")
    .split(", ")
    .filter(function (caption) { return caption; }));
var ignoredDesktops = readConfigString("ignoredDesktops", "").split(", ");
var ignoredScreens = readConfigString("ignoredScreens", "").split(", ");
function isIgnoredDesktop(desktop) {
    return ignoredDesktops.indexOf(desktop.toString()) > -1;
}
function isIgnoredScreen(screen) {
    return ignoredScreens.indexOf(screen.toString()) > -1;
}
var minWidth = readConfig("minWidth", 256);
var minHeight = readConfig("minHeight", 256);
var gaps = readConfig("gap", 8);
var maxClients = readConfig("maxClients", -1);
var autoTile = readConfigString("autoTile", true) === "true";
var followClients = readConfigString("followClients", true) === "true";
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
    isIgnoredDesktop: isIgnoredDesktop,
    isIgnoredScreen: isIgnoredScreen,
    minWidth: minWidth,
    minHeight: minHeight,
    gaps: gaps,
    maxClients: maxClients,
    margins: margins,
    autoTile: autoTile,
    followClients: followClients,
    layout: layout
};

// @ts-ignore, KWin global
// @ts-ignore, KWin global
var workspace = workspace || {};

function includes(client) {
    var isMaximized = client.geometry.width === workspace.clientArea(2, client.screen, 0).width &&
        client.geometry.height === workspace.clientArea(2, client.screen, 0).height;
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
        client.shade ||
        client.toolbar ||
        client.tooltip ||
        client.utility ||
        client.transient ||
        client.desktop < 1 ||
        client.screen < 0 ||
        client.geometry.width < config.minWidth ||
        client.geometry.height < config.minHeight ||
        config.ignoredCaptions.some(function (caption) { return client.caption.toString().toLowerCase().indexOf(caption.toLowerCase()) > -1; }) ||
        config.ignoredClients.indexOf(client.resourceClass.toString()) > -1 ||
        config.ignoredClients.indexOf(client.resourceName.toString()) > -1 ||
        config.isIgnoredDesktop(client.desktop) ||
        config.isIgnoredScreen(client.screen)
        ? true
        : false;
}
var blacklist = {
    includes: includes,
};

var size = config.gaps;
var adjust = function (amount) {
    // Note: Gap size can't be zero, because it would screw up the maximized window logic
    var min = 1;
    var max = 64;
    size = Math.min(Math.max(size + amount, min), max);
};
function increase() {
    adjust(1);
}
function decrease() {
    adjust(-1);
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
function moveTo(geometryA, geometryB) {
    var geometryC = clone(geometryB);
    geometryC.height = geometryA.height;
    geometryC.width = geometryA.width;
    return geometryC;
}
function center(geometryA, geometryB) {
    geometryB.x += geometryB.width * 0.5 - geometryA.width * 0.5;
    geometryB.y += geometryB.height * 0.5 - geometryA.height * 0.5;
    return moveTo(geometryA, geometryB);
}
var geometryUtils = {
    clone: clone,
    distance: distance,
    gapArea: gapArea,
    fullArea: fullArea,
    moveTo: moveTo,
    center: center
};

function getTiles(geometry, separators, count) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    var v = separators.v, h = separators.h;
    var tiles = [
        {
            x: x,
            y: y,
            width: v - x,
            height: h[0] - y,
        },
        {
            x: v,
            y: y,
            width: x + width - v,
            height: h[1] - y,
        },
        {
            x: v,
            y: h[1],
            width: x + width - v,
            height: y + height - h[1],
        },
        {
            x: x,
            y: h[0],
            width: v - x,
            height: y + height - h[0],
        },
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
function QuarterHorizontal(geometry) {
    var maxClients = 4;
    var hs = geometry.y + geometry.height * 0.5;
    var vs = geometry.x + geometry.width * 0.5;
    var separators = { h: [hs, hs], v: vs };
    function restore() {
        hs = geometry.y + geometry.height * 0.5;
        vs = geometry.x + geometry.width * 0.5;
        separators = { h: [hs, hs], v: vs };
    }
    function adjustGeometry(newGeometry) {
        geometry = newGeometry;
        restore();
    }
    function tileClients(clients) {
        var includedClients = clients.slice(0, maxClients);
        var tiles = getTiles(geometry, separators, includedClients.length);
        includedClients.forEach(function (client, index) {
            var tile = tiles[index];
            client.geometry = geometryUtils.gapArea(tile);
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
        restore: restore,
        maxClients: maxClients,
        tileClients: tileClients,
        resizeClient: resizeClient,
        geometry: geometry,
        separators: separators,
        adjustGeometry: adjustGeometry,
    };
}

function getTiles$1(geometry, separators, count) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    var v = separators.v, h = separators.h;
    var tiles = [
        {
            x: x,
            y: y,
            width: v - x,
            height: h - y,
        },
        {
            x: v,
            y: y,
            width: x + width - v,
            height: h - y,
        },
        {
            x: v,
            y: h,
            width: x + width - v,
            height: y + height - h,
        },
        {
            x: x,
            y: h,
            width: v - x,
            height: y + height - h,
        },
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
function QuarterSingleHorizontal(geometry) {
    var maxClients = 4;
    var hs = geometry.y + geometry.height * 0.5;
    var vs = geometry.x + geometry.width * 0.5;
    var separators = { h: hs, v: vs };
    function restore() {
        hs = geometry.y + geometry.height * 0.5;
        vs = geometry.x + geometry.width * 0.5;
        separators = { h: hs, v: vs };
    }
    function adjustGeometry(newGeometry) {
        geometry = newGeometry;
        restore();
    }
    function tileClients(clients) {
        var includedClients = clients.slice(0, maxClients);
        var tiles = getTiles$1(geometry, separators, includedClients.length);
        includedClients.forEach(function (client, index) {
            var tile = tiles[index];
            client.geometry = geometryUtils.gapArea(tile);
        });
    }
    function resizeClient(client, previousGeometry) {
        var newGeometry = client.geometry;
        previousGeometry = previousGeometry;
        if (previousGeometry.x >= separators.v) {
            separators.v += newGeometry.x - previousGeometry.x;
        }
        else {
            separators.v += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
        }
        if (previousGeometry.y >= separators.h) {
            separators.h += newGeometry.y - previousGeometry.y;
        }
        else {
            separators.h += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
        }
        var maxV = 0.9 * (geometry.x + geometry.width);
        var minV = geometry.x + geometry.width * 0.1;
        var maxH = 0.9 * (geometry.y + geometry.height);
        var minH = geometry.y + geometry.height * 0.1;
        separators.v = Math.min(Math.max(minV, separators.v), maxV);
        separators.h = Math.min(Math.max(minH, separators.h), maxH);
    }
    return {
        restore: restore,
        maxClients: maxClients,
        tileClients: tileClients,
        resizeClient: resizeClient,
        geometry: geometry,
        separators: separators,
        adjustGeometry: adjustGeometry,
    };
}

function getTiles$2(geometry, separators, count) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    var v = separators.v, h = separators.h;
    var tiles = [
        {
            x: x,
            y: y,
            width: v - x,
            height: h - y,
        },
        {
            x: x,
            y: h,
            width: v - x,
            height: y + height - h,
        },
        {
            x: v,
            y: h,
            width: x + width - v,
            height: y + height - h,
        },
        {
            x: v,
            y: y,
            width: x + width - v,
            height: h - y,
        },
    ];
    if (count < 4) {
        tiles[0].width = tiles[3].x + tiles[3].width - tiles[0].x;
    }
    if (count < 3) {
        tiles[1].width = tiles[2].x + tiles[2].width - tiles[1].x;
    }
    if (count < 2) {
        tiles[0].height = tiles[1].y + tiles[1].height - tiles[0].y;
    }
    return tiles;
}
function QuarterSingleVertical(geometry) {
    var maxClients = 4;
    var hs = geometry.y + geometry.height * 0.5;
    var vs = geometry.x + geometry.width * 0.5;
    var separators = { h: hs, v: vs };
    function restore() {
        hs = geometry.y + geometry.height * 0.5;
        vs = geometry.x + geometry.width * 0.5;
        separators = { h: hs, v: vs };
    }
    function adjustGeometry(newGeometry) {
        geometry = newGeometry;
        restore();
    }
    function tileClients(clients) {
        var includedClients = clients.slice(0, maxClients);
        var tiles = getTiles$2(geometry, separators, includedClients.length);
        includedClients.forEach(function (client, index) {
            var tile = tiles[index];
            client.geometry = geometryUtils.gapArea(tile);
        });
    }
    function resizeClient(client, previousGeometry) {
        var newGeometry = client.geometry;
        previousGeometry = previousGeometry;
        if (previousGeometry.x >= separators.v) {
            separators.v += newGeometry.x - previousGeometry.x;
        }
        else {
            separators.v += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
        }
        if (previousGeometry.y >= separators.h) {
            separators.h += newGeometry.y - previousGeometry.y;
        }
        else {
            separators.h += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
        }
        var maxV = 0.9 * (geometry.x + geometry.width);
        var minV = geometry.x + geometry.width * 0.1;
        var maxH = 0.9 * (geometry.y + geometry.height);
        var minH = geometry.y + geometry.height * 0.1;
        separators.v = Math.min(Math.max(minV, separators.v), maxV);
        separators.h = Math.min(Math.max(minH, separators.h), maxH);
    }
    return {
        restore: restore,
        maxClients: maxClients,
        tileClients: tileClients,
        resizeClient: resizeClient,
        geometry: geometry,
        separators: separators,
        adjustGeometry: adjustGeometry,
    };
}

function getTiles$3(geometry, separators, count) {
    var x = geometry.x, y = geometry.y, width = geometry.width, height = geometry.height;
    var v = separators.v, h = separators.h;
    var tiles = [
        {
            x: x,
            y: y,
            width: v[0] - x,
            height: h - y,
        },
        {
            x: x,
            y: h,
            width: v[1] - x,
            height: y + height - h,
        },
        {
            x: v[1],
            y: h,
            width: x + width - v[1],
            height: y + height - h,
        },
        {
            x: v[0],
            y: y,
            width: x + width - v[0],
            height: h - y,
        },
    ];
    if (count < 4) {
        tiles[0].width = tiles[3].x + tiles[3].width - tiles[0].x;
    }
    if (count < 3) {
        tiles[1].width = tiles[2].x + tiles[2].width - tiles[1].x;
    }
    if (count < 2) {
        tiles[0].height = tiles[1].y + tiles[1].height - tiles[0].y;
    }
    return tiles;
}
function QuarterVertical(geometry) {
    var maxClients = 4;
    var hs = geometry.y + geometry.height * 0.5;
    var vs = geometry.x + geometry.width * 0.5;
    var separators = { h: hs, v: [vs, vs] };
    function restore() {
        hs = geometry.y + geometry.height * 0.5;
        vs = geometry.x + geometry.width * 0.5;
        separators = { h: hs, v: [vs, vs] };
    }
    function adjustGeometry(newGeometry) {
        geometry = newGeometry;
        restore();
    }
    function tileClients(clients) {
        var includedClients = clients.slice(0, maxClients);
        var tiles = getTiles$3(geometry, separators, includedClients.length);
        includedClients.forEach(function (client, index) {
            var tile = tiles[index];
            client.geometry = geometryUtils.gapArea(tile);
        });
    }
    function resizeClient(client, previousGeometry) {
        var newGeometry = client.geometry;
        previousGeometry = previousGeometry;
        if (previousGeometry.y >= separators.h) {
            // Right
            separators.h += newGeometry.y - previousGeometry.y;
            if (previousGeometry.x >= separators.v[1]) {
                // Bottom right
                separators.v[1] += newGeometry.x - previousGeometry.x;
            }
            else {
                // Top right
                separators.v[1] += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
            }
        }
        else {
            separators.h += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
            // Left
            if (previousGeometry.x >= separators.v[0]) {
                // Bottom left
                separators.v[0] += newGeometry.x - previousGeometry.x;
            }
            else {
                // Top left
                separators.v[0] += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
            }
        }
        var maxV = 0.9 * (geometry.x + geometry.width);
        var minV = geometry.x + geometry.width * 0.1;
        var maxH = 0.9 * (geometry.y + geometry.height);
        var minH = geometry.y + geometry.height * 0.1;
        separators.v[0] = Math.min(Math.max(minV, separators.v[0]), maxV);
        separators.v[1] = Math.min(Math.max(minV, separators.v[1]), maxV);
        separators.h = Math.min(Math.max(minH, separators.h), maxH);
    }
    return {
        restore: restore,
        maxClients: maxClients,
        tileClients: tileClients,
        resizeClient: resizeClient,
        geometry: geometry,
        separators: separators,
        adjustGeometry: adjustGeometry,
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
var layouts = {
    "0": QuarterHorizontal,
    "1": QuarterVertical,
    "2": QuarterSingleHorizontal,
    "3": QuarterSingleVertical
};

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
    if (config.isIgnoredScreen(screen) || config.isIgnoredDesktop(desktop)) {
        return null;
    }
    // Geometry
    var geometry = availableArea(workspace.clientArea(2, screen, desktop));
    function hasGeometryChanged(newGeometry) {
        return (geometry.x !== newGeometry.x ||
            geometry.y !== newGeometry.y ||
            geometry.width !== newGeometry.width ||
            geometry.height !== newGeometry.height);
    }
    function onGeometryChanged(newGeometry) {
        geometry = newGeometry;
        layout.adjustGeometry(newGeometry);
    }
    // Layout
    var layout = SelectedLayout(geometry);
    if (config.maxClients > -1) {
        layout.maxClients = Math.min(layout.maxClients, config.maxClients);
    }
    function tileClients(clients) {
        var currentGeometry = availableArea(workspace.clientArea(2, screen, desktop));
        if (hasGeometryChanged(currentGeometry)) {
            onGeometryChanged(currentGeometry);
        }
        layout.tileClients(clients);
    }
    return {
        screen: screen,
        desktop: desktop,
        layout: layout,
        tileClients: tileClients,
    };
}

// toplevels[screen][desktop]: Toplevel
var toplevels = [];
function addAll() {
    toplevels = [];
    for (var i = 0; i < workspace.numScreens; i++) {
        toplevels[i] = [];
        for (var j = 1; j <= workspace.desktops; j++) {
            toplevels[i][j] = toplevel(i, j);
        }
    }
}
function addDesktop(desktop) {
    for (var i = 0; i < workspace.numScreens; i++) {
        if (toplevels && toplevels[i] && !toplevels[i][desktop]) {
            toplevels[i][desktop] = toplevel(i, desktop);
        }
    }
}
function removeDesktop(desktop) {
    forEachScreen(desktop, function (screen, desktop) {
        delete toplevels[screen][desktop];
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
function maxClients$1(screen, desktop) {
    if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        return toplevels[screen][desktop].layout.maxClients;
    }
    else {
        return 0;
    }
}
function isFull(clients, screen, desktop) {
    return clients.length >= maxClients$1(screen, desktop);
}
function isEmpty(clients, screen, desktop) {
    if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        return clients.length === 0;
    }
    else {
        return false;
    }
}
function forEach(callback) {
    for (var i = 0; i < workspace.numScreens; i++) {
        for (var j = 1; j <= workspace.desktops; j++) {
            if (toplevels && toplevels[i] && toplevels[i][j]) {
                var shouldReturn = callback(i, j);
                if (shouldReturn) {
                    return;
                }
            }
        }
    }
}
function forEachScreen(desktop, callback) {
    for (var i = 0; i < workspace.numScreens; i++) {
        if (toplevels && toplevels[i] && toplevels[i][desktop]) {
            var shouldReturn = callback(i, desktop);
            if (shouldReturn) {
                return;
            }
        }
    }
}
function forEachDesktop(screen, callback) {
    for (var i = 1; i <= workspace.desktops; i++) {
        if (toplevels && toplevels[screen] && toplevels[screen][i]) {
            var shouldReturn = callback(screen, i);
            if (shouldReturn) {
                return;
            }
        }
    }
}
function restoreLayout(screen, desktop) {
    if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        toplevels[screen][desktop].layout.restore();
    }
}
function adjustMaxClients(screen, desktop, amount) {
    if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        toplevels[screen][desktop].layout.maxClients += amount;
    }
}
var toplevelManager = {
    addAll: addAll,
    addDesktop: addDesktop,
    removeDesktop: removeDesktop,
    tileClients: tileClients,
    resizeClient: resizeClient,
    maxClients: maxClients$1,
    isFull: isFull,
    isEmpty: isEmpty,
    forEach: forEach,
    forEachScreen: forEachScreen,
    forEachDesktop: forEachDesktop,
    restoreLayout: restoreLayout,
    adjustMaxClients: adjustMaxClients,
};

var clients = [];
var disabled = {};
var disconnectors = {};
function filter(screen, desktop) {
    var includedClients = clients.filter(function (client) {
        return (client.screen === screen &&
            client.desktop === desktop &&
            (client.activities.length === 0 || client.activities.indexOf(workspace.currentActivity) > -1));
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
function splicePush(client) {
    var index = find(client);
    if (index > -1) {
        clients.splice(index, 1);
        clients.push(client);
    }
}
function add(client, checked) {
    var screen = client.screen, desktop = client.desktop;
    if (checked || !blacklist.includes(client)) {
        var index = enable(client);
        if (index > -1) {
            clients.splice(index, 0, client);
        }
        else {
            clients.push(client);
        }
        var disableClient_1 = function () { return disable(client, undefined, true); };
        var splicePushClient_1 = function () { return splicePush(client); };
        client.clientStartUserMovedResized.connect(startMove);
        client.clientFinishUserMovedResized.connect(finishMove);
        client.screenChanged.connect(splicePushClient_1);
        client.desktopChanged.connect(splicePushClient_1);
        client.shadeChanged.connect(disableClient_1);
        disconnectors[client.windowId] = function (client) {
            client.clientStartUserMovedResized.disconnect(startMove);
            client.clientFinishUserMovedResized.disconnect(finishMove);
            client.screenChanged.disconnect(splicePushClient_1);
            client.desktopChanged.disconnect(splicePushClient_1);
            client.shadeChanged.disconnect(disableClient_1);
        };
        tileAll(screen, desktop);
    }
}
function addWithForce(client) {
    if (!blacklist.includes(client)) {
        add(client, true);
        // If the client couldn't be added on its screen or desktop, finds an available screen and desktop for it
        if (find(client) === -1) {
            var freeScreen = -1;
            toplevelManager.forEachScreen(client.desktop, function (screen, desktop) {
                if (!toplevelManager.isFull(filter(screen, desktop), screen, desktop)) {
                    freeScreen = screen;
                    return true;
                }
            });
            if (freeScreen > -1) {
                client.geometry = geometryUtils.moveTo(client.geometry, workspace.clientArea(1, freeScreen, client.desktop));
                add(client, true);
            }
            else {
                var freeDesktop = -1;
                toplevelManager.forEach(function (screen, desktop) {
                    if (!toplevelManager.isFull(filter(screen, desktop), screen, desktop)) {
                        freeScreen = screen;
                        freeDesktop = desktop;
                        if (config.followClients) {
                            workspace.currentDesktop = desktop;
                        }
                        return true;
                    }
                });
                if (freeScreen > -1 && freeDesktop > -1) {
                    client.desktop = freeDesktop;
                    client.geometry = geometryUtils.moveTo(client.geometry, workspace.clientArea(1, freeScreen, client.desktop));
                    add(client, true);
                    if (config.followClients) {
                        workspace.activeClient = client;
                    }
                }
            }
        }
    }
}
function addAll$1() {
    if (config.autoTile) {
        workspace.clientList().forEach(function (client) { return add(client); });
    }
}
function remove(client, index, shouldNotFollow) {
    index = index || find(client);
    if (index > -1) {
        clients.splice(index, 1);
        disconnectors[client.windowId](client);
        delete disconnectors[client.windowId];
        tileAll(client.screen, client.desktop);
        // Checks if the current desktop is completely empty, finds the closest desktop with clients and switches to it
        if (!shouldNotFollow && config.followClients && client.desktop === workspace.currentDesktop) {
            var currentDesktop_1 = workspace.currentDesktop;
            var clientList = workspace.clientList();
            var hasClientsLeft = clientList.some(function (clientB) {
                if (clientB.windowId !== client.windowId) {
                    return clientB.desktop === currentDesktop_1;
                }
            });
            if (!hasClientsLeft) {
                var busyDesktops_1 = [];
                clientList.forEach(function (clientB) {
                    if (clientB.desktop !== currentDesktop_1) {
                        busyDesktops_1.push(clientB.desktop);
                    }
                });
                var nextDesktop = busyDesktops_1.reduce(function (previous, current) {
                    return Math.abs(currentDesktop_1 - current) < Math.abs(currentDesktop_1 - previous) ? current : previous;
                });
                workspace.currentDesktop = nextDesktop;
            }
        }
    }
    else if (disabled[client.windowId]) {
        delete disabled[client.windowId];
    }
}
function toggle(client, index) {
    index = index || find(client);
    if (index > -1) {
        remove(client, index);
        client.geometry = geometryUtils.center(client.geometry, workspace.clientArea(2, client.screen, client.desktop));
    }
    else {
        add(client);
    }
}
var snapshot = { geometry: { x: 0, y: 0, width: 0, height: 0 }, screen: -1 };
function findClosest(clientA, indexA) {
    var closestClientIndex = indexA || find(clientA);
    var closestDistance = geometryUtils.distance(clientA.geometry, snapshot.geometry);
    clients.forEach(function (clientB, indexB) {
        if (clientA.windowId !== clientB.windowId &&
            clientA.screen === clientB.screen &&
            clientA.desktop === clientB.desktop) {
            var distance = geometryUtils.distance(clientA.geometry, clientB.geometry);
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
                swap(index, findClosest(client, index));
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
        remove(removableClient);
    }
    toplevelManager.tileClients(includedClients);
}
function enable(client) {
    if (disabled[client.windowId]) {
        var _a = disabled[client.windowId], index = _a.index, screen_1 = _a.screen, desktop = _a.desktop, disconnect = _a.disconnect;
        delete disabled[client.windowId];
        disconnect();
        toplevelManager.adjustMaxClients(screen_1, desktop, 1);
        return index;
    }
    else {
        return -1;
    }
}
function disable(client, index, shouldNotFollow) {
    index = index || find(client);
    if (index > -1) {
        remove(client, index, shouldNotFollow);
        var addClient_1 = function () { return add(client); };
        client.shadeChanged.connect(addClient_1);
        disabled[client.windowId] = {
            index: index,
            screen: client.screen,
            desktop: client.desktop,
            disconnect: function () {
                client.shadeChanged.disconnect(addClient_1);
            },
        };
        toplevelManager.adjustMaxClients(client.screen, client.desktop, -1);
    }
}
var clientManager = {
    add: add,
    addWithForce: addWithForce,
    addAll: addAll$1,
    find: find,
    filter: filter,
    disable: disable,
    remove: remove,
    toggle: toggle,
    startMove: startMove,
    finishMove: finishMove,
    swap: swap,
    resize: resize,
    tileAll: tileAll,
};

var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var resizeStep = 20;
var registerShortcut = 
// @ts-ignore, KWin global
registerShortcut ||
    function () {
        // This is never called, exists only as a dumb workaround to include this file in rollup
        workspace.currentDesktop = workspace.currentDesktop;
    };
function registerShortcuts() {
    registerShortcut("Quarter: Reset Current Layout", "Quarter: Reset Current Layout", "Meta+R", function () {
        toplevelManager.restoreLayout(workspace.activeScreen, workspace.currentDesktop);
        clientManager.tileAll(workspace.activeScreen, workspace.currentDesktop);
    });
    registerShortcut("Quarter: Reset All Layouts", "Quarter: Reset All Layout", "Meta+Shift+R", function () {
        toplevelManager.forEach(function (screen, desktop) {
            toplevelManager.restoreLayout(screen, desktop);
            clientManager.tileAll(screen, desktop);
        });
    });
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
    // Resize
    function resizeClient(direction, amount) {
        var client = workspace.activeClient;
        var newGeometry = client.geometry;
        var oldGeometry = client.geometry;
        var index = clientManager.find(client);
        if (index > -1) {
            switch (direction) {
                case "top":
                    newGeometry.y += -amount;
                    newGeometry.height += amount > 0 ? amount : 0;
                    break;
                case "left":
                    newGeometry.x += -amount;
                    newGeometry.width += amount > 0 ? amount : 0;
                    break;
                case "bottom":
                    newGeometry.height += amount;
                    break;
                case "right":
                    newGeometry.width += amount;
                    break;
            }
            clientManager.resize(__assign(__assign({}, client), { geometry: newGeometry }), oldGeometry);
            clientManager.tileAll(client.screen, client.desktop);
        }
    }
    registerShortcut("Quarter: + Window Size Top", "Quarter: + Window Size Top", "Meta+K", function () {
        resizeClient("top", resizeStep);
    });
    registerShortcut("Quarter: - Window Size Top", "Quarter: - Window Size Top", "Meta+Shift+K", function () {
        resizeClient("top", -resizeStep);
    });
    registerShortcut("Quarter: + Window Size Left", "Quarter: + Window Size Left", "Meta+H", function () {
        resizeClient("left", resizeStep);
    });
    registerShortcut("Quarter: - Window Size Left", "Quarter: - Window Size Left", "Meta+Shift+H", function () {
        resizeClient("left", -resizeStep);
    });
    registerShortcut("Quarter: + Window Size Right", "Quarter: + Window Size Right", "Meta+L", function () {
        resizeClient("right", resizeStep);
    });
    registerShortcut("Quarter: - Window Size Right", "Quarter: - Window Size Right", "Meta+Shift+L", function () {
        resizeClient("right", -resizeStep);
    });
    registerShortcut("Quarter: + Window Size Bottom", "Quarter: + Window Size Bottom", "Meta+J", function () {
        resizeClient("bottom", resizeStep);
    });
    registerShortcut("Quarter: - Window Size Bottom", "Quarter: - Window Size Bottom", "Meta+Shift+J", function () {
        resizeClient("bottom", -resizeStep);
    });
    // Move
    function nextClient(direction) {
        var activeClient = workspace.activeClient;
        var clients = clientManager.filter(activeClient.screen, activeClient.desktop);
        clients = clients.filter(function (client) {
            switch (direction) {
                case "top":
                    return client.geometry.y < activeClient.geometry.y;
                case "left":
                    return client.geometry.x < activeClient.geometry.x;
                case "bottom":
                    return client.geometry.y > activeClient.geometry.y;
                case "right":
                    return client.geometry.x > activeClient.geometry.x;
            }
        });
        clients.sort(function (clientA, clientB) {
            return (geometryUtils.distance(activeClient.geometry, clientA.geometry) -
                geometryUtils.distance(activeClient.geometry, clientB.geometry));
        });
        return clients[0];
    }
    function moveClient(direction) {
        var i = clientManager.find(workspace.activeClient);
        var j = clientManager.find(nextClient(direction));
        if (i > -1 && j > -1) {
            clientManager.swap(i, j);
            clientManager.tileAll(workspace.activeScreen, workspace.currentDesktop);
        }
    }
    registerShortcut("Quarter: Move Up", "Quarter: Move Up", "Alt+Shift+K", function () {
        moveClient("top");
    });
    registerShortcut("Quarter: Move Left", "Quarter: Move Left", "Alt+Shift+H", function () {
        moveClient("left");
    });
    registerShortcut("Quarter: Move Down", "Quarter: Move Down", "Alt+Shift+J", function () {
        moveClient("bottom");
    });
    registerShortcut("Quarter: Move Right", "Quarter: Move Right", "Alt+Shift+L", function () {
        moveClient("right");
    });
    function focusClient(direction) {
        var focusableClient = nextClient(direction);
        workspace.clientList().some(function (client) {
            if (focusableClient.windowId === client.windowId) {
                workspace.activeClient = client;
                return true;
            }
        });
    }
    registerShortcut("Quarter: Focus Up", "Quarter: Focus Up", "Alt+K", function () {
        focusClient("top");
    });
    registerShortcut("Quarter: Focus Left", "Quarter: Focus Left", "Alt+H", function () {
        focusClient("left");
    });
    registerShortcut("Quarter: Focus Down", "Quarter: Focus Down", "Alt+J", function () {
        focusClient("bottom");
    });
    registerShortcut("Quarter: Focus Right", "Quarter: Focus Right", "Alt+L", function () {
        focusClient("right");
    });
}
var shortcuts = {
    registerShortcuts: registerShortcuts
};

function registerSignals() {
    if (config.autoTile) {
        workspace.clientAdded.connect(function (client) {
            if (client) {
                clientManager.addWithForce(client);
            }
        });
    }
    workspace.clientUnminimized.connect(function (client) {
        if (client && config.autoTile) {
            clientManager.addWithForce(client);
        }
    });
    workspace.clientRemoved.connect(function (client) {
        if (client) {
            clientManager.remove(client);
        }
    });
    workspace.clientMinimized.connect(function (client) {
        if (client) {
            clientManager.disable(client);
        }
    });
    workspace.clientMaximizeSet.connect(function (client, h, v) {
        if (client && h && v) {
            clientManager.disable(client, undefined, true);
            workspace.activeClient = client;
        }
        else if (client && !h && !v) {
            if (config.autoTile) {
                clientManager.addWithForce(client);
            }
        }
    });
    workspace.clientFullScreenSet.connect(function (client, fs) {
        if (client && fs) {
            clientManager.disable(client, undefined, true);
        }
        else {
            if (config.autoTile) {
                clientManager.addWithForce(client);
            }
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
    workspace.numberDesktopsChanged.connect(function (previousDesktops) {
        if (workspace.desktops > previousDesktops) {
            toplevelManager.addDesktop(workspace.desktops);
        }
        else {
            toplevelManager.removeDesktop(previousDesktops);
        }
        toplevelManager.forEachScreen(workspace.currentDesktop, function (screen, desktop) {
            clientManager.tileAll(screen, desktop);
        });
    });
    workspace.numberScreensChanged.connect(function (count) {
        toplevelManager.addAll();
    });
    workspace.screenResized.connect(function (screen) {
        clientManager.tileAll(screen, workspace.currentDesktop);
    });
}
var signals = {
    registerSignals: registerSignals,
};

toplevelManager.addAll();
clientManager.addAll();
shortcuts.registerShortcuts();
signals.registerSignals();
