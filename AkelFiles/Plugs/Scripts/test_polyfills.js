/*



*/
if (!(
    AkelPad.Include("ES\\polyfills\\es5.min.js")

        && AkelPad.Include("ES\\underscore.min.js")

    && AkelPad.Include("ES\\my_polyfills.js")
    && AkelPad.Include("ES\\json2.min.js")
    && AkelPad.Include("ES\\symbol.min.js")
    && AkelPad.Include("ES\\polyfills\\es2016.min.js")
    && AkelPad.Include("timer_extended.js")
    && AkelPad.Include("ES\\promise.min.js")
    && AkelPad.Include("ES\\reflect.js")
    && AkelPad.Include("ES\\polyfills\\es6.min.js")
    && AkelPad.Include("ES\\polyfills\\es2017.min.js")
    //&& AkelPad.Include("ES\\object.js")
    && AkelPad.Include("ES\\iterate-iterator.js")
  )) {
  WScript.Quit();
}


var und = _.filter([1, 2, 3, 4, 5, 6], function(num){ return num % 2 == 0; });
console.log(und);


['test', 'one', 'two'].forEach(function (item) {
  console.log(item)
});



setTimeout(function (args) {
  console.log(args)
}, 5, null, 'wat wat wat');



console.log('Breaded Mushrooms'.padEnd(25, '.'));



console.log(Symbol('foo'));

// [Symbol.iterator]() - NOT WORKING :(


//////////////////////////////////////////////////////////////////////////

var arr = [
     ['mark johansson', 'waffle iron', '80' , '2'],
     ['mark johansson', 'blender'    , '200', '1'],
     ['mark johansson', 'knife'      , '10' , '4'],
     ['Nikita Smith'  , 'waffle iron', '80' , '1'],
     ['Nikita Smith'  , 'knife'      , '10' , '2'],
     ['Nikita Smith'  , 'pot'        , '20' , '3']
];

var structure = arr.reduce(function (customers, line) {
  customers[line[0]] = customers[line[0]] || [];
  customers[line[0]].push({
    name: line[1],
    price: line[2],
    quantity: line[3]
  });
  return customers;
}, {})

console.log(JSON.stringify(structure, null, 4))

//////////////////////////////////////////////////////////////////////////

var inventory = [
  {name: 'apples', quantity: 2},
  {name: 'bananas', quantity: 0},
  {name: 'cherries', quantity: 5}
];

function isCherries(fruit) {
  return fruit.name === 'cherries';
}

console.log(inventory.find(isCherries));

//////////////////////////////////////////////////////////////////////////

var johnDoe = {
  firstName: "John",
  lastName: "Doe",
  sayName: function () {
    return "My name is " + this.firstName + " " + this.lastName;
  }
};

var janeDoe = Object.create(johnDoe, {
  firstName: {
    value: "Jane"
  },
  greet: {
    value: function (person) {
      return "Hello, " + person.firstName;
    }
  }
});

var jimSmith = Object.create(janeDoe, {
  firstName: {
    value: "Jim"
  },
  lastName: {
    value: "Smith"
  }
});

console.log(janeDoe.sayName() + " " + janeDoe.greet(johnDoe));
console.log(jimSmith.sayName() + " " + jimSmith.greet(janeDoe));
console.log(JSON.stringify(jimSmith, null, 4));



//////////////////////////////////////////////////////////////////////////
var createPeroson = function (firstName, lastName) {
    var person = {};

    Object.defineProperties( person, {
        firstName: {
            value: firstName,
            enumerable: true, // by default is false
            writable  : true
        },
        lastName : {
            value: lastName,
            enumerable: true,
            writable  : true
        },
        getFullName : {
            value : function () {
                return this.firstName + " " + this.lastName;
            }
        },
        setFullName : {
            value : function (value) {
                var val = value.split(" ");
                this.firstName = val[0];
                this.lastName  = val[1];
            },
            enumerable  : true,
            configurable: true
        },
        sayHi: {
            value: function () {
                return "Hello!";
            }
        }
    });

    return person;
};

var person = createPeroson("John", "Doe");
console.log(person)
console.log(person.getFullName())
console.log(person.sayHi())


/**
 * Parasitic Inheritance
 */
