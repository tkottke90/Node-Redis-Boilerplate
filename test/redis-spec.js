var expect = require("chai").expect;
var rewire = require("rewire");
var sinon = require("sinon");

var spec = rewire("../app_modules/redis-module");

var redisMock = require("redis-mock");

describe("Redis Unit Testing", function() {
    describe("Redis Set Sync Functions", function () {
        
        before(function() {

            this.client = redisMock.createClient();

            spec.__set__("client", this.client);

        });

        describe("SADDSync( set : string, value : string )", function(){
            it('should return a boolean value', async function() {
                var sadd_results = await spec.SADDSync('test', 'value');

                expect(sadd_results).to.be.a('boolean');
            });


            it('should add a set to RedisDB synchronously and return true value', 
                async function(){
                
                    var sadd_results = await spec.SADDSync('key', 'value');

                    expect(sadd_results).to.equal(true);

                }
            );
        });

        describe("SCARDSync( set : string )", function(){
            it('should return a number', async function() {
                var scard_results = await spec.SCARDSync('key');

                expect(scard_results).to.be.a('number');
            });

            it('should return the number of items in a set synchronously', async function(){
                var scard_results = await spec.SCARDSync('key');

                expect(scard_results).to.above(0);
            });
        });
        
        describe("SEXISTSSync()", function() {
            it('should return a boolean value');

            it('should return true for example data');
        });

        describe("SISMEMBERSync( set : string, member : string )", function(){

            it('should return a boolean', async function (){
                var sismember_results = await spec.SISMEMBERSync('key', 'value');

                expect(sismember_results).to.be.a('boolean');
            });

            it('should return true if the item exists', async function(){
                var sismember_results = await spec.SISMEMBERSync('key', 'value');

                expect(sismember_results).to.equal(true);
            });

            it('should return false as the item |chocolate| does not exist', async function(){
                var sismember_results = await spec.SISMEMBERSync('key', 'chocolate');

                expect(sismember_results).to.equal(false);
            });
        });

        before(function() {
            
            spec.SADDSync('test2', 'one');
            spec.SADDSync('test2', 'two');
            spec.SADDSync('test2', 'tree');

        });

        describe("SMEMBERSSync( set : string )", function(){
            it('should return an array of strings', async function(){
                var data = await spec.SMEMBERSSync('test2');

                expect(data).to.have.all.members(['one', 'two', 'tree']);
            });

            it('should return a list of 3 members in the set', async function(){
                var data = await spec.SMEMBERSSync('test2');
                var smember_results = 0;

                if(data[0] == 'one'){ smember_results++; }
                if(data[1] == 'two'){ smember_results++; }
                if(data[2] == 'tree'){ smember_results++; }


                expect(smember_results).to.equal(3);
            });

            
        });

        describe("SREMSync( set : string, value : string[])", function(){
            it('should return a boolean value', async function() {
                var srem_results = await spec.SREMSync('test', 'value');

                expect(srem_results).to.be.a('boolean');
            });

            it('should return true if the member(s) were removed', async function(){
                var srem_results = await spec.SREMSync('key', 'value');

                expect(srem_results).to.equal(true);
            });

        });

    });

    describe("Redis Hash Sync Functions", function() {

        before(function() {

            this.client = redisMock.createClient();

            spec.__set__("client", this.client);

        });

        describe('HSETSync', function() {
            it('should return a boolean');

            it('should add a value to a hash key to Redis');

            it('should add a value to the hash key');

        });

        describe('HGETSync()', function() {
            it('should return a string value');

            it('should get a value from a hash key');
        });

        describe('HGETALLSync()', function() {
            it('should return an array of values');

            it('should get all values in a hash key');
        });

        describe('HLENSync()', function() {
            it('should return an a number');

            it('should return the number of values in the set');
        });

        describe('HKEYSync()', function() {
            it('should return a array');

            it('should return a list of keys listed in the hash');
        });

        describe('HVALSync()', function() {
            it('should return an array');

            it('should return a list of the values listed in the hash')
        });
    });
});