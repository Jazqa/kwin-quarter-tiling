'use strict';

var registerUserActionsMenu = 
// @ts-ignore, KWin global
registerUserActionsMenu ||
    function () {
        workspace.currentDesktop = workspace.currentDesktop;
    };
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

// 2ed6
// Used to fetch configuration values for individual outputs (configuration value format: kcfg_<key>_<index>)
// Unlike proper .qml, the required .ui configuration interface doesn't support detecting outputs, so the configuration interface is hard-coded for up to 4 outputs
function kcfgOutputIndex(output) {
    var index = workspace.screens.findIndex(function (wsoutput) { return wsoutput.serialNumber === output.serialNumber; });
    // Theoretically supports more than 4 outputs by defaulting to 1st's configuration
    if (index === -1) {
        index = 0;
    }
    return index;
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
    x = rectB.x + rectB.width * 0.5 - width * 0.5;
    y = rectB.y + rectB.height * 0.5 - height * 0.5;
    return { x: x, y: y, width: width, height: height };
}
function distanceTo(rectA, rectB) {
    return Math.abs(rectA.x - rectB.x) + Math.abs(rectA.y - rectB.y);
}
var math = {
    kcfgOutputIndex: kcfgOutputIndex,
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
    "Configure — System Settings",
    "File Upload",
    "Move to Trash",
    "Quit GIMP",
    "Create a New Image"
], readConfigString("captions", "Quit GIMP, Create a New Image")
    .split(", ")
    .filter(function (caption) { return caption; }));
var desktops = readConfigString("desktops", "").split(", ");
var exclude = function (output, desktop) {
    // 04c1
    // layout[math.outputIndex(output)] ===  "DISABLED"
    return desktops.indexOf(math.desktopIndex(desktop).toString()) > -1;
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
    desktops: desktops,
    exclude: exclude,
};

function Columns(oi, rect) {
    var id = "Columns";
    var minWidth = 500;
    var limit = rect.width / (minWidth * 1.5);
    var width = rect.x + rect.width;
    var separators = [];
    var resized = [];
    function adjustRect(newRect) {
        rect = newRect;
    }
    function flushSeparators(windows) {
        if (windows.length > separators.length) {
            for (var i = 0; i < resized.length; i++) {
                if (resized[i]) {
                    resized[i] *= 0.5;
                }
            }
        }
        separators.splice(windows.length - 1);
        resized.splice(windows.length - 1);
    }
    function getRects(windows) {
        flushSeparators(windows);
        for (var i = 0; i < windows.length; i++) {
            var j = i + 1;
            var d = windows.length / j;
            var base = width / d;
            var res = resized[i] || 0;
            separators[i] = base + res;
        }
        var rects = [];
        for (var i = 0; i < separators.length; i++) {
            var end = separators[i];
            var start = rect.x;
            if (i > 0) {
                start = separators[i - 1];
            }
            rects.push({ x: start, y: rect.y, width: end - start, height: rect.height });
        }
        return rects;
    }
    function resizeWindow(window, oldRect) {
        var newRect = math.clone(window.frameGeometry);
        var x = oldRect.x;
        var separatorDir = -1; // Right
        if (newRect.x - oldRect.x === 0) {
            x = oldRect.x + oldRect.width;
            separatorDir = 1; // Left
        }
        var i = -1;
        var distance = x - rect.x;
        var distanceAbs = Math.abs(distance);
        for (var j = 0; j < separators.length; j++) {
            var newDistance = x - separators[j];
            var newDistanceAbs = Math.abs(newDistance);
            if (newDistanceAbs < distanceAbs) {
                distance = newDistance;
                distanceAbs = newDistanceAbs;
                i = j;
            }
        }
        // Stops resizing from screen edges
        if (i < 0 || i === separators.length - 1)
            return;
        if (!resized[0])
            resized[i] = 0;
        var diff = oldRect.width - newRect.width;
        if (separatorDir > 0) {
            diff = newRect.width - oldRect.width;
        }
        if (!resized[i]) {
            resized[i] = 0;
        }
        var newSeparator = separators[i] + diff;
        // Stops resizing over screen edges or other separators
        if (newSeparator <= rect.x + minWidth || newSeparator >= rect.x + rect.width - minWidth)
            return;
        if (newSeparator <= separators[i - 1] + minWidth || newSeparator >= separators[i + 1] - minWidth)
            return;
        resized[i] = resized[i] + diff;
    }
    function restore() { }
    return {
        id: id,
        limit: limit,
        getRects: getRects,
        resizeWindow: resizeWindow,
        adjustRect: adjustRect,
        restore: restore,
    };
}

function Disabled(oi, rect) {
    var id = "Disabled";
    var limit = 0;
    function getRects(windows) { }
    function resizeWindow(windows, oldRect) { }
    function adjustRect(rect) { }
    function restore() { }
    return {
        id: id,
        limit: limit,
        getRects: getRects,
        resizeWindow: resizeWindow,
        adjustRect: adjustRect,
        restore: restore,
    };
}

