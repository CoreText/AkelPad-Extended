/**
 * Console, almost like in the browser.
 * 
 * console.log()
 * console.assert()
 * console.equal()
 */
var console = {
  log: function () {
    if (AkelPad.IsPluginRunning('Log::Output')) {
      try {
        for (var i = 0, arg = ''; i < arguments.length; i++) {
          if (typeof arguments[i] === 'object') {
            arg = JSON.stringify(arguments[i], null, 4);
          }
          else {
            arg = arguments[i];
          }
          if (AkelPad.Call('Log::Output', 4 + _TSTR, '\n' + arg + '\n', -1, 2, 0, '.json') < 0)
            break;
        }
      }
      catch (e) {
        alert(e.getMessage());
      }
    }
    else {
      alert.apply(alert, arguments);
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
      this.log.call(console, ['TRUE ('].concat(args).join(' ') + ' )');
    }
    this.log.call(console, ['FALSE ('].concat(args).join(' ') + ' )');
  }
};

function alert() {
  for (var i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === 'object')
      WScript.echo(JSON.stringify(arguments[i], null, 4));
    else
      WScript.echo(arguments[i]);
  }
}
