const functions = require("firebase-functions");
const app = require('express')()

const { getAllScreams, createScream } = require('./handlers/screams')
const { signup, login } = require('./handlers/users')
const FBAuth = require('./util/FBAuth')


// Scream Routes
app.get('/screams', getAllScreams)
app.post('/scream', FBAuth, createScream);

// User Routes
app.post('/signup', signup)
app.post('/login', login)


exports.api = functions.https.onRequest(app);