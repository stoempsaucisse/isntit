var Isntit = require('../src/entries/development');

describe('Isntit', function() {
    it('should have some properties', function(done) {
        var I = new Isntit.default();

        I.should.have.property('rules');
        I.should.have.property('options');
        done();
    })
});
