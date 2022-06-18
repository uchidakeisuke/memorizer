import Store from "electron-store";

const store = new Store();

export const getValue = (key: string, defaultValue: any) => {
    const tmp = store.get(key, defaultValue);
    const value = typeof tmp === typeof defaultValue ? tmp : defaultValue;
    return value;
};

export const setValue = (key: string, value: any): void => {
    store.set(key, value);
};
