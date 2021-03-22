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
		user.amountGiven += 1;
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

// export async function showLeaderboard() {
// 	await User.find({}, function (err, users) {
// 		let starsSorted = Object.entries(users).sort(
// 			(a, b) => b[1].stars - a[1].stars
// 		);
// 		let philanthropistsSorted = Object.entries(users).sort(
// 			(a, b) => b[1].amountGiven - a[1].amountGiven
// 		);
// 		let topPhils = [];
// 		let topStars = [];
// 		let maxCount = 5;
// 		if (maxCount > starsSorted.length) {
// 			maxCount = starsSorted.length;
// 		}
// 		for (let i = 0; i < maxCount; i++) {
// 			let username = starsSorted[i][1].username;
// 			let stars = starsSorted[i][1].stars;
// 			let starEntry = `${username}: ${stars}`;
// 			topStars.push(starEntry);
// 			username = philanthropistsSorted[i][1].username;
// 			let amount = philanthropistsSorted[i][1].amountGiven;
// 			let philEntry = `${username}: ${amount}`;
// 			topPhils.push(philEntry);
// 		}
// 		let leaderboard = [topPhils, topStars];
// 		console.log(leaderboard);
// 		return leaderboard;
// 	});

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
	// console.log(leaderboard);
	return leaderboard;
}
