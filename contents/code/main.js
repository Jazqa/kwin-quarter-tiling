'use strict';

var registerShortcut = 
// @ts-ignore, KWin global
registerShortcut ||
    function () {
        workspace.currentDesktop = workspace.currentDesktop;
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
// @ts-ignore, KWin global
var workspace = workspace || {};
function maximizeArea(output, desktop) {
    return workspace.clientArea(2, output, desktop);
}

function outputIndex(output) {
    return workspace.screens.findIndex(function (wsoutput) { return wsoutput.serialNumber === output.serialNumber; });
}
function desktopIndex(desktop) {
    return workspace.desktops.findIndex(function (wsdesktop) { return wsdesktop.id === desktop.id; });
}
function clone(rect) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    return { x: x, y: y, width: width, height: height };
}
function withGap(oi, rect) {
    var gap = config.gap[oi];
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    x += gap;
    y += gap;
    width -= gap * 2;
    height -= gap * 2;
    return { x: x, y: y, width: width, height: height };
}
function withoutGap(oi, rect) {
    var gap = config.gap[oi];
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    x -= gap;
    y -= gap;
    width += gap * 2;
    height += gap * 2;
    return { x: x, y: y, width: width, height: height };
}
function withMargin(oi, rect) {
    var gap = config.gap[oi];
    var margin = config.margin[oi];
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    y += gap + margin.top;
    x += gap + margin.left;
    height -= gap * 2 + margin.top + margin.bottom;
    width -= gap * 2 + margin.left + margin.right;
    return { x: x, y: y, width: width, height: height };
}
function centerTo(rectA, rectB) {
    var x = rectA.x, y = rectA.y, width = rectA.width, height = rectA.height;
    x = rectB.width * 0.5 - rectA.width * 0.5;
    y = rectB.height * 0.5 - rectA.height * 0.5;
    return { x: x, y: y, width: width, height: height };
}
function distanceTo(rectA, rectB) {
    return Math.abs(rectA.x - rectB.x) + Math.abs(rectA.y - rectB.y);
}
var math = {
    outputIndex: outputIndex,
    desktopIndex: desktopIndex,
    clone: clone,
    withGap: withGap,
    withoutGap: withoutGap,
    withMargin: withMargin,
    centerTo: centerTo,
    distanceTo: distanceTo,
};

