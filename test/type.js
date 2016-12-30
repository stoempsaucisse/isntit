var t = require('../src/type.js');

describe('Type tools', function() {
    describe('checkType', function() {
        it('should return a boolean', function(done) {
            (t.checkType('', [])).should.be.Boolean();
            done();
        });
        it('should return true when `object` comply with `rules`', function(done) {
            // Flat object + flat rule
            (t.checkType(true, 'boolean')).should.be.true();
            // Flat object + flat rules
            (t.checkType([true], ['string', 'array'])).should.be.true();
            // Array + flat rules
            (t.checkType([true, 'false'], [['boolean', 'string'], 'map'])).should.be.true();
            // Object + object rules
            var object = {
                field: 1,
                bool: true,
                obj: {
                    prop1: 'another string',
                    prop2: 'more strings'
                },
                prop3: 'still strings',
                prop4: false
            };
            var rules = {
                field: 'number',
                bool: ['boolean', 'number'],
                obj: {
                    __all: 'string'
                },
                __others: ['string', 'boolean']
            };
            (t.checkType(object, rules)).should.be.true();
            done();
        });
        it('should return false when `object` does not comply with `rules`', function(done) {
            // Flat object + flat rule
            (t.checkType(true, 'string')).should.be.false();
            // Flat object + flat rules
            (t.checkType([true], ['string', 'boolean'])).should.be.false();
            // Array + flat rules
            (t.checkType([true, 'false'], [['number'], 'map'])).should.be.false();
            // Object + object rules
            var object = {
                field: 1,
                bool: true,
                obj: {
                    prop1: 'another string',
                    prop2: 'more strings'
                },
                prop3: 'still strings',
                prop4: false
            };
            var rules = {
                field: 'number',
                bool: ['boolean', 'number'],
                obj: {
                    __all: 'string'
                },
                __others: ['string', 'boolean']
            };
            object.obj.prop1 = 5;
            (t.checkType(object, rules)).should.be.false();
            done();
        });
    });
    describe('typeNumber', function() {
        var values = new Set();
        var length = 0;
        for (var key in t.typeNumber) {
            ++length;
            values.add(t.typeNumber[key]);
        }
        it('should be an object', function(done) {
            (t.typeNumber).should.be.Object();
            done();
        });
        it('should have unique values', function(done) {
            (length === values.size).should.be.true();
            done();
        });
        it('values should not have any bitwise AND between them', function(done) {
            function compare(value, set) {
                var result = true;
                set.forEach(function() {
                    result = result && !(value & arguments[0]);
                });
                return result;
            }
            var result = true;
            values.forEach(function() {
                var shortened = new Set(arguments[2]);
                shortened.delete(arguments[0]);
                result = result && compare(arguments[0], shortened);
            });
            (result).should.be.true();
            done();
        });
    });
    describe('setTypeNumber', function() {
        it('should set the bit for given type', function(done) {
            // On existing type
            var typeName = 'string';
            var originalInt = t.typeNumber[typeName];
            var typeInt = 18;
            t.setTypeNumber(typeName, typeInt);
            (t.typeNumber[typeName]).should.be.equal(typeInt);
            t.setTypeNumber(typeName, originalInt);
            // On new type
            typeName = 'unknown';
            typeInt = 0;
            t.setTypeNumber(typeName, typeInt);
            (t.typeNumber[typeName]).should.be.equal(typeInt);
            delete t.typeNumber[typeName];
            done();
        });
    });
    describe('getType', function() {
        it('should return type name from given object', function(done) {
            (t.getType()).should.be.equal('undefined');
            (t.getType('string')).should.be.equal('string');
            (t.getType(5)).should.be.equal('number');
            (t.getType(true)).should.be.equal('boolean');
            (t.getType(done)).should.be.equal('function');
            (t.getType(null)).should.be.equal('null');
            (t.getType(new Date())).should.be.equal('date');
            (t.getType(/regexp/i)).should.be.equal('regexp');
            (t.getType(new Array())).should.be.equal('array');
            (t.getType(new Set())).should.be.equal('set');
            (t.getType({})).should.be.equal('object');
            (t.getType(new Map())).should.be.equal('array');
            done();
        });
    });
    describe('isOfType', function() {
        it('should return boolean if object is(n\'t) of type', function(done) {
            var types = [
                'string',
                5,
                true,
                done,
                null,
                new Date(),
                /regexp/i,
                new Set(),
                {},
                new Map()
            ];
            for (var i = 0; i < types.length; i++) {
                (t.isOfType(t.getType(types[i]), types[i])).should.be.true();
                var shortened = Array.from(types);
                delete shortened[i];
                for (var j = 0; j < shortened.length; j++) {
                    (t.isOfType(t.getType(shortened[j]), types[i], false)).should.be.false();
                };
            };
            // Previous doesn't work with undefined, so testing apart
            (t.isOfType(t.getType(undefined), undefined)).should.be.true();
            for (var i = 0; i < types.length; i++) {
                (t.isOfType(t.getType(undefined), types[i], false)).should.be.false();
            };
            done();
        });
    });
    describe('isNumber', function() {
        it('should return boolean if object is(n\'t) of a number', function(done) {
            (t.isNumber(5)).should.be.true();
            (t.isNumber('5')).should.be.false();
            done();
        });
    });
    describe('isString', function() {
        it('should return boolean if object is(n\'t) of a string', function(done) {
            (t.isString('5')).should.be.true();
            (t.isString(5)).should.be.false();
            done();
        });
    });
});