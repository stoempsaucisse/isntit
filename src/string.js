import { warn } from './debug'

/**
 * Sort of 'printf' clone.
 * Use %{varName} in string with 'varName' as key in the `replacements` object
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
 * Set first character to upercase
 */
export function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}