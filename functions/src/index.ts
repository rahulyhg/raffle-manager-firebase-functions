import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as uuidv4 from 'uuid/v4'
import * as differenceInHours from 'date-fns/difference_in_hours'
import { transformObjectToList, mergeTicketsToList } from './utils'
import * as random from 'lodash.random'
import * as shuffle from 'lodash.shuffle'
const cors = require('cors')({ origin: true });

// The Firebase Admin SDK to access the Firebase Realtime Database. 
admin.initializeApp(functions.config().firebase);

export const handleAdminLogin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { username, password } = req.body
      const adminRef: admin.database.Reference = admin.database().ref('/admin/app')

      if (!username || !password) {
        throw new Error('Please provide a valid username or password.')
      }

      const snapshot: admin.database.DataSnapshot = await adminRef.once('value')
      const snapshotData = snapshot.val()
      const _username = snapshotData.username
      const _password = snapshotData.password

      if (username === _username && password === _password) {
        return res.status(200).send('Successfully logged in!')
      }

      throw new Error('Incorrect username or password provided.')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
})

export const handleDashboardLogin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { username, password } = req.body
      const adminRef: admin.database.Reference = admin.database().ref('/admin/dashboard')

      if (!username || !password) {
        throw new Error('Please provide a valid username or password.')
      }

      const snapshot: admin.database.DataSnapshot = await adminRef.once('value')
      const snapshotData = snapshot.val()
      const _username = snapshotData.username
      const _password = snapshotData.password

      if (username === _username && password === _password) {
        return res.status(200).send('Successfully logged in!')
      }

      throw new Error('Incorrect username or password provided.')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
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

      return res.status(200).send('Successfully registered your account!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
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

      return res.status(200).send('Successfully reset your account password!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
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

      return res.status(200).send('Successfully reset your account username!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
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

      return res.status(200).send('Your ticket count was successfully updated!')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
});

export const getUsersForDashboard = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const usersRef: admin.database.Reference = admin.database().ref('/users')
      const snapshot = await usersRef.once('value')
      const users = transformObjectToList(snapshot.val())
      const transformedUsers = users.map(({ _id, firstName, lastName, username }) => ({ _id, firstName, lastName, username }))

      return res.status(200).send(transformedUsers)
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
});

export const getRandomRaffleWinner = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const ticketsRef: admin.database.Reference = admin.database().ref('/tickets')
      const snapshot = await ticketsRef.once('value')
      const tickets = mergeTicketsToList(snapshot.val())
      const raffleEntries = []

      tickets.forEach(({ _id, firstName, lastName, ticketCount }) => {
        for (let i = 0; i < ticketCount; i++) {
          raffleEntries.push({
            _id,
            firstName,
            lastName,
            ticketCount,
          })
        }
      })

      const shuffledRaffleEntries = shuffle(raffleEntries)
      const randomIndex = random(tickets.length - 1)
      const raffleWinner = shuffledRaffleEntries[randomIndex]

      return res.status(200).send(raffleWinner)
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
});

export const confirmRaffleWinners = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { raffleWinnerIDs } = req.body
      const ticketsRef: admin.database.Reference = admin.database().ref('/tickets')

      for (let _id of raffleWinnerIDs) {
        let currentTicketRef = ticketsRef.child(_id)
        let snapshot = await currentTicketRef.once('value')
        let currentTicketCount = snapshot.val().ticketCount
        await currentTicketRef.update({ ticketCount: currentTicketCount - 1 })
      }

      return res.status(200).send('Successfully confirmed raffle winners.')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
});

export const resetAllUserTickets = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const ticketsRef: admin.database.Reference = admin.database().ref('/tickets')
      let snapshot = await ticketsRef.once('value')
      let tickets: object = snapshot.val()

      for (let ticketID of Object.keys(tickets)) {
        await ticketsRef.child(ticketID).update({ ticketCount: 0 })
      }

      return res.status(200).send('Successfully reset all tickets amount back to zero.')
    }
    catch (err) {
      console.log(`${err.name}: ${err.message}`)
      return res.status(500).send(`${err.name}: ${err.message}`)
    }
  })
});