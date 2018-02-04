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
const utils_1 = require("./utils");
const cors = require('cors')({ origin: true });
// The Firebase Admin SDK to access the Firebase Realtime Database. 
admin.initializeApp(functions.config().firebase);
exports.handleRaffleEntry = functions.https.onRequest((req, res) => {
    cors(req, res, () => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('--------------------------------');
            console.log('body: ', req.body);
            // Grab the text parameter.
            const { username, password } = req.body;
            if (!username || !password) {
                throw new Error('Please provide a valid username or password.');
            }
            console.log('username: ', username);
            console.log('password: ', password);
            const usersRef = admin.database().ref('/users');
            console.log('got usersRef.');
            const snapshot = yield usersRef.orderByChild('username').equalTo(username).once('value');
            console.log('grabbing matched users...');
            const users = utils_1.transformObjectToList(snapshot.val());
            if (!users) {
                throw new Error('There was an issue finding your account. Please try again.');
            }
            console.log('transformed users');
            console.log('users length: ', users.length);
            let _id = null;
            for (let user of users) {
                console.log('looping over user password: ', user.password);
                if (user.password === password) {
                    // the supplied password is correct
                    // so we can update their ticket count
                    console.log('credentials match!');
                    console.log('matched... _id: ', user._id);
                    _id = user._id;
                    break;
                }
            }
            if (!_id) {
                console.log('NO USER MATCH');
                throw new Error('There was an issue finding your account. Please try again.');
            }
            const ticketRef = admin.database().ref('/tickets').child(_id);
            const ticketSnapshot = yield ticketRef.once('value');
            const ticketCount = ticketSnapshot.val().ticketCount;
            console.log('ticketCount: ', ticketCount);
            yield ticketRef.update({ ticketCount: ticketCount + 1 });
            res.status(200).send('Your ticket count was successfully updated!');
        }
        catch (err) {
            console.log(`${err.name}: ${err.message}`);
            res.status(500).send(`${err.name}: ${err.message}`);
        }
    }));
});
//# sourceMappingURL=index.js.map