/*!
 * ES6-Promise-Shim v0.1.1
 * This module provides a lightweight implementation of Promise in pure ES5 code
 * for older browsers or older JavaScript engines.
 *
 * @license Copyright (c) 2017 Ariyan Khan, MIT License
 *
 * Codebase: https://github.com/ariyankhan/es6-promise-shim
 * Date: Jun 15, 2017
 */

"use strict";

var defineProperty = Object.defineProperty;

var defineProperties = Object.defineProperties;

var slice = Array.prototype.slice;

var forEach = Array.prototype.forEach;

var isArray = Array.isArray;

var floor = Math.floor;

var abs = Math.abs;

var max = Math.max;

var min = Math.min;

var isCallable = function (fn) {
    return typeof fn === 'function';
};

var isObject = function (value) {
    return value !== null && (typeof value === "object" || typeof value === "function");
};

var postToMessageQueue = function (fn, thisArg) {
    if (!isCallable(fn))
        throw new TypeError(fn + " is not a function");
    var args = slice.call(arguments, 2);
    setTimeout(function () {
        fn.apply(thisArg, args);
    }, 0);
};

var Promise = function Promise(executor) {
    if (!(this instanceof Promise) || isPromise(this))
        throw new TypeError(String(this) + " is not a promise");
    if (!isCallable(executor))
        throw new TypeError("Promise resolver " + String(executor) + " is not a function");
    setupPromiseInternals(this);
    try {
        executor((function (value) {
            this._resolve(value);
        }).bind(this), (function (reason) {
            this._reject(reason);
        }).bind(this));
    } catch (e) {
        this._reject(e);
    }
};

Promise.resolve = function resolve(value) {
    if (isPromise(value))
        return value;
    return new Promise(function (resolve, reject) {
        if (isThenable(value)) {
            postToMessageQueue(function () {
                try {
                    value.then(resolve, reject);
                } catch (e) {
                    reject(e);
                }
            });
        }
        else
            resolve(value);
    });
};

Promise.reject = function reject(reason) {
    return new Promise(function (resoolve, reject) {
        reject(reason);
    });
};

