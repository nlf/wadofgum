## wadofgum [![Build Status](https://travis-ci.org/nlf/wadofgum.svg)](https://travis-ci.org/nlf/wadofgum)

A super minimal and highly extensible modeling library.

### Usage

The basic form of *wadofgum* is essentially just an object with a few additions to simplify using it as the base for a more robust modeling system.

```js
const Wadofgum = require('wadofgum');

let model = new Wadofgum();
```

#### Capabilities

The base class and all classes derived from it contain a `capabilities` property, which is a `Set` containing the names of capabilities that have been added to your class. By default, this set is empty. It is intended to be added to when loading a mixin.

For example:

```js
const Wadofgum = require('wadofgum');
Wadofgum.capabilities.add('my_cap');
```

#### Metadata

Additionally the base class exports a `meta` property which can be used to store metadata about your class in a `WeakSet`. The meta object contains three methods, `set`, `get`, and `has`.

```js
const Wadofgum = require('wadofgum');

Wadofgum.meta.has('key'); // false
Wadofgum.meta.get('key'); // undefined

Wadofgum.meta.set('key', 'value');
Wadofgum.meta.has('key'); // true
Wadofgum.meta.get('key'); // 'value'
```

### Mixins

A mixin is simply a function that accepts a base class as a parameter, performs some manipulation of it, and returns a new class:

```js
const Wadofgum = require('wadofgum');

let myMixin = function (baseClass) {
    class myModel extends baseClass {
        static myMethod() {
            console.log('called myMethod');
        };
    }

    myModel.capabilities.add('myMethod');

    return myModel;
};

class Model extends Wadofgum.mixin(myMixin) {};
Model.myMethod(); // 'called myMethod'
Model.capabilities.has('myMethod'); // true
```
