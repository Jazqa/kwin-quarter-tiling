'use strict';

// @ts-ignore, KWin global
var workspace = workspace || {};

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
var gaps = readConfig("gap", 8);
var margins = {
    top: readConfig("marginTop", 0),
    left: readConfig("marginLeft", 0),
    bottom: readConfig("marginBottom", 0),
    right: readConfig("marginRight", 0),
};
var layouts = [
    readConfigString("layout_0", 0),
    readConfigString("layout_1", 0),
    readConfigString("layout_2", 0),
    readConfigString("layout_3", 0),
];
var maxWindows = [
    readConfig("maxWindows_0", -1),
    readConfig("maxWindows_1", -1),
    readConfig("maxWindows_2", -1),
    readConfig("maxWindows_3", -1),
];
var outputEnabled = [
    readConfig("outputEnabled_0", -1),
    readConfig("outputEnabled_1", -1),
    readConfig("outputEnabled_2", -1),
    readConfig("outputEnabled_3", -1),
];
var autoTile = readConfigString("autoTile", true) === "true";
var followWindows = readConfigString("followWindows", true) === "true";
var minWidth = readConfig("minWidth", 256);
var minHeight = readConfig("minHeight", 256);
var ignoredProcesses = __spreadArrays([
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
], readConfigString("ignoredProcesses", "wine, steam").split(", "), [readConfigString("ignoreJava", false) === "true" ? "sun-awt-x11-xframepeer" : ""]);
var ignoredCaptions = __spreadArrays([
    "File Upload",
    "Move to Trash",
    "Quit GIMP",
    "Create a New Image"
], readConfigString("ignoredCaptions", "Quit GIMP, Create a New Image")
    .split(", ")
    .filter(function (caption) { return caption; }));
var ignoredDesktops = readConfigString("ignoredDesktops", "").split(", ");
function isIgnoredDesktop(desktop) {
    var index = workspace.desktops.findIndex(function (_a) {
        var id = _a.id;
        return id === desktop.id;
    });
    return ignoredDesktops.indexOf(index.toString()) > -1;
}
function isOutputEnabled(output) {
    var index = workspace.screens.findIndex(function (_a) {
        var serialNumber = _a.serialNumber;
        return serialNumber === output.serialNumber;
    });
    return outputEnabled[index];
}
function isIgnoredLayer(output, desktop) {
    return !isOutputEnabled(output) || isIgnoredDesktop(desktop);
}
var config = {
    gaps: gaps,
    margins: margins,
    layouts: layouts,
    autoTile: autoTile,
    followWindows: followWindows,
    minWidth: minWidth,
    minHeight: minHeight,
    maxWindows: maxWindows,
    ignoredProcesses: ignoredProcesses,
    ignoredCaptions: ignoredCaptions,
    ignoredDesktops: ignoredDesktops,
    isIgnoredDesktop: isIgnoredDesktop,
    isIgnoredLayer: isIgnoredLayer,
};

function clone(rect) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    return { x: x, y: y, width: width, height: height };
}
function withGap(rect) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    x += config.gaps;
    y += config.gaps;
    width -= config.gaps * 2;
    height -= config.gaps * 2;
    return { x: x, y: y, width: width, height: height };
}
function withoutGap(rect) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    x -= config.gaps;
    y -= config.gaps;
    width += config.gaps * 2;
    height += config.gaps * 2;
    return { x: x, y: y, width: width, height: height };
}
function withMargin(rect) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    y += config.gaps + config.margins.top;
    x += config.gaps + config.margins.left;
    height -= config.gaps * 2 + config.margins.top + config.margins.bottom;
    width -= config.gaps * 2 + config.margins.left + config.margins.right;
    return { x: x, y: y, width: width, height: height };
}
function moveTo(rectA, rectB) {
    var rectC = clone(rectB);
    rectC.height = rectA.height;
    rectC.width = rectA.width;
    return rectC;
}
function centerTo(rectA, rectB) {
    rectB.x += rectB.width * 0.5 - rectA.width * 0.5;
    rectB.y += rectB.height * 0.5 - rectA.height * 0.5;
    return moveTo(rectA, rectB);
}
function distanceTo(rectA, rectB) {
    return Math.abs(rectA.x - rectB.x) + Math.abs(rectA.y - rectB.y);
}
var math = {
    clone: clone,
    withGap: withGap,
    withoutGap: withoutGap,
    withMargin: withMargin,
    moveTo: moveTo,
    centerTo: centerTo,
    distanceTo: distanceTo,
};

