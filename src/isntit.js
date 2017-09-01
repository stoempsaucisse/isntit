import validator from './validator';
import app from './app';
import Validation from './Validation';

var Failure = Validation.Failure;
var Success = Validation.Success;

var isntit = function (config, constraintsSet) {
    var my = {},
        that = validator(config, my);

    my.appName = 'isntit';
    my.appVersion = '2.0.0';
    app(config, my, that);
    that.version = that.getVersion();
    that.name = that.getName();

    // Boot isntit object.
    if (constraintsSet !== undefined) {
        that.setConstraints(constraintsSet);
    }

    return that;
};

// Give acces to validator function from within browser
isntit.validator = validator;

isntit.Success = Success;
isntit.Failure = Failure;

export default isntit;