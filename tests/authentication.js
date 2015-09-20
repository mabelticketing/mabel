/* global describe, it */
var app = require("../app.js").app;
var helpers = require("../src/api/helpers")
var chai = require('chai');
chai.config.includeStack = true;
var expect = chai.expect;

var request = require("supertest");

describe('mabel', function() {
	it('refuses access without a token', function(done) {
		request(app)
			.get('/api/group')
			.expect(401, done);
	});

	describe('local auth', function() {

		it('token checker fails invalid tokens', function(done) {
			expect(function() {
				helpers.checkToken("ew");
			}).to.throw(Error);
			done();
		});

		it('grants a new token when correct credentials are passed in the query', function(done) {
			request(app)
				.get('/api/token/mabel')
				.query({
					email: 'alumnus@clittle.com',
					password: 'password'
				})
				.expect(200)
		    .expect('Content-Type', /json/)
		    .expect(function(res) {
		    	expect(res.body).to.have.property('token');
		    	expect(function() {
		    			helpers.checkToken(res.body.token);	
		    		}).not.to.throw(Error);
		    })
		    .end(done);
		});

		it('grants a new token when correct credentials are passed in the authorization header', function(done) {
			request(app)
				.get('/api/token/mabel')
    		.set('Authorization', 'Basic ' + (new Buffer("alumnus@clittle.com:password").toString('base64')))
				.expect(200)
		    .expect('Content-Type', /json/)
		    .expect(function(res) {
		    	expect(res.body).to.have.property('token');
		    	expect(function() {
		    			helpers.checkToken(res.body.token);	
		    		}).not.to.throw(Error);
		    })
		    .end(done);
		});

		it('rejects absent email', function(done) {
			request(app).get('/api/token/mabel')
				.query({
					password: 'password'
				})
				.expect(400, done);
		});

		it('rejects absent password', function(done) {
			request(app).get('/api/token/mabel')
				.query({
					email: 'alumnus@clittle.com',
				})
				.expect(400, done);
		});

		it('rejects empty email', function(done) {
			request(app).get('/api/token/mabel')
				.query({
					email: '',
					password: 'password'
				})
				.expect(400, done);
		});

		it('rejects empty password', function(done) {
			request(app).get('/api/token/mabel')
				.query({
					email: 'alumnus@clittle.com',
					password: ''
				})
				.expect(400, done);
		});

		it('rejects malformed email', function(done) {
			request(app).get('/api/token/mabel')
				.query({
					email: 'foobar',
					password: 'barfoo'
				})
				.expect(400, done);
		});

		it('rejects incorrect password', function(done) {
			request(app).get('/api/token/mabel')
				.query({
					email: 'worker@clittle.com',
					password: 'notapassword'
				})
				.expect(401, done);
		});

		it('rejects emails which are not registered', function(done) {
			request(app).get('/api/token/mabel')
				.query({
					email: 'notaperson@clittle.com',
					password: 'notapassword'
				})
				.expect(404, done);
		});
	});

});