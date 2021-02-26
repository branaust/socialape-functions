let db = {
    users: [
        {
            userId: '1DWKZdZItIfJC0wbB15gcNS6vqJ2',
            email: 'user@email.com',
            handle: 'user',
            createdAt: '2021-02-24T18:56:28.456Z',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/socialape-12f18.appspot.com/o/52121.jpg?alt=media',
            bio: 'I am a beautiful user',
            website: 'http://branaust.com/',
            location: 'Oakland, CA'
        }
    ],
    screams: [
        {
            userHandle: 'user',
            body: 'this is the scream body',
            createdAt: '2021-02-24T17:18:13.540Z',
            likeCount: 5,
            commentCount: 2,
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'FbXG9fsNzuJhftRh8Mqo',
            body: 'nice one mate!',
            createdAt: '2021-02-24T18:56:28.456Z'
        }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'Ki',
            read: 'true | false',
            screamId: 'FbXG9fsNzuJhftRh8Mqo',
            type: 'like | comment | message',
            createdAt: '2021-02-24T18:56:28.456Z'
        }
    ]
}

const userDetails = {
    // Redux data
    credentials: {
        userId: '1DWKZdZItIfJC0wbB15gcNS6vqJ2',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2021-02-24T18:56:28.456Z',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/socialape-12f18.appspot.com/o/52121.jpg?alt=media',
        bio: 'I am a beautiful user',
        website: 'http://branaust.com/',
        location: 'Oakland, CA'

    },
    likes: [
        {
            userHandle: 'user',
            screamId: '52LT0e2bYLbDHqqIiqs9'
        },
        {
            userHandle: 'user',
            screamId: 'FbXG9fsNzuJhftRh8Mqo'
        }
    ]
}
