const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI);

const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: Date
});

const userSchema = new Schema({
  username: String,
  log: [exerciseSchema]
});

const User = mongoose.model('User', userSchema);
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Creating a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username });
  newUser.save()
    .then(data => {
      res.json({ username: data.username, _id: data._id });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while creating the user.' });
    });
});

// Get the details of the user or list of users
app.get('/api/users', (req, res) => {
  User.find({}).select('username _id').exec()
  .then(data => {
    res.json(data);
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching users.' });
  })
});

// Adding exercise details to the user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  const exercise = { description, duration, date: date ? new Date(date) : new Date() };
  
  User.findByIdAndUpdate(userId, { $push: { log: exercise } }, { new: true })
    .then(data => {
      res.json({ username: data.username, description, duration: parseInt(duration), date: exercise.date.toDateString(), _id: data._id });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while adding the exercise.' });
    });
});

// Get the exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  User.findById(userId).exec()
  .then(data => {
    let log = data.log;
    if (from) {
      log = log.filter(exercise => new Date(exercise.date) >= new Date(from));
    }
    if (to) {
      log = log.filter(exercise => new Date(exercise.date) <= new Date(to));
    }
    if (limit) {
      log = log.slice(0, parseInt(limit));
    }
    // Converting date objects to strings
    log.forEach(exercise => {
      exercise.date = new Date(exercise.date).toDateString();
    });
    res.json({ username: data.username, _id: data._id, count: log.length, log });
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching user by ID.' });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
