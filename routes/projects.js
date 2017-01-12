var express = require("express");
var router = express.Router();
var Project = require("../models/Project");
var Image = require("../models/Image");
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


/* GET projects listing. */

router.get("/", function(req, res, next) {
	Project.find(function(err, projects) {
		if (err) {
			res.status(500).send(err);
		} else {
			var returnProjects = [];
			projects.forEach(function(element, index, array) {
				var newProject = element.toJSON();
				returnProjects.push(newProject);
			});
			console.log(returnProjects);
			res.render("projects", {
				title: "All Projects",
				 user : req.user,
				projects: returnProjects
			});
		}
	});
});

router.get("/new/", function(req, res, next) {
	if (req.user) {
		res.render("new-project", {
			user : req.user
		})
	} else {
		res.status(404);
		err = new Error("Not Found");
		message = err.message;
  	err.status = 404;
		res.render("error", {
			message: message,
			error: {}
		});

	}
});

router.post("/new/", function(req, res, next) {
	if (req.user) {
		if (!req.body.name) {
			res.status(400);
			res.send("Name is required");
		} else if (!req.body.slug) {
			res.status(400);
			res.send("Slug is required");
		} else {
			project = new Project(req.body);
			project.save();
			res.status(201);
			res.redirect("/projects/" + project.slug);
		}
	} else {
		res.redirect("/projects" + project.slug);
	}
})

router.get("/:projectSlug", function(req, res, next) {
	console.log("ProjectSlug");
	Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
		if (err) {
			res.status(500).send(err);
		} else if (project) {
			res.render("project", {
				title: project.name,
				user : req.user,
				project: project
			});
		} else {
			next();
			//res.status(404).send("404");
		}
	});
});

router.post("/:projectSlug/delete/", function(req, res, next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {
				project.remove();
				res.redirect("/projects/");
			}
		});
	} else {
		res.redirect("/projects");
	}
});

router.get("/:projectSlug/upload/", function(req, res, next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {
				res.render("upload", {
					title: "Upload image",
					project: project
				});
			}
		});
	} else {
		res.redirect("/projects");
	}
});

router.post("/:projectSlug/upload/", memoryUpload, function(req, res, next) {
	var file = req.file;
	var cover = false;
	if (req.body.cover === "on") {
		cover =  true;
	}
	var order = req.body.order;
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
							imageData = {
								project: project,
								caption: "",
								order: order,
								url: "https://" + bucketName + ".s3.amazonaws.com/" + keyName
							}

							image = new Image(imageData);
							image.save()

							if (cover) {
								project.cover = image;
							}
							project.images.push(image);
							project.save();
							res.status(201);
							res.redirect("/projects/" + project.slug);

						}
					});
				});
			}
		});
	} else {
		res.redirect("/projects");
	}
});

module.exports = router;
