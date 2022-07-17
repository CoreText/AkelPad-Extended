if (!Array.prototype.flatMap) {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap
   */
  Array.prototype.flatMap = function (callbackFn, thisArg) {
    return this.reduce(function (acc, x) {
      var args = Array.prototype.slice.call(arguments, 1);
      return acc.concat(callbackFn.apply((thisArg || callbackFn), args));
    }, []);
  };
}

function isNaN(value) {
  return value !== value;
}
