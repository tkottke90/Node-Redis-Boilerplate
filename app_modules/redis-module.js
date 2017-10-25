"use strict"

// Imports
    // Native
    const fs = require('fs');
    const path = require('path');
    // Extra
    const redis = require('redis');
    //const bcrypt = require('bcrypt');
    const smc = require('./server-message-creator.js');

// Variables
    const redis_config = path.join(__dirname,'config','redis_config.json');
    var client; client = redis.createClient();
    var monitor;

    var DEBUG = false; // Debug Message Setting;

    // Referesh Settings
        var refresh_timer; // Value in Config
        var refresh_rate;  // Value in Config

        // Manages the rate at which the module will force redis to do a save
        // By default the module will save the db every 15 mins or once 5 or more changes have happend within a 15 min window
        //      If 15 minutes pass without 5 or more changes db_save_update++
        //      If 5 or more changes happen within 15 minutes db_save_update--
        var db_save_rate; // Value in Config
        var db_save_update = 0; // Number of Backups Before Rate Update

    // Redis Stats
        var redis_stats =  {
            "redis_version" : "",
            "port" : "",
            "uptime" : {
                "seconds" : "",
                "days" : ""
            },
            "clients_connected" : 0,
            "storage" : {
                "db_last_save": 0,
                "db_changes" : 0,
                "db_save_status" : "",
                "logs_enabled" : false,
                "log_status" : ""
            }
        };

    // Redis Memory
        var redis_memory_stats = {}


// Templates

    // File Templates

    var template_rconfig = 
        { 
            "debug" : 0,
            "monitor" : 0,
            "refresh_rate" : 1,
            "db_save_rate" : 15
        };

    // Time
        // Calculations for converting milliseconds to:
        // [0] - Seconds
        // [1] - Minutes
        // [2] - Hours
        // [3] - Days
        var timeCalc = [ (1000), (1000*60), (1000*60*60), (1000*60*60*24) ];

    // Redis
        var template_key = {}

// Module Exports

