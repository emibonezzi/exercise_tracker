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
  log: {
    type: [Object],
    default: []
  }
})

// create user Model
const UserModel = new mongoose.model('UserModel', userSchema)

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
  // search for user
  UserModel.findOne({ _id: req.params['_id'] }).then(data => {
    //save exercise into user log
    data.log.push({
      description: req.params.description,
      duration: Number(req.params.duration),
      date: req.params.date ? new Date(req.params.date).toDateString() : new Date(Date.now()).toDateString()
    })

    // save edits
    data.save().then(data => {
      const userObj = {
        username: data.username,
        description: req.params.description,
        duration: Number(req.params.duration),
        date: req.params.date ? new Date(req.params.date).toDateString() : new Date(Date.now()).toDateString(),
        _id: data._id
      }
      // send response with user object with the exercise fields added
      res.json(userObj)
    })


  })
  // .catch(error => res.send(error.toString()))

})


// GET endpoint to get exercise log
app.get('/api/users/:_id/logs', function (req, res) {
  UserModel.findOne({ _id: req.params._id }).lean().then(data => {
    //send back response with the user object with a log array of all the exercises added
    res.json({
      _id: req.params._id,
      username: data.username,
      count: data.log.length,
      log: data.log
    })
  }).catch(error => res.send(error.toString()))
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