function getTiles(rect, separators, count) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
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
function TwoByTwoHorizontal(rect) {
    var maxWindows = 4;
    var hs = rect.y + rect.height * 0.5;
    var vs = rect.x + rect.width * 0.5;
    var separators = { h: [hs, hs], v: vs };
    function adjustRect(newRect) {
        rect = newRect;
        restore();
    }
    function tileWindows(windows) {
        var includedWindows = windows.slice(0, maxWindows);
        var tiles = getTiles(rect, separators, includedWindows.length);
        includedWindows.forEach(function (window, index) {
            var tile = tiles[index];
            window.frameGeometry = math.withGap(tile);
        });
    }
    function resizeWindow(window, oldRect) {
        var newRect = math.clone(window.frameGeometry);
        if (oldRect.x >= separators.v) {
            // Right
            separators.v += newRect.x - oldRect.x;
            if (oldRect.y >= separators.h[1]) {
                // Bottom right
                separators.h[1] += newRect.y - oldRect.y;
            }
            else {
                // Top right
                separators.h[1] += newRect.y === oldRect.y ? newRect.height - oldRect.height : 0;
            }
        }
        else {
            separators.v += newRect.x === oldRect.x ? newRect.width - oldRect.width : 0;
            // Left
            if (oldRect.y >= separators.h[0]) {
                // Bottom left
                separators.h[0] += newRect.y - oldRect.y;
            }
            else {
                // Top left
                separators.h[0] += newRect.y === oldRect.y ? newRect.height - oldRect.height : 0;
            }
        }
        var maxV = 0.9 * (rect.x + rect.width);
        var minV = rect.x + rect.width * 0.1;
        var maxH = 0.9 * (rect.y + rect.height);
        var minH = rect.y + rect.height * 0.1;
        separators.v = Math.min(Math.max(minV, separators.v), maxV);
        separators.h[0] = Math.min(Math.max(minH, separators.h[0]), maxH);
        separators.h[1] = Math.min(Math.max(minH, separators.h[1]), maxH);
    }
    function restore() {
        hs = rect.y + rect.height * 0.5;
        vs = rect.x + rect.width * 0.5;
        separators = { h: [hs, hs], v: vs };
    }
    return {
        maxWindows: maxWindows,
        tileWindows: tileWindows,
        resizeWindow: resizeWindow,
        adjustRect: adjustRect,
        restore: restore,
    };
}

