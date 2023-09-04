const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const { application } = require('express')
require('dotenv').config()


// body parsing middleware to handle the POST requests
app.use(bodyParser.urlencoded({ extended: false }))

// connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
})

// create user Schema
const userSchema = new mongoose.Schema({
  username: String
})

// create user Model
const UserModel = new mongoose.model('UserModel', userSchema)

// create exercise Schema
const exerciseSchema = new mongoose.Schema({
  username: String,
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    default: new Date(Date.now()).toDateString()
  }
})

// create exercise Model
const ExerciseModel = new mongoose.model('ExerciseModel', exerciseSchema)

// create log Schema
const logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  _id: String,
  log: [Object]
})

// create log Model
const LogModel = new mongoose.model('LogModel', logSchema)

// cors middleware
app.use(cors())
// static middleware
app.use(express.static('public'))

// homepage endpoint
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// POST endpoint to create user
app.post('/api/users', function (req, res) {
  // search for user
  UserModel.findOne({ username: req.body.username }).then(data => {
    // if user found
    if (data) {
      res.json({ username: data.username, _id: data._id })
    }
    else {
      // if user not found
      // create new user
      let user = new UserModel({
        username: req.body.username
      })
      // save user to DB
      user.save().then(data => {
        console.log('User added!')
        // save user info to use on the log
        const userUsername = data.username;
        const userID = data._id
        // create user LOG
        let log = new LogModel({
          username: userUsername,
          count: 0,
          _id: userID,
          log: []
        })
        // save new LOG to DB
        log.save().then(data => {
          // user saved
          console.log('Log added!')
        })
        // send response
        res.json({ username: data.username, _id: data._id })
      })
    }
  })
})

// POST endpoint to add exercise
app.post('/api/users/:_id/exercises', function (req, res) {
  // search for user
  UserModel.findOne({ _id: req.body[':_id'] }).then(data => {
    const userID = data._id
    const userUsername = data.username
    console.log(req.body.date)
    // if user found
    if (data) {

      // create exercise
      let exercise = new ExerciseModel({
        description: req.body.description,
        duration: Number(req.body.duration),
        date: req.body.date ? new Date(req.body.date).toDateString() : undefined
      })

      // add exercise into user's log
      LogModel.findOne({ username: userUsername }).then(data => {
        // push exercise into log array
        data.log.push({
          exercise
        })

        // increase count
        data.count += 1

        // save edits
        data.save().then(data => {
          console.log('Exercise added to log!')
        })

      })

      // add exercise to db
      exercise.save().then(data => {
        console.log("Exercised saved!")

        res.json({
        _id: userID,
        username: userUsername,
        date: new Date(data.date).toDateString(),
        duration: Number(req.body.duration),
        description: req.body.description
      })
    })
    }
    else {
      // if user found
      res.json({ error: 'user not found' })
    }
  })

})


// GET endpoint to get exercise log
app.get('/api/users/:_id/logs', function (req, res) {
  UserModel.findOne({ _id: req.params._id }).then(data => {
    // if user found
    const userUsername = data.username
    const userId = data._id
    if (data) {
      // check for user log
      LogModel.findOne({ username: userUsername }).then(data => {
        res.json({
          _id: userId,
          username: userUsername,
          count: data.count,
          log: data.log
        })
      })
    }
    else {
      res.json({ error: 'user not found' })
    }
  })
})

// GET endpoint for single user
app.get('/api/users/:_id', function (req, res) {
  // search for user
  UserModel.findOne({ _id: req.params._id }).then(data => {
    // if user found
    if (data) {
      res.json({ username: data.username, _id: data._id })
    }
    else {
      // if user not found
      res.json({ error: "user not found" })
    }
  })
})

// GET end point to get all user
app.get('/api/users', function(req, res) {
  UserModel.find().then(data => {
    res.json(data)
  })
})

// start listener for incoming request
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