module.exports = { 
    // Expose Module Variables
    client, redis_stats,

    // Utility
        setDEBUG(d){ DEBUG = d; },

        updateStatus(){ getStatus(); },

        /**
         * Method to start or stop the Monitoring Function in Redis DB.  Feature implemented as
         * the monitoring feature is resource expensive and can hider the processing speed of the DB
         * @param {string} command 
         */
        redisMonitor(command){
            return new Promise((resolve, reject) => {
                // Array of accepted states for moitoring
                var commands = [ "start", "shutdown" ];


                switch(command){
                    case commands[0]: // Start Monitoring
                        // If monitoring is already running, inform the user and do no start
                        if(monitor_status == "start"){ return "Monitoring Already Running!"; }
                        
                        // Setup client to monitor DB actions
                        monitor = redis.createClient();

                        monitor.on('monitor', function(time, args, raw_reply){
                            smc.getMessage(2,null,`${args}`)
                        });

                        monitor.monitor(function(err, res){
                            // Log Error if there is one
                            if(err){ smc.getMessage(3,5,"Error Starting Monitoring!"); reject(false); }
                            // Set Current Monitor Status
                            monitor_status = "start";
                            // Return OK if all commands are suggessful
                            resolve(true);
                        });
                        break;
                    case commands[1]: // Shutdown Monitoring
                        // If monitoring is not running, inform the user that it cant be stopped
                        if(monitor_status == "shutdown"){ return "Monitoring Not Running!"; }
                        // Log Action
                        smc.getMessage(2,null,"Closing Monitoring Session");
                        // Currently (Redis v3.0) to close monitoring the client session must be disconnected
                        monitor.quit(function(err, res){
                            // Log Error during shutdown
                            if(err){ 
                                smc.getMessage(3,5,"Error Shutting Down Monitoring!"); 
                                reject(false); 
                            }
                            if(res == "OK"){ 
                                // If quit successful, set monitor_status
                                monitor_status = "shutdown";
                                // Restart redis connection
                                monitor = null;
                                resolve(true);
                            }
                            else {
                                resolve(false);
                            }
                        });
                        break;
                    default:
                        // Notify user that the command they used was invalid 
                        smc.getMessage(1,null,`${command} is not a valid command for Redis Monitor`);
                        reject(false);
                }
            });
        },    

        startRedis(){
            // Check for Config File
            var config_dir = path.join(__dirname,'config');
            if(!fs.existsSync(config_dir)){
                fs.mkdirSync(config_dir)
                fs.writeFileSync(redis_config,JSON.stringify(template_rconfig),"utf-8");
                smc.getMessage(1,null,`Created redis_config.json`);
            } else if(!fs.existsSync(redis_config)){
                fs.writeFileSync(redis_config,JSON.stringify(template_rconfig),"utf-8");
                smc.getMessage(1,null,`Created redis_config.json`);
            } else {
                // If config exists, update values from config
                var c = JSON.parse(fs.readFileSync(redis_config));
                //{"debug":0,"monitor":0,"refresh_rate":1, "db_save_rate" : 15}
                DEBUG = c['debug'] == 1;  // DEBUG mode enabled
                c['monitor'] == 1 ? redisMonitor("start"): monitor = null; // Monitor Mode Enabled by Default
                refresh_rate = c['refresh_rate'] * timeCalc[1];
                db_save_rate = c['db_save_rate'] || 15;
            }


            // Start Redis
            client = redis.createClient();
            /**
             * Method Triggered on Error from Redis DB
             */
            client.on('error', function(err){
                smc.getMessage(1,5,`Redis Error: ${err.message}`);
            });

            /**
             * Method Triggered on connection request to Redis DB
             */
            client.on('connect', function(){
                smc.getMessage(1,null,"Connected to Redis DB");
                getStatus();
            });

            client.on('reconnecting', function(){
                smc.getMessage(1,5,"Attempting to Reconnect to Redis DB")
            })

            /**
             * Method Triggered on successful connection to Redis DB
             */
            client.on('ready', function(){
                smc.getMessage(1,null,`Redis Client Ready`);
                getStatus(function(err,data){
                    if(!err){ refresh_timer = setInterval(function(){ refresh() },refresh_rate); }
                    else { smc.getMessage(1,5,`Error in getStatus(): ${err}`) }        
                })
            });

            
            client.on('end', function(){
                clearInterval(refresh_timer);
            });


            
        },
    
    // Redis Sync Functions
        // Core
            EXISTSync(key){
                return new Promise((resolve, reject) => {
                    client.EXISTS(key, (err, res) => {
                        if(err){
                            smc.getMessage(1,0,`Redis EXISTS Error: ${err}`);
                            reject(err);
                        } else {
                            res == 0 ? resolve(false) : resolve(true);
                        }
                    });
                })
            },


        // Sets
            /**
             * Synchronous function adds a value to a set.
             * @param {string} key Name of the set key in Redis.
             * @param {string} value Value to be added to the set.
             * @returns
             *{Promise<boolean, Error>} If promise is fulfilled, return if value was added to set.  If promise is rejected, return error. 
             */
            SADDSync(key, value){
                return new Promise((resolve, reject) => {
                    client.SADD(key, value, (err, res) => {
                        if(err){
                            smc.getMessage(1,0,`SADDSync Error: ${err}`);
                            reject(err);
                        } else {
                            res == 0 ? resolve(false) : resolve(true);
                        }
                    });
                });
            },

            /**
             * Synchronus function gets number of values in set.
             * @param {string} key Name of the set key in Redis
             * @returns {Proimse<number, Error>} If promise is fulfilled, return number of values.  If Promise is rejected, return error.
             */
            SCARDSync(key){
                return new Promise((resolve, reject) => {
                    client.SCARD(key,(err, res) => {
                        if(err){
                            smc.getMessage(1,0,`SCARDSync Error: ${err}`);
                            reject(err);
                        } else {
                            resolve(res);
                        }
                    });
                });
            },

            /**
             * Synchronous Function checks if a value currently exists in a set.  This function checks for a
             * complete value and does not parse through the values stored in the set.
             * @param {string} key Name of set in Redis
             * @param {string} value Value that is being checked from set
             * @returns {Promise<boolean, Error>} If promise is fulfilled, return True it the value exists.  False if the value does not exist.  If promise is rejected, return error.
             */
            SISMEMBERSync(key, value){
                return new Promise((resolve, reject) => {
                    // Get list of members
                    client.SISMEMBER(key, value,(err, res) => {
                        if(err){
                            // Handle Error
                            smc.getMessage(1,0,`SISMEMBER Error: \r\nkey: ${key} value:${value} \r\n${err}`);
                            reject(err);
                        } else {
                            res == 0 ? resolve(false) : resolve(true);                  
                        }
                    });
                });
            },

            /**
             * Synchronous function pulls a list of members from a set as an array
             * @returns {Promise<string[], Error} If promise is fulfilled, return arary of of members in set.  If promise is rejected, return error.
             */
            SMEMBERSSync(key){
                return new Promise((resolve,reject) => {
                    client.SMEMBERS(key, (err, res) => {
                        if(err){
                            smc.getMessage(1,0,`SMEMBERSSync Error: ${err}`);
                            reject(err);
                        } else {
                            resolve(res);
                        }
                    });
                });
            },

            /**
             * Synchronous function deletes a member from a set.
             * @param {string} key Name of set in Redis.
             * @param {string} value Value that will be deleted.
             * @returns {Promise<boolean, Error>} If promise is fulfilled, return if the  
             */
            SREMSync(key, value){
                return new Promise((resolve, reject) => {
                    client.SREM(key, value, (err, res) => {
                        if(err){
                            smc.getMessage(1,0,`SRemSync Error: ${err}`)
                            reject(err);
                        } else {
                            res == 0 ? resolve(false) : resolve(true);
                        }
                    });
                });
            },

        // Hash
            // Delete Fields
                HDELSync(key, field){
                    return new Promise((resolve, reject) => {
                        client.HDEL(key, field, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HDEL Error: ${err}`);
                                reject(err);
                            } else {
                                res == 0 ? resolve(false) : resolve(true);
                            }
                        });
                    });
                },

            // Key Exists
                HEXISTSSync(key, field){
                    return new Promise((resolve, reject) => {
                        client.HEXISTS(key, field, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HEXISTS Error: ${err}`);
                                reject(err);
                            } else {
                                res == 0 ? resolve(false) : resolve(true);
                            }
                        });
                    });
                },
            
            // Get Value
                HGETSync(key, field){
                    return new Promise((resolve, reject) => {
                        client.HGET(key, field, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HGET Error: ${err}`);
                                reject(err);
                            } else {
                                resolve(res);
                            }
                        });
                    });
                },

            // Get All Values
                HGETALLSync(key){
                    return new Promise((resolve, reject) => {
                        client.HGETALL(key, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HGETALL Error: ${err}`);
                                reject(err);
                            } else {
                                resolve(res);
                            }
                        });
                    });
                },    

            // Get List of Keys
                HKEYSync(key){
                    return new Promise((resolve, reject) => {
                        client.HKEYS(key, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HKEYS Error: ${err}`);
                                reject(err);
                            } else {
                                resolve(res);
                            }
                        });
                    });
                },

            // Hash Length
                HLENSync(key){
                    return new Promise((resolve, reject) => {
                        client.HLEN(key, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HLEN Error: ${err}`);
                                reject(err);
                            } else {
                                resolve(res);
                            }
                        });
                    });
                },

            // Add Hash/Field
                HSETSync(key, field, value){
                    return new Promise((resolve, reject) => {
                        client.HSET(key, field, value, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HSET Error: ${err}`);
                                reject(err);
                            } else {
                                res == 0 ? resolve(false) : resolve(true);
                            }
                        });
                    });
                },

                HSETNXSync(key, field, value){
                    return new Promise((resolve, reject) => {
                        client.HSETNX(key, field, value, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HSETNX Error: ${err}`);
                                reject(err);
                            } else {
                                res == 0 ? resolve(false) : resolve(true);
                            }
                        });
                    });
                },

            // Get List of Values
                HVALSync(key){
                    return new Promise((resolve, reject) => {
                        client.HVALS(key, (err, res) => {
                            if(err){
                                smc.getMessage(1,0,`HVAL Error: ${err}`)
                                reject(err);
                            } else {
                                resolve(res);
                            }
                        });
                    });
                }
}

