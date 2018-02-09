"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const uuidv4 = require("uuid/v4");
const differenceInHours = require("date-fns/difference_in_hours");
const utils_1 = require("./utils");
const random = require("lodash.random");
const shuffle = require("lodash.shuffle");
const cors = require('cors')({ origin: true });
// The Firebase Admin SDK to access the Firebase Realtime Database. 
admin.initializeApp(functions.config().firebase);
exports.handleAdminLogin = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { username, password } = req.body;
            const adminRef = admin.database().ref('/admin/app');
            if (!username || !password) {
                throw new Error('Please provide a valid username or password.');
            }
            const snapshot = yield adminRef.once('value');
            const snapshotData = snapshot.val();
            const _username = snapshotData.username;
            const _password = snapshotData.password;
            if (username === _username && password === _password) {
                return res.status(200).send('Successfully logged in!');
            }
            throw new Error('Incorrect username or password provided.');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.handleDashboardLogin = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { username, password } = req.body;
            const adminRef = admin.database().ref('/admin/dashboard');
            if (!username || !password) {
                throw new Error('Please provide a valid username or password.');
            }
            const snapshot = yield adminRef.once('value');
            const snapshotData = snapshot.val();
            const _username = snapshotData.username;
            const _password = snapshotData.password;
            if (username === _username && password === _password) {
                return res.status(200).send('Successfully logged in!');
            }
            throw new Error('Incorrect username or password provided.');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.createAccount = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, lastName, username, password } = req.body;
            const _id = uuidv4();
            const usersRef = admin.database().ref('/users');
            const ticketsRef = admin.database().ref('/tickets');
            if (!firstName || !lastName || !username || !password) {
                throw new Error('Please provide a valid first name or last name or username or password.');
            }
            yield usersRef.child(_id).set({
                _id,
                firstName,
                lastName,
                username,
                password
            });
            yield ticketsRef.child(_id).set({
                firstName,
                lastName,
                ticketCount: 1,
                lastUpdated: admin.database.ServerValue.TIMESTAMP
            });
            return res.status(200).send('Successfully registered your account!');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.resetPassword = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, lastName, username, password } = req.body;
            const usersRef = admin.database().ref('/users');
            if (!firstName || !lastName || !username || !password) {
                throw new Error('Please provide a valid first name or last name or username or password.');
            }
            const snapshot = yield usersRef.orderByChild('username').equalTo(username).once('value');
            const users = utils_1.transformObjectToList(snapshot.val());
            if (!users) {
                throw new Error('There was an issue finding your account. Please try again.');
            }
            let _id = null;
            for (let user of users) {
                if (user.firstName === firstName && user.lastName === lastName && user.username === username) {
                    _id = user._id;
                    break;
                }
            }
            if (!_id) {
                throw new Error('There was an issue finding your account. Please try again.');
            }
            // we found the correct user so let's set their new password
            yield usersRef.child(_id).update({ password });
            return res.status(200).send('Successfully reset your account password!');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.resetUsername = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, lastName, username, password } = req.body;
            const usersRef = admin.database().ref('/users');
            if (!firstName || !lastName || !username || !password) {
                throw new Error('Please provide a valid first name or last name or username or password.');
            }
            const snapshot = yield usersRef.orderByChild('password').equalTo(password).once('value');
            const users = utils_1.transformObjectToList(snapshot.val());
            if (!users) {
                throw new Error('There was an issue finding your account. Please try again.');
            }
            let _id = null;
            for (let user of users) {
                if (user.firstName === firstName && user.lastName === lastName && user.password === password) {
                    _id = user._id;
                    break;
                }
            }
            if (!_id) {
                throw new Error('There was an issue finding your account. Please try again.');
            }
            // we found the correct user so let's set their new password
            yield usersRef.child(_id).update({ username });
            return res.status(200).send('Successfully reset your account username!');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.handleRaffleEntry = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                throw new Error('Please provide a valid username or password.');
            }
            const usersRef = admin.database().ref('/users');
            const snapshot = yield usersRef.orderByChild('username').equalTo(username).once('value');
            const users = utils_1.transformObjectToList(snapshot.val());
            if (!users) {
                throw new Error('There was an issue finding your account. Please try again.');
            }
            let _id = null;
            for (let user of users) {
                if (user.password === password) {
                    _id = user._id;
                    break;
                }
            }
            if (!_id) {
                throw new Error('There was an issue finding your account. Please try again.');
            }
            const ticketRef = admin.database().ref('/tickets').child(_id);
            const ticketSnapshot = yield ticketRef.once('value');
            const ticketData = ticketSnapshot.val();
            const { ticketCount, lastUpdated } = ticketData;
            const currentDate = new Date();
            const lastUpdatedDate = new Date(lastUpdated);
            const resultDifference = differenceInHours(currentDate, lastUpdatedDate);
            const minRequiredHourDifference = ((24 * 7) - 3);
            if (resultDifference > minRequiredHourDifference === false) {
                throw new Error('You may only recieve 1 raffle ticket per week.');
            }
            yield ticketRef.update({ ticketCount: ticketCount + 1, lastUpdated: admin.database.ServerValue.TIMESTAMP });
            return res.status(200).send('Your ticket count was successfully updated!');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.getUsersForDashboard = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const usersRef = admin.database().ref('/users');
            const snapshot = yield usersRef.once('value');
            const users = utils_1.transformObjectToList(snapshot.val());
            const transformedUsers = users.map(({ _id, firstName, lastName, username }) => ({ _id, firstName, lastName, username }));
            return res.status(200).send(transformedUsers);
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.getRandomRaffleWinner = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketsRef = admin.database().ref('/tickets');
            const snapshot = yield ticketsRef.once('value');
            const tickets = utils_1.mergeTicketsToList(snapshot.val());
            const raffleEntries = [];
            tickets.forEach(({ _id, firstName, lastName, ticketCount }) => {
                for (let i = 0; i < ticketCount; i++) {
                    raffleEntries.push({
                        _id,
                        firstName,
                        lastName,
                        ticketCount,
                    });
                }
            });
            console.log('raffleEntries: ', raffleEntries);
            const shuffledRaffleEntries = shuffle(raffleEntries);
            const randomIndex = random(tickets.length - 1);
            const raffleWinner = shuffledRaffleEntries[randomIndex];
            console.log('raffleWinner: ', raffleWinner);
            return res.status(200).send(raffleWinner);
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.confirmRaffleWinners = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { raffleWinnerIDs } = req.body;
            const ticketsRef = admin.database().ref('/tickets');
            for (let _id of raffleWinnerIDs) {
                let currentTicketRef = ticketsRef.child(_id);
                let snapshot = yield currentTicketRef.once('value');
                let currentTicketCount = snapshot.val().ticketCount;
                yield currentTicketRef.update({ ticketCount: currentTicketCount - 1 });
            }
            return res.status(200).send('Successfully confirmed raffle winners.');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
exports.resetAllUserTickets = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketsRef = admin.database().ref('/tickets');
            let snapshot = yield ticketsRef.once('value');
            let tickets = snapshot.val();
            for (let ticketID of Object.keys(tickets)) {
                yield ticketsRef.child(ticketID).update({ ticketCount: 0 });
            }
            return res.status(200).send('Successfully reset all tickets amount back to zero.');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            return res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
//# sourceMappingURL=index.js.map