const { db } = require('../util/admin')
const { validateSignupData, validateLoginData } = require('../util/validators')
const firebase = require('firebase')
const config = require('../util/config')
firebase.initializeApp(config)

exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

    const { valid, errors } = validateSignupData(newUser);
    if (!valid) return res.status(400).json(errors);

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
}

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
            if (err.code === 'auth/wrong-password') {
                return res.status(403)
                    .json({ general: 'Incorrect email/password combination, please try again' })
            } else {
                return res.status(500)
                    .json({ error: err.message })
            }
        })
}