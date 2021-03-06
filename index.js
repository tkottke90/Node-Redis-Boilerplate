"use strict"

// Imports
    // Native
    const https = require('https');
    const fs = require('fs');
    const crypto = require('crypto');
    const path = require('path');
    // Extra
    const express = require('express');
    const bparser = require('body-parser');

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
        // GET API
        
        app.get(`${root}/api/:api`, (req, res) => {
            var now = Date.now();

        });

    // PUT

    // POST

    // DELETE

    // OPTIONS
// File System Tasks

// Server Listeners
    // app.init(() => {
    //     redis.startRedis()        
    // });


    app.listen(3000,function(err){
        process.argv[2] == "--DEBUG" ? DEBUG = true : DEBUG = false;

        console.log(`DEBUG: ${DEBUG}`)
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
        //function seconds(number){ return number*1000; }
        
        //setTimeout((err) => { test() }, seconds(2));
        

        // End Test

    }); 
    


    async function test(){
        smc.getMessage(0,null,"Test Function \n\n");

        try {
           
            console.log(process.env.PORT);
        } catch(e) {
            console.log("Error: See Debugging Tools To Resume and Review Error");
            console.log(e);
            //typeof e == 'object' ? console.log(JSON.stringify(e)) : smc.getMessage(0,5,e);
        }

        console.log("\n")
        smc.getMessage(0,null,"End of Test");
        process.exit();
    }

    module.exports.app = app;
    module.exports.DEBUG = DEBUG;