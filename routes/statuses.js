var express = require("express");
var router = express.Router();
var Status = require("../models/status");


router.get("/new/", function(req, res, next) {
	if (req.user) {
		res.render("status-new", {
			user : req.user,
			title: "New Status"
		})
	} else {
		next();
	}
});

router.post("/new/", function(req, res, next) {
	if (req.user) {
		if (!req.body.name) {
			res.status(400);
			res.send("Name is required");
		} else if (!req.body.color) {
			res.status(400);
			res.send("Color is required");
		} else {
			parameters = {};
			parameters.name = req.body.name;
			parameters.color = req.body.color;
			status = new Status(parameters);
			status.save();
			res.status(201);
			res.redirect("/statuses/");
		}
	} else {
		next();
	}
})

router.get("/:statusName", function(req, res, next) {
	if (req.user){
		Status.findOne({ name: req.params.statusName }, function(err, status) {
			if (err) {
				res.status(500).send(err);
			} else if (status) {
				res.render("status", {
					title: status.name,
					user: req.user,
					status: status
				});
			} else {
				next();
			}
		});
	} else {
		next();
	}
});

router.post("/:statusName/edit/", function(req, res, next) {
	if (req.user) {
		if (!req.body.name) {
			res.status(400);
			res.send("Name is required");
		} else if (!req.body.color) {
			res.status(400);
			res.send("Color is required");
		} else {
			parameters = {};
			parameters.name = req.body.name;
			parameters.color = req.body.color;

			Status.findOneAndUpdate({ name: parameters.name }, parameters, { new: false }, function(err, status) {
				if (err) {
					res.status(500).send(err);
				} else if (status) {
					res.status(201);
					res.redirect("/statuses/");
				}
			});
		}
	} else {
		next();
	}
});

router.get("/:statusName/delete/", function(req, res, next) {
	if (req.user) {
		if (!req.params.statusName) {
			res.status(400);
			res.send("Name is required");
		} else {
			parameters = {};
			parameters.name = req.params.statusName;
			Status.findOne({ name: parameters.name }, function(err, status) {
				if (err) {
					res.status(500).send(err);
				} else if (status) {
					status.remove();
					res.status(201);
					res.redirect("/statuses/");
				}
			});
		}
	} else {
		next();
	}
});

router.get("/", function(req, res, next) {
	if (req.user){
		var query = {};
		if (req.query.name){
			query.tags = req.query.name;
		}
		Status.find(query, function(err, statuses) {
			if (err) {
				res.status(500).send(err);
			} else {
				var returnStatuses = [];
				statuses.forEach(function(status, index, array) {
					var newStatus = status.toJSON();
					returnStatuses.push(newStatus);
				});
				res.render("statuses", {
					title: "Project Statuses",
					user : req.user,
					statuses: returnStatuses
				});
			}
		});
	} else {
		next();
	}
});



module.exports = router;