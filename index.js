"use strict"

// Imports
    // Native
    const https = require('https');
    const fs = require('fs');
    const crypto = require('crypto');
    // Extra
    const express = require('express');
    const bparser = require('body-parser');
    //const bcrypt = require('bcrypt');    
    const smc = require('./app_modules/server-message-creator.js');
    const redis = require('./app_modules/redis-module.js');
    const redis_sync = require('./app_modules/redis-sync.js');
    const auth = require('./app_modules/oauth-module.js');

// Variables
    var root = '';
    var app = express();

    var DEBUG = false; // DEBUG Message Setting

// Authentication

// HTML Server Manager Static Files

// HTML Auth Request Static Files

    
// RESTful API
    // GET

    // PUT

    // POST

    // DELETE

    // OPTIONS
// File System Tasks

// Server Listeners
    app.listen(8080,function(err){
        // Check for Errors - Log Server Running Message
        !err ? smc.getMessage(0,null,"Server Running on port: 8080") : function(err){ smc.getMessage(0,5,`Error Starting Server: ${err} \n Shutting Down`); process.exit(1); };
        
        // Start Redis Connection
        redis.startRedis();

        // Test 
        setTimeout(
            () => {
                test()
            }
        ,10);

        // redis.reqClient("Thomas Kottke", "t.kottke90@gmail.com", "12345", function(err){
        //     redis.getClientReq(function(err,res){
        //         console.log(res);
        //     });
        // });

        //redis.addClient(0);
 
        

        // redis.clientExistsByUsername("t.kottke90@gmail.com")
        //     .then((result) => { 
        //         console.log(result); 
                
            
        //     })
        //     .catch((err) => { console.log(err); });

        /*
            redis.clientExistsByUsername("t.kottke()@gmail.com", function (err, result){
                if(err) { <Log Err> }
                else{ console.log(result) }
            }):
        */
        
        // End Test

    }); 

    async function test(){
        smc.getMessage(0,null,"Test Function \n\n");

        console.log(`Results: ${await redis.SADDSync("key", "value")}`);

        smc.getMessage(0,null,"End of Test");
        process.exit();
    }