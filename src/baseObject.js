var baseObject = function (config, my, that) {
    config = config || {};
    my = my || {};
    if (my.has === undefined) { my.has = {} };

    that = that || {};

    // Checking if "that" object already has baseObject activated
    if (my.has.baseObject !== true) {
        my.has.baseObject = true;

        var errors = {
                Error: function (msg) { throw new Error(msg); },
                TypeError: function (msg) { throw new TypeError(msg); }
            },
            getConfig,
            getNested,
            index,
            noop,
            setNested,
            throwError,
            unsetNested;

        getConfig = function () {
            return config;
        };
        that.getConfig = getConfig;
        getNested = function (obj, key) {
            var portions = typeof key === 'string' ? key.split('.') : key;
            return portions.reduce(index, obj);
        };
        my.getNested = getNested;
        index = function (obj, i) {
            if (obj[i] === undefined) {
                throw new Error('index() : obj[i] is undefined');
            }
            return obj[i];
        };
        my.index = index;
        noop = function () {};
        my.noop = noop;
        setNested = function (obj, key, value) {
            var portions = typeof key === 'string' ? key.split('.') : key;
            var pointer = obj;
            var i;
            for (i = 0; i < portions.length; i += 1) {
                if (pointer[portions[i]] === undefined) {
                    pointer[portions[i]] = {};
                }
                if (i + 1 === portions.length) {
                    pointer[portions[i]] = value;
                }
                pointer = pointer[portions[i]];
            }
        };
        my.setNested = setNested;
        throwError = function (type, msg) {
            errors[type](msg);
        };
        my.throwError = throwError;
        unsetNested = function (obj, key) {
            var portions = typeof key === 'string' ? key.split('.') : key;
            var pointer = obj;
            var i;
            for (i = 0; i < portions.length; i += 1) {
                if (pointer[portions[i]] === undefined) {
                    throw new Error('unsetNested() : obj.' + portions.slice(0, i).join('.') + ' is undefined');
                }
                if (i + 1 === portions.length) {
                    delete pointer[portions[i]];
                }
                pointer = pointer[portions[i]];
            }
        };
        my.unsetNested = unsetNested;
    };

    return that;
};

export default baseObject;