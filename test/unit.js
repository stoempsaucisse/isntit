var Isntit = require('../src/entries/development');
var sinon = require('sinon');
var should = require('should');
require('should-sinon');

describe('Isntit', function() {
    it('should construct', function(done) {
        var I = new Isntit.default();

        should.exist(I);
        done();
    });
    it('should have some properties', function(done) {
        var I = new Isntit.default();

        I.should.have.property('rules');
        I.should.have.property('options');
        I.should.have.property('errors');
        I.should.have.property('cache');
        done();
    });
    it('should have a validate method', function(done) {
        var I = new Isntit.default();

        I.should.have.property('validate');
        I.validate.should.be.type('function');
        done();
    });
    describe('validate method', function(done) {
        it('should return a boolean', function(done) {
            var I = new Isntit.default();

            I.validate({}, {}).should.be.Boolean();
            done();
        });
        it('should call `validate()` on the right checker', function(done) {
            var checkers = Isntit.default().getCheckers();
            var checker = {
                validate: function() {}
            };
            sinon.spy(checker, 'validate');
            checkers.before['test'] = checker;
            var I = Isntit.default({}, {});

            I.validate(
                {
                    fieldName: 'value'
                },
                {
                    fieldName: {
                        test: 'value'
                    }
                }
            );
            checker.validate.should.be.calledOnce();
            done();
        });
        it('should call `preprocess()` on the right checker', function(done) {
            var checkers = Isntit.default().getCheckers();
            var checker = {
                validate: function() {},
                preprocess: function() {}
            };
            sinon.spy(checker, 'preprocess');
            checkers.before['test'] = checker;
            var I = Isntit.default({}, {});

            I.validate(
                {
                    fieldName: 'value'
                },
                {
                    fieldName: {
                        test: 'value'
                    }
                }
            );
            checker.preprocess.should.be.calledOnce();
            done();
        });
    });
    it('should have a checkRules method', function(done) {
        var I = new Isntit.default();

        I.should.have.property('checkRules');
        I.checkRules.should.be.Function();
        done();
    });
    describe('checkers', function(done) {
        var checkers = Isntit.default().getCheckers();
        describe('confirms', function(done) {
            it('should confirm that several fields have the same value', function(done) {
                var otherValue = 'otherValue';
                var context = {
                    ruleSet: {
                        confirms: {
                            field: 'otherField'
                        }
                    },
                    data: {
                        otherField: otherValue
                    }
                };
                checkers.before.confirms.validate('value', context).should.be.false();
                checkers.before.confirms.validate(otherValue, context).should.be.true();
                done();
            });
        });
        describe('required', function(done) {
            it('should check that given value is not empty', function(done) {
                checkers.before.required.validate().should.be.false();
                checkers.before.required.validate('value').should.be.true();
                done();
            });
        });
        describe('email', function(done) {
            it('should check that given value is an email', function(done) {
                var value = 'tata';
                var regExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                checkers.during.email.validate(value).should.equal(regExp.test(value));
                value = 'tata@somemail.cc';
                checkers.during.email.validate(value).should.equal(regExp.test(value));
                done();
            });
            var I = new Isntit.default();
            it('should preprocess and check value is a string', function(done) {
                var value = 'tata';
                checkers.during.email.preprocess.call(I, value).should.be.true();
                value = 50;
                checkers.during.email.preprocess.call(I, value).should.be.false();
                value = ['tata'];
                checkers.during.email.preprocess.call(I, value).should.be.false();
                value = {value: 'tata'};
                checkers.during.email.preprocess.call(I, value).should.be.false();
                done();
            });
        });
        describe('format', function(done) {
            it('should check that given value comply to a given context RegExp', function(done) {
                var value = 'tata';
                var regExp = /^2\d{3}$/i;
                var context = {
                    ruleSet: {
                        format: regExp
                    }
                }
                checkers.during.format.validate(value, context).should.equal(regExp.test(value));
                value = 2500;
                context = {
                    ruleSet: {
                        format: {
                            pattern: regExp
                        }
                    }
                }
                checkers.during.format.validate(value, context).should.equal(regExp.test(value));
                done();
            });
            var I = new Isntit.default();
            it('should preprocess and check value is a string or number', function(done) {
                var value = 'tata';
                checkers.during.format.preprocess.call(I, value).should.be.true();
                value = 50;
                checkers.during.format.preprocess.call(I, value).should.be.true();
                value = ['tata'];
                checkers.during.format.preprocess.call(I, value).should.be.false();
                value = {value: 'tata'};
                checkers.during.format.preprocess.call(I, value).should.be.false();
                done();
            });
        });
        describe('length', function(done) {
            it('should check that given value `is` n character long', function(done) {
                var value = 'a' + Math.ceil(Math.random() * 10);
                var context = {
                    ruleSet: {
                        length: {
                            is: value.length
                        }
                    }
                }
                checkers.during.length.validate.is(value, context).should.be.true();
                context = {
                    ruleSet: {
                        length: {
                            is: value.length + 1
                        }
                    }
                }
                checkers.during.length.validate.is(value, context).should.be.false();
                done();
            });
            it('should check that given value is `min` n character long', function(done) {
                var value = 'a' + Math.ceil(Math.random() * 100000);
                var context = {
                    ruleSet: {
                        length: {
                            min: value.length
                        }
                    }
                }
                checkers.during.length.validate.min(value, context).should.be.true();
                context = {
                    ruleSet: {
                        length: {
                            min: value.length + 1
                        }
                    }
                }
                checkers.during.length.validate.min(value, context).should.be.false();
                done();
            });
            it('should check that given value is `max` n character long', function(done) {
                var value = 'a' + Math.ceil(Math.random() * 100000);
                var context = {
                    ruleSet: {
                        length: {
                            max: value.length
                        }
                    }
                }
                checkers.during.length.validate.max(value, context).should.be.true();
                context = {
                    ruleSet: {
                        length: {
                            max: value.length - 1
                        }
                    }
                }
                checkers.during.length.validate.max(value, context).should.be.false();
                done();
            });
            var I = new Isntit.default();
            it('should preprocess and check value has a length property', function(done) {
                var value = 'tata';
                checkers.during.length.preprocess.call(I, value).should.be.true();
                value = 50;
                checkers.during.length.preprocess.call(I, value).should.be.false();
                value = ['tata'];
                checkers.during.length.preprocess.call(I, value).should.be.true();
                value = {value: 'tata'};
                checkers.during.length.preprocess.call(I, value).should.be.false();
                done();
            });
        });
        describe('numeric', function(done) {
            it('should check that given value is `equalTo` a given context value', function(done) {
                var power = 1000000;
                var value = Math.random() * power;
                var context = {
                    ruleSet: {
                        numeric: {
                            equalTo: value
                        }
                    }
                }
                checkers.during.numeric.validate.equalTo(value, context).should.be.true();
                checkers.during.numeric.validate.equalTo(power * 2, context).should.be.false();
                done();
            });
            it('should check that given value is `notEqualTo` a given context value', function(done) {
                var power = 1000000;
                var value = Math.random() * power;
                var context = {
                    ruleSet: {
                        numeric: {
                            notEqualTo: value
                        }
                    }
                }
                checkers.during.numeric.validate.notEqualTo(value, context).should.be.false();
                checkers.during.numeric.validate.notEqualTo(power * 2, context).should.be.true();
                done();
            });
            it('should check that given value is `greaterThan` a given context value', function(done) {
                var power = 1000000;
                var value = Math.random() * power;
                var context = {
                    ruleSet: {
                        numeric: {
                            greaterThan: value - 1
                        }
                    }
                }
                checkers.during.numeric.validate.greaterThan(value, context).should.be.true();
                checkers.during.numeric.validate.greaterThan(value * 0.5, context).should.be.false();
                done();
            });
            it('should check that given value is `greaterThanOrEqualTo` a given context value', function(done) {
                var power = 1000000;
                var value = Math.random() * power;
                var context = {
                    ruleSet: {
                        numeric: {
                            greaterThanOrEqualTo: value
                        }
                    }
                }
                checkers.during.numeric.validate.greaterThanOrEqualTo(value, context).should.be.true();
                checkers.during.numeric.validate.greaterThanOrEqualTo(value + 1, context).should.be.true();
                checkers.during.numeric.validate.greaterThanOrEqualTo(value * 0.5, context).should.be.false();
                done();
            });
            it('should check that given value is `lessThan` a given context value', function(done) {
                var power = 1000000;
                var value = Math.random() * power;
                var context = {
                    ruleSet: {
                        numeric: {
                            lessThan: value + 1
                        }
                    }
                }
                checkers.during.numeric.validate.lessThan(value, context).should.be.true();
                checkers.during.numeric.validate.lessThan(value * 2, context).should.be.false();
                done();
            });
            it('should check that given value is `lessThanOrEqualTo` a given context value', function(done) {
                var power = 1000000;
                var value = Math.random() * power;
                var context = {
                    ruleSet: {
                        numeric: {
                            lessThanOrEqualTo: value
                        }
                    }
                }
                checkers.during.numeric.validate.lessThanOrEqualTo(value, context).should.be.true();
                checkers.during.numeric.validate.lessThanOrEqualTo(value - 1, context).should.be.true();
                checkers.during.numeric.validate.lessThanOrEqualTo(value * 2, context).should.be.false();
                done();
            });
            it('should check that given value is `noStrings`', function(done) {
                var power = 1000000;
                var value = Math.random() * power;
                checkers.during.numeric.validate.noStrings(value).should.be.true();
                checkers.during.numeric.validate.noStrings(value + 'a').should.be.false();
                done();
            });
            it('should check that given value is `onlyInteger`', function(done) {
                var power = 1000000;
                var value = Math.random() * power;
                checkers.during.numeric.validate.onlyInteger(Math.ceil(value)).should.be.true();
                checkers.during.numeric.validate.onlyInteger(value).should.be.false();
                done();
            });
            var I = new Isntit.default();
            it('should preprocess and check value is a string or number', function(done) {
                var value = 'tata';
                checkers.during.numeric.preprocess.call(I, value).should.be.true();
                value = 50;
                checkers.during.numeric.preprocess.call(I, value).should.be.true();
                value = ['tata'];
                checkers.during.numeric.preprocess.call(I, value).should.be.false();
                value = {value: 'tata'};
                checkers.during.numeric.preprocess.call(I, value).should.be.false();
                done();
            });
        });
    });
});
