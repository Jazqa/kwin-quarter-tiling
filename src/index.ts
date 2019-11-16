import { clientManager } from "./clientManager";
import { shortcuts } from "./shortcuts";
import { signals } from "./signals";

clientManager.addClients();
shortcuts.registerShortcuts();
signals.registerSignals();
