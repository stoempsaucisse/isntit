import { config } from './config'
import { noop } from './utils'

var warn = noop;
if (process.env.NODE_ENV !== 'production') {
    const hasConsole = typeof console !== 'undefined';
    warn = function(msg, obj) {
        if (hasConsole && (!config.silent)) {
            if (obj) {
                console.error(`[Isntit warn]: ${msg}`, obj);
            } else {
                console.error(`[Isntit warn]: ${msg}`);
            }
        }
    }
}

export { warn }