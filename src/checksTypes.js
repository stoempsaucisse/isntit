import baseObject from './baseObject';
var checksTypes = function (config, my, that) {
    config = config || {};
    my = my || {};
    that = that || {};
    // Depending on baseObject for my.noop()
    baseObject(config, my, that);

    // Checking if "that" object already has checksTypes activated
    if (my.has.checksTypes !== true) {
        my.has.checksTypes = true;

        if (config.checksTypes === undefined) { config.checksTypes = {}; };
        // Set sensible default
        if (config.checksTypes.throwOnTypeError === undefined) {
            config.checksTypes.throwOnTypeError = true;
        };

        var checkType,
            isArray,
            isNumber,
            isObject,
            isRealObject,
            getType,
            setTypeChekedMethod;

        isArray = function (array) {
            return Object.prototype.toString.apply(array) === "[object Array]";
        };
        my.isArray = isArray;
        isNumber = function (number) {
            return typeof number === 'number' && isFinite(number);
        };
        my.isNumber = isNumber;
        isObject = function (obj) {
            return obj !== null && typeof obj === 'object';
        };
        my.isObject = isObject;
        isRealObject = function (obj) {
            return Object.prototype.toString.apply(obj) === "[object Object]";
        };
        my.isRealObject = isRealObject;
        getType = function (value) {
            return Object.prototype.toString.apply(value).slice(8, -1);
        };
        my.getType = getType;

        if (config.checkTypes) {
            checkType = function (specs) {
                var i;
                for (i = 0; i < specs.args.length; i += 1) {
                    // Using my.getType() method instead of
                    // the private function lets devs overload it.
                    var argType = my.getType(specs.args[i]);
                    var shouldBe = isArray(specs.types[i]) ? specs.types[i] : [specs.types[i]];
                    if (shouldBe.length !== 0) {
                        var result = 0;
                        var j;
                        for (j = 0; j < shouldBe.length; j += 1) {
                            result |= argType === shouldBe[j];
                            if (result) { break; }
                        }
                        if (!result) {
                            var msg = specs.name + '() expects ' + shouldBe.join(' or ') + ' but ' + argType + ' given.';
                            throw new TypeError(msg);
                        }
                    }
                }
            };
            setTypeChekedMethod = function (specs) {
                var slice = Array.prototype.slice;
                this[specs.name] = function () {
                    specs.args = slice.apply(arguments);
                    checkType(specs);
                    return specs.func.apply(this, specs.args);
                };
            };
        } else {
            checkType = my.noop;
            setTypeChekedMethod = function (specs) {
                this[specs.name] = specs.func;
            };
        }
        my.checkType = checkType;
        that.setTypeChekedMethod = setTypeChekedMethod;
    };

    return that;
}

export default checksTypes;