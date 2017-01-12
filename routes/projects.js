var express = require("express");
var router = express.Router();
var Project = require("../models/project");
var AWS = require("aws-sdk");
var uuid = require("uuid");
var Datauri = require("datauri");
var multer = require("multer");
var memoryStorage = multer.memoryStorage();
var memoryUpload = multer({
	storage: memoryStorage,
	limits: {
		filesize: 20000000,
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

router.get("/upload/", function(req, res, next) {
	res.render("upload", {
		title : "Upload image"
	});
});

router.post("/upload/", memoryUpload, function(req, res, next) {
	var s3 = new AWS.S3();
	var bucketName = process.env.AWS_BUCKET;
	var keyName = makeid() + "-" + req.file.originalname;
	var datauri = new Datauri();

	datauri.pipe(process.stdout);
	datauri.encode(req.file);

	s3.createBucket({
		Bucket: process.env.AWS_BUCKET
	}, function() {
		var params = {
			Bucket: bucketName,
			Key: keyName,
			Body: datauri.content
		};
		s3.putObject(params, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				console.log("Successfully uploaded to: " + bucketName + "/" + keyName);
				res.send("<img src='https://" + bucketName + ".s3.amazonaws.com/" + keyName + "'>");
			}
		});
	});
});




/*

router.post("/upload", upload.single("file"), function(req, res, next){
   console.log("/// ----------- Upload");
   console.log(req.file);
   console.log("../uploads");
   if(!req.file) {
      return res.render("upload", {
      	title : "Upload Image",
      	message : {
      		type: "danger",
      		messages : [ "Failed uploading image. 1x001"]
      	}
      });
   } else {
    fs.rename(req.file.path, "../uploads/" + req.file.originalname, function(err){
      if(err){
        return res.render("upload", {
        	title : "Upload Image",
        	message : {
        		type: "danger",
        		messages : [ "Failed uploading image. 1x001"]
        	}
        });
      } else {
        //pipe to s3
        AWS.config.update({
        	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        var fileBuffer = fs.readFileSync("../uploads/" + req.file.originalname);
        console.log(fileBuffer);
        var s3 = new AWS.S3();
        var s3_param = {
           Bucket: process.env.AWS_BUCKET,
           Key: req.file.originalname,
           //Expires: 60,
           ContentType: req.file.mimetype,
           ACL: "public-read",
           Body: fileBuffer
        };
        s3.putObject(s3_param, function(err, data){
          if(err){
            console.log("S3 putObject Error: " + err);
          } else {
            var return_data = {
               signed_request: data,
               url: "https://" + process.env.AWS_BUCKET + ".s3.amazonaws.com/" + req.file.originalname
               
            }; 
            console.log("return data - ////////// --------------");
            console.log(return_data);
            return res.render("upload", {
            	data : return_data,
            	title : "Upload Image : success",
            	message : {
             		type: 'success',
             		messages : [ 'Uploaded Image']
            	}
          	});
          }
        });  
      }
    })
   }
});
*/

module.exports = router;
