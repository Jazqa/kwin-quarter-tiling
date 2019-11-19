import { clientManager } from "./clientManager";
import { toplevelManager } from "./toplevelManager";
import { shortcuts } from "./shortcuts";
import { signals } from "./signals";

toplevelManager.addAll();
clientManager.addAll();
shortcuts.registerShortcuts();
signals.registerSignals();
