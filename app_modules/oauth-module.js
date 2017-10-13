"use strict"

var bcrypt = require("bcrypt");
var redis = require("./redis-module.js");

module.exports = {
    async addClientReq( name , email , password){
        return new Promise(function(resolve,reject){
            // Get Number of Reqests

            var test = redis.SCARDSync('client_req');

            

            console.log(`test = ${test}`);

        });
    }
}