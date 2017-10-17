var expect = require("chai").expect;
var rewire = require("rewire");
var sinon = require("sinon");

var spec = rewire("../app_modules/redis-module");

var redisMock = require("redis-mock");

describe("Redis Unit Testing", function() {
    describe("Redis Core Sync Functions", function() {
        
        before(function() {
            this.client = redisMock.createClient();
            spec.__set__("client", this.client);

            spec.SADDSync('core', 'value');
        });

        describe("EXISTSync", function() {
            it('should return true if key is listed', async function() {
                var exists_result = await spec.EXISTSync('core');

                expect(exists_result).to.equal(true);
            });
        });        
    });

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

        describe('HSETSync()', function() {
            it('should return a boolean', async function() {
                var hset_result = await spec.HSETSync('hashTest', 'field1', 'value1');

                expect(hset_result).to.be.a('boolean');
            });

            it('should add key to Redis if one does not exist', function(done) {
                this.client.EXISTS('hashTest', (err, res) => {
                    if(err) done(err);
                    else if(res == 0) done(new Error("Hash Not Found - Error:0"));
                    else if(res == 1) done();
                    else done(new Error(`Error: Bad Results - ${res}`));
                });
            });

            it('should add a field to the key', function(done){
                this.client.HEXISTS('hashTest', 'field1',(err, res) => {
                    if(err) done(err);
                    else if(res == 0) done(new Error("Field Not Found"));
                    else done();
                });
            });

            it('should add a value to the field', function(done){
                this.client.HGET('hashTest', 'field1', (err, res) => {
                    if(err) done(err);
                    else if(res == null) done(new Error("No Value Assigned - Error Null"));
                    else if(res === 'value1') done();
                    else done(new Error(`Error: Bad Results - ${res}`))
                });
            });

        });

        describe('HEXISTSSync()', function() {
            it('should return a boolean', async function() {
                var hexists_result = await spec.HEXISTSSync('hashTest', 'field1');

                expect(hexists_result).to.be.a('boolean');
            });

            it('should return true if the field exists in the key', async function() {
                var hexists_result = await spec.HEXISTSSync('hashTest', 'field1');

                expect(hexists_result).to.be.true;
            });
        });

        describe('HGETSync()', function() {
            it('should return a string value', async function() {
                var hget_result = await spec.HGETSync('hashTest', 'field1');

                expect(hget_result).to.be.a('string');
            });

            it('should get a value from a hash key', async function() {
                var hget_result = await spec.HGETSync('hashTest', 'field1');
                
                expect(hget_result).to.equal('value1');
            });
        });

        before(async function() {
            await spec.HSETSync('hashTest', 'field2', 'value2');
        });

        describe('HGETALLSync()', function() {
            it('should return a JSON object', async function() {
                var hgetall_result = await spec.HGETALLSync('hashTest');

                expect(hgetall_result).to.be.a('object');
            });

            it('should get all values in a hash key', async function() {
                var hgetall_result = await spec.HGETALLSync('hashTest');
                
                expect(hgetall_result).to.includes({'field1':'value1','field2':'value2'});
            });
        });

        describe('HLENSync()', function() {
            it('should return an a number', async function() {
                var hlen_result = await spec.HLENSync('hashTest');

                expect(hlen_result).to.be.a('number');
            });

            it('should return the number of values in the set', async function() {
                var hlen_result = await spec.HLENSync('hashTest');

                expect(hlen_result).to.equal(2);
            });
        });

        describe('HKEYSync()', function() {
            it('should return a array', async function() {
                var hkey_result = await spec.HKEYSync('hashTest');

                expect(hkey_result).to.be.an('array');
            });

            it('should return a list of keys listed in the hash', async function() {
                var hkey_result = await spec.HKEYSync('hashTest');

                expect(hkey_result).to.eql([ 'field2', 'field1' ]);
            });
        });

        describe('HVALSync()', function() {
            it('should return an array');

            it('should return a list of the values listed in the hash')
        });

        describe('HDELSync()', function() {
            it('should return a boolean');

            it('should return true if item is deleted');
        });
    });
});