function _getRects(rect, separators, count) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    var v = separators.v, h = separators.h;
    var rects = [
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
        rects[0].height = rects[3].y + rects[3].height - rects[0].y;
    }
    if (count < 3) {
        rects[1].height = rects[2].y + rects[2].height - rects[1].y;
    }
    if (count < 2) {
        rects[0].width = rects[1].x + rects[1].width - rects[0].x;
    }
    return rects;
}
function TwoByTwoHorizontal(oi, rect) {
    var id = "2X2H";
    var limit = 4;
    var minSizeMultiplier = 0.15;
    var hs = rect.y + rect.height * 0.5;
    var vs = rect.x + rect.width * 0.5;
    var separators = { h: [hs, hs], v: vs };
    function adjustRect(newRect) {
        rect = newRect;
        restore();
    }
    function getRects(windows) {
        return _getRects(rect, separators, windows.length);
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
        var maxV = (1 - minSizeMultiplier) * (rect.x + rect.width);
        var minV = rect.x + rect.width * minSizeMultiplier;
        var maxH = (1 - minSizeMultiplier) * (rect.y + rect.height);
        var minH = rect.y + rect.height * minSizeMultiplier;
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
        id: id,
        limit: limit,
        getRects: getRects,
        resizeWindow: resizeWindow,
        adjustRect: adjustRect,
        restore: restore,
    };
}

function _getRects$1(rect, separators, count) {
    var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
    var v = separators.v, h = separators.h;
    var rects = [
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
        rects[0].width = rects[3].x + rects[3].width - rects[0].x;
    }
    if (count < 3) {
        rects[1].width = rects[2].x + rects[2].width - rects[1].x;
    }
    if (count < 2) {
        rects[0].height = rects[1].y + rects[1].height - rects[0].y;
    }
    return rects;
}
function TwoByTwoVertical(oi, rect) {
    var id = "2X2V";
    var limit = 4;
    var minSizeMultiplier = 0.15;
    var hs = rect.y + rect.height * 0.5;
    var vs = rect.x + rect.width * 0.5;
    var separators = { h: hs, v: [vs, vs] };
    function adjustRect(newRect) {
        rect = newRect;
        restore();
    }
    function getRects(windows) {
        return _getRects$1(rect, separators, windows.length);
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
        var maxV = (1 - minSizeMultiplier) * (rect.x + rect.width);
        var minV = rect.x + rect.width * minSizeMultiplier;
        var maxH = (1 - minSizeMultiplier) * (rect.y + rect.height);
        var minH = rect.y + rect.height * minSizeMultiplier;
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
        id: id,
        limit: limit,
        getRects: getRects,
        resizeWindow: resizeWindow,
        adjustRect: adjustRect,
        restore: restore,
    };
}

var layouts = {
    "0": Disabled,
    "1": TwoByTwoHorizontal,
    "2": TwoByTwoVertical,
    "3": Columns,
};

