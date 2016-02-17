## wadofgum [![Build Status](https://travis-ci.org/nlf/wadofgum.svg)](https://travis-ci.org/nlf/wadofgum)

A super minimal and highly extensible modeling library.
Wadofgum models use pure functions to work with the state of an object.

Wadofgum by itself doesn't do much, but with extensions, it can manage the state of an object with schemas, processors, etc.

### Usage

The basic form of *wadofgum* is essentially just an object with a few additions to simplify using it as the base for a more robust modeling system.

```js
const Wadofgum = require('wadofgum');

const Model = new Wadofgum();
```

#### Capabilities

The base class and all classes derived from it contain a `capabilities` property, which is a `Set` containing the names of capabilities that have been added to your class. By default, this set is empty. It is intended to be added to when loading a mixin.

For example:

```js
const Wadofgum = require('wadofgum');
Wadofgum.capabilities.add('my_cap');
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

Note: extensions that want to process their options should add a getter and setter for them, and set the value in `.meta`.
