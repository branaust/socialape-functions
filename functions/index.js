const functions = require("firebase-functions");
const app = require('express')()
const { db } = require('./util/admin')

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
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead

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
app.get('/user/:handle', getUserDetails)
app.post('/notifications', FBAuth, markNotificationsRead)

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        // Fix route
        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        screamId: doc.id
                    })
                }
            })
            .then(() => {
                return
            })
            .catch(err => {
                console.error(err)
                return;
            })
    })

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        db.collection('notifications').doc(snapshot.id)
            .delete()
            .then(() => {
                return
            })
            .catch(err => {
                console.error(err)
                return
            })
    })


exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        // Fix route
        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        screamId: doc.id
                    })
                }
            })
            .then(() => {
                return
            })
            .catch(err => {
                console.error(err)
                return;
            })
    })