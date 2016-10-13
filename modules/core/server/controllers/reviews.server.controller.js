/* eslint-disable */
'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  async = require('async'),
  Review = mongoose.model('Review'),
  Topic = mongoose.model('Topic'),
  User = mongoose.model('User'),
  _ = require('lodash');
  
  var topics = require('../controllers/topics.server.controller');

/**
 * Create a Review
 */
exports.create = function (req, res) {
var averageRating = 0;
var totalRating = 0;
var ratingCount = 0;
var userId = req.user;
var userName = '';
var review = new Review(req.body);
	async.series([
		function(callback){ 
			async.parallel([
				function(callback){
				 getUserName(userId, function(err, userName) {
                        if (err) return callback(err);
                        review.reviewerId= userId;
						review.reviewerName = userName;
                        callback();
                    });	
			
	},
		function(callback){ 
				averageRating=req.topic.avgRating;
				console.log("Current Avg Rating of TopicId="+req.topic._id+" is "+averageRating);
				console.log("Fetching Reviews Count by TopicId= "+req.topic._id);
			Review.count({ownerTopicId: req.topic._id}, function(err, count){
			if (err) {
				console.log("error",err);
				}
			else{	
				ratingCount = count;
				console.log( "Number of Count: ", ratingCount );
				totalRating = averageRating * ratingCount;	
				console.log("Total Rating:"+totalRating);
				totalRating+=req.body.rating;
				console.log( "Updated TotalRating: ", totalRating );
				ratingCount+=1;
				console.log( "Updated Count: ", ratingCount );
				averageRating=totalRating/ratingCount;
				console.log( "Updated avgRating: ", averageRating );
				callback();
			}
		});		
	}], callback);
	 },
	function(callback){
		async.parallel([
		function(callback){
		var update = { $set: { avgRating: averageRating }};
		Topic.findByIdAndUpdate(req.topic.id, update , function (err, topic) {
		if (err) {
			return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
			});				
			}
			callback();
				
		});
	},
	function(callback){
		review.save(function(err) {
				if (err) {
					console.log(err);
					return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			  }
				else{
					callback();
				}
			});
	}],callback);			
	}		 
], function(err){
		if (err) {
			return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
			});				
			}
		res.status(201).json(review);		
	});

};

/**
 * Show the current Review
 */
exports.read = function (req, res) {
	res.json(req.review);
};

/**
 * Update a Review
 */
exports.update = function (req, res) {
var review = req.review;

	review = _.extend(review, req.body);

	review.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(review);
		}
	});
};

/**
 * Upvote a Review
 */
exports.upvote = function (req, res) {
var review = req.review;

	review.upvotes+=1;

	review.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(review);
		}
	});
};

/**
 * Delete an Review
 */
exports.delete = function (req, res) {
var review = req.review;

	review.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(review);
		}
	});
};

/**
 * List of Reviews
 */
exports.list = function (req, res) {
Review.find().exec(function(err, reviews) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(reviews);
		}
	});
};
	
/**
 * Review middleware
 */
exports.reviewByID = function(req, res, next, id) {

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).send({
			message: 'Review is invalid'
		});
	}

	Review.findById(id).exec(function(err, review) {
		if (err) return next(err);
		if (!review) {
			return res.status(404).send({
  				message: 'Review not found'
  			});
		}
		req.review = review;
		next();
	});	
};


function getUserName(id, callback) {
	console.log("Searching user by UserId:"+id);
	var userName = '';
    User.findById(id).exec(function(err, user) {
					if (err) return callback(err);
					//Check that a user was found
				if(user.local) userName = user.local.name;
				else if(user.facebook) userName= user.facebook.name;
				else if (user.google) userName = user.google.name;			
				console.log("UserDetails:"+ id + " "+ userName);
        callback(null, userName);
    });
}
