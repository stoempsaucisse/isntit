/*!
 * Isntit - a simple javascript validation library
 * version: 2.0.0
 * (c) 2016-2017 stoempsaucisse
 * Released under the MIT License.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.validator = factory());
}(this, (function () { 'use strict';

var baseObject = function (config, my, that) {
    config = config || {};
    my = my || {};
    if (my.has === undefined) { my.has = {}; }

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
    }

    return that;
};

var checksTypes = function (config, my, that) {
    config = config || {};
    my = my || {};
    that = that || {};
    // Depending on baseObject for my.noop()
    baseObject(config, my, that);

    // Checking if "that" object already has checksTypes activated
    if (my.has.checksTypes !== true) {
        my.has.checksTypes = true;

        if (config.checksTypes === undefined) { config.checksTypes = {}; }
        // Set sensible default
        if (config.checksTypes.throwOnTypeError === undefined) {
            config.checksTypes.throwOnTypeError = true;
        }

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
    }

    return that;
};

// This is shamelessly copied from folktale V.1.0
// by Quildreen Motta <quildreen@gmail.com>
// references :
// http://folktalejs.org/
// https://github.com/folktale/data.validation

// Copyright (c) 2013-2014 Quildreen Motta <quildreen@gmail.com>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

function Validation$1 () {}

function Failure$1 (a) {
    this.value = a;
}
Failure$1.prototype = Object.create(Validation$1.prototype);
function Success$1 (a) {
    this.value = a;
}
Success$1.prototype = Object.create(Validation$1.prototype);

Validation$1.Failure = function (a) {
    return new Failure$1(a);
};
Validation$1.prototype.Failure = Validation$1.Failure;
Validation$1.Success = function (a) {
    return new Success$1(a);
};
Validation$1.prototype.Success = Validation$1.Success;

Validation$1.prototype.isFailure = false;
Failure$1.prototype.isFailure = true;
Validation$1.prototype.isSuccess = false;
Success$1.prototype.isSuccess = true;

// End of Copyright (c) 2013-2014 Quildreen Motta <quildreen@gmail.com>

Failure$1.prototype.concat = function (aValidation) {
    // this.isFailure + aValidation.isSuccess
    // return the Failure
    return aValidation.isSuccess ?
        this.Failure(this.value) :
        this.Failure(this.value.concat(aValidation.value));
};
Success$1.prototype.concat = function (aValidation) {
    return aValidation.isSuccess ?
        this.Success(aValidation.value) :
        this.Failure(aValidation.value) ;
};

var Success = Validation$1.Success;

var validator$1 = function (config, my, that) {
    config = config || {};
    my = my || {};
    that = that || {};
    baseObject(config, my, that);

    var data,
        only,
        path,
        result,
        constraints,
        constraintsSubset;

    var getResults,
        passed,
        passes,
        reset,
        setData,
        setConstraints,
        validate,
        validateOnly,
        validateSubset;


    // Depending on checksTypes for my.checkType()
    checksTypes(config, my, that);

    that.failed = function () {
        return !passed();
    };
    that.fails = function (dataSet) {
        return !passes(dataSet);
    };
    getResults = function() {
        return result;
    };
    that.getResults = getResults;
    that.only = function (key) {
        var specs = {
            name: 'only',
            args: [key],
            types: ['String']
        };
        try {
            my.checkType(specs);
            reset();
            only = key;
        } catch (e) {
             throw new TypeError(`only() expects a dot notation String but ${my.getType(key)} given.`);
        }
        return that;
    };
    passed = function () {
        if (result === undefined) {
            my.throwError('Error', 'Trying to get validation results before validating data!');
        }
        return result.isSuccess;
    };
    that.passed = function () {
        return passed();
    };
    passes = function (dataSet) {
        validate(dataSet);
        return passed();
    };
    that.passes = function (dataSet) {
        return passes(dataSet);
    };
    reset = function () {
        result = undefined;
    };
    setData = function (dataSet) {
        var specs = {
            name: 'setData',
            args: [dataSet],
            types: ['Object']
        };
        my.checkType(specs);

        data = dataSet;
    };
    that.setData = function(dataSet) {
        setData(dataSet);
        return that;
    };
    setConstraints = function (constraintsSet) {
        var specs = {
            name: 'setConstraints',
            args: [constraintsSet],
            types: ['Object']
        };
        my.checkType(specs);
        constraints = constraintsSet;
        constraintsSubset = constraints;
    };
    that.setConstraints = function (constraintsSet) {
        setConstraints(constraintsSet);
        return that;
    };
    that.subset = function (keys) {
        var specs = {
            name: 'subset',
            args: [keys],
            types: [['Array', 'String']]
        };
        my.checkType(specs);

        // Reset validation constraints holder to empty
        constraintsSubset = {};
        keys = typeof keys === 'string' ? [keys] : keys;
        var i;
        for (i = 0; i < keys.length; i += 1) {
            try {
                var value = my.getNested(constraints, keys[i]);
                my.setNested(constraintsSubset, keys[i], value);
            } catch (e) {
                my.throwError('Error', 'Bad parameter for subset()! \'' + keys[i] + '\' doesn\'t match any rule.');
            }
        }
        reset();
        // Reset only
        only = undefined;
        return that;
    };
    that.unOnly = function () {
        only = undefined;
        reset();
        return that;
    };
    that.unSubset = function () {
        constraintsSubset = constraints;
        reset();
        return that;
    };
    validate = function (dataSet) {
        if (dataSet !== undefined) {
            setData(dataSet);
        }

        if (data === undefined) {
            my.throwError('Error', 'No data to validate!');
        }

        result = Success();
        if (only !== undefined) {
            validateOnly();
        } else {
            // Reset path, but is this really necessary?
            path = [];
            validateSubset(data, constraintsSubset);
        }
    };
    that.validate = function (dataSet) {
        validate(dataSet);
        return that;
    };
    validateOnly = function () {
        var test,
            value;
        try {
            test = my.getNested(constraintsSubset, only);
        } catch (e) {
            throw new Error('Bad parameter for only(), \'' + only + '\' doesn\'t match any rule.');
        }
        try {
            value = my.getNested(data, only);
        } catch (e) {
            throw new Error('Bad parameter for only(), \'' + only + '\' doesn\'t match any data.');
        }

        result = result.concat(test.apply(this, [only, value]));
        // if (!test.apply(this, [value])) {
        //     fail();
        // };
    };
    validateSubset = function (dataSet, constraintsSet) {
        var key;
        // Walk through local constraints
        for (key in constraintsSet) {
            path.push(key);
            if (typeof constraintsSet[key] !== 'function') {
                validateSubset(dataSet[key], constraintsSet[key]);
            } else {
                result = result.concat(constraintsSet[key](path.join('.'), dataSet[key]));
                // if (!constraintsSet[key](dataSet[key])) {
                //     fail();
                // };
            }
            path.pop();
        }
    };

    return that;
};

return validator$1;

})));
