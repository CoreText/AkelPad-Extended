/*



*/
if (!(
    AkelPad.Include("ES\\polyfills\\es5.min.js")
    && AkelPad.Include("ES\\json2.min.js")
    && AkelPad.Include("ES\\console.js")
    && AkelPad.Include("timer_extended.js")
  )) {
  WScript.Quit();
}


setTimeout(function (arg1, arg2) {
  WScript.echo(arg1 + ' ' + arg2);
}, 5, null, 'wat1', 'wat2');


//////////////////////////////////////////////////////////////////////////
console.equals(false, NaN === NaN);
console.equals(true, -0 === 0);


//////////////////////////////////////////////////////////////////////////
var test = function () {alert(1);}
console.log(test);

var entire = test.toString(); // this part may fail!
var body = entire.substring(entire.indexOf("{") + 1, entire.lastIndexOf("}"));

console.log(body); // "alert(1);"


//////////////////////////////////////////////////////////////////////////
if (console.assert(true)) {
    console.log('ok');
}

if (console.assert(false, {reason: 'not true'})) {
    console.log('not ok');
}


//////////////////////////////////////////////////////////////////////////
/*
In algebra,

    a
    = 0+a
    = 0+0+a
    = 0+0+0+a

or

    a
    = 1*a
    = 1*1*a
    = 1*1*1*a

is called identity element.


0 in +(addition) operation,

    a + 0 = a  //right identity
    0 + a = a  //left identity


1 in *(multiplication) operation,

    a * 1 = a  //right identity
    1 * a = a  //left identity



In algebra is called associative property

    1 + 2 + 3 = 1 + 2 + 3
    (1+2) + 3 = 1 + (2+3)
        3 + 3 = 1 + 5
            6 = 6

*/

var compose = function (f, g) {
    return (function (x) { return g(f(x)) })
};

var isMonad = function (m) { return !(typeof m.val === "undefined") };

// M is a highly composable unit in functional programming.
var M = function (m) {
  var m = m || [];

  var f = function (m1) {
    //check type error
    try {
      return M(M(m1).val(m));
    } catch (e) {
      return M(compose(m, M(m1).val)); // f-f compose
    };
  };

  f.val = m;

  return (
    isMonad(m)
      ? m
      : f
  );
};

M.val = function (m) { return m };


//////////////////////////////////////////////////////////////////////////
var log = function (m) {
    return (
      (typeof m !== 'function')
        ? (function () {
            console.log(m);
            return m;
          })()
        : err()
    );
};

var err = function () {
  throw new TypeError();
};

////////////////////////////////////////////////////////////////////////// Test code

var loglog = M(log)(log);
M("test")(loglog);


M("------")(log);
M([1])(log);
M(M(M(5)))(log)
M(99)(M)(log)


M("------")(log);
//M([1, 2, 3])(([a, b, c]) => [a + 1, b + 1, c + 1])(log)
M([1, 2, 3])(function (args) {
  var a = args[0];
  var b = args[1];
  var c = args[2];
  return [a + 1, b + 1, c + 1]
})(log)


M("------")(log);
var add1 = function (a) {
  return (
    (typeof a == 'number')
      ? a + 1
      : err()
  );
};

M(10)(add1)(log);             //11
M(10)(add1)(add1)(log);       //12
M(10)(add1)(add1)(add1)(log); //13

var add2 = M(add1)(add1);
M(10)(add2)(log);             //12

var add3 = M(add2)(add1);
M(10)(add3)(log);             //13


M("------")(log);
var plus = function (x) {
  return function (y) {
    return (x + y)
  };
};

M(plus(1)(5))(log);           //6
M(5)(M(1)(plus))(log);        //6

var plus1 = M(1)(plus);
M(5)(plus1)(log);             //6


M("------")(log);
var map = function (f) {
  return function (array) {
    return array.map(f);
  };
};

var map1 = M(add1)(map);
M([1, 2, 3])(log)(map1)(log);


//////////////////////////////////////////////////////////////////////////

M("left identity   M(a)(f) = f(a)")(log);
M(7)(add1)(log)               //8

M("right identity  M = M(M)")(log);
console.log(M)                //{ [Function: M] val: [Function] }
console.log(M(M))             //{ [Function: M] val: [Function] }


M("identity")(log);
M(9)(M(function (x) { return x }))(log);         //9
M(9)(function (x) { return x })(log);            //9


M("homomorphism")(log);
M(100)(M(add1))(log);         //101
M(add1(100))(log);            //101


M("interchange")(log);
M(3)(add1)(log);                                //4
M(add1)(function (f) {return f(3) })(log);      //4


M("associativity")(log);
M(10)(add1)(add1)(log);       //12
M(10)(M(add1)(add1))(log);    //12


// left identity M(a)(f) = f(a)
M(7)(add1)                    //8
M(add1(7))                    //8

// right identity M = M(M)
console.log(M)                //{ [Function: M] val: [Function] }
console.log(M(M))             //{ [Function: M] val: [Function] }



/* Applicative

A value that implements the Applicative specification must also implement the Apply specification.
    1. v.ap(A.of(x => x)) is equivalent to v (identity)
    2. A.of(x).ap(A.of(f)) is equivalent to A.of(f(x)) (homomorphism)
    3. A.of(y).ap(u) is equivalent to u.ap(A.of(f => f(y))) (interchange)
*/

// identity
M(9)(M(function (x) { return x }))               //9


// homomorphism
M(100)(M(add1))               //101
M(add1(100))                  //101


// interchange
M(3)(add1)                                      //4
M(add1)(function (f) { return f(3) })           //4



/* Chain

A value that implements the Chain specification must also implement the Apply specification.
    1. m.chain(f).chain(g) is equivalent to m.chain(x => f(x).chain(g)) (associativity)
*/

// associativity
M(10)(add1)(add1)             //12
M(10)(M(add1)(add1))          //12


