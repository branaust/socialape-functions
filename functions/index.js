const functions = require("firebase-functions");
const admin = require('firebase-admin')
const app = require('express')()

admin.initializeApp();


// Firebase configuration
const config = {
    apiKey: "AIzaSyC6eKyHAP9GYPkNxDr_Kqfi79RsmyJ0txk",
    authDomain: "socialape-12f18.firebaseapp.com",
    projectId: "socialape-12f18",
    storageBucket: "socialape-12f18.appspot.com",
    messagingSenderId: "484136488302",
    appId: "1:484136488302:web:e86eae8c1b941fcf15057f",
    measurementId: "G-LCNVXZ51YS"
};

const firebase = require('firebase')
firebase.initializeApp(config)

const db = admin.firestore()

// GET Screams
app.get('/screams', (req, res) => {
    db.collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let screams = []
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    ...doc.data()
                })
            })
            return res.json(screams);
        })
        .catch(err => console.log(err))
})

// POST Screams
app.post('/scream', (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    }

    db.collection('screams').add(newScream)
        .then((doc) => {
            res.json({ message: `document ${doc.id} created successfully` })
        })
        .catch((err) => {
            res.status(500).json({ error: 'something went wrong' })
            console.log(err)
        })
});

const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false
}

const isEmail = (email) => {
    const regEx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    if (email.match(regEx)) return true;
    else return false
}

// POST Signup
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

    // VALIDATE DATA 
    let errors = {}
    // Check for valid email
    if (isEmpty(newUser.email)) {
        errors.email = 'Field required'
    } else if (!isEmail(newUser.email)) {
        errors.email = 'Must be a valid email address'
    }
    // Check for valid password
    if (isEmpty(newUser.password)) {
        errors.password = 'Field required'
    }
    if (newUser.password !== newUser.confirmPassword) {
        errors.confirmPassword = 'Password and Confirm Password must match'
    }
    // Check for valid handle
    if (isEmpty(newUser.handle)) {
        errors.handle = 'Field required'
    }
    // If error, return error
    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors)
    }

    // Initialize
    let token, userId
    db.doc(`/users/${newUser.handle}`).get()
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
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
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
                return res.status(500).json({ error: err.code })
            }

        })
})

// POST Login
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    let errors = {}

    if (isEmpty(user.email)) errors.email = "Field required"
    if (isEmpty(user.password)) errors.password = "Field required"
    if (Object.keys(errors).length > 0) return res.status(400).json(errors)

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token })
        })
        .catch(err => {
            console.error(err)
            if (err.code === 'auth/wrong-password') {
                return res.status(403)
                    .json({ general: 'Incorrect email/password combination, please try again' })
            } else {
                return res.status(500)
                    .json({ error: err.message })
            }
        })
})

exports.api = functions.https.onRequest(app);