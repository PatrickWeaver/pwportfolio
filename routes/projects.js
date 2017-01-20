var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Project = require("../models/project");
var Status = require("../models/status");
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
var imageRoutes = require("./images");
var moment = require("moment");
moment().format();

router.use("/:projectSlug/images/", imageRoutes);
var imageRouter = express.Router({mergeParams: true});


/* GET projects listing. */

router.get("/", function(req, res, next) {
	var query = {};
	var status = "";
	if (req.query.tags){
		query.tags = req.query.tags;
	}
	if (req.query.status){
		status = req.query.status;
	}
	Project.find(query)
	.populate("status")
	.exec(function(err, projects) {
		if (err) {
			res.status(500).send(err);
		} else {
			var returnProjects = [];
			projects.forEach(function(project, index, array) {
				pushProject = function(){
					cover = findCover(project);
					var newProject = project.toJSON();
					newProject.cover = cover;
					returnProjects.push(newProject);
				}
				if (status){
					if (status.toLowerCase() === project.status.name.toLowerCase()){
						pushProject();
					}
				} else {
					pushProject();
				}
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

		Status.find(function(err, statuses) {
			if (err) {
				res.status(500).send(err);
			} else {
				res.render("project-new", {
					user : req.user,
					title: "New Project",
					statuses: statuses
				});
			}
		});
	} else {
		next();
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
			project.save( function (err, project) {
				if (err){
					res.send("EEP!" + err)
				} else {
					res.status(201);
					res.redirect("/projects/" + project.slug);
				}
			});
		}
	} else {
		res.redirect("/projects/");
	}
});

router.get("/:projectSlug", function(req, res, next) {	
	Project.findOne({ slug: req.params.projectSlug })
	.populate("status")
	.exec(function(err, project) {
		if (err) {
			res.status(500).send(err);
		} else if (project) {
			if (project.active || req.user){
				cover = findCover(project);

				res.render("project", {
					title: project.name,
					user: req.user,
					project: project,
					cover: cover,
					md: md,
					moment: moment
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
				Status.find(function(err, statuses) {
					if (err) {
						res.status(500).send(err);
					} else {

						res.render("edit-project", {
							user: req.user,
							title: "📝 Edit: " + project.name,
							project: project,
							statuses: statuses
						})
					}
				});
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

router.post("/:projectSlug/edit/", function(req, res, next) {
	if (req.user) {
		if (!req.body.name) {
			res.status(400);
			res.send("Name is required");
		} else if (!req.body.slug) {
			res.status(400);
			res.send("Slug is required");
		} else {
			projectTemplate = checkProject(req.body);

			Project.findOneAndUpdate({ slug: req.params.projectSlug }, projectTemplate, { new: true }, function(err, project) {
				if (err) {
					res.status(500).send(err);
				} else if (project) {
					res.status(201);
					res.redirect("/projects/" + project.slug + "/")
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
		next();
	}
});

module.exports = router;