var createEmployee = function (firstName, lastName, position) {
    var person = createPeroson(firstName, lastName);

    person.position = position || "no position";

    // var fullName = person.fullName; /* won't redefine this property */
    // gets property descriptor and we can redefine property
    var getFullName = Object.getOwnPropertyDescriptor( person, "getFullName");

    // it will execute func as it was person's obj
    var fullNameFunction = getFullName.value.bind(person);

    // так можно перегружать функции
    var sayHiFunction = person.sayHi.bind(person);

    person.sayHiFunction = function () {
        return sayHiFunction() + ". My name is " + this.getFullName();
    };

    Object.defineProperty(person, "fullPosition", {
        value : function () {
            return fullNameFunction() + " (" + this.position + ")";
        },
        enumerable: true,
        configurable: true
    });

    return person;
};

var newEmployee = createEmployee("Snoop", "Dogg", "Web Developer");

console.log(newEmployee.fullPosition());
console.log(newEmployee.sayHiFunction());



//////////////////////////////////////////////////////////////////////////

/**
 * A - object literal
 */
var A = {
  name: 'A',
  special: 'from A',
  specialMethod: function () {
    return this.name + ' ' + this.special
  }
};

var newA = Object.create(A)
B.prototype = newA
B.constructor = A

/**
 * B - function
 */
function B() {
  this.name = 'B'
}

/**
 * C - function
 */
function C() {
  this.name = 'C'
}

var newB = new B()
console.log(newB.specialMethod())        // B from A

C.prototype = newB
C.constructor = B

var newC = new C()
console.log(newC.specialMethod())        // C from A



//////////////////////////////////////////////////////////////////////////

// Shape - superclass
function Shape() {
  this.x = 0;
  this.y = 0;
}

// superclass method
Shape.prototype.move = function (x, y) {
  this.x += x;
  this.y += y;
  console.log('Shape moved.');
};

// Rectangle - subclass
function Rectangle() {
  Shape.call(this); // call super constructor.
}

// subclass extends superclass
Rectangle.prototype = Object.create(Shape.prototype);

//If you don't set Rectangle.prototype.constructor to Rectangle,
//it will take the prototype.constructor of Shape (parent).
//To avoid that, we set the prototype.constructor to Rectangle (child).
Rectangle.prototype.constructor = Rectangle;

var rect = new Rectangle();

console.log('Is rect an instance of Rectangle?', rect instanceof Rectangle); // true
console.log('Is rect an instance of Shape?', rect instanceof Shape); // true
rect.move(1, 1); // Outputs, 'Shape moved.'



//////////////////////////////////////////////////////////////////////////
function SuperClass() {
  this.name = 'SuperClass'
}

function OtherSuperClass() {
  SuperClass.call(this);
}

function MyClass() {
  SuperClass.call(this);
  OtherSuperClass.call(this);
}

// inherit one class
MyClass.prototype = Object.create(SuperClass.prototype);

// mixin another
Object.assign(Object.getPrototypeOf(MyClass.prototype), OtherSuperClass.prototype);

// re-assign constructor
MyClass.prototype.constructor = MyClass;

MyClass.prototype.myMethod = function () {
  return this.name;
};

console.log(new MyClass().name);



//////////////////////////////////////////////////////////////////////////

var duck = {
  name: 'Maurice',
  color: 'white',
  greeting: function () {
    console.log('Quaaaack! My name is ' + this.name);
  }
}

console.log(Reflect.has(duck, 'color'));
// true
console.log(Reflect.has(duck, 'haircut'));
// false

console.log(Reflect.ownKeys(duck))
console.log(Reflect.set(duck, 'eyes', 'black'))

console.log(JSON.stringify(Object.entries(duck), null, 4));



//////////////////////////////////////////////////////////////////////////

var promiseA = new Promise(function (resolutionFunc, rejectionFunc) {
  return resolutionFunc(777);
});

// At this point, "promiseA" is already settled.
promiseA.then(function (val) {
  console.log("asynchronous logging has val:" + val)
});
console.log("immediate logging");



//////////////////////////////////////////////////////////////////////////

var promise = new Promise(function (resolve, reject) {
  setTimeout(resolve, 0, null, 101);
}).then(function (value) {
  console.log(value);
  return Promise.resolve(102);
}).then(function (value) {
  console.log(value);
  return {
    then: function (resolve, reject) {
      setTimeout(resolve, 0, null, 103);
    }
  }
}).then(function (value) {
  console.log(value);
  return Promise.all(["Bar", new Promise(function (resolve, reject) {
    setTimeout(resolve, 500, 106)
  }), Promise.resolve(104)]);
}).then(function (value) {
  console.log(value);
  return Promise.race([Promise.reject("Error"), Promise.resolve(108)]);
}).then(function (value) {
  console.log(value);
  return 109;
}).error(function (error) {
  console.log(error);
});

// true
// 101
// 102
// 103
// [ 'Bar', 106, 104 ]
// Error

