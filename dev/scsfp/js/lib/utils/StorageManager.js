
export const storageManager = {
    load(key, defaultValue = null) {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        try {
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error parsing JSON from localStorage for key "${key}":`, e);
            localStorage.removeItem(key);
            return defaultValue;
        }
    },

    save(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (e) {
            console.error(`Error saving data to localStorage for key "${key}":`, e);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    }
};