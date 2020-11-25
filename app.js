const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const app = express();
const User = require("./models/user");
const Exercise = require("./models/exercise");

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// POST /api/exercise/new-user
let newUserPath = "/api/exercise/new-user";
let newUserPoster = (req, res, next) => {
  let user = new User(req.body); // req.body = {username: "username"}
  // check if user already exists, if not save.
  User.findOne(req.body, (err, savedUser) => {
    if(err) return next(err);
    if(savedUser){
      // already exists
      return res.send("Username already taken");
    } else{
      // save user in db
      user.save((err, user) => {
        if(err) return next(err);
        return res.json({username: user.username, _id: user._id});
      });
    }
  });
};
app.post(newUserPath, newUserPoster);

// GET /api/exercise/users
let usersPath = "/api/exercise/users";
let usersGetter = (req, res, next) => {
  User.find({}, (err, users) => {
    if(err) return next(err);
    return res.json(users);
  })  
}
app.get(usersPath, usersGetter);

// Update POST /api/exercise/add;
let addExercisePath = "/api/exercise/add";
let addExercise = (req, res, next) => {
  let id = req.body.userId;
  let desc = req.body.description;
  let dur = Number(req.body.duration);
  let date = (req.body.date === "" || req.body.date === undefined) ? new Date() : new Date(req.body.date); // for if-else purpose.
  if(req.body.date === "" || req.body.date === undefined){
    // if empty, date = now.
    req.body.date = new Date().toDateString();
  }
  if (isNaN(date)) {
    // if invalid date.
    return res.send('Cast to date failed for value "' + req.body.date + '" at path "date"');
  } else{
    // if valid date.
    req.body.date = new Date(req.body.date).toDateString();
  }
  if (isNaN(dur)) {
    // if invalid duration.
    return res.send('Cast to Number failed for value "' + req.body.duration + '" at path "duration"');
  } 
  // if valid id, find user.
  User.findOne({_id: id}, (err, user) => {
    if(err) return next(err);
    if (user) {
      // if user exists, then update.
      let exercise = new Exercise(req.body); // req.body = {key: value}
      exercise.save((err, exercise) => {
        if(err) return next(err);
        return res.json({ _id: id, username: user.username, date: exercise.date, duration: dur, description: desc });
      });
    } else{
      // if no user for the userId.
      return res.send("Unknown userId");
    }
  });    
};
app.post(addExercisePath, addExercise);

// GET /api/exercise/log?{userId}[&from][&to][&limit]
let logPath = "/api/exercise/log";
let logGetter = (req, res, next) => {
  let id = req.query.userId;
  let fromDate = req.query.from;
  let toDate = req.query.to;
  let limit = req.query.limit;
  if (JSON.stringify(req.query) === "{}") {
    // if totally empty query
    return res.send("Unknown userId");
  }
  // if valid id, find user.
  User.findOne({_id: id}, (err, user) => {
    if(err) return next(err); // invalid ObjectId
    if(user){
      // if valid id and user in db.
      // load all exercises of the user.
      let exercises = Exercise.find({userId: id}, (err, exercises) => {
        if(err) return next(err);
        if(exercises){
          // if exercises found, can be empty list, then create a log.
          let log = (JSON.stringify(exercises) === "[]")? []:exercises;
          if (!isNaN(new Date(fromDate)) && log!==[]) {
            // if from date is valid
            fromDate = new Date(fromDate);
            log = log.filter(e => new Date(e.date) >= fromDate);
          }
          if (!isNaN(new Date(toDate)) && log!==[]) {
            // if to date is valid
            toDate = new Date(toDate);
            log = log.filter(e => new Date(e.date) <= toDate);
          }
          if(parseInt(limit)===Number(limit) && log!==[]){
            // if limit is valid Int.
            limit = parseInt(limit);
            // log sort: present to past, then slice, map.
            log = log.sort((a, b) => new Date(b.date)-new Date(a.date)).slice(0, limit).map(e => ({
              description: e.description,
              duration: e.duration,
              date: e.date
            }));
          } else{
            // when limit not available, sort log: present to past, map
            log = log.sort((a, b) => new Date(b.date)-new Date(a.date)).map(e => ({
              description: e.description,
              duration: e.duration,
              date: e.date
            }));
          }
          let count = log.length;
          // posting msg.
          let msg = { _id: user._id, username: user.username, count: count, log: log };
          if(isNaN(new Date(fromDate)) && isNaN(new Date(toDate)) && parseInt(limit)!==Number(limit)){
            // if only query is userId
            return res.json(msg);
          } else{
            if(!isNaN(new Date(fromDate))){
              // if from date available
              msg = { _id: user._id, username: user.username, from: fromDate.toDateString(), count: count, log: log };
            } else if(!isNaN(new Date(toDate))){
              // if to date available
              msg = { _id: user._id, username: user.username, to: toDate.toDateString(), count: count, log: log };
            }
            if(!isNaN(new Date(fromDate)) && !isNaN(new Date(toDate))){
              // if both dates available
              msg = { _id: user._id, username: user.username, from: fromDate.toDateString(), to: toDate.toDateString(), count: count, log: log };
            }
            return res.json(msg);
          }
        }
      });
    } else{
      // if valid id format but user not exists in db.
      return res.send("Unknown userId");
    }
  });
};
app.get(logPath, logGetter);

module.exports = app;
