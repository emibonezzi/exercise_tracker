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
  username: String,
  log: [Object]
})

// create user Model
const UserModel = new mongoose.model('Users', userSchema)

// create Exercises Schema
const exerciseSchema = new mongoose.Schema({
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
const ExerciseModel = new mongoose.model('Exercises', exerciseSchema)


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
        // send response
        res.json({ username: data.username, _id: data._id })
      })
    }
  })
})

// POST endpoint to add exercise
app.post('/api/users/:_id/exercises', function (req, res) {
  // search user
  UserModel.findOne({ _id: req.params._id }).then(data => {
    const userId = data._id
    const userUsername = data.username
    // create exercise 
    let exercise = new ExerciseModel({
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date ? new Date(req.body.date).toDateString() : undefined
    })

    // push exercise in log
    data.log.push(exercise)
    data.save()

    // save exercise and send response
    exercise.save().then(data => {
      res.json({
        username: userUsername,
        description: data.description,
        duration: data.duration,
        date: data.date,
        _id: userId
      })


    }).catch(err => res.send(err.toString()))
  }).catch(err => res.send(err))
})

// GET endpoint to get exercise log
app.get('/api/users/:_id/logs', function (req, res) {
  // search user
  UserModel.findOne({ _id: req.params._id }).then(data => {
    const userId = data._id
    const userUsername = data.username
    // if from parameters is found
    if (req.query.from) {
      console.log('From found')
      //send response with log
      res.json({
        username: userUsername,
        count: data.log.length,
        _id: userId,
        log: [data.log.filter(item => new Date(item.date) >= new Date(req.query.from))]
      })
    } else {
      //send response with log
      res.json({
        username: userUsername,
        count: data.log.length,
        _id: userId,
        log: data.log
      })
    }

  }).catch(err => res.send(err.toString()))
})

// GET endpoint with FROM
app.get('/api/users/:_id/logs/:from?', function (req, res) {
  UserModel.findOne({ _id: req.params._id }).then(data => {
    console.log(req.params.from)
    const userId = data._id
    const userUsername = data.username
    //send response with log
    res.json({
      username: userUsername,
      count: data.log.length,
      _id: userId,
      log: data.log.filter(item => new Date(item.date) < req.query.from)
    })
  }).catch(err => res.send(err.toString()))
})

// GET end point to get all users
app.get('/api/users', function (req, res) {
  UserModel.find().then(data => {
    res.json(data)
  }).catch(error => res.send(error.toString()))
})

// start listener for incoming request
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
