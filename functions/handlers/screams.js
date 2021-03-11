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
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    }
    db.collection('screams').add(newScream)
        .then((doc) => {
            const resScream = newScream;
            resScream.screamId = doc.id
            res.json(resScream)
        })
        .catch((err) => {
            res.status(500).json({ error: 'something went wrong' })
            console.log(err)
        })
}

// Fetch Single Scream
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
            return db.collection('comments')
                .orderBy('createdAt', 'desc')
                .where('screamId', '==', req.params.screamId)
                .get()
        })
        // 6) For each comment, push to array of comments in scream data
        .then(data => {
            screamData.comments = [];
            data.forEach(doc => {
                commentData = doc.data()
                commentData.commentId = doc.id
                screamData.comments.push(commentData)
            });
            return res.json(screamData);
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

// Comment on a scream 
exports.commentOnScream = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ comment: 'Field Required' })
    }
    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
    };
    db.collection('screams').doc(req.params.screamId).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found' })
            }
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
        })
        .then(() => {
            return db.collection('comments').add(newComment)
                .then((doc) => {
                    const resComment = newComment
                    resComment.commentId = doc.id
                    res.json(resComment)
                })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: 'Something went wrong' })
        })
}

// Delete Comment
exports.deleteComment = (req, res) => {
    const commentDoc = db.collection('comments').doc(req.params.commentId)
    const screamDoc = db.collection('screams').doc(req.params.screamId)

    screamDoc.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found' })
            }
            return doc.ref.update({ commentCount: doc.data().commentCount - 1 })
        }).then(() => {
            commentDoc.get()
                .then(doc => {
                    if (!doc.exists) {
                        return res.status(400).json({ error: 'Comment not found' })
                    }
                    if (doc.data().userHandle !== req.user.handle) {
                        return res.status(403).json({ error: 'Unauthorized' })
                    } else {
                        return commentDoc.delete();
                    }
                })
        })
        .then(() => {
            res.json({ message: 'Comment deleted successfully' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

// TODO: return doc.ref.update({ commentCount: doc.data().commentCount + 1 })

// Like A Scream
exports.likeScream = (req, res) => {
    // 1) Find all the likes that includes the user ID
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
        // 2) Find the like from that user that equals the screamId param (return single scream)
        .where('screamId', '==', req.params.screamId).limit(1);
    // 1) Find scream that equals screamId param
    const screamDocument = db.collection('screams').doc(req.params.screamId)

    let screamData
    // 1) Fetch scream document
    screamDocument.get()
        .then(doc => {
            if (doc.exists) {
                screamData = doc.data()
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Scream not found' })
            }
        })
        // 2) If there is not a likeDocument doc, create one
        .then(data => {
            if (data.empty) {
                return db.collection('likes').add({
                    screamId: req.params.screamId,
                    userHandle: req.user.handle
                })
                    // 3) update the likeCount on the scream document
                    .then(() => {
                        screamData.likeCount++
                        return screamDocument.update({ likeCount: screamData.likeCount })
                    })
                    // 4) return screamData
                    .then(() => {
                        return res.json(screamData);
                    })
                // 5) Otherwise, scream exists - return error
            } else {
                return res.status(400).json({ error: 'Scream already liked' })
            }
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: err.code })
        })

}

// Unlike A Scream
exports.unlikeScream = (req, res) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId).limit(1);
    const screamDocument = db.collection('screams').doc(req.params.screamId)

    let screamData
    // 1) Fetch scream document
    screamDocument.get()
        .then(doc => {
            if (doc.exists) {
                screamData = doc.data()
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Scream not found' })
            }
        })
        // 2) If there is not a likeDocument doc, return error
        .then(data => {
            if (data.empty) {
                return res.status(400).json({ error: 'Scream not liked by user' })
            } else {
                // 3) Otherwise, delete likeDocument & negate likeCount on screamDocument
                return db.collection('likes').doc(data.docs[0].id).delete()
                    .then(() => {
                        screamData.likeCount--
                        return screamDocument.update({ likeCount: screamData.likeCount })
                    })
                    .then(() => {
                        return res.json(screamData)
                    })
            }
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: err.code })
        })

}

// Delete A Scream
exports.deleteScream = (req, res) => {
    const document = db.collection('screams').doc(req.params.screamId)
    document.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(400).json({ error: 'Scream not found' })
            }
            if (doc.data().userHandle !== req.user.handle) {
                return res.status(403).json({ error: 'Unauthorized' })
            } else {
                return document.delete();
            }
        }).then(() => {
            res.json({ message: 'Scream deleted successfully' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}