function getTiles$1(rect, separators, count) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
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
function TwoByTwoVertical(rect) {
    var maxWindows = 4;
    var hs = rect.y + rect.height * 0.5;
    var vs = rect.x + rect.width * 0.5;
    var separators = { h: hs, v: [vs, vs] };
    function adjustRect(newRect) {
        rect = newRect;
        restore();
    }
    function tileWindows(windows) {
        var includedWindows = windows.slice(0, maxWindows);
        var tiles = getTiles$1(rect, separators, includedWindows.length);
        includedWindows.forEach(function (window, index) {
            var tile = tiles[index];
            window.frameGeometry = math.withGap(tile);
        });
    }
    function resizeWindow(window, oldRect) {
        var newRect = math.clone(window.frameGeometry);
        if (oldRect.y >= separators.h) {
            // Right
            separators.h += newRect.y - oldRect.y;
            if (oldRect.x >= separators.v[1]) {
                // Bottom right
                separators.v[1] += newRect.x - oldRect.x;
            }
            else {
                // Top right
                separators.v[1] += newRect.x === oldRect.x ? newRect.width - oldRect.width : 0;
            }
        }
        else {
            separators.h += newRect.y === oldRect.y ? newRect.height - oldRect.height : 0;
            // Left
            if (oldRect.x >= separators.v[0]) {
                // Bottom left
                separators.v[0] += newRect.x - oldRect.x;
            }
            else {
                // Top left
                separators.v[0] += newRect.x === oldRect.x ? newRect.width - oldRect.width : 0;
            }
        }
        var maxV = 0.9 * (rect.x + rect.width);
        var minV = rect.x + rect.width * 0.1;
        var maxH = 0.9 * (rect.y + rect.height);
        var minH = rect.y + rect.height * 0.1;
        separators.v[0] = Math.min(Math.max(minV, separators.v[0]), maxV);
        separators.v[1] = Math.min(Math.max(minV, separators.v[1]), maxV);
        separators.h = Math.min(Math.max(minH, separators.h), maxH);
    }
    function restore() {
        hs = rect.y + rect.height * 0.5;
        vs = rect.x + rect.width * 0.5;
        separators = { h: hs, v: [vs, vs] };
    }
    return {
        maxWindows: maxWindows,
        tileWindows: tileWindows,
        resizeWindow: resizeWindow,
        adjustRect: adjustRect,
        restore: restore,
    };
}

/*
 * Adding a new layout to the script and its options:
 *
 *  1. Create a new class that inside src/layouts folder, make sure it implements the Layout interface as seen in /src/layout.ts
 *  2. Add an entry to the layouts object in src/layouts/layouts.ts, increasing the key by one:
 *      { "0": TwoByTwoHorizontal, "1": NewLayout }
 *  3. Add a new entry to the kcfg_layouts entry in contents/code/config.ui:
 *      <property name="text">
 *          <string>NewLayout</string>
 *      </property>
 */
var layouts$1 = {
    "0": TwoByTwoHorizontal,
    "1": TwoByTwoVertical,
};

function tile(window, callbacks) {
    var move = window.move;
    var resize = window.resize;
    var frameGeometry;
    function startMove() {
        move = true;
        frameGeometry = math.clone(window.frameGeometry);
    }
    function stopMove() {
        callbacks.moveWindow(window, frameGeometry);
        move = false;
    }
    function startResize() {
        resize = true;
        frameGeometry = math.clone(window.frameGeometry);
    }
    function stopResize() {
        callbacks.resizeWindow(window, frameGeometry);
        resize = false;
    }
    function moveResizedChanged() {
        if (window.move && !move) {
            startMove();
        }
        else if (!window.move && move) {
            stopMove();
        }
        if (window.resize && !resize) {
            startResize();
        }
        else if (!window.resize && resize) {
            stopResize();
        }
    }
    function isOnOutput(targetOutput) {
        return window.output === targetOutput;
    }
    function isOnDesktop(targetDesktop) {
        return window.desktops.findIndex(function (desktop) { return desktop.id === targetDesktop.id; }) > -1;
    }
    window.moveResizedChanged.connect(moveResizedChanged);
    function remove() {
        window.moveResizedChanged.disconnect(moveResizedChanged);
    }
    return {
        window: window,
        isOnOutput: isOnOutput,
        isOnDesktop: isOnDesktop,
        remove: remove,
    };
}