// As the ES5 has no any iterable features, so this method's first
// argument should be array or array-like object
Promise.race = function race(promiseArray) {
    if (promiseArray === undefined || promiseArray === null)
        return new Promise(function (resolve, reject) {
            postToMessageQueue(reject, undefined, TypeError("First argument of Promise.race can not be undefined or null"));
        });
    var length,
        isSettled = false;

    length = Number(promiseArray.length);
    length = length !== length ? 0 : length;
    length = (length < 0 ? -1 : 1) * floor(abs(length));
    length = max(length, 0);

    return new Promise(function (resolve, reject) {
        var fn,
            i = 0;
        fn = function (promise) {
            var temp1,
                temp2;
            if (isPromise(promise)) {
                if (isFulfilledPromise(promise)) {
                    if (!isSettled) {
                        isSettled = true;
                        postToMessageQueue(function () {
                            resolve(promise._value);
                        });
                    }
                }
                else if (isRejectedPromise(promise)) {
                    if (!isSettled) {
                        isSettled = true;
                        postToMessageQueue(function () {
                            reject(promise._reason);
                        });
                    }
                } else if (isPendingPromise(promise)) {
                    temp1 = promise._resolve;
                    temp2 = promise._reject;
                    defineProperties(promise, {
                        _resolve: {
                            value: (function (value) {
                                temp1(value);
                                if (!isSettled) {
                                    isSettled = true;
                                    resolve(value);
                                }
                            }).bind(promise)
                        },
                        _reject: {
                            value: (function (reason) {
                                temp2(reason);
                                if (!isSettled) {
                                    isSettled = true;
                                    reject(reason);
                                }
                            }).bind(promise)
                        }
                    });
                }
            } else if (isThenable(promise)) {
                postToMessageQueue(function () {
                    try {
                        promise.then(function (value) {
                            if (!isSettled) {
                                isSettled = true;
                                resolve(value);
                            }
                        }, function (reason) {
                            if (!isSettled) {
                                isSettled = true;
                                reject(reason);
                            }
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            } else {
                if (!isSettled) {
                    isSettled = true;
                    postToMessageQueue(function () {
                        resolve(promise);
                    });
                }
            }
        };
        for(; i < length; ++i) {
            fn(promiseArray[i]);
        }
    });
};

// As the ES5 has no any iterable features, so this method's first
// argument should be array or array-like object
Promise.all = function all(promiseArray) {
    if (promiseArray === undefined || promiseArray === null)
        return new Promise(function (resolve, reject) {
            postToMessageQueue(reject, undefined, TypeError("First argument of Promise.all can not be undefined or null"));
        });
    var counter = 0,
        length,
        values;

    length = Number(promiseArray.length);
    length = length !== length ? 0 : length;
    length = (length < 0 ? -1 : 1) * floor(abs(length));
    length = max(length, 0);

    values = new Array(length);

    return new Promise(function (resolve, reject) {
        var fn,
            i = 0;
        if (length === 0)
            resolve(values);
        else {
            fn = function (promise, index) {
                var temp1,
                    temp2;
                if (isPromise(promise)) {
                    if (isFulfilledPromise(promise)) {
                        values[index] = promise._value;
                        counter++;
                        if (counter === length) {
                            postToMessageQueue(function () {
                                resolve(values);
                            });
                        }
                    } else if(isRejectedPromise(promise)) {
                        postToMessageQueue(function () {
                            reject(promise._reason);
                        });
                    } else if(isPendingPromise(promise)) {
                        temp1 = promise._resolve;
                        temp2 = promise._reject;
                        defineProperties(promise, {
                            _resolve: {
                                value: (function (value) {
                                    temp1(value);
                                    values[index] = value;
                                    counter++;
                                    if (counter === length) {
                                        resolve(values);
                                    }
                                }).bind(promise)
                            },
                            _reject: {
                                value: (function (reason) {
                                    temp2(reason);
                                    reject(reason);
                                }).bind(promise)
                            }
                        });
                    }
                } else if (isThenable(promise)) {
                    postToMessageQueue(function () {
                        try {
                            promise.then(function (value) {
                                values[index] = value;
                                counter++;
                                if (counter === length) {
                                    resolve(values);
                                }
                            }, function (reason) {
                                // If the returned promise is already rejected, then it does nothing
                                reject(reason);
                            });
                        } catch (e) {
                            reject(e);
                        }
                    });
                } else {
                    values[index] = promise;
                    counter++;
                    if (counter === length) {
                        postToMessageQueue(function () {
                            resolve(values);
                        });
                    }
                }
            };
            for(; i < length; ++i) {
                fn(promiseArray[i], i);
            }
        }
    });
};

Promise.prototype.then = function then(onFulfilled, onRejected) {
    if (!isPromise(this))
        throw new TypeError(this + " is not a promise");
    onFulfilled = !isCallable(onFulfilled) ? defaultPromiseOnFulfilled : onFulfilled;
    onRejected = !isCallable(onRejected) ? defaultPromiseOnRejected : onRejected;

    var chainedPromise = new Promise(function (resolve, reject) {}),
        nextOnFulfilled,
        nextOnRejected;

    nextOnFulfilled = function (value) {
        var result;
        try {
            result = onFulfilled(value);
            processPromiseResult(result, chainedPromise);
        } catch (e) {
            chainedPromise._reject(e);
        }
    };

    nextOnRejected = function (reason) {
        var result;
        try {
            result = onRejected(reason);
            processPromiseResult(result, chainedPromise);
        } catch (e) {
            chainedPromise._reject(e);
        }
    };

    if (isPendingPromise(this)) {
        this._onFulfilled.push(nextOnFulfilled);
        this._onRejected.push(nextOnRejected);
    } else if (isFulfilledPromise(this)) {
        postToMessageQueue(nextOnFulfilled, undefined, this._value);
    } else if (isRejectedPromise(this))
        postToMessageQueue(nextOnRejected, undefined, this._reason);
    return chainedPromise;
};

var processPromiseResult = function (result, chainedPromise) {
    var temp1,
        temp2;
    if (isPromise(result)) {
        if (isFulfilledPromise(result))
            chainedPromise._resolve(result._value);
        else if (isRejectedPromise(result))
            chainedPromise._reject(result._reason);
        else if (isPendingPromise(result)) {
            temp1 = result._resolve;
            temp2 = result._reject;
            defineProperties(result, {
                _resolve: {
                    value: (function (value) {
                        temp1(value);
                        chainedPromise._resolve(value);
                    }).bind(result)
                },
                _reject: {
                    value: (function (reason) {
                        temp2(reason);
                        chainedPromise._reject(reason);
                    }).bind(result)
                }
            });
        }
    } else if (isThenable(result)) {
        postToMessageQueue(function () {
            try {
                result.then((function (value) {
                    this._resolve(value);
                }).bind(chainedPromise), (function (reason) {
                    this._reject(reason);
                }).bind(chainedPromise));
            } catch (e) {
                chainedPromise._reject(e);
            }
        });
    } else
        chainedPromise._resolve(result);
};

Promise.prototype.error = function (onRejected) {
    if (!isCallable(this["then"]))
        throw new TypeError("(var).then is not a function");
    return this["then"](undefined, onRejected);
};

// Although this method is not standard i.e. is not a part of ES6,
// but it is given for testing purpose
Promise.prototype.toString = function () {
    if (!isPromise(this))
        throw new TypeError(this + " is not a promise");
    switch (this._state) {
        case "pending":
            return "Promise { <pending> }";
        case "fulfilled":
            return "Promise { " + this._value + " }";
        case "rejected":
            return "Promise { <rejected> " + this._reason + " }";
    }
};

var isThenable = function (value) {
    return isObject(value) && isCallable(value.then);
};

var defaultPromiseOnFulfilled = function (value) {
    return Promise.resolve(value);
};

var defaultPromiseOnRejected = function (reason) {
    return Promise.reject(reason);
};

var promiseResolve = function (value) {
    // Just return if the promise is settled already
    if (isSettledPromise(this))
        return;
    defineProperties(this, {
        _state: {
            value: "fulfilled"
        },
        _value: {
            value: value
        }
    });
    if (this._onFulfilled.length > 0) {
        postToMessageQueue(function (value) {
            this._onFulfilled.forEach(function (callback) {
                callback(value);
            });
            // Free the references of the callbacks, because
            // these are not needed anymore after calling first time _resolve() method
            this._onFulfilled.length = 0;
            this._onRejected.length = 0;
        }, this, value);
    }
};

var promiseReject = function (reason) {
    // Just return if the promise is settled already
    if (isSettledPromise(this))
        return;
    defineProperties(this, {
        _state: {
            value: "rejected"
        },
        _reason: {
            value: reason
        }
    });
    if (this._onRejected.length > 0) {
        postToMessageQueue(function (reason) {
            this._onRejected.forEach(function (callback) {
                callback(reason);
            });
            // Free the references of the callbacks, because
            // these are not needed anymore after calling first time _reject() method
            this._onFulfilled.length = 0;
            this._onRejected.length = 0;
        }, this, reason);
    }
};

var setupPromiseInternals = function (promise) {
    defineProperties(promise, {
        _isPromise: {
            value: true
        },
        _onFulfilled: {
            value: []
        },
        _onRejected: {
            value: []
        },
        _resolve: {
            value: promiseResolve.bind(promise),
            configurable: true
        },
        _reject: {
            value: promiseReject.bind(promise),
            configurable: true
        },
        _state: {
            value: "pending",
            configurable: true
        },
        _value: {
            value: undefined,
            configurable: true
        },
        _reason: {
            value: undefined,
            configurable: true
        }
    });
};

var isPendingPromise = function (promise) {
    return promise._state === "pending";
};

var isFulfilledPromise = function (promise) {
    return promise._state === "fulfilled";
};

var isRejectedPromise = function (promise) {
    return promise._state === "rejected";
};

var isSettledPromise = function (promise) {
    return promise._state === "fulfilled" || promise._state === "rejected";
};

var isValidPromiseState = function (state) {
    return ["pending", "fulfilled", "rejected"].indexOf(String(state)) !== -1;
};

var checkPromiseInternals = function (promise) {
    return promise._isPromise === true
        && isArray(promise._onFulfilled)
        && isArray(promise._onRejected)
        && isCallable(promise._resolve)
        && isCallable(promise._reject)
        && isValidPromiseState(promise._state)
        && promise.hasOwnProperty("_value")
        && promise.hasOwnProperty("_reason")
};

var isPromise = function (promise) {
    return promise instanceof Promise && checkPromiseInternals(promise);
};



defineProperty(global, "Promise", {
    value: Promise,
    writable: true,
    configurable: true
});



/* Polyfill service v3.111.0
 * Disable minification (remove `.min` from URL path) for more info */
 
(function(self, undefined) {function Call(t,l){var n=arguments.length>2?arguments[2]:[];if(!1===IsCallable(t))throw new TypeError(Object.prototype.toString.call(t)+"is not a function.");return t.apply(l,n)}function CreateDataProperty(e,r,t){var a={value:t,writable:!0,enumerable:!0,configurable:!0};try{return Object.defineProperty(e,r,a),!0}catch(n){return!1}}function CreateDataPropertyOrThrow(t,r,o){var e=CreateDataProperty(t,r,o);if(!e)throw new TypeError("Cannot assign value `"+Object.prototype.toString.call(o)+"` to property `"+Object.prototype.toString.call(r)+"` on object `"+Object.prototype.toString.call(t)+"`");return e}function CreateMethodProperty(e,r,t){var a={value:t,writable:!0,enumerable:!1,configurable:!0};Object.defineProperty(e,r,a)}function Get(n,t){return n[t]}function HasOwnProperty(r,t){return Object.prototype.hasOwnProperty.call(r,t)}function IsCallable(n){return"function"==typeof n}function SameValueNonNumber(e,n){return e===n}function ToBoolean(o){return Boolean(o)}function ToObject(e){if(null===e||e===undefined)throw TypeError();return Object(e)}function GetV(t,e){return ToObject(t)[e]}function GetMethod(e,n){var r=GetV(e,n);if(null===r||r===undefined)return undefined;if(!1===IsCallable(r))throw new TypeError("Method not callable: "+n);return r}function Type(e){switch(typeof e){case"undefined":return"undefined";case"boolean":return"boolean";case"number":return"number";case"string":return"string";case"symbol":return"symbol";default:return null===e?"null":"Symbol"in self&&(e instanceof self.Symbol||e.constructor===self.Symbol)?"symbol":"object"}}function IteratorComplete(t){if("object"!==Type(t))throw new Error(Object.prototype.toString.call(t)+"is not an Object.");return ToBoolean(Get(t,"done"))}function IteratorNext(t){if(arguments.length<2)var e=Call(t["[[NextMethod]]"],t["[[Iterator]]"]);else e=Call(t["[[NextMethod]]"],t["[[Iterator]]"],[arguments[1]]);if("object"!==Type(e))throw new TypeError("bad iterator");return e}function IteratorStep(t){var r=IteratorNext(t);return!0!==IteratorComplete(r)&&r}function IteratorValue(t){if("object"!==Type(t))throw new Error(Object.prototype.toString.call(t)+"is not an Object.");return Get(t,"value")}function OrdinaryToPrimitive(r,t){if("string"===t)var e=["toString","valueOf"];else e=["valueOf","toString"];for(var i=0;i<e.length;++i){var n=e[i],a=Get(r,n);if(IsCallable(a)){var o=Call(a,r);if("object"!==Type(o))return o}}throw new TypeError("Cannot convert to primitive.")}function SameValueZero(n,e){return Type(n)===Type(e)&&("number"===Type(n)?!(!isNaN(n)||!isNaN(e))||(1/n===Infinity&&1/e==-Infinity||(1/n==-Infinity&&1/e===Infinity||n===e)):SameValueNonNumber(n,e))}function ToInteger(n){if("symbol"===Type(n))throw new TypeError("Cannot convert a Symbol value to a number");var t=Number(n);return isNaN(t)?0:1/t===Infinity||1/t==-Infinity||t===Infinity||t===-Infinity?t:(t<0?-1:1)*Math.floor(Math.abs(t))}function ToLength(n){var t=ToInteger(n);return t<=0?0:Math.min(t,Math.pow(2,53)-1)}function ToPrimitive(e){var t=arguments.length>1?arguments[1]:undefined;if("object"===Type(e)){if(arguments.length<2)var i="default";else t===String?i="string":t===Number&&(i="number");var r="function"==typeof self.Symbol&&"symbol"==typeof self.Symbol.toPrimitive?GetMethod(e,self.Symbol.toPrimitive):undefined;if(r!==undefined){var n=Call(r,e,[i]);if("object"!==Type(n))return n;throw new TypeError("Cannot convert exotic object to primitive.")}return"default"===i&&(i="number"),OrdinaryToPrimitive(e,i)}return e}function ToString(t){switch(Type(t)){case"symbol":throw new TypeError("Cannot convert a Symbol value to a string");case"object":return ToString(ToPrimitive(t,String));default:return String(t)}}function ToPropertyKey(r){var i=ToPrimitive(r,String);return"symbol"===Type(i)?i:ToString(i)}CreateMethodProperty(Array.prototype,"includes",function e(r){"use strict";var t=ToObject(this),o=ToLength(Get(t,"length"));if(0===o)return!1;var n=ToInteger(arguments[1]);if(n>=0)var a=n;else(a=o+n)<0&&(a=0);for(;a<o;){var i=Get(t,ToString(a));if(SameValueZero(r,i))return!0;a+=1}return!1});!function(){var e=Object.getOwnPropertyDescriptor,t=function(){try{return 1===Object.defineProperty(document.createElement("div"),"one",{get:function(){return 1}}).one}catch(e){return!1}},r={}.toString,n="".split;CreateMethodProperty(Object,"getOwnPropertyDescriptor",function c(o,i){var a=ToObject(o);a=("string"===Type(a)||a instanceof String)&&"[object String]"==r.call(o)?n.call(o,""):Object(o);var u=ToPropertyKey(i);if(t)try{return e(a,u)}catch(l){}if(HasOwnProperty(a,u))return{enumerable:!0,configurable:!0,writable:!0,value:a[u]}})}();CreateMethodProperty(Object,"keys",function(){"use strict";function t(){var t;try{t=Object.create({})}catch(r){return!0}return o.call(t,"__proto__")}function r(t){var r=n.call(t),e="[object Arguments]"===r;return e||(e="[object Array]"!==r&&null!==t&&"object"==typeof t&&"number"==typeof t.length&&t.length>=0&&"[object Function]"===n.call(t.callee)),e}var e=Object.prototype.hasOwnProperty,n=Object.prototype.toString,o=Object.prototype.propertyIsEnumerable,c=!o.call({toString:null},"toString"),l=o.call(function(){},"prototype"),i=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],u=function(t){var r=t.constructor;return r&&r.prototype===t},a={$console:!0,$external:!0,$frame:!0,$frameElement:!0,$frames:!0,$innerHeight:!0,$innerWidth:!0,$outerHeight:!0,$outerWidth:!0,$pageXOffset:!0,$pageYOffset:!0,$parent:!0,$scrollLeft:!0,$scrollTop:!0,$scrollX:!0,$scrollY:!0,$self:!0,$webkitIndexedDB:!0,$webkitStorageInfo:!0,$window:!0},f=function(){if("undefined"==typeof window)return!1;for(var t in window)try{if(!a["$"+t]&&e.call(window,t)&&null!==window[t]&&"object"==typeof window[t])try{u(window[t])}catch(r){return!0}}catch(r){return!0}return!1}(),p=function(t){if("undefined"==typeof window||!f)return u(t);try{return u(t)}catch(r){return!1}};return function s(o){var u="[object Function]"===n.call(o),a=r(o),f="[object String]"===n.call(o),s=[];if(o===undefined||null===o)throw new TypeError("Cannot convert undefined or null to object");var y=l&&u;if(f&&o.length>0&&!e.call(o,0))for(var h=0;h<o.length;++h)s.push(String(h));if(a&&o.length>0)for(var g=0;g<o.length;++g)s.push(String(g));else for(var w in o)t()&&"__proto__"===w||y&&"prototype"===w||!e.call(o,w)||s.push(String(w));if(c)for(var d=p(o),$=0;$<i.length;++$)d&&"constructor"===i[$]||!e.call(o,i[$])||s.push(i[$]);return s}}());!function(){var t={}.toString,e="".split,r=[].concat,o=Object.prototype.hasOwnProperty,c=Object.getOwnPropertyNames||Object.keys,n="object"==typeof self?c(self):[];CreateMethodProperty(Object,"getOwnPropertyNames",function l(a){var p=ToObject(a);if("[object Window]"===t.call(p))try{return c(p)}catch(j){return r.call([],n)}p="[object String]"==t.call(p)?e.call(p,""):Object(p);for(var i=c(p),s=["length","prototype"],O=0;O<s.length;O++){var b=s[O];o.call(p,b)&&!i.includes(b)&&i.push(b)}if(i.includes("__proto__")){var f=i.indexOf("__proto__");i.splice(f,1)}return i})}();!function(e,r,n){"use strict";function t(e){if("symbol"===Type(e))return e;throw TypeError(e+" is not a symbol")}var u,o=function(){try{var r={};return e.defineProperty(r,"t",{configurable:!0,enumerable:!1,get:function(){return!0},set:undefined}),!!r.t}catch(n){return!1}}(),i=0,a=""+Math.random(),c="__symbol:",l=c.length,f="__symbol@@"+a,s={},v="defineProperty",y="defineProperties",b="getOwnPropertyNames",p="getOwnPropertyDescriptor",h="propertyIsEnumerable",m=e.prototype,d=m.hasOwnProperty,g=m[h],w=m.toString,S=Array.prototype.concat,P=e.getOwnPropertyNames?e.getOwnPropertyNames(self):[],O=e[b],j=function $(e){if("[object Window]"===w.call(e))try{return O(e)}catch(r){return S.call([],P)}return O(e)},E=e[p],N=e.create,T=e.keys,_=e.freeze||e,k=e[v],F=e[y],I=E(e,b),x=function(e,r,n){if(!d.call(e,f))try{k(e,f,{enumerable:!1,configurable:!1,writable:!1,value:{}})}catch(t){e[f]={}}e[f]["@@"+r]=n},z=function(e,r){var n=N(e);return j(r).forEach(function(e){q.call(r,e)&&L(n,e,r[e])}),n},A=function(e){var r=N(e);return r.enumerable=!1,r},D=function ee(){},M=function(e){return e!=f&&!d.call(H,e)},W=function(e){return e!=f&&d.call(H,e)},q=function re(e){var r=""+e;return W(r)?d.call(this,r)&&this[f]&&this[f]["@@"+r]:g.call(this,e)},B=function(r){var n={enumerable:!1,configurable:!0,get:D,set:function(e){u(this,r,{enumerable:!1,configurable:!0,writable:!0,value:e}),x(this,r,!0)}};try{k(m,r,n)}catch(o){m[r]=n.value}H[r]=k(e(r),"constructor",J);var t=E(G.prototype,"description");return t&&k(H[r],"description",t),_(H[r])},C=function(e){var r=t(e);if(Y){var n=V(r);if(""!==n)return n.slice(1,-1)}if(s[r]!==undefined)return s[r];var u=r.toString(),o=u.lastIndexOf("0.");return u=u.slice(10,o),""===u?undefined:u},G=function ne(){var r=arguments[0];if(this instanceof ne)throw new TypeError("Symbol is not a constructor");var n=c.concat(r||"",a,++i);r===undefined||null!==r&&!isNaN(r)&&""!==String(r)||(s[n]=String(r));var t=B(n);return o||e.defineProperty(t,"description",{configurable:!0,enumerable:!1,value:C(t)}),t},H=N(null),J={value:G},K=function(e){return H[e]},L=function te(e,r,n){var t=""+r;return W(t)?(u(e,t,n.enumerable?A(n):n),x(e,t,!!n.enumerable)):k(e,r,n),e},Q=function(e){return function(r){return d.call(e,f)&&d.call(e[f],"@@"+r)}},R=function ue(e){return j(e).filter(e===m?Q(e):W).map(K)};I.value=L,k(e,v,I),I.value=R,k(e,"getOwnPropertySymbols",I),I.value=function oe(e){return j(e).filter(M)},k(e,b,I),I.value=function ie(e,r){var n=R(r);return n.length?T(r).concat(n).forEach(function(n){q.call(r,n)&&L(e,n,r[n])}):F(e,r),e},k(e,y,I),I.value=q,k(m,h,I),I.value=G,k(n,"Symbol",I),I.value=function(e){var r=c.concat(c,e,a);return r in m?H[r]:B(r)},k(G,"for",I),I.value=function(e){if(M(e))throw new TypeError(e+" is not a symbol");return d.call(H,e)?e.slice(2*l,-a.length):void 0},k(G,"keyFor",I),I.value=function ae(e,r){var n=E(e,r);return n&&W(r)&&(n.enumerable=q.call(e,r)),n},k(e,p,I),I.value=function ce(e,r){return 1===arguments.length||void 0===r?N(e):z(e,r)},k(e,"create",I);var U=null===function(){return this}.call(null);if(I.value=U?function(){var e=w.call(this);return"[object String]"===e&&W(this)?"[object Symbol]":e}:function(){if(this===window)return"[object Null]";var e=w.call(this);return"[object String]"===e&&W(this)?"[object Symbol]":e},k(m,"toString",I),u=function(e,r,n){var t=E(m,r);delete m[r],k(e,r,n),e!==m&&k(m,r,t)},function(){try{var r={};return e.defineProperty(r,"t",{configurable:!0,enumerable:!1,get:function(){return!0},set:undefined}),!!r.t}catch(n){return!1}}()){var V;try{V=Function("s","var v = s.valueOf(); return { [v]() {} }[v].name;")}catch(Z){}var X=function(){},Y=V&&"inferred"===X.name?V:null;e.defineProperty(n.Symbol.prototype,"description",{configurable:!0,enumerable:!1,get:function(){return C(this)}})}}(Object,0,self);Object.defineProperty(self.Symbol,"iterator",{value:self.Symbol("iterator")});function GetIterator(t){var e=arguments.length>1?arguments[1]:GetMethod(t,Symbol.iterator),r=Call(e,t);if("object"!==Type(r))throw new TypeError("bad iterator");var o=GetV(r,"next"),a=Object.create(null);return a["[[Iterator]]"]=r,a["[[NextMethod]]"]=o,a["[[Done]]"]=!1,a}function IterableToList(t){for(var r=arguments.length>1?GetIterator(t,arguments[1]):GetIterator(t),e=[],a=!0;!1!==a;)if(!1!==(a=IteratorStep(r))){var o=IteratorValue(a);e.push(o)}return e}!function(){function r(r,e){var t=void 0===e?new Error:new Error(e);CreateDataPropertyOrThrow(this,"name","AggregateError"),CreateDataPropertyOrThrow(this,"message",t.message),CreateDataPropertyOrThrow(this,"stack",t.stack);var o;if(Array.isArray(r))o=r.slice();else try{o=IterableToList(r)}catch(a){throw new TypeError("Argument is not iterable")}CreateDataPropertyOrThrow(this,"errors",o)}r.prototype=Object.create(Error.prototype),r.prototype.constructor=r,self.AggregateError=r}();Object.defineProperty(Symbol,"toStringTag",{value:Symbol("toStringTag")});!function(){"use strict";function n(){return tn[q][B]||D}function t(n){return n&&"object"==typeof n}function e(n){return"function"==typeof n}function r(n,t){return n instanceof t}function o(n){return r(n,A)}function i(n,t,e){if(!t(n))throw a(e)}function u(){try{return b.apply(R,arguments)}catch(n){return Y.e=n,Y}}function c(n,t){return b=n,R=t,u}function f(n,t){function e(){for(var e=0;e<o;)t(r[e],r[e+1]),r[e++]=T,r[e++]=T;o=0,r.length>n&&(r.length=n)}var r=L(n),o=0;return function(n,t){r[o++]=n,r[o++]=t,2===o&&tn.nextTick(e)}}function s(n,t){var o,i,u,f,s=0;if(!n)throw a(N);var l=n[tn[q][z]];if(e(l))i=l.call(n);else{if(!e(n.next)){if(r(n,L)){for(o=n.length;s<o;)t(n[s],s++);return s}throw a(N)}i=n}for(;!(u=i.next()).done;)if((f=c(t)(u.value,s++))===Y)throw e(i[G])&&i[G](),f.e;return s}function a(n){return new TypeError(n)}function l(n){return(n?"":Q)+(new A).stack}function h(n,t){var e="on"+n.toLowerCase(),r=F[e];E&&E.listeners(n).length?n===X?E.emit(n,t._v,t):E.emit(n,t):r?r({reason:t._v,promise:t}):tn[n](t._v,t)}function v(n){return n&&n._s}function _(n){if(v(n))return new n(Z);var t,r,o;return t=new n(function(n,e){if(t)throw a();r=n,o=e}),i(r,e),i(o,e),t}function d(n,t){var e=!1;return function(r){e||(e=!0,I&&(n[M]=l(!0)),t===U?g(n,r):y(n,t,r))}}function p(n,t,r,o){return e(r)&&(t._onFulfilled=r),e(o)&&(n[J]&&h(W,n),t._onRejected=o),I&&(t._p=n),n[n._c++]=t,n._s!==$&&rn(n,t),t}function m(n){if(n._umark)return!0;n._umark=!0;for(var t,e=0,r=n._c;e<r;)if(t=n[e++],t._onRejected||m(t))return!0}function w(n,t){function e(n){return r.push(n.replace(/^\s+|\s+$/g,""))}var r=[];return I&&(t[M]&&e(t[M]),function o(n){n&&K in n&&(o(n._next),e(n[K]+""),o(n._p))}(t)),(n&&n.stack?n.stack:n)+("\n"+r.join("\n")).replace(nn,"")}function j(n,t){return n(t)}function y(n,t,e){var r=0,i=n._c;if(n._s===$)for(n._s=t,n._v=e,t===O&&(I&&o(e)&&(e.longStack=w(e,n)),on(n));r<i;)rn(n,n[r++]);return n}function g(n,r){if(r===n&&r)return y(n,O,a(V)),n;if(r!==S&&(e(r)||t(r))){var o=c(k)(r);if(o===Y)return y(n,O,o.e),n;e(o)?(I&&v(r)&&(n._next=r),v(r)?x(n,r,o):tn.nextTick(function(){x(n,r,o)})):y(n,U,r)}else y(n,U,r);return n}function k(n){return n.then}function x(n,t,e){var r=c(e,t)(function(e){t&&(t=S,g(n,e))},function(e){t&&(t=S,y(n,O,e))});r===Y&&t&&(y(n,O,r.e),t=S)}var T,b,R,S=null,C="object"==typeof self,F=self,P=F.Promise,E=F.process,H=F.console,I=!0,L=Array,A=Error,O=1,U=2,$=3,q="Symbol",z="iterator",B="species",D=q+"("+B+")",G="return",J="_uh",K="_pt",M="_st",N="Invalid argument",Q="\nFrom previous ",V="Chaining cycle detected for promise",W="rejectionHandled",X="unhandledRejection",Y={e:S},Z=function(){},nn=/^.+\/node_modules\/yaku\/.+\n?/gm,tn=function(n){var r,o=this;if(!t(o)||o._s!==T)throw a("Invalid this");if(o._s=$,I&&(o[K]=l()),n!==Z){if(!e(n))throw a(N);r=c(n)(d(o,U),d(o,O)),r===Y&&y(o,O,r.e)}};tn["default"]=tn,function en(n,t){for(var e in t)n[e]=t[e]}(tn.prototype,{then:function(n,t){if(this._s===undefined)throw a();return p(this,_(tn.speciesConstructor(this,tn)),n,t)},"catch":function(n){return this.then(T,n)},"finally":function(n){return this.then(function(t){return tn.resolve(n()).then(function(){return t})},function(t){return tn.resolve(n()).then(function(){throw t})})},_c:0,_p:S}),tn.resolve=function(n){return v(n)?n:g(_(this),n)},tn.reject=function(n){return y(_(this),O,n)},tn.race=function(n){var t=this,e=_(t),r=function(n){y(e,U,n)},o=function(n){y(e,O,n)},i=c(s)(n,function(n){t.resolve(n).then(r,o)});return i===Y?t.reject(i.e):e},tn.all=function(n){function t(n){y(o,O,n)}var e,r=this,o=_(r),i=[];return(e=c(s)(n,function(n,u){r.resolve(n).then(function(n){i[u]=n,--e||y(o,U,i)},t)}))===Y?r.reject(e.e):(e||y(o,U,[]),o)},tn.Symbol=F[q]||{},c(function(){Object.defineProperty(tn,n(),{get:function(){return this}})})(),tn.speciesConstructor=function(t,e){var r=t.constructor;return r?r[n()]||e:e},tn.unhandledRejection=function(n,t){H&&H.error("Uncaught (in promise)",I?t.longStack:w(n,t))},tn.rejectionHandled=Z,tn.enableLongStackTrace=function(){I=!0},tn.nextTick=C?function(n){P?new P(function(n){n()}).then(n):setTimeout(n)}:E.nextTick,tn._s=1;var rn=f(999,function(n,t){var e,r;return(r=n._s!==O?t._onFulfilled:t._onRejected)===T?void y(t,n._s,n._v):(e=c(j)(r,n._v))===Y?void y(t,O,e.e):void g(t,e)}),on=f(9,function(n){m(n)||(n[J]=1,h(X,n))});F.Promise=tn}();!function(){CreateMethodProperty(Promise,"allSettled",function e(r){var t=this;if("object"!==Type(t))throw new TypeError("`this` value must be an object");var n;if(Array.isArray(r))n=r;else try{n=IterableToList(r)}catch(o){return Promise.reject(new TypeError("Argument of Promise.allSettled is not iterable"))}var a=n.map(function(e){var r=function(e){return{status:"fulfilled",value:e}},n=function(e){return{status:"rejected",reason:e}},a=t.resolve(e);try{return a.then(r,n)}catch(o){return t.reject(o)}});return t.all(a)})}();!function(){var r=function(r){return r};CreateMethodProperty(Promise,"any",function e(t){var n=this;if("object"!==Type(n))throw new TypeError("`this` value must be an object");var o;if(Array.isArray(t))o=t;else try{o=IterableToList(t)}catch(c){return Promise.reject(new TypeError("Argument of Promise.any is not iterable"))}var a=function(r){return n.reject(r)},i=o.map(function(e){var t=n.resolve(e);try{return t.then(a,r)}catch(o){return o}});return n.all(i).then(function(r){throw new AggregateError(r,"Every promise rejected")},r)})}();})('object' === typeof window && window || 'object' === typeof self && self || 'object' === typeof global && global || {});