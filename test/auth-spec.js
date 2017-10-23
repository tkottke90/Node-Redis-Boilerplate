var expect = require("chai").expect;
var rewire = require("rewire");
var sinon = require("sinon");

var auth = rewire('../app_modules/auth-module');

describe("Authorization Testing", function() {
    
    describe("Client Datastore Requests", function() {

        describe("addClientReq()", function(){
            before(function() {
                
            });

            it('should check if email already in use');

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

        describe("authAPI()", function(){
            beforeEach(function() {
                this.redisMock = {
                    EXISTSync : sinon.stub().resolves(true)
                }

                auth.__set__("redis", this.redisMock);

                auth.authAPI('testKey');

            });

            it('calls authAPI with the correct key', function(){                
                expect(this.redisMock.EXISTSync.calledWith('testKey')).to.equal(true);
            });

            it('should return true if key exists', function() {
                auth.authAPI('testKey')
                    .then((result) => {
                        if(typeof result != 'boolean'){
                            expect(result).to.be.a('boolean');
                        } else {
                            expect(result).to.equal(true);
                        }    
                    })
                    .catch((err) => { expect(err).to.throw(); });
            });

        });
    });
    
});