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
        '==': {
            fun: function(val1, val2) {
                return (val1 == val2);
            },
            name: "equalsTo"
        },
        '>': {
            fun: function(val1, val2) {
                return (val1 > val2);
            },
            name: "greaterThan"
        },
        '>=': {
            fun: function(val1, val2) {
                return (val1 >= val2);
            },
            name: "greaterThanOrEqualsTo"
        },
        '<': {
            fun: function(val1, val2) {
                return (val1 < val2);
            },
            name: "lessThan"
        },
        '<=': {
            fun: function(val1, val2) {
                return (val1 <= val2);
            },
            name: "lessThanOrEqualsTo"
        }
    }
};

export { config }