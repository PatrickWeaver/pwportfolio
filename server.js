var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

var projects = require("./routes/projects");
var statuses = require("./routes/statuses")
var accounts = require("./routes/accounts");

var mongoose = require("mongoose");

var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;


// Models:
var Project = require("./models/project");
var Status = require("./models/status");
var Account = require("./models/account");


// DB:
var db;

if (process.env.ENV === "stag") {
  console.log("ENV is staging.");
  db = mongoose.connect(process.env.MONGODB_URI);
} else if (process.env.ENV === "prod") {
  console.log("ENV is production.");
  db = mongoose.connect(process.env.MONGODB_URI);
} else {
  console.log("ENV is development.");
  db = mongoose.connect("mongodb://localhost/pwportfolio");
}

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

var port = process.env.PORT || 8000;

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(require("express-session")({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes:
//app.use("/", routes);
app.use("/", projects);
app.use("/statuses/", statuses);
app.use("/u/", accounts);

passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (process.env.ENV === "dev") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  message = err.message;
  res.render("error", {
    message: message,
    error: {}
  });
});

app.listen(port, function() {
  console.log("Running on PORT: " + port);
});

module.exports = app;
