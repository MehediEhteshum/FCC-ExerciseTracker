require('dotenv').config();
const express = require('express');
const dateAndTime = require('date-and-time');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
const router = express.Router();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, autoIndex: false });

// check mongoose connection
router.get("/is-mongoose-ok", function(req, res) {
  if (mongoose) {
    res.json({ isMongooseOk: !!mongoose.connection.readyState });
  } else {
    res.json({ isMongooseOk: false });
  }
});

// User schema.
let Schema = mongoose.Schema;
let userSchema = new Schema(
  {
  username: { type: String, required: true },
  count: { type: Number, default: 0 },
  log: { type: [Object], default: [] },
  },
  { versionKey: false }
);

// User model.
let Users = mongoose.model("Users", userSchema);

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// necessary methods for db
const createAndSaveUser = (name, res) => {
  let user = Users({
    username: name
  });
  user.save(function(err, doc) {
    if (err) {
      return console.log(err);
    }
    res.json({ username: doc.username, _id: doc._id });
  });
};

// POST /api/exercise/new-user
let newUserPath = "/api/exercise/new-user";
let newUserPoster = async (req, res) => {
  let name = req.body.username;
  let userExistsInDb = await Users.exists({ username: name });
  if (!userExistsInDb) {
    // if user is not in db, then save in db.
    createAndSaveUser(name, res);
  } else {
    res.send("Username already taken");
  }
};
app.post(newUserPath, newUserPoster);

// Update POST /api/exercise/add;
let addExercisePath = "/api/exercise/add";
let addExercise = async (req, res) => {
  let id = req.body.userId;
  let desc = req.body.description;
  let dur = Number(req.body.duration);
  let date = (req.body.date === "" || req.body.date === undefined) ? new Date() : new Date(req.body.date);
  // if valid id, find user.
  let user = mongoose.Types.ObjectId.isValid(id) ? await Users.findById(id) : false;
  if (isNaN(date)) {
    // if invalid date.
    res.send('Cast to date failed for value "' + req.body.date + '" at path "date"');
  } else if (isNaN(dur)) {
    // if invalid duration.
    res.send('Cast to Number failed for value "' + req.body.duration + '" at path "duration"');
  } else if (user) {
    // if user exists, then update.
    date = dateAndTime.format(date, 'ddd MMM DD YYYY');
    let count = user.count + 1;
    let log = [...user.log];
    log.push({ description: desc, duration: dur, date: date });
    log.sort((a, b) => new Date(b.date) - new Date(a.date)); // present to past
    user.updateOne({ count: count }).exec();
    user.updateOne({ log: log }).exec();
    res.json({ _id: id, username: user.username, date: date, duration: dur, description: desc });
  } else if (user === null) {
    // if no user for the userId.
    res.send("Unknown userId");
  } else {
    // invalid userId.
    res.send('Cast to ObjectId failed for value "' + id + '" at path "_id" for model "Users"');
  }
};
app.post(addExercisePath, addExercise);

// GET /api/exercise/log?{userId}[&from][&to][&limit]
let logPath = "/api/exercise/log?:userId:from?:to?:limit?";
let logGetter = async (req, res) => {
  let id = req.query.userId;
  let fromDate = req.query.from;
  let toDate = req.query.to;
  let limit = req.query.limit;
  // if valid id, find user.
  let user = mongoose.Types.ObjectId.isValid(id) ? await Users.findById(id) : false;
  if (JSON.stringify(req.query) === "{}" || user === null) {
    res.send("Unknown userId");
  } else if (user) {
    // if user exists in db.
    console.log(id, fromDate, toDate, limit);
    let log = [...user.log];
    if (!isNaN(new Date(fromDate))) {
      // if from date is valid
      fromDate = new Date(fromDate);
      log = [...user.log].filter(e => new Date(dateAndTime.transform(e.date, "    MMM DD YYYY", "YYYY-MM-DD")) >= fromDate);
    }
    if (!isNaN(new Date(toDate))) {
      // if to date is valid
      toDate = new Date(toDate);
      log = log.filter(e => new Date(dateAndTime.transform(e.date, "    MMM DD YYYY", "YYYY-MM-DD")) <= toDate);
    }
    if(parseInt(limit)===Number(limit)){
      // if limit is valid Int.
      limit = parseInt(limit);
      log = log.slice(0, limit);
    }
    let count = log.length;
    // posting msg.
    let msg = { _id: user._id, username: user.username, count: count, log: log };
    if(isNaN(new Date(fromDate)) && isNaN(new Date(toDate)) && parseInt(limit)!==Number(limit)){
      res.json(msg);
    } else{
      if(!isNaN(new Date(fromDate))){
        // if form date available
        msg = { _id: user._id, username: user.username, from: dateAndTime.format(fromDate, 'ddd MMM DD YYYY'), count: count, log: log };
      } else if(!isNaN(new Date(toDate))){
        // if to date available
        msg = { _id: user._id, username: user.username, to: dateAndTime.format(toDate, 'ddd MMM DD YYYY'), count: count, log: log };
      }
      if(!isNaN(new Date(fromDate)) && !isNaN(new Date(toDate))){
        // if both date available
        msg = { _id: user._id, username: user.username, from: dateAndTime.format(fromDate, 'ddd MMM DD YYYY'), to: dateAndTime.format(toDate, 'ddd MMM DD YYYY'), count: count, log: log };
      }
      res.json(msg);
    }
  } else {
    // when userId invalid.
    res.send('Cast to ObjectId failed for value "' + id + '" at path "_id" for model "Users"');
  }
};
app.get(logPath, logGetter);

// GET /api/exercise/users
let usersPath = "/api/exercise/users";
let usersGetter = (req, res) => {
  let allUsers = Users.find({}).exec(function(err, results) {
    if (err) console.log(err);
    else res.json(results);
  });
}
app.get(usersPath, usersGetter);

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
