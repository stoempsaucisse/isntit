import {Validation, Failure, Success} from './FolktaleValidation'

Failure.prototype.concat = function (aValidation) {
    // this.isFailure + aValidation.isSuccess
    // return the Failure
    return aValidation.isSuccess ?
        this.Failure(this.value) :
        this.Failure(this.value.concat(aValidation.value));
};
Success.prototype.concat = function (aValidation) {
    return aValidation.isSuccess ?
        this.Success(aValidation.value) :
        this.Failure(aValidation.value) ;
};

export default Validation;