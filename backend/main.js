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

export async function checkIfUser(username) {
	if (username[0] === "@") {
		username = username.substring(1);
	}
	if (username.length !== 11) {
		console.log("username format is wrong");
		return false;
	}
	let success = await User.findOne({ username: username });
	if (success) {
		return true;
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
			return true;
		});
	}
}

export async function userHasEnoughStars(username, starsSent) {
	let foundUser = await User.findOne({ username: username });
	return !(foundUser.stars < starsSent);
}

async function takeStars(username, amount) {
	let user = await User.findOne({ username: username });
	if (!user) {
		console.log("Couldn't take stars. User doesn't exist.");
		return false;
	}
	user.amountGiven += amount;
	user.stars -= amount;
	user.save();
	return user.stars;
}

export async function giveStars(username, amount) {
	let user = await User.findOne({ username: username });
	if (!user) {
		console.log("Couldn't give stars. User doesn't exist.");
		return false;
	}
	user.stars += amount;
	user.save();
	console.log("gave stars :D");
	return user.stars;
}

export async function handleTransaction(sender, receiver, starsSent) {
	for (let i = 0; i < receiver.length; i++) {
		let user = await checkIfUser(receiver[i]);
		if (!user) return false;
	}
	let takeSuccess = await takeStars(sender, starsSent);
	if (receiver.length > 1) {
		starsSent = starsSent / receiver.length;
	}
	if (takeSuccess) {
		for (let user of receiver) {
			let giveSuccess = await giveStars(user, starsSent);
			if (!giveSuccess) return false;
		}

		return takeSuccess;
	}
}

export async function showLeaderboard() {
	let users = await User.find({});
	let starsSorted = Object.entries(users).sort(
		(a, b) => b[1].stars - a[1].stars
	);
	let philanthropistsSorted = Object.entries(users).sort(
		(a, b) => b[1].amountGiven - a[1].amountGiven
	);
	let topPhils = [];
	let topStars = [];
	let maxCount = 5;
	if (maxCount > starsSorted.length) {
		maxCount = starsSorted.length;
	}
	for (let i = 0; i < maxCount; i++) {
		let username = starsSorted[i][1].username;
		let stars = starsSorted[i][1].stars;
		let starEntry = `<@${username}>: ${stars}`;
		topStars.push(starEntry);

		username = philanthropistsSorted[i][1].username;
		let amount = philanthropistsSorted[i][1].amountGiven;
		let philEntry = `<@${username}>: ${amount}`;
		topPhils.push(philEntry);
	}
	let leaderboard = [topPhils, topStars];
	return leaderboard;
}

export async function checkBalance(username) {
	let user = await User.findOne({ username: username });
	let balance = {
		stars: user.stars,
		amountGiven: user.amountGiven,
	};
	return balance;
}
