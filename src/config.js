/**
 * Default configuration (for production).
 */
var config = {
    /**
     * Many thanks to Jan Goyvaerts for his email regular expression
     * @url : http://www.regular-expressions.info/email.html
     */
    emailRE: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    emptyStringRE: /^[\s\t\n\r]+$/,
    emptyValues: [null, undefined, 'undefined'],
    checkersSteps: ['before', 'during'],
    confirmationRE: /(.+)_confirmation$/,
    comparators: {
        '==': function(val1, val2) {
            return (val1 == val2);
        },
        '===': function(val1, val2) {
            return (val1 === val2);
        },
        '!=': function(val1, val2) {
            return (val1 != val2);
        },
        '!==': function(val1, val2) {
            return (val1 !== val2);
        },
        '>': function(val1, val2) {
            return (val1 > val2);
        },
        '>=': function(val1, val2) {
            return (val1 >= val2);
        },
        '<': function(val1, val2) {
            return (val1 < val2);
        },
        '<=': function(val1, val2) {
            return (val1 <= val2);
        },
        // Aliasses
        get equalTo(){ 
            delete this.equalTo;
            return this.equalTo = this['=='];
        },
        get notEqualTo(){ 
            delete this.notEqualTo;
            return this.notEqualTo = this['!='];
        },
        get greaterThan(){ 
            delete this.greaterThan;
            return this.greaterThan = this['>'];
        },
        get greaterThanOrEqualTo(){ 
            delete this.greaterThanOrEqualTo;
            return this.greaterThanOrEqualTo = this['>='];
        },
        get lessThan(){ 
            delete this.lessThan;
            return this.lessThan = this['<'];
        },
        get lessThanOrEqualTo(){ 
            delete this.lessThanOrEqualTo;
            return this.lessThanOrEqualTo = this['<='];
        }
    },
    equalityComparators: [
        '==', '===', '!=', '!==', 'equalTo', 'notEqualTo'
    ],
    messages: {
        confirms: "should be sames as %{field}.",
        required: "is required",
        email: "is not a valid email.",
        format: "",
        length: function() {
            var context = this;
            var rule = context.ruleSet['length'];
            if(rule.is) {
                return 'must be exactly %{is} characters long.';
            }
            if(rule.min && rule.max) {
                return 'must be between %{min} and %{max} characters long.';
            }
            if(rule.min) {
                return 'must be minimum %{min} characters long.';
            }
            if(rule.max) {
                return 'must be maximum %{min} characters long.';
            }
        },
        numeric: function() {
            var context = this;
            var numeric = context.ruleSet['numeric'];
            var message = []
            if(numeric.onlyInteger && (context.value % 1 !== 0)) {
                message.push('must be an integer');
            }
            if(numeric.noStrings && (typeof context.value === 'string')) {
                message.push('strings are not allowed');
            }
            if(numeric.equalTo) {
                message.push('must be equal to %{equalTo}');
            }
            if(numeric.notEqualTo) {
                message.push('must not be equal to %{notEqualTo}');
            }
            if(numeric.greaterThan) {
                message.push('must be greater than %{greaterThan}');
            }
            if(numeric.greaterThanOrEqualTo) {
                message.push('must be greater than or equal to %{greaterThanOrEqualTo}');
            }
            if(numeric.lessThan) {
                message.push('must be less than %{lessThan}');
            }
            if(numeric.lessThanOrEqualTo) {
                message.push('must be less than or equal to %{lessThanOrEqualTo}');
            }
            return message.join(' and ') + '.';
        }
    },
    noLabelChar: "^"
};

export { config }