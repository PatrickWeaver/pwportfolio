var express = require("express");
var router = express.Router();
var Project = require("../models/Project");
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

			projectTemplate = checkProject(req.body);

			project = new Project(projectTemplate);
			project.save();
			res.status(201);
			res.redirect("/projects/" + project.slug);
		}
	} else {
		res.redirect("/projects/");
	}
})

router.get("/:projectSlug", function(req, res, next) {	
	Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
		if (err) {
			res.status(500).send(err);
		} else if (project) {
			if (project.active || req.user){
				cover = "";

				for (i in project.images) {
					if (project.images[i].cover) {
						cover = project.images[i].url;
						break;
					}
				}

				res.render("project", {
					title: project.name,
					user: req.user,
					project: project,
					cover: cover,
					md: md
				});
			} else {
				next();
			}
		} else {
			next();
		}
	});
});

router.get("/:projectSlug/edit/", function(req, res, next) {
	if (req.user) {
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {

				res.render("edit-project", {
					user: req.user,
					title: "📝 Edit: " + project.name,
					project: project
				})
			}
		});
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

router.get("/:projectSlug/edit/", function(req, res, next) {
	if (req.user) {
		if (!req.body.name) {
			res.status(400);
			res.send("Name is required");
		} else if (!req.body.slug) {
			res.status(400);
			res.send("Slug is required");
		} else {
			projectTemplate = checkProject(req.body);

			Project.findOneAndUpdate({ slug: req.params.projectSlug }, projectTemplate, { new: false }, function(err, project) {
				if (err) {
					res.status(500).send(err);
				} else if (project) {
					res.status(201);
					res.render("project", {
						title: project.name,
						user: req.user,
						project: project,
						cover: cover,
						md: md
					});
				}
			});
		}
	} else {
		next();
	}
});

router.get("/:projectSlug/toggle/:state/", function(req, res, next) {
	if (req.user) {

		Project.findOneAndUpdate({ slug: req.params.projectSlug }, { active: (req.params.state === "true" ? true : false) }, { new: true }, function (err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {
			console.log("REQ: " + req.params.state);
			console.log("PROJ: " + project.active)

			res.redirect("/projects/")
			}
		})
	} else {
		next();
	}
});


router.get("/:projectSlug/delete/", function(req, res, next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {

				cover = findCover(project);

				res.render("delete-yes-for-sure", {
					title: "🗑 Delete: " + project.name,
					user: req.user,
					project: project,
					cover: cover
				});
			}
		});
	} else {
		res.redirect("/projects/");
	}
});

router.post("/:projectSlug/delete/yes-for-sure", function(req, res, next) {
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

router.get("/:projectSlug/image/:imageOrder/make-cover", function(req,res,next) {
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

router.get("/:projectSlug/remove-cover", function(req,res,next) {
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

router.get("/:projectSlug/upload-image/", function(req, res, next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project) {
				res.render("upload-image", {
					title: "Upload image",
					project: project
				});
			}
		});
	} else {
		res.redirect("/projects");
	}
});

router.post("/:projectSlug/upload-image/", memoryUpload, function(req, res, next) {
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

router.get("/:projectSlug/image/:imageOrder/", function(req, res, next) {
	Project.findOne({ slug: req.params.projectSlug }, function(err, project){
		if (err) {
			res.status(500).send(err);
		} else if (project){
			res.render("image", {
				title: "Image from: " + project.name,
				project: project,
				image: project.images[parseInt(req.params.imageOrder)]
			});
		} else {
			next();
		}
	});
});

router.get("/:projectSlug/image-order/", function(req, res, next) {
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
	}
});

router.post("/:projectSlug/image-order/", function(req,res,next) {
	if (req.user){
		Project.findOne({ slug: req.params.projectSlug }, function(err, project) {
			if (err) {
				res.status(500).send(err);
			} else if (project){
				orders = req.body;

				// This kind of seems like a hack, but it works
				count = 0;
				for (o in orders){
					project.images[count].order = orders[o];
					count++;
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

router.get("/:projectSlug/image/:imageOrder/delete/", function(req, res, next) {
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

module.exports = router;
