var expect = require("chai").expect;
var rewire = require("rewire");
var sinon = require("sinon");

var auth = rewire('../app_modules/auth-module');

describe("Authorization Testing", function() {
    beforeEach(function() {
        this.redisMock = {
            EXISTSync : sinon.stub().yields(true)
        }

        auth.__set__("redis", this.redisMock);
    });
    
    describe("Client Datastore Requests", function() {

        describe("addClientReq()", function(){
            it('should return true if request added');
        });

        describe("getClientReqs()", function() {
            it('should return a json object that includes a list of requests');
        });

        describe("getClientReqByID()", function() {
            it('should return a json object of the request');
        });

        describe("approveClientReq()", function() {
            it('should return true if the Client Account was created');
        });

        describe("clientExists()", function() {
            it('should return true if client account exists');
        });

        describe("addAPIReq()", function() {
            it('should return true if API Request added successfully');
        });

        describe("getAPIReqs()", function() {
            it('should return a json object that includes a list of reqeusts');
        });

        describe("getAPIReqByID()", function() {
            it('should return a json object of the request');
        });

        describe("approveAPIReq()", function() {
            it('should return true if the API was created successfully');
        });

    });

    describe("API Authorization", function () {
        beforeEach(function() {

            auth.authAPI('testKey');

        });

        describe("authAPI()", function(){
            it('calls authAPI with the correct key', function(){                
                expect(this.redis.EXISTSync.calledWith('testKey')).to.equal(true);
            });
        });
    });
    
});