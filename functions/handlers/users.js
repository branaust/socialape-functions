const { db, admin } = require('../util/admin')
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators')
const storage = require('firebase/storage')
const firebase = require('firebase')
const config = require('../util/config')
const { user } = require('firebase-functions/lib/providers/auth')
firebase.initializeApp(config)

// Signup New User
exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

    const { valid, errors } = validateSignupData(newUser);
    if (!valid) return res.status(400).json(errors);

    const noImg = 'no-img.png'

    // Initialize
    let token, userId
    db.collection('users').doc(newUser.handle).get()
        .then(doc => {
            // 1) Check in firestore db to see if newUser handle exists
            if (doc.exists) {
                return res.status(400).json({ handle: 'This handle is already taken' })

                // 2) Create new user in Authentication
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
            // 3) Returns a JSON Web Token (JWT) used to identify the user to a Firebase service.
        }).then(data => {
            userId = data.user.uid
            return data.user.getIdToken();
        })
        // 4) Create new user instance in DB and pair with user doc in Auth
        .then(idToken => {
            token = idToken
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
                userId
            };
            return db.collection('users').doc(newUser.handle).set(userCredentials);
        })
        // 5)  Returns the current token if it has not expired.
        // Otherwise, this will refresh the token and return a new one
        .then(() => {
            return res.status(201).json({ token })
        })
        // 6) Check if email has already been used
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: err.message })
            } else {
                return res.status(500).json({ general: 'Something went wrong, please try again.' })
            }

        })
}

// Login User
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    const { valid, errors } = validateLoginData(user);
    if (!valid) return res.status(400).json(errors);



    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token })
        })
        .catch(err => {
            console.error(err)
            return res.status(403)
                .json({ general: 'Incorrect credentials, please try again' })

        })
}

// Add User Details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body)
    db.collection('users').doc(req.user.handle).update(userDetails)
        .then(() => {
            return res.json({ message: 'User Updated Successfully' })
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code })
        })
}

// Get any user's details
exports.getUserDetails = (req, res) => {
    let userData = {}
    db.collection('users').doc(req.params.handle).get()
        .then(doc => {
            if (doc.exists) {
                userData.user = doc.data()
                return db.collection('screams').where('userHandle', '==', req.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get()
            } else {
                return res.status(404).json({ error: 'User not found' })
            }
        })
        .then(data => {
            userData.screams = []
            data.forEach(doc => {
                userData.screams.push({
                    ...doc.data(),
                    screamId: doc.id
                })
            })
            return res.json({ userData })
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: err.code })
        })
}

// TODO:
// Get All Users
exports.getUsers = (req, res) => {
    db.collection('users')
        .get()
        .then(data => {
            let users = []
            data.forEach(user => {
                users.push(user.data())
            })
            return res.json(users)
        })
        .catch(err => console.log(err))
}

// Get Own User Details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db.collection('users').doc(req.user.handle).get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', req.user.handle).get()
            }
        })
        .then(data => {
            userData.likes = []
            data.forEach(doc => {
                userData.likes.push(doc.data())
            })
            return db.collection('notifications').where('recipient', '==', req.user.handle)
                .orderBy('createdAt', 'desc').limit(10).get()
        }).then(data => {
            userData.notifications = []
            data.forEach(doc => {
                userData.notifications.push({
                    ...doc.data(),
                    notificationId: doc.id
                })
            })
            return res.json(userData)
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

// Add User Profile Img
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const busboy = new BusBoy({ headers: req.headers })

    let imageFileName
    let imageToBeUploaded = {}

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Please upload a valid image file (jpeg or png)' })
        }
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.floor(Math.random() * 100000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype }
        file.pipe(fs.createWriteStream(filepath))
    })
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
            ////////////////////////////
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
                return db.collection('users').doc(req.user.handle).update({ imageUrl })
            })
            .then(() => {
                return res.json({ message: 'Image uploaded successfully' })
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json(err.code)
            })
    })
    busboy.end(req.rawBody)
}

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach(notificationId => {
        const notification = db.collection('notifications').doc(notificationId);
        batch.update(notification, { read: true })
    })
    batch.commit()
        .then(() => {
            return res.json({ message: 'Notifications marked read' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}