const functions = require("firebase-functions");
const app = require('express')()

const {
    getAllScreams,
    createScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
} = require('./handlers/screams')

const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser
} = require('./handlers/users')

const FBAuth = require('./util/FBAuth')

// Scream Routes
app.get('/screams', getAllScreams);
app.get('/scream/:screamId', getScream);
app.post('/scream', FBAuth, createScream);
app.delete('/scream/:screamId', FBAuth, deleteScream)
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);

// User Routes
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

exports.api = functions.https.onRequest(app);