// Module Local Functions
    /**
     * Function updates local object that stores information about the Redis DB.  This is
     * designed to be used to monitor the DB and allow for more advanced analysis of events from the db
     * 
     */
    function getStatus(callback){

        // Server - redis_version, tcp_port,uptime_in_seconds,updtime_in_days
        client.INFO('server',function(err, data){
            if(err){ response(err,null); }
            data = data.split("\n");
            redis_stats.redis_version = data[1].split(":")[1].trim();
            redis_stats.port = data[11].split(":")[1].trim();
            redis_stats.uptime.seconds = data[12].split(":")[1].trim();
            redis_stats.uptime.days = data[13].split(":")[1].trim();
            _getClients();
        });
        
        // Clients - connected_clients
        function _getClients() {
            client.INFO('clients', function(err, data){
                if(err){ response(err,null); }

                data = data.split("\n");
                redis_stats.clients_connected = data[1].split(":")[1].trim();
                _getPersis();
            });
        }


        // Persistence - rdb_changes_since_last_save, rdb_bgsave_in_progress, rdb_last_save_time
        function _getPersis(){
            client.INFO('persistence', function(err, data){
                
                if(err){ response(err,null); }

                data = data.split("\r\n");
                // rdb_last_save_time
                var date = new Date(0);
                date.setUTCSeconds(data[4].split(":")[1]);
                redis_stats.storage.db_last_save = date;
                // rdb_chagnes_since_last_save
                redis_stats.storage.db_changes = data[2].split(":")[1];
                // rdb_bgsave_in_progress
                data[3].split(":")[1] == 0 ? redis_stats.storage.db_save_status = "idle" : redis_stats.storage.db_save_status = "saving"; 
                // aof_enabled
                data[8].split(":")[1] == 1 ? redis_stats.storage.logs_enabled = true : redis_stats.storage.logs_enabled = false;
                // aof_rewrite_in_progress
                data[9].split(":")[1] == 1 ? redis_stats.storage.log_status = "saving" : redis_stats.storage.log_status = "idle";
            
                response(null, redis_stats);
            });
        }

        // Function handles callback if there is a callback.  If there is no callback
        // in the function in the call.
        function response(err, data){
            if(typeof callback === "function"){ return callback(err, data); }
            else { return err != null ? err : "OK"; }
        }

    } 

    /**
     * Method updates information about Redis, as well as forces a save if it has been
     * longer than 15 minutes
     */
    function refresh(){
        getStatus(function(err, data){
            // Get time since last save in minutes
            var savediff = Math.ceil(getDateDiff(new Date(data.storage.db_last_save), new Date()) / timeCalc[1] );

            // Get number of changes to DB
            var changes = data.storage.db_changes;

            if(DEBUG){  
                smc.getMessage(4,null,`Database Refresh`);
                smc.getMessage(4,null,`DateDiff Time Between: ${ savediff } minutes`);
                smc.getMessage(4,null,`DB Changes: ${changes}`);

                smc.getMessage(4,null,`Redis Stats: \n${JSON.stringify(redis_stats)}`);
            }

            // Backup Database if more than 15 minues has passed or 5 or more changes have been made to the db
            if(savediff > (db_save_rate) || changes > 5 ){
                // Update Dynamic Save Values
                changes > 5 ? db_save_update-- : db_save_update++;
                switch(db_save_update){
                    case -2:
                        // Miniumum save rate is every one minute
                        db_save_rate == 1 ? db_save_rate = 1 : db_save_rate--;
                        writeToConfig();
                        break;
                    case 2:
                        // Maximum save rate is every 60 minutes
                        db_save_rate == 60 ? db_save_rate = 60 : db_save_rate++;
                        writeToConfig();
                        break;
                }
                smc.getMessage(1,6,"Database Backup Started")
                client.BGSAVE(function(err, res){
                    if(err){ smc.getMessage(1,5,`Error Backing Up Redis: ${err}`); }
                    else { smc.getMessage(1,6,"Backup Complete"); }
                });
            }
        });

        // Function calculates the difference between 2 date objects by comparing the objects milliseciond conversion of valueOf()
        function getDateDiff( date1, date2 ){
            if(date1 instanceof Date && date2 instanceof Date){
                var d1 = date1.valueOf(), d2 = date2.valueOf();
            
                return d2 - d1;
            }
            else { return 0; }
        }

        function writeToConfig(){
            fs.readFile(redis_config,"UTF8",function(err, data){
                if(err){ smc.getMessage(1,5,`Error reading config for update: ${err}`); }
                else {
                    var conf = JSON.parse(data);
                    conf['db_save_rate'] = db_save_rate;
                    db_save_update = 0;
                    fs.writeFile(redis_config,JSON.stringify(conf),function(err){
                        if(err){ smc.getMessage(1,5,`Error updating config: ${err}`) }
                        else { smc.getMessage(1,7,`Redis_Config updated: db_save_rate ${db_save_rate} minutes`) }
                    });
                }
            });
        }
    }

