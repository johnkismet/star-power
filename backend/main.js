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

let defaultStars = 2;

export async function checkIfUser(username) {
	if (!username) return;
	if (username === "U01SNC0TL9W") return;
	if (username && username[0] === "@") {
		username = username.substring(1);
	}
	if (!username.match(/U\w{10}/gm)) {
		console.log("Username format is wrong");
		return "ERROR";
	}
	let success = await User.findOne({ username: username });
	if (success) {
		return "EXISTING_USER";
	} else {
		User.create(
			{
				username: username,
				stars: defaultStars,
				amountGiven: 0,
				lifetimeStars: defaultStars,
			},
			function (err, user) {
				if (err) {
					console.log(err);
					return "ERROR";
				}
				console.log("New user created!");
			}
		);
		return "NEW_USER";
	}
}

export async function userHasEnoughStars(username, starsSent) {
	let foundUser = await User.findOne({ username: username });
	return !(foundUser.stars < starsSent);
}

export async function takeStars(username, amount, skip = false) {
	let user = await User.findOne({ username: username });
	if (!user) {
		console.log("Couldn't take stars. User doesn't exist.");
		return false;
	}
	// skip == true when removing a reaction since we have to take stars but don't want to increment amountGiven
	if (!skip) {
		user.amountGiven += amount;
	} else {
		user.lifetimeStars -= amount;
	}
	user.stars -= amount;
	user.save();
	return user.stars;
}

export async function giveStars(username, amount, decrement = false) {
	let user = await User.findOne({ username: username });
	if (!user) {
		console.log("Couldn't give stars. User doesn't exist.");
		return false;
	}

	// always increment user.stars
	// decrement == true when removing an emoji
	user.stars += amount;
	if (decrement) {
		user.amountGiven -= 1;
	} else {
		user.lifetimeStars += amount;
	}
	user.save();
	return user.stars;
}

export async function handleTransaction(sender, receiver, starsSent) {
	for (let i = 0; i < receiver.length; i++) {
		await checkIfUser(receiver[i]);
	}
	let balanceAfterWithdraw = await takeStars(sender, starsSent);
	// if multiple people then divide the amount of stars to send by however many people were mentioned
	if (receiver.length > 1) {
		// flooring it just to be safe, shouldn't matter but this will prevent any floats from slipping through the cracks
		starsSent = Math.floor(starsSent / receiver.length);
	}
	if (balanceAfterWithdraw >= 0) {
		for (let user of receiver) {
			let giveSuccess = await giveStars(user, starsSent);
			if (!giveSuccess) {
				console.log("Couldn't give stars");
				return false;
			}
		}

		return balanceAfterWithdraw;
	}
}

export async function showLeaderboard() {
	let users = await User.find({});
	let starsSorted = Object.entries(users).sort(
		(a, b) => b[1].stars - a[1].stars
	);
	let g = Object.entries(users).sort(
		(a, b) => b[1].amountGiven - a[1].amountGiven
	);
	let topPhils = [];
	let topStars = [];
	let maxCount = 5;

	// this is mostly for development when the database is less than 5
	if (maxCount > starsSorted.length) maxCount = starsSorted.length;

	for (let i = 0; i < maxCount; i++) {
		let starEntry = `<@${starsSorted[i][1].username}>: ${starsSorted[i][1].stars} stars`;
		let philEntry = `<@${givenSorted[i][1].username}>: ${givenSorted[i][1].amountGiven} times given`;
		topStars.push(starEntry);
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
		lifetimeStars: user.lifetimeStars,
	};
	return balance;
}

export async function reset() {
	let users = await User.find({});
	users.forEach((user) => {
		user.stars = defaultStars;
		user.amountGiven = 0;
		user.lifetimeStars = defaultStars;
		user.save();
	});
	console.log("Reset :D");
}