function layer(output, desktop) {
    var id = output.serialNumber + desktop.id;
    var oi = math.kcfgOutputIndex(output);
    var _rect = math.withMargin(oi, maximizeArea(output, desktop));
    var _layout = layouts[config.layout[oi]](oi, _rect);
    if (config.limit[oi] > -1) {
        _layout.limit = Math.min(_layout.limit, config.limit[oi]);
    }
    // @returns boolean - Indicates whether the tile array was modifier during tiling
    function tile(tiles) {
        var i = 0;
        var includedTiles = [];
        tiles.forEach(function (tile) {
            if (!tile.isEnabled())
                return;
            if (tile.isOnOutput(output) && tile.isOnDesktop(desktop)) {
                if (i < _layout.limit) {
                    i += 1;
                    includedTiles.push(tile);
                }
                else {
                    tile.disable();
                }
            }
        });
        var rects = _layout.getRects(includedTiles);
        includedTiles.forEach(function (tile, index) {
            var rect = math.withGap(oi, rects[index]);
            tile.setFrameGeometry(rect);
        });
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
    var _isKeyboard = false;
    var _oldGeometryKeyboard;
    if (!config.auto || window.minimized || window.fullScreen || isMaximized()) {
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
            window.frameGeometry = math.centerTo(_originalGeometry, window.output.geometry);
            workspace.activeWindow = window;
        }
    }
    // b43a
    function setFrameGeometry(rect) {
        if (rect.width < window.minSize.width) {
            rect.width = window.minSize.width;
        }
        if (rect.height < window.minSize.height) {
            rect.height = window.minSize.height;
        }
        window.frameGeometry = rect;
        _oldGeometryKeyboard = undefined;
    }
    function startMove(oldRect) {
        _move = true;
        _oldGeometry = math.clone(oldRect);
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
    function startResize(oldRect) {
        _resize = true;
        _oldGeometry = math.clone(oldRect);
    }
    function stopResize() {
        callbacks.resizeWindow(window, _oldGeometry);
        _resize = false;
    }
    function moveResizedChanged() {
        if (window.move && !_move) {
            startMove(window.frameGeometry);
        }
        else if (!window.move && _move) {
            stopMove();
        }
        else if (!_enabled) {
            return;
        }
        else if (window.resize && !_resize) {
            startResize(window.frameGeometry);
        }
        else if (!window.resize && _resize) {
            stopResize();
        }
    }
    // frameGeometryAboutToChange and frameGeometryChanged are used only for moving windows via KWin's default shortcuts
    // _isKeyboard and _oldGeometryKeyboard are used to identify signals triggered by the shortcut
    function frameGeometryAboutToChange() {
        if (!callbacks.isTiling() && !window.move && !window.resize && !_move && !_resize) {
            _isKeyboard = true;
        }
    }
    function frameGeometryChanged(oldRect) {
        if (!callbacks.isTiling() && !window.move && !window.resize && !_move && !_resize && _isKeyboard) {
            if (_oldGeometryKeyboard) {
                startMove(_oldGeometryKeyboard);
                stopMove();
                _oldGeometryKeyboard = undefined;
            }
            else {
                _oldGeometryKeyboard = oldRect;
            }
            _isKeyboard = false;
        }
    }
    function fullScreenChanged() {
        if (window.fullScreen) {
            disable();
        }
        else {
            enable();
        }
        callbacks.enableWindow(window);
    }
    function maximizedChanged() {
        if (window.fullScreen)
            return;
        if (isMaximized()) {
            disable();
        }
        else {
            enable();
        }
        callbacks.enableWindow(window);
    }
    function minimizedChanged() {
        if (window.minimized) {
            disable();
        }
        else {
            enable();
        }
        callbacks.pushWindow(window);
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
    window.moveResizedChanged.connect(moveResizedChanged);
    window.outputChanged.connect(outputChanged);
    window.desktopsChanged.connect(desktopsChanged);
    window.maximizedChanged.connect(maximizedChanged);
    window.minimizedChanged.connect(minimizedChanged);
    window.fullScreenChanged.connect(fullScreenChanged);
    window.frameGeometryChanged.connect(frameGeometryChanged);
    window.frameGeometryAboutToChange.connect(frameGeometryAboutToChange);
    function remove() {
        window.moveResizedChanged.disconnect(moveResizedChanged);
        window.outputChanged.disconnect(outputChanged);
        window.desktopsChanged.disconnect(desktopsChanged);
        window.maximizedChanged.disconnect(maximizedChanged);
        window.fullScreenChanged.disconnect(fullScreenChanged);
        window.frameGeometryChanged.disconnect(frameGeometryChanged);
        window.frameGeometryAboutToChange.disconnect(frameGeometryAboutToChange);
    }
    return {
        window: window,
        isEnabled: isEnabled,
        enable: enable,
        disable: disable,
        setFrameGeometry: setFrameGeometry,
        isOnOutput: isOnOutput,
        isOnDesktop: isOnDesktop,
        remove: remove,
    };
}

function wm() {
    var _tiling = false;
    var layers = {};
    var tiles = [];
    var callbacks = {
        isTiling: isTiling,
        enableWindow: enableWindow,
        pushWindow: pushWindow,
        resizeWindow: resizeWindow,
        moveWindow: moveWindow,
    };
    function isTiling() {
        return _tiling;
    }
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
        if (_tiling)
            return;
        _tiling = true;
        Object.values(layers).forEach(function (layer) {
            layer.tile(tiles);
        });
        _tiling = false;
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
            !config.captions.some(function (caption) { return window.caption.toLowerCase().includes(caption.toLowerCase()); }));
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
    function toggleActiveTile() {
        var tile = tiles.find(function (tile) { return tile.window.internalId === workspace.activeWindow.internalId; });
        toggleTile(tile);
    }
    function toggleTile(tile) {
        if (tile.isEnabled()) {
            tile.disable(true);
            tileLayers();
            workspace.activeWindow = tile.window;
        }
        else {
            tile.enable(true);
            pushWindow(tile.window);
        }
    }
    registerShortcut("(Quarter Tiling) Tile Window", "Toggles tiling for the active window", "Meta+F", toggleActiveTile);
    function actionMenu(window) {
        var tile = tiles.find(function (tile) { return tile.window.internalId === window.internalId; });
        if (tile) {
            return {
                text: "Tile Window",
                checkable: true,
                checked: tile.isEnabled(),
                triggered: function () {
                    toggleTile(tile);
                },
            };
        }
    }
    registerUserActionsMenu(actionMenu);
}

wm();
