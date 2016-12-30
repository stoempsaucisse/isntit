var s = require('../src/string');

describe('String tools', function() {
    describe('printf', function() {
        it('should return a string with placeholders replaced', function(done) {
            var prefix = "a string with a ";
            var fix = "%{placeholder}";
            var sufix = " in it";
            var str =  prefix + fix + sufix;
            var replacements = {
                placeholder: "'replaced placeholder'"
            };
            var res = prefix + replacements.placeholder + sufix;
            (s.printf(str, replacements)).should.be.equal(res);

            done();
        })
        it('should warn + return a string with placeholders "en place" if no replacement found', function(done) {
            var prefix = "a string with a ";
            var fix = "%{placeholder}";
            var sufix = " in it";
            var str =  prefix + fix + sufix;
            var replacements = {
                another: "'replaced placeholder'"
            };
            (s.printf(str, replacements)).should.be.equal(str);

            done();
        })
    });
    describe('ucfirst', function() {
        it('should return given string with first character uppercased', function(done) {
            var str = 'any string';
            var startCode = str.codePointAt(0);
            // console.log(startCode);
            // code for a == 97, for A == 65 difference is (- 32)
            (s.ucfirst(str).codePointAt(0)).should.be.equal(startCode - 32);

            done();
        })
    });
});
