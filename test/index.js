var WOG = require('..');
var Joi = require('joi');

var lab = exports.lab = require('lab').script();
var expect = require('code').expect;

lab.experiment('model', function () {

    lab.test('can create a model definition', function (done) {

        var User = new WOG({
            name: 'user',
            schema: {
                name: Joi.string().required()
            }
        });

        expect(User).to.exist();
        done();
    });

    lab.test('throws when no name is supplied', function (done) {

        expect(function () {

            var User = new WOG();
        }).to.throw('must provide a name');

        done();
    });

    lab.test('can create a model instance', function (done) {

        var User = new WOG({
            name: 'user',
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

        var User = new WOG({
            name: 'user',
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

        var User = new WOG({
            name: 'user',
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

        var User = new WOG({
            name: 'user',
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

        var User = new WOG({
            name: 'user',
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

        var User = new WOG({
            name: 'user',
            schema: {
                name: Joi.string().required(),
                age: Joi.number().integer().default(20)
            }
        });

        var user = new User({ age: '30' });
        user.validate(function (err) {

            expect(err).to.exist();
            expect(err.message).to.equal('name is required');
            expect(user.age).to.equal(30);
            done();
        });
    });

    lab.test('calling validate converts valid keys to the correct type', function (done) {

        var User = new WOG({
            name: 'user',
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

        var User = new WOG({
            name: 'user',
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

        var User = new WOG({
            name: 'user',
            schema: {
                name: Joi.string().required(),
                age: Joi.number().integer().default(20)
            }
        });

        var user = new User({ age: 'test' });
        user.validate(function (err) {

            expect(err).to.exist();
            expect(err.message).to.equal('name is required. age must be a number');
            expect(user.age).to.equal('test');
            done();
        });
    });

    lab.test('can use a plugin', function (done) {

        var User = new WOG({
            name: 'user',
            schema: {
                name: Joi.string().required(),
                age: Joi.number().integer().default(20)
            }
        });

        var initCalled = false;

        var Plugin = function (collection) {

            expect(collection).to.exist();
            expect(collection.name).to.equal('user');
            expect(collection.schema.isJoi).to.equal(true);
            expect(initCalled).to.equal(false);
            initCalled = true;
        };

        Plugin.prototype.test = function () {
            return this.name;
        };

        Plugin.test = function () {
            return true;
        };

        User.use(Plugin);

        expect(initCalled).to.equal(true);

        var user = new User({ name: 'test' });
        expect(user.test).to.exist();
        expect(user.test()).to.equal('test');

        expect(User.test).to.exist();
        expect(User.test()).to.equal(true);
        done();
    });

    lab.test('throws when trying to use an invalid plugin', function (done) {

        var User = new WOG({
            name: 'user',
            schema: {
                name: Joi.string().required(),
                age: Joi.number().integer().default(20)
            }
        });

        expect(function () {
            User.use();
        }).to.throw('Plugin must be a constructor method');

        done();
    });

    lab.test('can extend a model schema with a plugin', function (done) {

        var User = new WOG({
            name: 'user',
            schema: {
                name: Joi.string().required(),
                age: Joi.number().integer().default(20)
            }
        });

        var Plugin = function (collection) {

            expect(collection).to.exist();
            expect(collection.schema).to.exist();
            expect(collection.schema.isJoi).to.equal(true);
            collection.schema = collection.schema.concat(Joi.object().keys({
                id: Joi.string().default('some_id')
            }));
        };

        User.use(Plugin);

        var user = new User();
        user.validate();
        expect(user.id).to.equal('some_id');
        done();
    });

    lab.test('can use preValidate to populate model fields', function (done) {

        var User = new WOG({
            name: 'user',
            schema: {
                name: Joi.string().required(),
                age: Joi.number().integer().default(20)
            }
        });

        var Plugin = function (collection) {

            expect(collection).to.exist();
            expect(collection.schema.isJoi).to.equal(true);
            collection.schema = collection.schema.concat(Joi.object().keys({
                id: Joi.string().default('some_id')
            }));
        };

        Plugin.prototype.preValidate = function (collection) {

            this.id = 'other_id';
        };

        User.use(Plugin);

        var user = new User();
        user.validate();
        expect(user.id).to.equal('other_id');
        done();
    });
});
