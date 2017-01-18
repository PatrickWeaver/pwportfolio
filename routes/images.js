var express = require("express");
var imageRouter = express.Router({mergeParams: true});
var Project = require("../models/project");
var AWS = require("aws-sdk");
var uuid = require("uuid");
var multer = require("multer");
var memoryStorage = multer.memoryStorage();
var memoryUpload = multer({
	storage: memoryStorage,
	limits: {
		filesize: 20*1024*1024,
		files: 1
	}
}).single("file");
var rand = require("../helpers/rand");
var validate = require("../helpers/validate");
var general = require("../helpers/general");
var md = require("marked");

imageRouter.get("/:imageOrder/make-cover", function(req,res,next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project){
				newCover = req.params.imageOrder;
				for (i = 0; i < project.images.length; i++){
					image = project.images[i];
					if (parseInt(image.order) === parseInt(newCover)){
						image.cover = true;
					} else {
						image.cover = false;
					}
				}
				project.save(function(err, project, numAffected) {
					if (err) {
						console.log(err);
						next();
					} else {
						res.redirect("/projects/" + req.params.projectSlug);
					}
				});
			}
		});

	} else {
		next();
	}
});

imageRouter.get("/remove-cover/", function(req,res,next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project){
				for (i = 0; i < project.images.length; i++){
					project.images[i].cover = false;
				}
				project.save(function(err, project, numAffected) {
					if (err) {
						console.log(err);
						next();
					} else {
						res.redirect("/projects/" + req.params.projectSlug);
					}
				});
			}
		});

	} else {
		next();
	}
});

imageRouter.get("/upload/", function(req, res, next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {
				res.render("image-upload", {
					title: "Upload image",
					project: project
				});
			}
		});
	} else {
		res.redirect("/projects");
	}
});

imageRouter.post("/upload/", memoryUpload, function(req, res, next) {
	var file = req.file;
	var cover = false;
	if (req.body.cover === "on") {
		cover =  true;
	}
	var order = req.body.order;
	var caption = req.body.caption;
	console.log("cover: " + cover + ", order: " + order);
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {
				if (!req.file) {
					return res.status(403).send("No files uploaded");
				}
				if (!/^image\/(jpe?g|png|gif)$/i.test(file.mimetype)) {
			        return res.status(403).send('expect image file');
				}
				filetype = file.mimetype;
				var s3 = new AWS.S3();
				var bucketName = process.env.AWS_BUCKET;
				var keyName = makeid() + "-" + file.originalname;

				s3.createBucket({
					Bucket: process.env.AWS_BUCKET
				}, function() {
					var params = {
						Bucket: bucketName,
						Key: keyName,
						Body: file.buffer,
						ContentType: filetype
					};

					s3.putObject(params, function(err, data) {
						if (err) {
							console.log(err);
						} else {
							for (d in data){
								console.log("DATA: " + d + " - " + data[d]);
							}
							images = [];
							if (order > project.images.length) {
								order = project.images.length;
							}
							bump = false;
							for (j in project.images) {
								if (cover){
									if (project.images[j].cover){
										project.images[j].cover = false;
									}
								}
								if (parseInt(order) === parseInt(project.images[j].order)){
									project.images[j].order++;
									bump = true;
								} else if (bump) {
									project.images[j].order++;	
								}
							}
							imageData = {
								caption: caption,
								order: order,
								cover: cover,
								url: "https://" + bucketName + ".s3.amazonaws.com/" + keyName
							}
							images.push(imageData);
							project.images.push(imageData);
							project.images.sort(function(a,b){
								return a.order - b.order;
							})
							project.save(function (err, savedProject) {
								if (err) {
									res.status(500).send(err);
								} else {
									res.status(201);
									res.redirect("/projects/" + project.slug);
								}
							});

						};
					});
				});
			}
		});
	} else {
		res.redirect("/projects");
	}
});

imageRouter.get("/order/", function(req, res, next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {
				res.render("image-order", {
					title: "Image order: " + project.name,
					project: project
				})
			} else {
				next();
			}
		});
	} else {
		next()
	}
});


imageRouter.post("/order/", function(req,res,next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project){
				orders = req.body;
				numberOfImages = project.images.length - 1;
				takenOrders = [];
				var newOrder;

				for (o = 0; o < orders.images.length; o++){
					if (orders.images[o] > numberOfImages) {
						orders.images[o] = numberOfImages;
					}
					project.images[o].order = checkSameOrder(takenOrders, parseInt(orders.images[o]), numberOfImages);
				}

				project.images.sort(function(a,b){
					return a.order - b.order;
				})

				project.save(function(err, project, numAffected) {
					if (err) {
						console.log(err);
						next();
					} else {
						res.redirect("/projects/" + req.params.projectSlug);
					}
				});
			}
		});

	} else {
		next();
	}
});


imageRouter.get("/:imageOrder/view/", function(req, res, next) {
	Project.findOne({ slug: req.params.projectSlug }, function(err, project){
		if (err) {
			res.status(500).send(err);
		} else if (project){
			image = project.images[parseInt(req.params.imageOrder)]
			title = project.name
			res.render("image", {
				title: title,
				project: project,
				image: image
			});
		} else {
			next();
		}
	});
});

imageRouter.get("/:imageOrder/delete/", function(req, res, next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {
				found = false;
				var deleteId;
				for (i = 0; i < project.images.length; i++){
					image = project.images[i];
					if (parseInt(image.order) === parseInt(req.params.imageOrder)) {
						deleteId = image._id;
					} else if (parseInt(image.order) > parseInt(req.params.imageOrder)){
						image.order--;
					}
				}
				project.images.id(deleteId).remove();
				// There seems to be a bug here where validation throws an error for the Image that was deleted because it doesn't have an order (which is required)
				// Calling validate() on Project somehow makes it save ok, but logs the error to the console. save() then doesn't throw (the same) error it would have if we hadn't called validate().
				//https://github.com/Automattic/mongoose/issues/2344
				project.validate(function(err) {console.log(err)})
				project.save(function (err, project, numAffected) {
					if (err) {
						console.log(err);
					} else {
						res.redirect("/projects/" + req.params.projectSlug);
					}
				});
				
			}
		});
	} else {
		next();
	}
});

module.exports = imageRouter;
