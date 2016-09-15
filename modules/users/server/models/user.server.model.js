/* eslint-disable */
'use strict';
// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var path = require('path');
var bcrypt   = require('bcrypt-nodejs');
var jwt = require('jwt-simple');
var cfg = require(path.resolve('./config/config.js'));
var moment = require('moment');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : { type: String },
        password     : { type: String },
		name         : { type: String }
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String,
		picture      : String
    },
    twitter          : {
        id           : String,
        picture      : String,
        name  		 : String,
        username     : String
    },
    google           : {
        id           : String,
        picture      : String,
        email        : String,
        name         : String
    }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// Create JWT 
userSchema.methods.generateJwt = function(){
var payload = {
	
    sub: this._id,
	iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
};
    return jwt.encode(payload,cfg.sessionSecret); // DO NOT KEEP YOUR SECRET IN THE CODE!
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
