export const kwOptions: KWOptions = options ? options : {};

export const kwWorkspace: KWWorkspace = workspace;

export const kwReadConfig = readConfig
  ? readConfig
  : (key: string, defaultValue: any): any => {
      return defaultValue;
    };

export const kwReadConfigString = (key: string, defaultValue: any): string => {
  return kwReadConfig(key, defaultValue).toString();
};

export const kwRegisterShortcut = registerShortcut;

export const kwPrint = print;
