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

lab.test('throws when bad options are supplied', function (done) {

    expect(function () {

        var User = new Factory();
    }).to.throw();

    expect(function () {

        var User = new Factory({});
    }).to.throw();

    expect(function () {

        var User = new Factory({ type: 'test' });
    }).to.throw();

    expect(function () {

        var User = new Factory({ schema: {} });
    }).to.throw();

    expect(function () {

        var User = new Factory({ plugins: [] });
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
    expect(user.age).to.equal('30');
    done();
});

lab.test('sets default values after validating', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string(),
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User();
    user.validate().then(function () {

        expect(user).to.exist();
        expect(user.age).to.equal(20);

        done();
    });
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
    user.validate().then(function () {

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
    user.validate().then(function () {

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
    user.validate().catch(function (err) {

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
            extras: {
                likesMelon: Joi.boolean()
            },
            age: Joi.number().integer().default(20)
        }
    });

    var user = new User({ name: 'test', age: '30', favorites: { number: '20' } });
    user.validate().then(function () {

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
    user.validate().catch(function () {

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
    user.validate().catch(function (err) {

        expect(err).to.exist();
        expect(err.message).to.contain('"name" is required');
        expect(err.message).to.contain('"age" must be a number');
        expect(user.age).to.equal('test');
        done();
    });
});

lab.test('calling validate removes renamed keys', function (done) {

    var User = new Factory({
        type: 'user',
        schema: Joi.object({
            name: Joi.string(),
            age: Joi.number().integer()
        }).rename('_age', 'age')
    });

    var user = new User({ _age: 30 });
    user.validate()
        .then(function () {

            expect(user.age).to.equal(30);
            expect(user._age).to.not.exist();
            done();
        })
        .catch(done);
});

lab.test('calling validate does not remove aliased renamed keys', function (done) {

    var User = new Factory({
        type: 'user',
        schema: Joi.object({
            name: Joi.string(),
            age: Joi.number().integer()
        }).rename('_age', 'age', { alias: true })
    });

    var user = new User({ _age: 30 });
    user.validate()
        .then(function () {

            expect(user.age).to.equal(30);
            expect(user._age).to.equal(30);
            done();
        })
        .catch(done);
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

        model.prototype.test = function () {

            return this.name;
        };

        model.test = function () {

            return true;
        };
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

lab.test('can load multiple plugins at once', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var Plugin = function (model, options) {

        model.test = function () {

            return true;
        };
    };

    var PluginTwo = function (model, options) {

        model.twice = true;
    };

    User.register([Plugin, PluginTwo]);
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

        model.schema = Joi.object({
            id: Joi.string().default('some_id')
        });
    };

    User.register(Plugin);

    var user = new User({ name: 'test' });
    user.validate().then(function () {

        expect(user.id).to.equal('some_id');
        done();
    });
});

lab.test('can load plugins during instantiation', function (done) {

    var Plugin = function (model) {

        model.test = 'object';
    };

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string()
        },
        plugins: [Plugin]
    });

    var user = new User({ name: 'test' });
    expect(user.name).to.equal('test');
    expect(User.test).to.equal('object');
    done();
});

lab.test('can extend a model with another model', function (done) {

    var execCount = 0;

    var Plugin = function (model) {

        model.test = 'object';
        ++execCount;
    };

    var Base = new Factory({
        type: 'base',
        schema: {
            id: Joi.string()
        },
        plugins: [Plugin]
    });

    expect(execCount).to.equal(1);

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string()
        }
    });

    User.extend(Base);
    expect(execCount).to.equal(2);
    expect(User.type).to.equal('user');
    expect(User.test).to.equal('object');
    expect(User.schema.describe()).to.deep.equal({
        type: 'object',
        children: {
            name: {
                type: 'string',
                invalids: ['']
            },
            id: {
                type: 'string',
                invalids: ['']
            }
        }
    });
    done();
});

lab.test('throws an error when attempting to extend a factory with an invalid factory', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string()
        }
    });

    expect(function () {

        User.extend();
    }).to.throw('Invalid factory');

    expect(function () {

        User.extend({});
    }).to.throw('Invalid factory');

    expect(function () {

        User.extend(function () {});
    }).to.throw('Invalid factory');

    done();
});

lab.test('can abort validation by returning an error in preValidate', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    var called = false;
    User.prototype.on('preValidate', function (user) {

        return Promise.reject(new Error('failed'));
    });

    User.prototype.on('preValidate', function (user) {

        called = true;
    });

    var user = new User({ name: 'test' });
    user.validate().catch(function (err) {

        expect(err).to.exist();
        expect(err.message).to.equal('failed');
        expect(user.age).to.not.exist();
        expect(called).to.equal(false);
        done();
    });
});

lab.test('can pass through an error from postValidate', function (done) {

    var User = new Factory({
        type: 'user',
        schema: {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        }
    });

    User.prototype.on('postValidate', function (user) {

        return Promise.reject(new Error('failed'));
    });

    var user = new User({ name: 'test' });
    user.validate().catch(function (err) {

        expect(err).to.exist();
        expect(err.message).to.equal('failed');
        done();
    });
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
        model.schema = Joi.object().keys({
            id: Joi.string().default('some_id')
        });

        model.schema = { admin: Joi.boolean().default(false) };

        model.prototype.on('preValidate', function (model) {

            model.id = 'other_id';
        });
    };

    User.register(Plugin);

    var user = new User({ name: 'test' });
    user.validate().then(function (user) {

        expect(user.id).to.equal('other_id');
        expect(user.admin).to.equal(false);
        done();
    });
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
        model.schema = Joi.object().keys({
            id: Joi.string().default('some_id')
        });

        model.prototype.on('preValidate', function (model) {

            model.id = 'other_id';
        });

        model.prototype.on('preValidate', function (model) {

            model.age += 1;
        });
    };

    User.register(Plugin);

    var user = new User({ name: 'test', age: 20 });
    user.validate().then(function () {

        expect(user.age).to.equal(21);
        expect(user.id).to.equal('other_id');
        done();
    });
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

    var user = new User({ id: 1, name: 'test' });
    var user2 = new User({ id: 5, name: 'test2' });

    user.validate().then(function () {

        expect(user.id).to.equal(2);
        return user2.validate();
    }).then(function () {

        expect(user2.id).to.equal(6);
        done();
    });
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
