var express = require("express");
var passport = require("passport")	
//var Account = require("../models/Account");
var router = express.Router();


router.get("/", function (req, res) {
    res.render("u", { user : req.user });
});

router.post("/", passport.authenticate("local"), function(req, res) {
	res.redirect("/u/");
});

router.post("/new/", function(req, res) {
	if (req.body.key === process.env.KEY) {
		Account.register(new Account({ username: req.body.username }), req.body.password, function(err, account) {
			if (err) {
				console.log("Error: " + err);
				return res.render("u", { account : account });
			}
			passport.authenticate("local")(req, res, function() {
				res.redirect("/");
			});
		});
	} else {
		res.send("invalid key");
	}
});

router.post("/logout/", function(req, res) {
	req.logout();
	res.redirect("/");
});

module.exports = router;
