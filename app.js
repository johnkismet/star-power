require("dotenv").config();

import {
	connectToMongo,
	checkIfUser,
	userHasEnoughStars,
	handleTransaction,
} from "./backend/main";
import handleMessage from "./handleMessage";

const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const port = 3000;
const emoji = ":star-power:";
const prefix = "!";

const slackEvents = createEventAdapter(process.env.SIGNING_SECRET);
const slackClient = new WebClient(process.env.SLACK_TOKEN);

// slackEvents.on("app_mention", (event) => {
// 	slackClient.chat.postMessage({
// 		channel: event.channel,
// 		text: `Help Message`,
// 	});
// });

// TODO: Handle replies in thread
slackEvents.on("message", (event) => {
	let message = event.text;
	let sender = event.user;
	if (message[0] === prefix) {
		handleMessage(message);
		return;
	}
	checkIfUser(sender);
	// console.log(message);

	if (message.includes(emoji)) {
		let starsSent = message.match(/:star-power:/gi).length;
		let usersMentioned = message.match(/@\w+/gm);
		let channel = slackClient.chat;

		if (!usersMentioned) {
			channel.postMessage({
				channel: event.channel,
				text:
					"I can't give any stars because you didn't @ anyone in your shoutout",
			});
			return;
		}

		// check to make sure user has enough stars
		let flag = false;
		userHasEnoughStars(sender, starsSent).then((userHasEnough) => {
			if (!userHasEnough) {
				channel.postMessage({
					channel: event.channel,
					text: "You don't have enough stars!",
				});
				flag = true;
				return;
			}
		});

		// Check if there is an even way to split stars with multiple people
		if (usersMentioned.length > 1) {
			if (starsSent % usersMentioned !== 0) {
				channel.postMessage({
					channel: event.channel,
					text: `I can't split evenly between all the mentioned users, please try again`,
				});
				return;
			}
		}
		let sanitizedUsers = [];
		for (let user of usersMentioned) {
			if (user[0] === "@") {
				user = user.substring(1);
				sanitizedUsers.push(user);
			}
		}
		setTimeout(() => {
			if (flag === false) {
				handleTransaction(sender, sanitizedUsers, starsSent);
			}
		}, 2000);
	}
});

slackEvents.on("error", console.error);

slackEvents.start(port).then(() => {
	console.log(`Server started on port ${port}!`);
	connectToMongo();
});
