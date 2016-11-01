

// Compare values
// Isntit.compare = function(value1, comparator, value2, strict) {
//     var strict = strict || false;
//     var result;
//     var typeOf1 = Isntit.getTypeBit(value1);
//     var typeOf2 = Isntit.getTypeBit(value2);
//     var types = (typeOf1 | typeOf2);
//     if (strict && (typeOf1 !== typeOf2)) {
//         throw new Error("When comparing values in strict mode, both value MUST have same bit mask.")
//     }
//     // Strings and Numbers only
//     if (types <= 3) {
//         return _compare(value1, comparator, value2);
//     }
//     // Other types MUST have same bit mask
//     if (typeOf1 !== typeOf2) {
//         return false;
//     }
//     // Other types are only compared for equality
//     if (config.equalityComparators.indexOf(comparator) === -1) {
//         throw new Error("Values other than numbers or string can only by compared for equality. Given comparator: " + comparator);
//     }
//     // Arrays and Maps
//     if (types === 64) {
//         var objLength1 = value1.length || value1.size;
//         var objLength2 = value2.length || value2.size;
//         if (objLength1 !== objLength2) {
//             return false;
//         }
//         var values = {
//             value2: value2,
//             result: true
//         };
//         value1.forEach(function(item1, index) {
//             if (!result) {
//                 return false;
//             }
//             var item2 = (typeof values.value2[index] !== 'undefined') ?
//                 values.value2[index] :
//                 values.value2.get(index);
//             values.result = (values.result && _compare(item1, comparator, item2, strict));
//         });
//         return values.result;
//     }
//     // Sets (not supported)
//     if (types === 128) {
//         throw new Error('Comparing Sets is not supported (yet?).');
//     }
//     // Objects
//     if (types === 256) {
//         var result = true;
//         for (var key in value1) {
//             if (!result) {
//                 return false;
//             }
//             result = (result && _compare(value1[key], comparator, value2[key], strict));
//         }
//         return result;
//     }
//     // Other types
//     return (strict) ?
//         (value1 === value2) :
//         (value1 == value2);
// }