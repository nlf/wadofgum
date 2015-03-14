## wadofgum [![Build Status](https://travis-ci.org/nlf/wadofgum.svg)](https://travis-ci.org/nlf/wadofgum)

A super minimal modeling library built around [joi](https://github.com/hapijs/joi).

Joi is used for all schema definition and validation, all this library provides is a way of using predefined schemas in a prototypical manner as well as means of simply extending these prototypes.

### Usage

The exported method is a constructor used to create a model factory. It accepts a single object parameter, and requires `type` and `schema` properties. For example:

```javascript
var Factory = require('wadofgum');

var User = new Factory({
    type: 'user',
    schema: {
        id: Joi.number(),
        firstName: Joi.string(),
        lastName: Joi.string()
    }
});
```

The schema property can be passed as an object literal, as above, or as a joi schema. The following is equivalent to the first example:

```javascript
var User = new Factory({
    type: 'user',
    schema: Joi.object({
        id: Joi.number(),
        firstName: Joi.string(),
        lastName: Joi.string()
    })
});
```

Also supported is an optional `plugins` key, which can be used to load plugins on the factory at creation time.

```javascript
var User = new Factory({
    type: 'user',
    schema: {
        id: Joi.number(),
        firstName: Joi.string(),
        lastName: Joi.string()
    },
    plugins: [PluginOne, PluginTwo]
});
```

This factory can then be used to create model instances. These instances are validated on creation which allows joi to perform type coercion immediately. Errors in the initial validation are simply ignored.

```javascript
var User = new Factory({
    type: 'user',
    schema: {
        id: Joi.number(),
        firstName: Joi.string(),
        lastName: Joi.string()
    }
});

var user = new User({ id: '40', firstName: 'Jane', lastName: 'Doe' });
user.id === 40 // true
```

Note that model instances will automatically have a reference to their factory as the property `factory`.

```javascript
var user = new User();
user.factory === User; // true
```

To attach methods to the factory, simply assign them.

```javascript
User.find = function (query, callback) {
};
```

To attach methods to a model instance, assign them to the factory's prototype.

```javascript
User.prototype.save = function (callback) {
};
```

Note that later assignments to the factory's `schema` property will pass through a setter method that will concat the new schema with the existing one, as in:

```javascript
var User = new Factory({
    type: 'user',
    schema: {
        name: Joi.string(),
        age: Joi.number().integer()
    }
});

User.schema = Joi.object({ favoriteColor: Joi.string() });
User.schema = { luckyNumber: Joi.number().integer() };
// User.schema will now have keys for 'name', 'age', 'favoriteColor', and 'luckyNumber'
```

#### `validate([next])`

Validation can also be triggered manually, by calling the `validate()` method on a model instance. This method accepts a callback that will receive any errors. Note that validating a model mutates properties in the same way as when instantiating a new model.

```javascript
user.id = '100';
user.validate(function (err) {
    user.id === 100 // true
});
```

#### `register([plugins])`

wadofgum model factories are easily extended using plugins. A plugin can be passed as either a function directly, or as an object with `register` and `options` properties.

```javascript
User.register(SomePlugin, SecondPlugin);

User.register({
    register: AnotherPlugin,
    options: {
        someOption: true
    }
});
```

#### `extend(obj)`

The `extend` method is used to extend the current factory with another factory. This is useful for creating a base factory that contains common plugins for your other factories to inherit. The schema from the two factories will also be merged.

```javascript
var Base = new Factory({
    type: '_base',
    schema: {
        id: Joi.string()
    },
    plugins: [SomePlugin, AnotherPlugin]
});

User.extend(Base); // User will now have SomePlugin and AnotherPlugin loaded, as well as an 'id' key available in the schema
```

#### events

The model factory and model instances each have event emitters. These event emitters are provided by [spit](https://github.com/nlf/spit) and are asynchronous. See the README in that repo for more details.

To add a listener for factory events, you may simply use `User.on(event, fn)`. Events can also be emitted on a model factory by calling `User.emit(event, params)`.

Model factories, by default, only emit one event `create`. The parameter passed to this event is the model instance that was just created.

To add a listener for model instance events, you may either use `user.on(event, fn)` where `user` is an instance of a model, or you may use `User.prototype.on(event, fn)` where `User` is a model factory.

Model instances, by default, emit two events `preValidate` and `postValidate`. The parameter passed to both is a reference to the model instance.

Events can only be emitted on a model instance if you have a reference to that instance, in which case you may simply use `user.emit(event, params)`.

### Plugins

A plugin is a method that receives two parameters, `factory` and `options`.

The `options` parameter is passed directly from the call to `register()`. If no options are given, this parameter will be an empty object `{}`.

The `factory` parameter is a reference to the factory object this plugin is being registered on. All the above methods are available.
