const functions = require("firebase-functions");
const app = require('express')()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const { getAllScreams, createScream, getScream, commentOnScream } = require('./handlers/screams')
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users')
const FBAuth = require('./util/FBAuth')

// Scream Routes
app.get('/screams', getAllScreams)
app.get('/scream/:screamId', getScream)
app.post('/scream', FBAuth, createScream);
// TODO: delete scream
// TODO: like a scream
// TODO: unlike a scream
app.post('/scream/:screamId/comment', FBAuth, commentOnScream)

// User Routes
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

exports.api = functions.https.onRequest(app);