var __spreadArrays = (undefined && undefined.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var auto = readConfigString("auto", true) === "true";
var follow = readConfigString("follow", true) === "true";
var gap = [
    readConfig("gap_0", 8),
    readConfig("gap_1", 8),
    readConfig("gap_2", 8),
    readConfig("gap_3", 8),
];
var margin = [
    {
        top: readConfig("marginTop_0", 0),
        left: readConfig("marginLeft_0", 0),
        bottom: readConfig("marginBottom_0", 0),
        right: readConfig("marginRight_0", 0),
    },
    {
        top: readConfig("marginTop_1", 0),
        left: readConfig("marginLeft_1", 0),
        bottom: readConfig("marginBottom_1", 0),
        right: readConfig("marginRight_1", 0),
    },
    {
        top: readConfig("marginTop_2", 0),
        left: readConfig("marginLeft_2", 0),
        bottom: readConfig("marginBottom_2", 0),
        right: readConfig("marginRight_2", 0),
    },
    {
        top: readConfig("marginTop_3", 0),
        left: readConfig("marginLeft_3", 0),
        bottom: readConfig("marginBottom_3", 0),
        right: readConfig("marginRight_3", 0),
    },
];
var layout = [
    readConfigString("layout_0", 1),
    readConfigString("layout_1", 1),
    readConfigString("layout_2", 1),
    readConfigString("layout_3", 1),
];
var limit = [
    readConfig("limit_0", -1),
    readConfig("limit_1", -1),
    readConfig("limit_2", -1),
    readConfig("limit_3", -1),
];
var minWidth = readConfig("minWidth", 256);
var minHeight = readConfig("minHeight", 256);
var processes = __spreadArrays([
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
], readConfigString("processes", "wine, steam").toLowerCase().split(", "), [readConfigString("java", false) === "true" ? "sun-awt-x11-xframepeer" : ""]);
var captions = __spreadArrays([
    "File Upload",
    "Move to Trash",
    "Quit GIMP",
    "Create a New Image"
], readConfigString("captions", "Quit GIMP, Create a New Image")
    .toLowerCase()
    .split(", ")
    .filter(function (caption) { return caption; }));
var outputs = readConfigString("outputs", "").split(", ");
var desktops = readConfigString("desktops", "").split(", ");
var exclude = function (output, desktop) {
    return (outputs.indexOf(math.outputIndex(output).toString()) > -1 ||
        desktops.indexOf(math.desktopIndex(desktop).toString()) > -1);
};
var config = {
    auto: auto,
    follow: follow,
    gap: gap,
    margin: margin,
    layout: layout,
    limit: limit,
    minWidth: minWidth,
    minHeight: minHeight,
    processes: processes,
    captions: captions,
    outputs: outputs,
    desktops: desktops,
    exclude: exclude,
};

function Disabled(oi, rect) {
    var limit = 0;
    function tileWindows(windowsOnLayout) { }
    function resizeWindow(windowOnLayout, oldRect) { }
    function adjustRect(rect) { }
    function restore() { }
    return {
        limit: limit,
        tileWindows: tileWindows,
        resizeWindow: resizeWindow,
        adjustRect: adjustRect,
        restore: restore,
    };
}

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
function TwoByTwoHorizontal(oi, rect) {
    var limit = 4;
    var hs = rect.y + rect.height * 0.5;
    var vs = rect.x + rect.width * 0.5;
    var separators = { h: [hs, hs], v: vs };
    function adjustRect(newRect) {
        rect = newRect;
        restore();
    }
    function tileWindows(windows) {
        var tiles = getTiles(rect, separators, windows.length);
        windows.forEach(function (window, index) {
            window.frameGeometry = math.withGap(oi, tiles[index]);
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
        limit: limit,
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
function TwoByTwoVertical(oi, rect) {
    var limit = 4;
    var hs = rect.y + rect.height * 0.5;
    var vs = rect.x + rect.width * 0.5;
    var separators = { h: hs, v: [vs, vs] };
    function adjustRect(newRect) {
        rect = newRect;
        restore();
    }
    function tileWindows(windows) {
        var tiles = getTiles$1(rect, separators, windows.length);
        windows.forEach(function (window, index) {
            window.frameGeometry = math.withGap(oi, tiles[index]);
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
        limit: limit,
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
 *      { "0": Disabled, "1": NewLayout }
 *  3. Add a new entry to the kcfg_layouts entry in contents/code/config.ui:
 *      <property name="text">
 *          <string>NewLayout</string>
 *      </property>
 */
var layouts = {
    "0": Disabled,
    "1": TwoByTwoHorizontal,
    "2": TwoByTwoVertical,
};

function layer(output, desktop) {
    var id = output.serialNumber + desktop.id;
    var oi = math.outputIndex(output);
    var _rect = math.withMargin(oi, maximizeArea(output, desktop));
    var _layout = layouts[config.layout[oi]](oi, _rect);
    if (config.limit[oi] > -1) {
        _layout.limit = Math.min(_layout.limit, config.limit[oi]);
    }
    function tile(tiles) {
        var windows = [];
        var i = 0;
        tiles.forEach(function (tile) {
            if (tile.isOnOutput(output) && tile.isOnDesktop(desktop)) {
                var enabled = tile.isEnabled();
                if (i < _layout.limit && enabled) {
                    i += 1;
                    windows.push(tile.window);
                }
                else if (enabled) {
                    tile.disable();
                }
            }
        });
        _layout.tileWindows(windows);
    }
    function resizeWindow(window, oldRect) {
        _layout.resizeWindow(window, oldRect);
    }
    return {
        output: output,
        desktop: desktop,
        id: id,
        tile: tile,
        resizeWindow: resizeWindow,
    };
}

function tile(window, callbacks) {
    // Enabled  can      be changed manually by the user or automatically by the script
    // Disabled can only be changed                         automatically by the script
    // In practice, disabled = true tiles can be re-enabled automatically by the script, but disabled = false tiles can only be re-enabled manually by the user
    var _enabled = true;
    var _disabled = false;
    var _output = window.output;
    var _desktops = window.desktops;
    var _move = window.move;
    var _resize = window.resize;
    var _originalGeometry = math.clone(window.frameGeometry);
    var _oldGeometry;
    if (window.minimized || window.fullScreen || isMaximized()) {
        disable();
    }
    function isEnabled() {
        return _enabled;
    }
    // @param manual  - Indicates whether the action was performed manually by the user or automatically by the script
    // @param capture - Inciates whether the window's frameGeometry should be used as its originalGeometry when restored later
    function enable(manual, capture) {
        if (manual || _disabled) {
            _disabled = false;
            _enabled = true;
            if (capture) {
                _originalGeometry = math.clone(window.frameGeometry);
            }
        }
    }
    // @param manual  - Indicates whether the action was performed manually by the user or automatically by the script
    // @param restore - Indicates the window's frameGeometry should be restored to its original rect
    function disable(manual, restore) {
        if (!manual)
            _disabled = true;
        _enabled = false;
        if (restore) {
            window.frameGeometry.width = _originalGeometry.width;
            window.frameGeometry.height = _originalGeometry.height;
        }
    }
    function startMove() {
        _move = true;
        _oldGeometry = math.clone(window.frameGeometry);
    }
    function stopMove() {
        if (_output !== window.output) {
            outputChanged(true);
        }
        else if (_enabled) {
            callbacks.moveWindow(window, _oldGeometry);
        }
        _move = false;
    }
    function startResize() {
        _resize = true;
        _oldGeometry = math.clone(window.frameGeometry);
    }
    function stopResize() {
        callbacks.resizeWindow(window, _oldGeometry);
        _resize = false;
    }
    function moveResizedChanged() {
        if (window.move && !_move) {
            startMove();
        }
        else if (!window.move && _move) {
            stopMove();
        }
        if (!_enabled)
            return;
        if (window.resize && !_resize) {
            startResize();
        }
        else if (!window.resize && _resize) {
            stopResize();
        }
    }
    function maximizedChanged() {
        if (isMaximized()) {
            disable();
        }
        else {
            enable();
        }
        callbacks.enableWindow(window);
    }
    function isMaximized() {
        var desktop = _desktops[0] || window.desktops[0] || workspace.desktops[0];
        var area = maximizeArea(_output, desktop);
        var h = window.frameGeometry.width === area.width && window.frameGeometry.x === area.x;
        var v = window.frameGeometry.height === area.height && window.frameGeometry.y === area.y;
        if (h || v) {
            return true;
        }
    }
    // @param force - Ignores the move check (used to ignore outputChanged signal if moveResizedChanged might do the same later)
    function outputChanged(force) {
        if (force || !_move) {
            _output = window.output;
            enable();
            callbacks.pushWindow(window);
        }
    }
    function isOnOutput(output) {
        return window.output.serialNumber === output.serialNumber;
    }
    // cf3f
    function desktopsChanged() {
        if (window.desktops.length > 1) {
            disable();
        }
        else if (window.desktops.length === 1) {
            enable();
        }
        _desktops = window.desktops;
        callbacks.pushWindow(window);
    }
    // cf3f
    function isOnDesktop(desktop) {
        return window.desktops.length === 1 && window.desktops[0].id === desktop.id;
    }
    // Constructor
    // Signals
    window.moveResizedChanged.connect(moveResizedChanged);
    window.outputChanged.connect(outputChanged);
    window.desktopsChanged.connect(desktopsChanged);
    window.maximizedChanged.connect(maximizedChanged);
    function remove() {
        window.moveResizedChanged.disconnect(moveResizedChanged);
        window.outputChanged.disconnect(outputChanged);
        window.desktopsChanged.disconnect(desktopsChanged);
    }
    return {
        window: window,
        isEnabled: isEnabled,
        enable: enable,
        disable: disable,
        isOnOutput: isOnOutput,
        isOnDesktop: isOnDesktop,
        remove: remove,
    };
}

function wm() {
    var layers = {};
    var tiles = [];
    var callbacks = {
        enableWindow: enableWindow,
        pushWindow: pushWindow,
        resizeWindow: resizeWindow,
        moveWindow: moveWindow,
    };
    // Layers
    function addLayer(output, desktop) {
        if (config.exclude(output, desktop))
            return;
        var id = output.serialNumber + desktop.id;
        if (layers[id])
            return;
        var newLayer = layer(output, desktop);
        layers[id] = newLayer;
    }
    function tileLayers() {
        Object.values(layers).forEach(function (layer) {
            layer.tile(tiles);
        });
    }
    // Tiles
    function swapTiles(i, j) {
        var tile = tiles[i];
        tiles[i] = tiles[j];
        tiles[j] = tile;
    }
    // Windows
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
                layer.resizeWindow(window, oldRect);
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
    function enableWindow(window) {
        tileLayers();
    }
    function pushWindow(window) {
        var index = tiles.findIndex(function (tile) { return tile.window.internalId === window.internalId; });
        if (index > -1) {
            var tile_1 = tiles[index];
            tiles.splice(index, 1);
            tiles.push(tile_1);
        }
        tileLayers();
    }
    function isWindowAllowed(window) {
        return (window.managed &&
            window.normalWindow &&
            window.moveable &&
            window.resizeable &&
            window.rect.width >= config.minWidth &&
            window.rect.height >= config.minHeight &&
            config.processes.indexOf(window.resourceClass.toString().toLowerCase()) === -1 &&
            config.processes.indexOf(window.resourceName.toString().toLowerCase()) === -1 &&
            config.captions.some(function (caption) { return window.caption.toString().toLowerCase().indexOf(caption) === -1; }));
    }
    // Constructor
    workspace.screens.forEach(function (output) {
        workspace.desktops.forEach(function (desktop) {
            addLayer(output, desktop);
        });
    });
    workspace.stackingOrder.forEach(function (window) {
        addWindow(window);
    });
    // Signals
    workspace.currentDesktopChanged.connect(tileLayers);
    workspace.windowAdded.connect(addWindow);
    workspace.windowRemoved.connect(removeWindow);
    workspace.windowActivated.connect(tileLayers);
    // Shortcuts
    function toggleActiveWindow() {
        var tile = tiles.find(function (tile) { return tile.window.internalId === workspace.activeWindow.internalId; });
        if (tile.isEnabled()) {
            tile.disable(true);
            tileLayers();
        }
        else {
            tile.enable(true);
            pushWindow(tile.window);
        }
    }
    registerShortcut("8137: Tile Window", "8137: Tile Window", "Meta+F", toggleActiveWindow);
}

wm();
