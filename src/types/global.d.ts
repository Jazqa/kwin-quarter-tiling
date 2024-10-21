import { KWinWorkspaceWrapper } from "./kwin";

declare global {
  var workspace: KWinWorkspaceWrapper;
  var readConfig: (key: string, defaultValue: any) => any;
  var registerUserActionsMenu: (actionsMenu: Object) => void;
  var registerShortcut: (name: string, description: string, key: string, cb: () => void) => void;
}
