const { db, admin } = require('../util/admin')
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

    const noImg = 'no-img.png'

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
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
                return db.doc(`/users/${req.user.handle}`).update({ imageUrl })
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
