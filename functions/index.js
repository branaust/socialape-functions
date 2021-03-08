const functions = require("firebase-functions");
const app = require('express')()
const { db } = require('./util/admin')

const cors = require('cors')
app.use(cors())

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
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if (doc.exists && doc.data.userHandle !== snapshot.data.userHandle) {
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

            .catch(err =>
                console.error(err))
    })

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        return db.collection('notifications').doc(snapshot.id)
            .delete()

            .catch(err => {
                console.error(err)
                return
            })
    })


exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        // Fix route
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if (doc.exists && doc.data.userHandle !== snapshot.data.userHandle) {
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
            .catch(err => {
                console.error(err)
                return;
            })
    })

exports.onUserImageChange = functions.firestore.document('/users/{userId}')
    .onUpdate((change) => {
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            const batch = db.batch()
            return db
                .collection('screams')
                .where('userHandle', '==', change.before.data().handle)
                .get()
                .then(data => {
                    data.forEach(doc => {
                        const scream = db.collection('screams').doc(doc.id)
                        batch.update(scream, { userImage: change.after.data().imageUrl })
                    })
                    return batch.commit()
                })
        } else return true;
    })

exports.onScreamDelete = functions.firestore.document('screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch()
        return db.collection('comments').where('screamId', '==', screamId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.collection('comments').doc(doc.id));
                })
                return db.collection('likes').where('screamId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.collection('likes').doc(doc.id));
                })
                return db.collection('notifications').where('screamId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.collection('notifications').doc(doc.id));
                })
                return batch.commit()
            })
            .catch(err => {
                console.error(err)
            })
    })