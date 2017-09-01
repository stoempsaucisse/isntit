/*!
 * Isntit - a simple javascript validation library
 * version: 2.0.0
 * (c) 2016-2017 stoempsaucisse
 * Released under the MIT License.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.test = factory());
}(this, (function () { 'use strict';

var noop = function () {};

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

var placeholder = function () {
    return placeholder;
};
var isPlaceholder = function (a) {
    return a === _;
};
var _ = placeholder();

var getType = function (value) {
    return Object.prototype.toString.apply(value).slice(8, -1);
};

var traverse = function (obj, fn, acc, args, path) {
    var key;
    path = path || [];
    for (key in obj) {
        path.push(key);
        if (getType(obj[key]) === 'Object') {
            acc = traverse(obj[key], fn, acc, args, path);
        } else {
            acc = fn(obj[key], acc, path, args);
        }
        path.pop();
    }
    return acc;
};

var slice = function(args, a, b) {
    return [].slice.apply(args, [a, b]);
};

var mergeArguments = function (primaryArgs, secundaryArgs) {
    var merged = [].concat(primaryArgs);
    var i = 0;
    for (i; i < secundaryArgs.length; i += 1) {
        var index = merged.indexOf(_);
        if (index !== -1) {
            // log(index);
            // log(merged);
            // log(secundaryArgs[i]);
            merged[index] = secundaryArgs[i];
        } else {
            merged.push(secundaryArgs[i]);
        }
    }
    return merged;
};

var curry = function (fn) {
    var args = slice(arguments, 1);
    return function () {
        var fnArgs = mergeArguments(args, slice(arguments));
        var fnApply = fnArgs.indexOf(_) === -1;
        if (fnApply) {
            return fn.apply(null, fnArgs);
        } else {
            return curry.apply(null, [fn].concat(fnArgs));
        }
    };
};

var getNested = function(path, obj) {
    path = (typeof path === 'string') ?
        path.split('.') :
        path;
    var i;
    for (i = 0; i < path.length; i += 1) {
        obj = obj === undefined ?
            obj :
            obj[path[i]];
    }
    return obj;
};

// import {getType} from './getType';
var warn = noop;
var config = function (config) {
    if (config.development) {
        warn = log;
    }
};

var Failure = Validation$1.Failure;
var Success = Validation$1.Success;

var _validateTraverse = function (validator, result, path, args) {
    var value;
    var data = args[0];
    var fieldPrefix = args[1];
    var originalData = args[2];
    if (isPlaceholder(result)) {
        result = Success();
        value = getNested(path, data);
    } else {
        value = result.isSuccess ?
            result.value.value :
            getNested(path, data);
    }
    if (fieldPrefix !== undefined) {
        path = fieldPrefix.split('.').concat(path);
    }
    var field = path.join('.');
    result = result.concat(
        _validateOne(validator, value, field, originalData)
    );
    return result;
};
var _validateOne = function (validator, value, field, originalData) {
    return validator(value, originalData, field);
};
var _validate = function (constraints, data, path, originalData) {
    warn(arguments);
    var path = arguments[2];
    var originalData = arguments[3] || data;
    if (path !== undefined) {
        constraints = getNested(path, constraints);
        data = getNested(path, data);
    }
    if (typeof constraints === 'function') {
        return _validateOne(constraints, data, path, originalData);
    } else {
        var args = [data, path, originalData];
        return traverse(constraints, _validateTraverse, _, args);
    }
};
var validate = function (constraints, data, path, originalData) {
    constraints = constraints || _;
    data = data || _;
    return curry(_validate, constraints, data, path, originalData)();
};
var _only = function (constraints, path, data, originalData) {
    return _validate(constraints, data, path, originalData);
};
var only = function (constraints, path, data, originalData) {
    constraints = constraints || _;
    path = path || _;
    data = data || _;
    return curry(_only, constraints, path, data, originalData)();
};
var _setProps = function (obj) {
    obj.Success = Success;
    obj.Failure = Failure;
    obj.constrained = constrained;
    obj.config = config;
    return obj;
};
var constrained = function (constraints) {
    var newValidate = validate.apply(null, arguments);
    var newOnly = only.apply(null, arguments);

    newValidate = _setProps(newValidate);
    newValidate.validate = newValidate;
    newValidate.only = newOnly;

    return newValidate;
};

validate = _setProps(validate);
validate.validate = validate;
validate.only = only;
validate.acc = curry;
validate._ = _;
validate.isPlaceholder = isPlaceholder;

var test$1 = validate;

return test$1;

})));