// Notes
    /*
        Data:
            Data(keys) are tied to the user by a user email.  Users create new key via a static file page with request form.

            OAuth Players: User, Server Admin, Server, User App

            OAuth Path:
                1) New Client: 
                    1) User would like to store data on server.  
                    2) User Makes request for client access. 
                    3) Server recieves request, adds to queue for Server Admin
                    4) Server Admin approves client request
                    5) Server sends client info to user
                2) New Datastore
                    1) Client login to client portal
                    2) Client fills out form and submits request
                        - User Entered Information: Project Name, Password, Delete Date
                    3) Server recieves request, adds to queue for Server Admin
                    4) Server Admin approves request
                    5) Server sends client project key info - Info also available in the user portal
                3) Manipulate Datastore
                    1) User App sends request for users data with token recieved from new datastore setup
                    2) Server Authenticates Token
                        - Tokens are valid for 60 days
                        - Each time an active token is used, the expiration is reset
                        - After 60 days of inactivity the token is listed as inactive
                        - After 180 days of inactivity the token and datastore are archived
                    3) Server serves users data


        Redis Storage Structure:
            * OAuth Information *
            1) client_req : - Requsts are stored as stringafied json objects that will include information on the requster.  This list is for providers or applications who are looking to pull user data   
                [ 
                    <requestID> : {
                        "status" : <number>, - Status of request.  1 = pending, 0 = approved, -1 = denied
                        "req_date" : <number>, - Millisecond Value Representing the date the request
                        "info" : {
                            "client_name" : <string>, - Client's Name
                            "client_email" : <string>, - Client's Email Address
                            "client_password": <string>, - Client's Password
                        }  
                    } 
                ],
            2) reg_clients : - List of registered clients (Hash)
                [ 
                    <clientGUID> : {  - JSON string of client info
                        "security" : { "password" : <string>, "salt" : <string> }, 
                        "access" : [ <string> ], - List of data available to client with user permission
                        "tokens" : [ <string> ] - List of tokens client is currently using
                    } 
                ],  
            3) tokens : [- List of active tokens (Hash)
                    <token> : { - JSON String of token info
                        "key" : <string>,
                        "password" : <string>
                        "expiration" : <number>
                    }
                ],

            4) data_req : [ - List of requests for data store allocation
                <request> : { - JSON String of project request info
                    "status" : <number>, - Status of request.  1 = pending, 0 = approved, -1 = denied
                    "req_date" : <number>, - Millisecond Value Representing the date the request
                        "info" : {
                            "clientGUID" : <string>, - GUID from client account
                            "project_name" : <string>, - 
                            
                        }
                }
            ],

            ) key_ref : [ <strings> ], - Array of keys that hold data in the db.  
            ) temp_key_ref: [ <strings> ], - Array of keys that have an expiration.  Used to create temporary stores in the Redis DB

            * Data Template *
            n) <128-bit key> : {
                "project_name" : <string>,
                "user_email" : <string>,
                "create_date" : <number>, - Millisecond Value Representing the date the key was created
                "delete_date" : <number>, - Millisecond Value Represending when the key is scheduled to be deleted.  A value of -1 means the key will never be deleted automatically
                "security" : { <json objects> }, - Log of security issues
                "password" : { password: <encrypted password>, salt : <string> }, - Password for database
                "root" : { <json> } - Users data
            }

    */