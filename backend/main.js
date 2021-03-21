const mongoose = require("mongoose");
import { User } from "./models/User";
let connectedToDB = false;

export function connectToMongo() {
	if (!connectedToDB) {
		mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		const db = mongoose.connection;
		db.on("error", console.error.bind(console, "connection error:"));
		db.once("open", function () {
			// we're connected!
			console.log("Connected to MongoDB");
		});
		connectedToDB = true;
	} else {
		console.log("Already connected");
	}
}

export function handleStar() {}

export function checkIfUser(username) {
	if (username[0] === "@") {
		username = username.substring(1);
	}
	if (username.length !== 11) {
		console.log("username format is wrong");
		return;
	}
	User.findOne({ username: username }).exec(function (err, user) {
		if (user) {
			return;
		} else {
			const newUser = new User({
				username: username,
				stars: 2,
				amountGiven: 0,
			});

			newUser.save((err) => {
				if (err) {
					console.log(err);
				}
				console.log("User Created");
			});
		}
	});
}

export async function userHasEnoughStars(username, starsSent) {
	let foundUser = await User.findOne({ username: username });
	return !(foundUser.stars < starsSent);
}

function takeStars(username, amount) {
	User.findOne({ username: username }, (err, user) => {
		if (!user) {
			console.log("User doesn't exist. How'd you do this?");
		}
		user.stars -= amount;
		user.save();
		console.log(`${username}'s new balance: ${user.stars}`);
	});
}

function giveStars(username, amount) {
	User.findOne({ username: username }, (err, user) => {
		if (!user) {
			console.log("User doesn't exist. How'd you do this?");
		}
		if (err) {
			console.log(err);
			return;
		}
		user.stars += amount;
		user.save();
		console.log(`${username}'s new balance: ${user.stars}`);
	});
}

export function handleTransaction(sender, receiver, starsSent) {
	takeStars(sender, starsSent);
	if (receiver.length > 1) {
		starsSent = starsSent / receiver.length;
	}
	for (let user of receiver) {
		checkIfUser(user);
		giveStars(user, starsSent);
	}
}
