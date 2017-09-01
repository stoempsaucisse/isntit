import {noop} from './noop';
import Validation from './Validation';
import {isPlaceholder, _} from './placeholder';
import {traverse} from './traverse';
import {curry} from './curry';
// import {getType} from './getType';
import {getNested} from './getNested';

var warn = noop;
var config = function (config) {
    if (config.development) {
        warn = log;
    }
};

var Failure = Validation.Failure;
var Success = Validation.Success;

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
    };
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
    };
    if (typeof constraints === 'function') {
        return _validateOne(constraints, data, path, originalData);
    } else {
        var args = [data, path, originalData];
        return traverse(constraints, _validateTraverse, _, args);
    };
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

export default validate;