var expect = require("chai").expect;
var rewire = require("rewire");
var sinon = require("sinon");

var spec = rewire("../app_modules/redis-module");

var redisMock = require("redis-mock");


describe("Redis Set Sync Functions", function () {
    
    before(function() {

        this.client = redisMock.createClient();

        spec.__set__("client", this.client);

    });

    describe("SADDSync( set : string, value : string )", function(){
        
        it('should add a set to RedisDB synchronously and return true', 
            async function(){
            
                var sadd_results = await spec.SADDSync('key', 'value');

                expect(sadd_results).to.equal(true);

            }
        );
    });

    describe("SCARDSync( set : string )", function(){
        it('should return the number of items in a set synchronously', async function(){
            var scard_results = await spec.SCARDSync('key');

            expect(scard_results).to.above(0);
        });
    });
    
    // describe("SISMEMBERSync( set : string, member : string )", function(){
    //     it('should return true if the item exists', async function(){
    //         var sismember_results = await spec.SISMEMBERSync('key', 'value');

    //         expect(sismember_results).to.equal(true);
    //     });

    //     it('should return false as the item |chocolate| does not exist', function(){
    //         var sismember_results = await spec.SISMEMBERSync('key', 'chocolate');

    //         expect(sismember_results).to.equal(false);
    //     });
    // });

    describe("SMEMBERSync( set : string )", function(){
        it('should return a list of members in the set', async function(){
            var smember_results = await spec.SMEMBERSync('key');

            expect(smember_results).to.equal([ 'value' ]);
        });
    });

    describe("SREMSync( set : string, value : string[])", function(){
        it('should return true if the member(s) were removed', async function(){
            var srem_results = await spec.SREMSync('key', 'value');

            expect(srem_results).to.equal(true);
        });

    });
});