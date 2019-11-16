import { clientManager } from "./clientManager";
import { toplevelManager } from "./toplevelManager";
import { shortcuts } from "./shortcuts";
import { signals } from "./signals";

clientManager.addAll();
toplevelManager.addAll();
shortcuts.registerShortcuts();
signals.registerSignals();
