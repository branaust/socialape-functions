const { db } = require('../util/admin')

exports.getAllScreams = (req, res) => {
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
}

exports.createScream = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ body: 'Field required' })
    }
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
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
}

exports.getScream = (req, res) => {
    // 1) Create scream data object
    let screamData = {}
    // 2) Search for scream ID given from param in URL
    db.collection('screams').doc(req.params.screamId).get()
        .then(doc => {
            // 3) If scream does not exist, return error
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found' })
            }
            // 4) else, scream data is the data that was found
            screamData = doc.data()
            screamData.screamId = doc.id
            // 5) next, find all comments where the scream ID matches the param & return it
            return db.collection('comments').where('screamId', '==', req.params.screamId).get()
        })
        // 6) For each comment, push to array of comments in scream data
        .then(data => {
            screamData.comments = [];
            data.forEach(doc => {
                screamData.comments.push(doc.data())
            });
            return res.json(screamData);
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}