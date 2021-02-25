const functions = require("firebase-functions");
const app = require('express')()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const { getAllScreams, createScream } = require('./handlers/screams')
const { signup, login, uploadImage } = require('./handlers/users')
const FBAuth = require('./util/FBAuth')

// Scream Routes
app.get('/screams', getAllScreams)
app.post('/scream', FBAuth, createScream);

// User Routes
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)

exports.api = functions.https.onRequest(app);
