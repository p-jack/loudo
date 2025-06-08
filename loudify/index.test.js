"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("./index.js");
var vitest_1 = require("vitest");
(0, vitest_1.afterEach)(function () {
    (0, index_js_1.extendWith)(function () { });
    (0, index_js_1.compareWith)(Object.is);
    (0, index_js_1.checkWith)(function () { });
});
(0, vitest_1.test)("not checked by default", function () {
    var obj = (0, index_js_1.loudify)({ n: 0 });
    (0, vitest_1.expect)(function () { obj.n = undefined; }).not.toThrowError();
});
(0, vitest_1.describe)("loudify", function () {
    var I = /** @class */ (function () {
        function I(id, email, firstName, lastName) {
            var _this = this;
            this.id = id;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.setName = function (first, last) {
                _this.firstName = first;
                _this.lastName = last;
                return _this.name;
            };
        }
        Object.defineProperty(I.prototype, "name", {
            get: function () { return this.firstName + " " + this.lastName; },
            enumerable: false,
            configurable: true
        });
        return I;
    }());
    var obj;
    var keeper = {};
    var newValue;
    var oldValue;
    var ear = function (n, o) {
        newValue = n;
        oldValue = o;
    };
    (0, vitest_1.beforeEach)(function () {
        var input = new I(0, "fake@example.com", "First", "Last");
        obj = (0, index_js_1.loudify)(input);
        keeper = {};
        newValue = undefined;
        oldValue = undefined;
    });
    (0, vitest_1.test)("hear and unhear", function () {
        var heard = obj.hear("email", keeper, ear);
        (0, vitest_1.expect)(newValue).toBe("fake@example.com");
        (0, vitest_1.expect)(oldValue).toBeUndefined();
        newValue = undefined;
        oldValue = undefined;
        obj.email = "fake2@example.com";
        (0, vitest_1.expect)(oldValue).toBe("fake@example.com");
        (0, vitest_1.expect)(newValue).toBe("fake2@example.com");
        newValue = undefined;
        oldValue = undefined;
        obj.unhear(heard);
        obj.email = "fake3@example.com";
        (0, vitest_1.expect)(newValue).toBeUndefined();
        (0, vitest_1.expect)(oldValue).toBeUndefined();
    });
    (0, vitest_1.test)("not heard", function () {
        obj.hear("email", keeper, ear);
        newValue = undefined;
        obj.id = 1;
        (0, vitest_1.expect)(newValue).toBeUndefined();
        (0, vitest_1.expect)(oldValue).toBeUndefined();
    });
    (0, vitest_1.test)("same value", function () {
        obj.hear("email", keeper, ear);
        newValue = undefined;
        oldValue = undefined;
        obj.email = "fake@example.com";
        (0, vitest_1.expect)(newValue).toBeUndefined();
        (0, vitest_1.expect)(oldValue).toBeUndefined();
    });
    (0, vitest_1.test)("multiple ears", function () {
        var captured2;
        var ear2 = function (v) {
            captured2 = v;
        };
        obj.hear("email", keeper, ear);
        obj.hear("email", keeper, ear2);
        (0, vitest_1.expect)(captured2).toBe("fake@example.com");
        newValue = undefined;
        captured2 = undefined;
        obj.email = "fake2@example.com";
        (0, vitest_1.expect)(newValue).toBe("fake2@example.com");
        (0, vitest_1.expect)(captured2).toBe("fake2@example.com");
    });
    (0, vitest_1.test)("function calls", function () {
        var captured;
        var ear = function (v) {
            captured = v;
        };
        obj.hear("setName", keeper, ear);
        (0, vitest_1.expect)(captured).toBeInstanceOf(Function);
        captured = undefined;
        obj.setName("Foo", "Bar");
        (0, vitest_1.expect)(obj.name).toBe("Foo Bar");
        (0, vitest_1.expect)(captured).toBeInstanceOf(Function);
    });
});
(0, vitest_1.test)("nested function calls", function () {
    var C = /** @class */ (function () {
        function C(x, y, dirty, version) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (dirty === void 0) { dirty = false; }
            if (version === void 0) { version = 0; }
            var _this = this;
            this.x = x;
            this.y = y;
            this.dirty = dirty;
            this.version = version;
            this.setDirty = function () {
                var o = _this;
                o.version++;
                o.dirty = true;
            };
        }
        Object.defineProperty(C.prototype, "sum", {
            get: function () { return this.x + this.y; },
            enumerable: false,
            configurable: true
        });
        C.prototype.setNums = function (x, y) {
            var o = this;
            o.x = x;
            o.y = y;
            this.setDirty();
            return this.sum;
        };
        return C;
    }());
    var obj = (0, index_js_1.loudify)(new C());
    var keeper = {};
    var captured = undefined;
    var count = 0;
    obj.hear("setNums", keeper, function (o) { captured = o; count++; });
    (0, vitest_1.expect)(captured).toBeInstanceOf(Function);
    (0, vitest_1.expect)(count).toBe(1);
    captured = undefined;
    obj.setNums(11, 22);
    (0, vitest_1.expect)(captured).toBeInstanceOf(Function);
    (0, vitest_1.expect)(count).toBe(2);
    (0, vitest_1.expect)(obj.sum).toBe(33);
    (0, vitest_1.expect)(obj.dirty).toBe(true);
    (0, vitest_1.expect)(obj.version).toBe(1);
});
(0, vitest_1.test)("quiet function call results", function () {
    var C = /** @class */ (function () {
        function C(x) {
            if (x === void 0) { x = 0; }
            this.x = x;
        }
        C.prototype.reset = function (x) {
            if (x < 0) {
                return (0, index_js_1.quiet)(false);
            }
            var o = this;
            o.x = x;
            return true;
        };
        return C;
    }());
    var obj = (0, index_js_1.loudify)(new C());
    var keeper = {};
    var captured = undefined;
    var count = 0;
    obj.hear("reset", keeper, function (o) { captured = o; count++; });
    (0, vitest_1.expect)(captured).toBeInstanceOf(Function);
    (0, vitest_1.expect)(count).toBe(1);
    captured = undefined;
    obj.reset(-1);
    (0, vitest_1.expect)(captured).toBeUndefined();
    (0, vitest_1.expect)(count).toBe(1);
    obj.reset(1);
    (0, vitest_1.expect)(captured).toBeInstanceOf(Function);
    (0, vitest_1.expect)(count).toBe(2);
    (0, vitest_1.expect)(obj.x).toBe(1);
});
(0, vitest_1.describe)("hearFar", function () {
    var leaf = (0, index_js_1.loudify)({ x: 11, y: 22 });
    var o1 = (0, index_js_1.loudify)({ leaf: leaf });
    var o2 = (0, index_js_1.loudify)({ o1: o1 });
    var oldValue;
    var newValue;
    var called = false;
    var reset = function () {
        oldValue = undefined;
        newValue = undefined;
        called = false;
    };
    (0, vitest_1.beforeEach)(function () {
        reset();
        leaf = (0, index_js_1.loudify)({ x: 11, y: 22 });
        o1 = (0, index_js_1.loudify)({ leaf: leaf });
        o2 = (0, index_js_1.loudify)({ o1: o1 });
        o2.hearFar(["o1", "leaf", "x"], globalThis, function (n, o) {
            called = true;
            oldValue = o;
            newValue = n;
        });
    });
    (0, vitest_1.test)("immediate fire", function () {
        (0, vitest_1.expect)(called).toBe(true);
        (0, vitest_1.expect)(oldValue).toBeUndefined();
        (0, vitest_1.expect)(newValue).toBe(11);
    });
    (0, vitest_1.test)("no change", function () {
        reset();
        leaf.x = 11;
        (0, vitest_1.expect)(called).toBe(false);
        (0, vitest_1.expect)(oldValue).toBeUndefined();
        (0, vitest_1.expect)(newValue).toBeUndefined();
    });
    (0, vitest_1.test)("leaf change", function () {
        reset();
        leaf.x = 111;
        (0, vitest_1.expect)(called).toBe(true);
        (0, vitest_1.expect)(oldValue).toBe(11);
        (0, vitest_1.expect)(newValue).toBe(111);
    });
    (0, vitest_1.test)("o1 change", function () {
        reset();
        o1.leaf = (0, index_js_1.loudify)({ x: 33, y: 44 });
        (0, vitest_1.expect)(called).toBe(true);
        (0, vitest_1.expect)(newValue).toBe(33);
        (0, vitest_1.expect)(oldValue).toBe(undefined);
    });
    (0, vitest_1.test)("o1 removal", function () {
        reset();
        o1.leaf = undefined;
        (0, vitest_1.expect)(called).toBe(true);
        (0, vitest_1.expect)(newValue).toBeUndefined();
        (0, vitest_1.expect)(oldValue).toBeUndefined();
    });
    (0, vitest_1.test)("o2 change", function () {
        reset();
        var leaf = (0, index_js_1.loudify)({ x: 33, y: 44 });
        o2.o1 = (0, index_js_1.loudify)({ leaf: leaf });
        (0, vitest_1.expect)(called).toBe(true);
        (0, vitest_1.expect)(newValue).toBe(33);
        (0, vitest_1.expect)(oldValue).toBeUndefined();
    });
    (0, vitest_1.test)("o2 removal", function () {
        reset();
        o2.o1 = undefined;
        (0, vitest_1.expect)(called).toBe(true);
        (0, vitest_1.expect)(newValue).toBeUndefined();
        (0, vitest_1.expect)(oldValue).toBeUndefined();
    });
});
(0, vitest_1.test)("extendWith", function () {
    (0, index_js_1.extendWith)(function (loud) {
        loud["flag"] = true;
    });
    var obj = (0, index_js_1.loudify)({ s: "" });
    (0, vitest_1.expect)(obj["flag"]).toBe(true);
});
(0, vitest_1.test)("compareWith", function () {
    (0, index_js_1.compareWith)(function (a, b) {
        if ((typeof (a) == "string") && (typeof (b) === "string")) {
            return a.toLowerCase() === b.toLowerCase();
        }
        return Object.is(a, b);
    });
    var obj = (0, index_js_1.loudify)({ s: "a" });
    var keeper = {};
    var flag = false;
    obj.hear("s", keeper, function () {
        flag = true;
    });
    flag = false;
    obj.s = "A";
    (0, vitest_1.expect)(flag).toBe(false);
});
(0, vitest_1.test)("checkWith", function () {
    var check = function (_1, _2, v) {
        if (v === "fail")
            throw new Error("failed");
    };
    (0, index_js_1.checkWith)(check);
    var obj = (0, index_js_1.loudify)({ s: "" });
    (0, vitest_1.expect)(function () { obj.s = "fail"; }).toThrow("failed");
});
// describe("tx", () => {
//   test("happy path", () => {
//     const a = loudify({n:111})
//     const b = loudify({x:222})
//     let agood = false
//     let acount = 0
//     a.hear("n", (v:typeof a) => {
//       acount++
//       agood = (v.n === 333) && (b.x === 444)
//     })
//     let bgood = false
//     let bcount = 0
//     b.hear("x", (v:typeof b) => {
//       bcount++
//       bgood = (a.n === 333) && (v.x === 444)
//     })
//     acount = 0
//     bcount = 0
//     const tx = new Tx()
//     tx.batch(a, {n:333})
//     tx.batch(b, {x:444})
//     tx.commit()
//     expect(agood).toBe(true)
//     expect(acount).toBe(1)
//     expect(bgood).toBe(true)
//     expect(bcount).toBe(1)
//   })
//   test("check failure", () => {
//     checkWith(<T extends object,K extends keyof T>(_1:T, _2:K, v:T[K]) => {
//       if (v === 2) throw new Error("fail")
//     })
//     const o = loudify({x:1,y:3})
//     const tx = new Tx()
//     tx.batch(o, {x:3,y:2})
//     expect( () => { tx.commit() }).toThrow("fail")
//     expect(o.x).toBe(1)
//     expect(o.y).toBe(3)
//   })
// })
(0, vitest_1.test)("constructors", function () {
    var C = /** @class */ (function () {
        function C(x) {
            this.x = x;
        }
        return C;
    }());
    var o = (0, index_js_1.loudify)(new C(0));
    (0, vitest_1.expect)(o).toBeInstanceOf(C);
    (0, vitest_1.expect)(o.constructor === C).toBe(true);
});