console.log(promise)



//////////////////////////////////////////////////////////////////////////

var pAllSettled = Promise.allSettled([
  Promise.resolve(33),
  new Promise(function (resolve) {
      return setTimeout(function () {
        return resolve(66)
      })
    }),
  99,
  Promise.reject(new Error('an error'))
])
  .then(function (values) {
    console.log(values)
  });

console.log(pAllSettled)

//////////////////////////////////////////////////////////////////////////

var promise1 = new Promise(function (resolve, reject) {
  setTimeout(resolve, 500, null, 'one');
});

var promise2 = new Promise(function (resolve, reject) {
  setTimeout(resolve, 100, null, 'two');
});

var pRace = Promise.race([promise1, promise2]).then(function (value) {
  console.log(value);
  // Both resolve, but promise2 is faster
});

console.log(pRace)
// expected output: "two"


//////////////////////////////////////////////////////////////////////////
// we are passing as argument an array of promises that are already resolved,
// to trigger Promise.race as soon as possible
var resolvedPromisesArray = [Promise.resolve(33), Promise.resolve(44)];

var pRace = Promise.race(resolvedPromisesArray);
// immediately logging the value of p
console.log(pRace);

// using setTimeout we can execute code after the stack is empty
setTimeout(function () {
  console.log('the stack is now empty');
  console.log(pRace);
}, 0);


//////////////////////////////////////////////////////////////////////////
var foreverPendingPromise = Promise.race([]);
var alreadyFulfilledProm = Promise.resolve(100);

var arr = [foreverPendingPromise, alreadyFulfilledProm, "non-Promise value"];
var arr2 = [foreverPendingPromise, "non-Promise value", Promise.resolve(100)];
var p = Promise.race(arr);
var p2 = Promise.race(arr2);

console.log(p);
console.log(p2);

setTimeout(function () {
  console.log('the stack is now empty');
  console.log(p);
  console.log(p2);
}, 0);


//////////////////////////////////////////////////////////////////////////
var promise1 = new Promise(function (resolve, reject) {
  setTimeout(resolve, 500, null, 'one');
});

var promise2 = new Promise(function (resolve, reject) {
  setTimeout(reject, 100, null, 'two');
});


var pRace = Promise.race([promise1, promise2]).then(function (value) {
  console.log('succeeded with value:', value);
}).error(function (reason) {
  // Only promise1 is fulfilled, but promise2 is faster
  console.log('failed with reason:', reason);
});

console.log(pRace)
// expected output: "failed with reason: two"


var pAny = Promise.any([promise1, promise2]).then(function (value) {
  // Only promise1 is fulfilled, even though promise2 settled sooner
  console.log('succeeded with value:', value);
}).error(function (reason) {
  console.log('failed with reason:', reason);
});

console.log(pAny)
// expected output: "succeeded with value: one"



////////////////////////////////////////////////////////////////////////// Iterator

function makeIterator(array) {
    var nextIndex = 0;
    return {
        next: function () {
            return (
            (nextIndex < array.length)
                ? {value: array[nextIndex++], done: false}
                : {done: true}
            );
        }
    };
}

var iterate = makeIterator;
var some = iterate(["yo", "ya", "hoo"]);

/*
console.log(some.next().value)
console.log(some.next().value)
console.log(some.next().value)
console.log(some.next().value)
console.log(some.next().done)
*/


while (true) {
  var result = some.next();
  if (result.done)
    break;

  console.log(result.value);
}


var wtf = iterate("WTF".split(''));
iterateIterator(wtf, function (item) {
    return WScript.echo(item);
})



//////////////////////////////////////////////////////////////////////////
// ES3-5 version

/*
function gen(obj) {
  var keys = [];
  var index = 0;
  for (keys[index++] in obj);
  var total = index;
  index = 0;
  return {
    next: function () {
      if (index < total) {
        var key = keys[index++];
        return {
          done: false,
          value: [key, obj[key]]
        }
      }
      return {
        done: true
      };
    }
  };
}

var www = gen(["one", "two", "three"]);
iterateIterator(www, function (item) {
  return WScript.echo(item);
})
*/


//////////////////////////////////////////////////////////////////////////

console.equal(true, 'abc'.startsWith('a'));
console.equal(false, 'abc'.endsWith('a'));
console.equal(true, 'john alice'.includes('john'));
console.equal('123'.repeat(2), '123123');
console.equal(false, NaN === NaN);
console.equal(true, Object.is(NaN, NaN));
console.equal(true, -0 === 0);
console.equal(false, Object.is(-0, 0));