function layer(output, desktop) {
    var id = output.serialNumber + desktop.id;
    var outputIndex = workspace.screens.findIndex(function (workspaceOutput) { return workspaceOutput.serialNumber === output.serialNumber; });
    var rect = math.withMargin(workspace.clientArea(2, output, desktop));
    var layout = layouts$1[config.layouts[outputIndex]](rect);
    if (config.maxWindows[outputIndex] > -1) {
        layout.maxWindows = Math.min(layout.maxWindows, config.maxWindows[outputIndex]);
    }
    return {
        output: output,
        desktop: desktop,
        id: id,
        rect: rect,
        layout: layout,
    };
}
function wm() {
    var layers = {};
    var tiles = [];
    var callbacks = {
        resizeWindow: resizeWindow,
        moveWindow: moveWindow,
    };
    function addLayer(output, desktop) {
        if (config.isIgnoredLayer(output, desktop))
            return;
        var newLayer = layer(output, desktop);
        layers[newLayer.id] = newLayer;
    }
    function tileLayers() {
        Object.values(layers).forEach(function (layer) {
            var windows = tiles.map(function (tile) {
                if (tile.isOnOutput(layer.output) && tile.isOnDesktop(layer.desktop)) {
                    return tile.window;
                }
            });
            windows = windows.filter(function (window) { return window; });
            layer.layout.tileWindows(windows);
        });
    }
    function swapTiles(i, j) {
        var tile = tiles[i];
        tiles[i] = tiles[j];
        tiles[j] = tile;
    }
    function addWindow(window) {
        if (isWindowAllowed(window)) {
            var newTile = tile(window, callbacks);
            tiles.push(newTile);
            tileLayers();
        }
    }
    function removeWindow(window) {
        var index = tiles.findIndex(function (tile) { return tile.window.internalId === window.internalId; });
        var tile = tiles[index];
        if (index > -1) {
            tile.remove();
            tiles.splice(index, 1);
            tileLayers();
        }
    }
    function resizeWindow(window, oldRect) {
        window.desktops.forEach(function (desktop) {
            var layer = layers[window.output.serialNumber + desktop.id];
            if (layer) {
                layer.layout.resizeWindow(window, oldRect);
            }
        });
        tileLayers();
    }
    function moveWindow(window, oldRect) {
        var nearestTile = tiles.find(function (tile) { return tile.window.internalId === window.internalId; });
        var nearestDistance = math.distanceTo(window.frameGeometry, oldRect);
        tiles.forEach(function (tile) {
            if (window.internalId !== tile.window.internalId) {
                var distance = math.distanceTo(window.frameGeometry, tile.window.frameGeometry);
                if (distance < nearestDistance) {
                    nearestTile = tile;
                    nearestDistance = distance;
                }
            }
        });
        var i = tiles.findIndex(function (tile) { return tile.window.internalId === window.internalId; });
        var j = tiles.findIndex(function (tile) { return tile.window.internalId === nearestTile.window.internalId; });
        if (i !== j) {
            swapTiles(i, j);
        }
        tileLayers();
    }
    function isWindowAllowed(window) {
        return window.resourceClass.toString().includes("dolphin");
        /*
        TODO: Uncomment
        return (
          window.managed &&
          window.normalWindow &&
          window.moveable &&
          window.resizeable &&
          window.maximizable &&
          !window.fullScreen &&
          !window.minimized &&
          window.rect.width >= config.minWidth &&
          window.rect.height >= config.minHeight &&
          config.ignoredProcesses.indexOf(window.resourceClass.toString()) === -1 &&
          config.ignoredProcesses.indexOf(window.resourceName.toString()) === -1 &&
          config.ignoredCaptions.some(
            (caption) => window.caption.toString().toLowerCase().indexOf(caption.toLowerCase()) === -1
          )
        );
        */
    }
    workspace.screens.forEach(function (output) {
        workspace.desktops.forEach(function (desktop) {
            addLayer(output, desktop);
        });
    });
    workspace.stackingOrder.forEach(function (window) {
        addWindow(window);
    });
    workspace.windowAdded.connect(addWindow);
    workspace.windowRemoved.connect(removeWindow);
    workspace.windowActivated.connect(tileLayers);
}

wm();
