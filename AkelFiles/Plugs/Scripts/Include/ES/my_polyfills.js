/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap
 */
Array.prototype.flatMap = function (callbackFn, thisArg) {
  return this.reduce(function (acc, x) {
    var args = Array.prototype.slice.call(arguments, 1);
    return acc.concat(callbackFn.apply((thisArg || callbackFn), args));
  }, []);
};

function isNaN(value) {
  return value !== value;
}

var console = {
  log: function () {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === "object")
        WScript.echo(JSON.stringify(arguments[i], null, 4));
      else
        WScript.echo(arguments[i]);
    }
  },
  assert: function (expr) {
    if (expr) return true;
    var args = Array.prototype.slice.call(arguments, 1);
    this.log.apply(console, ['Assertion failed:'].concat(args));
  },
  equal: function (a, b) {
    var args = Array.prototype.slice.call(arguments, 0);
    if (a === b) {
        this.log.call(console,  ['TRUE ('].concat(args).join(' ') + ' )');
    }
    this.log.call(console, ['FALSE ('].concat(args).join(' ') + ' )');
  }
};

