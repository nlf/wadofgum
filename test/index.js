var Factory = require('..');
var Joi = require('joi');

var lab = exports.lab = require('lab').script();
var expect = require('code').expect;

lab.test('can create a model definition', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required()
        }
    });

    expect(User).to.exist();
    done();
});

lab.test('throws when no name is supplied', function (done) {

    expect(function () {

        var User = new Factory();
    }).to.throw();

    done();
});

lab.test('can create a model instance', function (done) {

    var User = new Factory({
        type: 'user',
        schema: Joi.object().keys({
            name: Joi.string().required(),
            age: Joi.number().integer()
        })
    });

    var user = new User({ name: 'test', age: '30' });
    expect(user).to.exist();
    expect(user.name).to.equal('test');
    expect(user.age).to.equal(30);
    done();
});

lab.test('allows updating properties', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer()
        }
    });

    var user = new User({ name: 'test', age: '30' });
    expect(user).to.exist();
    expect(user.name).to.equal('test');
    expect(user.age).to.equal(30);

    user.age = 40;
    expect(user.age).to.equal(40);

    done();
});

lab.test('sets default values when not provided at creation', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string(),
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User();
    expect(user).to.exist();
    expect(user.age).to.equal(20);

    done();
});

lab.test('can validate', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User({ name: 'test', age: 30 });
    user.validate(function (err) {

        expect(err).to.not.exist();
        expect(user.name).to.equal('test');
        expect(user.age).to.equal(30);
        done();
    });
});

lab.test('calling validate converts values', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User({ name: 'test', age: '30' });
    user.validate(function (err) {

        expect(err).to.not.exist();
        expect(user.name).to.equal('test');
        expect(user.age).to.equal(30);
        done();
    });
});

lab.test('calling validate reports errors', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User({ age: '30' });
    user.validate(function (err) {

        expect(err).to.exist();
        expect(err.message).to.contain('"name" is required');
        expect(user.age).to.equal(30);
        done();
    });
});

lab.test('calling validate converts valid keys to the correct type', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            favorites: {
                number: Joi.number().integer()
            },
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User({ name: 'test', age: '30', favorites: { number: '20' } });
    user.validate(function (err) {

        expect(user.age).to.equal(30);
        expect(user.favorites.number).to.equal(20);
        done();
    });
});

lab.test('calling validate does not convert keys which contain errors', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            favorites: {
                number: Joi.number().integer()
            },
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User({ name: 'test', age: 'test', favorites: { number: 'twenty' } });
    user.validate(function (err) {

        expect(user.favorites.number).to.equal('twenty');
        expect(user.age).to.equal('test');
        done();
    });
});

lab.test('calling validate reports multiple errors', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User({ age: 'test' });
    user.validate(function (err) {

        expect(err).to.exist();
        expect(err.message).to.contain('"name" is required');
        expect(err.message).to.contain('"age" must be a number');
        expect(user.age).to.equal('test');
        done();
    });
});

lab.test('can use a plugin', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var initCalled = false;

    var Plugin = function (model, options) {

        expect(model).to.exist();
        expect(model.type).to.equal('user');
        expect(model.schema.isJoi).to.equal(true);
        expect(initCalled).to.equal(false);
        initCalled = true;

        model.prototype.extend({
            test: function () {

                return this.name;
            }
        });

        model.extend({
            test: function () {

                return true;
            }
        });
    };

    User.register({
        register: Plugin
    });

    expect(initCalled).to.equal(true);

    var user = new User({ name: 'test' });
    expect(user.test).to.exist();
    expect(user.test()).to.equal('test');

    expect(User.test).to.exist();
    expect(User.test()).to.equal(true);
    done();
});

lab.test('can load multiple plugins at once using both arrays and single objects', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model, options) {

        model.extend({
            test: function () {

                return true;
            }
        });
    };

    var PluginTwo = function (model, options) {

        model.extend({
            twice: true
        });
    };

    User.register(Plugin, [PluginTwo]);
    expect(User.test()).to.equal(true);
    expect(User.twice).to.equal(true);
    done();
});

lab.test('can load a plugin with a deep register property', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model) {

        expect(model).to.exist();
    };

    User.register({
        register: {
            register: Plugin
        }
    });

    done();
});

lab.test('throws when trying to use an invalid plugin', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    expect(function () {
        User.register({});
    }).to.throw('Invalid plugin');

    expect(function () {
        User.register('broken');
    }).to.throw('Invalid plugin');

    done();
});

lab.test('does nothing when calling extend with no parameters', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    expect(function () {
        User.register();
    }).to.not.throw();

    done();
});

lab.test('can extend a model schema with a plugin', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model) {

        expect(model).to.exist();
        expect(model.schema).to.exist();
        expect(model.schema.isJoi).to.equal(true);
        model.extendSchema(Joi.object().keys({
            id: Joi.string().default('some_id')
        }));
    };

    User.register(Plugin);

    var user = new User();
    user.validate();
    expect(user.id).to.equal('some_id');
    done();
});

lab.test('can use preValidate to populate model fields', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model) {

        expect(model).to.exist();
        expect(model.schema.isJoi).to.equal(true);
        model.schema = model.schema.concat(Joi.object().keys({
            id: Joi.string().default('some_id')
        }));

        model.prototype.on('preValidate', function (model) {

            model.id = 'other_id';
        });
    };

    User.register(Plugin);

    var user = new User();
    user.validate();
    expect(user.id).to.equal('other_id');
    done();
});

lab.test('can use preValidate twice', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model) {

        expect(model).to.exist();
        expect(model.schema.isJoi).to.equal(true);
        model.schema = model.schema.concat(Joi.object().keys({
            id: Joi.string().default('some_id')
        }));

        model.prototype.on('preValidate', function (model) {

            model.id = 'other_id';
        });

        model.prototype.on('preValidate', function (model) {

            model.age += 1;
        });
    };

    User.register(Plugin);

    var user = new User({ name: 'test', age: 20 });
    expect(user.age).to.equal(21);
    expect(user.id).to.equal('other_id');
    done();
});

lab.test('uses separate event emitters for different instances', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            id: Joi.number().integer(),
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model) {

        expect(model).to.exist();
        expect(model.schema.isJoi).to.equal(true);
        model.prototype.on('preValidate', function (model) {

            ++model.id;
        });
    };

    User.register(Plugin);

    var user = new User({ id: 1 });
    var user2 = new User({ id: 5 });

    expect(user.id).to.equal(2);
    expect(user2.id).to.equal(6);
    done();
});

lab.test('fires the create event when instantiating a model', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model) {

        expect(model).to.exist();
        expect(model.schema.isJoi).to.equal(true);
        model.on('create', function (model) {

            expect(model.name).to.equal('test');
            expect(model.age).to.equal(20);
            done();
        });
    };

    User.register(Plugin);

    var user = new User({ name: 'test', age: 20 });
});

lab.test('can bind a non-method value', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model) {

        expect(model).to.exist();
        expect(model.schema.isJoi).to.equal(true);
        model.extend({
            test: 'object'
        });
    };

    User.register(Plugin);
    expect(User.test).to.equal('object');
    done();
});
