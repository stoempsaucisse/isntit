import { warn } from './debug'

/**
 * Parse a string to replace placeholders.
 *
 * @param    {string}                   str           The string to parse for
 *                                                    `%{placeholder}`.
 * @param    {Object.<string, string>}  replacements  A collection of
 *                                                    placeholder: value.
 *
 * @returns  {string}                                 The string with
 *                                                    placeholders replaced with
 *                                                    corresponding values.
 *                                                    If there is no match for
 *                                                    placeholder: value in 
 *                                                    replacements, then `%{placeholder}`
 *                                                    will remain in the string.
 *
 * @alias Isntit.printf
 */
export function printf(str, replacements) {
    return str.replace(/\%\{([\w\d_\.]+)\}/g, function(match, placeholder){
        if (typeof replacements[placeholder] != 'undefined') {
            return replacements[placeholder];
        }
        warn(`There is no replacement for ${match} in ${str}`, replacements);
        return match;
    });
}

/**
 * Uppercase the first character of given string
 *
 * @ignore
 *
 * @param    {string}  str  The string to capitalize.
 *
 * @returns  {string}  The capitalized string.
 */
export function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}