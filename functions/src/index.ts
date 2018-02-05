import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as uuidv4 from 'uuid/v4'
import * as differenceInHours from 'date-fns/difference_in_hours'
import { transformObjectToList } from './utils'
const cors = require('cors')({ origin: true });

// The Firebase Admin SDK to access the Firebase Realtime Database. 
admin.initializeApp(functions.config().firebase);

export const handleAdminLogin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { username, password } = req.body
      const adminRef: admin.database.Reference = admin.database().ref('/admin')

      if (!username || !password) {
        throw new Error('Please provide a valid username or password.')
      }

      const snapshot: admin.database.DataSnapshot = await adminRef.once('value')
      const snapshotData = snapshot.val()
      const _username = snapshotData.username
      const _password = snapshotData.password

      if (username === _username && password === _password) {
        res.status(200).send('Successfully logged in!')
      }

      throw new Error('Incorrect username or password provided.')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
})

export const createAccount = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { firstName, lastName, username, password } = req.body
      const _id = uuidv4();
      const usersRef: admin.database.Reference = admin.database().ref('/users')
      const ticketsRef: admin.database.Reference = admin.database().ref('/tickets')

      if (!firstName || !lastName || !username || !password) {
        throw new Error('Please provide a valid first name or last name or username or password.')
      }

      await usersRef.child(_id).set({
        _id,
        firstName,
        lastName,
        username,
        password
      })

      await ticketsRef.child(_id).set({
        firstName,
        lastName,
        ticketCount: 1,
        lastUpdated: admin.database.ServerValue.TIMESTAMP
      })

      res.status(200).send('Successfully registered your account!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
})

export const resetPassword = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { firstName, lastName, username, password } = req.body
      const usersRef: admin.database.Reference = admin.database().ref('/users')

      if (!firstName || !lastName || !username || !password) {
        throw new Error('Please provide a valid first name or last name or username or password.')
      }

      const snapshot: admin.database.DataSnapshot = await usersRef.orderByChild('username').equalTo(username).once('value')
      const users = transformObjectToList(snapshot.val())

      if (!users) {
        throw new Error('There was an issue finding your account. Please try again.')
      }

      let _id = null
      for (let user of users) {
        if (user.firstName === firstName && user.lastName === lastName && user.username === username) {
          _id = user._id
          break
        }
      }

      if (!_id) {
        throw new Error('There was an issue finding your account. Please try again.')
      }

      // we found the correct user so let's set their new password
      await usersRef.child(_id).update({ password })

      res.status(200).send('Successfully reset your account password!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
})

export const resetUsername = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { firstName, lastName, username, password } = req.body
      const usersRef: admin.database.Reference = admin.database().ref('/users')

      if (!firstName || !lastName || !username || !password) {
        throw new Error('Please provide a valid first name or last name or username or password.')
      }

      const snapshot: admin.database.DataSnapshot = await usersRef.orderByChild('password').equalTo(password).once('value')
      const users = transformObjectToList(snapshot.val())

      if (!users) {
        throw new Error('There was an issue finding your account. Please try again.')
      }

      let _id = null
      for (let user of users) {
        if (user.firstName === firstName && user.lastName === lastName && user.password === password) {
          _id = user._id
          break
        }
      }

      if (!_id) {
        throw new Error('There was an issue finding your account. Please try again.')
      }

      // we found the correct user so let's set their new password
      await usersRef.child(_id).update({ username })

      res.status(200).send('Successfully reset your account username!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
})

export const handleRaffleEntry = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new Error('Please provide a valid username or password.')
      }

      const usersRef: admin.database.Reference = admin.database().ref('/users')
      const snapshot: admin.database.DataSnapshot = await usersRef.orderByChild('username').equalTo(username).once('value')
      const users = transformObjectToList(snapshot.val())

      if (!users) {
        throw new Error('There was an issue finding your account. Please try again.')
      }

      let _id = null
      for (let user of users) {
        if (user.password === password) {
          _id = user._id
          break
        }
      }

      if (!_id) {
        throw new Error('There was an issue finding your account. Please try again.')
      }

      const ticketRef: admin.database.Reference = admin.database().ref('/tickets').child(_id)
      const ticketSnapshot = await ticketRef.once('value')
      const ticketData = ticketSnapshot.val()
      const { ticketCount, lastUpdated } = ticketData

      const currentDate = new Date();
      const lastUpdatedDate = new Date(lastUpdated)

      const resultDifference = differenceInHours(currentDate, lastUpdatedDate)
      const minRequiredHourDifference = ((24 * 7) - 3)

      if (resultDifference > minRequiredHourDifference === false) {
        throw new Error('You may only recieve 1 raffle ticket per week.')
      }

      await ticketRef.update({ ticketCount: ticketCount + 1, lastUpdated: admin.database.ServerValue.TIMESTAMP })

      res.status(200).send('Your ticket count was successfully updated!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
});

