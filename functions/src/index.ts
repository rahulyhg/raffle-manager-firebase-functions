import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { transformObjectToList } from './utils'
const cors = require('cors')({ origin: true });

// The Firebase Admin SDK to access the Firebase Realtime Database. 
admin.initializeApp(functions.config().firebase);

export const handleRaffleEntry = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      console.log('--------------------------------')
      console.log('body: ', req.body)

      // Grab the text parameter.
      const { username, password } = req.body;

      if (!username || !password) {
        throw new Error('Please provide a valid username or password.')
      }

      console.log('username: ', username)
      console.log('password: ', password)

      const usersRef: admin.database.Reference = admin.database().ref('/users')
      console.log('got usersRef.')

      const snapshot: admin.database.DataSnapshot = await usersRef.orderByChild('username').equalTo(username).once('value')

      console.log('grabbing matched users...')

      const users = transformObjectToList(snapshot.val())

      if (!users) {
        throw new Error('There was an issue finding your account. Please try again.')
      }

      console.log('transformed users')
      console.log('users length: ', users.length)

      let _id = null
      for (let user of users) {
        console.log('looping over user password: ', user.password)

        if (user.password === password) {
          // the supplied password is correct
          // so we can update their ticket count
          console.log('credentials match!')
          console.log('matched... _id: ', user._id)
          _id = user._id
          break
        }
      }

      if (!_id) {
        console.log('NO USER MATCH')
        throw new Error('There was an issue finding your account. Please try again.')
      }

      const ticketRef: admin.database.Reference = admin.database().ref('/tickets').child(_id)

      const ticketSnapshot = await ticketRef.once('value')
      const ticketCount = ticketSnapshot.val().ticketCount

      console.log('ticketCount: ', ticketCount)

      await ticketRef.update({ ticketCount: ticketCount + 1 })

      res.status(200).send('Your ticket count was successfully updated!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
});

