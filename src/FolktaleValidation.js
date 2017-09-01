// This is shamelessly copied from folktale V.1.0
// by Quildreen Motta <quildreen@gmail.com>
// references :
// http://folktalejs.org/
// https://github.com/folktale/data.validation

// Copyright (c) 2013-2014 Quildreen Motta <quildreen@gmail.com>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

export function Validation () {};

export function Failure (a) {
    this.value = a;
};
Failure.prototype = Object.create(Validation.prototype);
export function Success (a) {
    this.value = a;
};
Success.prototype = Object.create(Validation.prototype);

Validation.Failure = function (a) {
    return new Failure(a);
};
Validation.prototype.Failure = Validation.Failure;
Validation.Success = function (a) {
    return new Success(a);
};
Validation.prototype.Success = Validation.Success;

Validation.prototype.isFailure = false;
Failure.prototype.isFailure = true;
Validation.prototype.isSuccess = false;
Success.prototype.isSuccess = true;

// End of Copyright (c) 2013-2014 Quildreen Motta <quildreen@gmail.com>