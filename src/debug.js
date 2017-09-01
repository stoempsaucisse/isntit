import baseObject from './baseObject';

var debug = function(config, my, that) {
    config = config || {};
    my = my || {};
    that = that || {};

    // Checking if "that" object already has debug activated
    if (my.has.debug !== true) {
        my.has.debug = true;

        // Depending on baseObject for my.noop()
        baseObject(config, my, that);
        // Set sensible default
        if (config.debug === undefined) { config.debug = false; };

        var warn;

        if (config.debug) {
            warn = function (msg, obj) {
                const hasConsole = typeof console !== 'undefined';
                if (hasConsole && !config.debug.silent) {
                    var appName = my.appName || 'debug';
                    /* eslint-disable no-console */
                    if (obj) {
                        console.error(`[${appName} warn]: ${msg}`, obj);
                    } else {
                        console.error(`[${appName} warn]: ${msg}`);
                    }
                    /* eslint-enable no-console */
                }
            };
        } else {
            warn = my.noop;
        }
        my.warn = warn;
    };

    return that;
};

export default debug;