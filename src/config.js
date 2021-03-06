/**
 * Default configuration object.
 *
 * @type {Object}
 * @property {string}  env=NODE_ENV The environement for current runtime
 * @property {boolean} silent=false   Whether to silence warnings when devtools are enabled
 * @property {string[]} checkersSteps='before','during'  The list of validation steps chronolgicaly ordered.
 * @see  Step
 * @property {regexp}  confirmationRE=/(.+)_confirmation$/  The RegExp to test against to detect if a fieldname is a shorthand for the {@link Checker|confirms} checker.
 * @property {regexp}  emailRE=/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i  The RegExp to validate emails.
 * @copyright Many thanks to Jan Goyvaerts for his {@link http://www.regular-expressions.info/email.html|email regular expression}
 * @property {regexp}  emptyStringRE=/^[\s\t\n\r]+$/  The RegExp that defines which strings are considered as empty. This is used by {@link Isntit.isEmpty}
 * @property {string[]} emptyValues=null,undefined,'undefined'  The values to consider as empty. This is used by {@link Isntit.isEmpty}
 * @property {Object.<string, MessageTypes>} messages The fallback error messages tu use when validation against default checkers fails. Use the {@link Checker|checker name} as key.
 * @property {string} noLabelChar=^ Any error message starting with this chaaracter will never be prepended with the corresponding field name (even when {@link Options| options.fullMessages}) is true.
 */
var config = {
    env: 'process.env.NODE_ENV',
    silent: false,
    checkersSteps: ['before', 'during'],
    confirmationRE: /(.+)_confirmation$/,
    /**
     * Many thanks to Jan Goyvaerts for his email regular expression
     * @url : http://www.regular-expressions.info/email.html
     */
    emailRE: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    emptyStringRE: /^[\s\t\n\r]+$/,
    emptyValues: [null, undefined, 'undefined'],
    messages: {
        confirms: "should be sames as %{field}",
        required: "is required",
        email: "is not a valid email",
        format: "",
        length: function(context) {
            var rule = context.ruleSet['length'];
            if(rule.is) {
                return 'must be exactly %{is} characters long';
            }
            if(rule.min && rule.max) {
                return 'must be between %{min} and %{max} characters long';
            }
            if(rule.min) {
                return 'must be minimum %{min} characters long';
            }
            if(rule.max) {
                return 'must be maximum %{min} characters long';
            }
        },
        numeric: {
            onlyInteger: 'must be an integer',
            noStrings: 'strings are not allowed',
            equalTo: 'must be equal to %{equalTo}',
            notEqualTo: 'must not be equal to %{notEqualTo}',
            greaterThan: 'must be greater than %{greaterThan}',
            greaterThanOrEqualTo: 'must be greater than or equal to %{greaterThanOrEqualTo}',
            lessThan: 'must be less than %{lessThan}',
            lessThanOrEqualTo: 'must be less than or equal to %{lessThanOrEqualTo}'
        },
        notValid: "is not valid."
    },
    noLabelChar: "^"
};

export { config }