import baseObject from './baseObject';
import checksTypes from './checksTypes';
import Validation from './Validation';

var Failure = Validation.Failure;
var Success = Validation.Success;

var validator = function (config, my, that) {
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
        };
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

export default validator;