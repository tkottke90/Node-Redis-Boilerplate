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
    const auth = require('./app_modules/auth-module.js');
    const users = require('./app_modules/user-module.js');
    const api = require('./app_modules/api-module.js');

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
        if(!err){ 
            smc.getMessage(0,null,"Server Running on port: 8080"); 
        } else {
            smc.getMessage(0,5,`Error Starting Server: ${err} \n Shutting Down`); 
            process.exit(1);    
        }
        // Start Redis Connection
        redis.startRedis();

        // Test 
        
        test();
        

        // End Test

    }); 

    async function test(){
        smc.getMessage(0,null,"Test Function \n");

        try {
            var client = await users.getClientReqByID(1);
            var addClient = await users.createAccount(client);
            
            console.log(`Created Client?: ${addClient}`);

        } catch(e) {
            smc.getMessage(0,5,JSON.stringify(e));
        }

        console.log("\n")
        smc.getMessage(0,null,"End of Test");
        process.exit();
    }