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

function isBlacklisted(client) {
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

// @flow
function addClient(client) {
    if (!isBlacklisted(client)) {
        client.clientStartUserMovedResized.connect(this.startMoveClient);
        client.clientFinishUserMovedResized.connect(this.finishMoveClient);
        // TODO: tile(clients, client.screen, client.desktop);
    }
}
function addClients() {
    if (config.autoTile) {
        workspace.clientList().forEach(addClient);
    }
}
function removeClient(client) {
    var index = this.findClient(client);
    if (index > -1) {
        this.clients.splice(index, 1);
        client.clientStartUserMovedResized.disconnect(this.startMoveClient);
        client.clientFinishUserMovedResized.disconnect(this.finishMoveClient);
        // TODO: tile(clients, client.screen, client.desktop);
    }
}
function maximizeClient(client, h, v) {
    if (h && v) {
        this.removeClient(client);
    }
}
function fullScreenClient(client, fullScreen) {
    if (fullScreen) {
        this.removeClient(client);
    }
}

function registerSignals() {
    if (config.autoTile) {
        workspace.clientAdded.connect(addClient);
    }
    workspace.clientRemoved.connect(removeClient);
    workspace.clientMaximizeSet.connect(maximizeClient);
    workspace.clientFullScreenSet.connect(fullScreenClient);
    workspace.clientUnminimized.connect(addClient);
    workspace.clientMinimized.connect(removeClient);
    // workspace.currentDesktopChanged.connect(currentDesktopChanged);
    // workspace.desktopPresenceChanged.connect(desktopPresenceChanged);
}

addClients();
registerSignals();
