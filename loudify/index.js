"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWith = exports.compareWith = exports.extendWith = exports.quiet = exports.Loud = void 0;
exports.loudify = loudify;
var loudo_weakness_1 = require("loudo-weakness");
var heard = Symbol("heard");
var Loud = /** @class */ (function () {
    function Loud() {
    }
    Loud.prototype.hearFar = function (_keys, _keeper, _ear) { throw 0; };
    Loud.prototype.unhear = function (_heard) { };
    Loud.prototype.hear = function (_key, _keeper, _ear) { throw 0; };
    return Loud;
}());
exports.Loud = Loud;
var Quiet = /** @class */ (function () {
    function Quiet(value) {
        this.value = value;
    }
    return Quiet;
}());
var quiet = function (value) { return new Quiet(value); };
exports.quiet = quiet;
var earSymbol = Symbol("ears");
function loudify(object) {
    var ears = new loudo_weakness_1.Weakness();
    var proxy = new Proxy(object, {
        set: function (target, p, newValue) {
            if ((typeof (p) !== "symbol") && (typeof (newValue) !== "function")) {
                check(target, p, newValue);
            }
            var oldValue = target[p];
            target[p] = newValue;
            if (!compare(oldValue, newValue)) {
                for (var _i = 0, _a = ears.group(p); _i < _a.length; _i++) {
                    var ear = _a[_i];
                    ear(newValue, oldValue);
                }
            }
            return true;
        },
        get: function (target, p, receiver) {
            var value = target[p];
            if (p === "constructor") {
                return target.constructor;
            }
            if (value instanceof Function) {
                return function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var result = value.apply(receiver, args);
                    if (result instanceof Quiet) {
                        return result.value;
                    }
                    for (var _a = 0, _b = ears.group(p); _a < _b.length; _a++) {
                        var ear = _b[_a];
                        ear(value, undefined);
                    }
                    return result;
                };
            }
            return value;
        },
    });
    proxy[earSymbol] = ears;
    proxy["hear"] = function (key, keeper, ear) {
        var _a;
        var i = ears.add(keeper, ear, key);
        ear(proxy[key], undefined);
        return _a = {}, _a[heard] = i, _a;
    };
    proxy["hearFar"] = function (keys, keeper, ear) {
        keys = __spreadArray([], keys, true);
        var refs = Array(keys.length).fill(undefined);
        var h = Array(keys.length).fill(undefined);
        var redo = function (start, first) {
            var _a;
            if (first === undefined) {
                refs[start] = undefined;
                ear(undefined, undefined);
            }
            else
                refs[start] = new WeakRef(first);
            var values = refs.map(function (x) { return x === null || x === void 0 ? void 0 : x.deref(); });
            for (var i = start; i < keys.length; i++) {
                if (h[i] !== undefined)
                    (_a = values[i]) === null || _a === void 0 ? void 0 : _a.unhear(h[i]);
                h[i] = undefined;
            }
            for (var i = start + 1; i < keys.length; i++) {
                if (values[i - 1] == undefined)
                    values[i] = undefined;
                else
                    values[i] = values[i - 1][keys[i - 1]];
            }
            var last = keys.length - 1;
            var _loop_1 = function (i) {
                var _b;
                if (values[i] == undefined)
                    return "break";
                var x = values[i][earSymbol].add(keeper, function (n) {
                    redo(i + 1, n);
                }, keys[i]);
                h[i] = (_b = {}, _b[heard] = x, _b);
            };
            for (var i = start; i < last; i++) {
                var state_1 = _loop_1(i);
                if (state_1 === "break")
                    break;
            }
            if (values[last] !== undefined) {
                values[last].hear(keys[last], keeper, ear);
            }
        };
        redo(0, proxy);
        return h[0];
    };
    proxy["unhear"] = function (h) {
        ears.delete(h[heard]);
    };
    extend(proxy, object);
    return proxy;
}
// interface Batch<T extends object> {
//   target:Loud<T>
//   changes:Partial<T>
// }
// const yell = <T extends object>(source:Loud<T>, key:keyof T) => {
//   const ears:Map<keyof T, Set<(changed:T)=>void>> = (source as any)[earSymbol]
//   const set = ears.get(key);
//   set?.forEach(ear => { ear(source) })
// }
// export class Tx {
//   private readonly batches:Batch<any>[] = []
//   readonly batch = <T extends object>(target:Loud<T>, changes:Partial<T>) => {
//     this.batches.push({target, changes})
//   }
//   readonly commit = () => {
//     const oldGlobalBlock = globalBlock
//     globalBlock = true
//     const batches = this.batches
//     const changed:Set<string>[] = []
//     try {
//       for (const batch of batches) {
//         for (const k in batch.changes) {
//           check(batch.target, k, batch.changes[k])
//         }
//       }
//       for (const batch of batches) {
//         const set = new Set<string>()
//         changed.push(set)
//         for (const k in batch.changes) {
//           if (!compare(batch.target[k], batch.changes[k])) {
//             set.add(k)
//             batch.target[k] = batch.changes[k]
//           }
//         }
//       }
//       for (let i = 0; i < batches.length; i++) {
//         const set = changed[i]!
//         const batch = batches[i]!
//         for (const k of set) {
//           yell(batch.target, k)
//         }
//       }
//     } finally {
//       globalBlock = oldGlobalBlock
//     }  
//   }
// }
// const ksym = Symbol("keep")
// function keep<T extends Function>(parent:{}, child:T):T {
//   let set = (parent as any)[ksym] as Set<Function>
//   if (set === undefined) {
//     set = new Set();
//     (parent as any)[ksym] = set
//   }
//   set.add(child)
//   return child
// }
var extend = function (_loud, _observed) { };
var extendWith = function (extender) {
    extend = extender;
};
exports.extendWith = extendWith;
var compare = Object.is;
var compareWith = function (comparer) {
    compare = comparer;
};
exports.compareWith = compareWith;
var check = function (_obj, key, _value) { };
var checkWith = function (checker) {
    check = checker;
};
exports.checkWith = checkWith;
