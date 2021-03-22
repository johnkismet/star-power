require("dotenv").config();

import {
	connectToMongo,
	checkIfUser,
	userHasEnoughStars,
	handleTransaction,
	checkBalance,
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

function postEphemeralMsg(text, event) {
	slackClient.chat.postEphemeral({
		channel: event.channel,
		user: event.user,
		text: text,
	});
}

async function messageSender(event) {
	let userBalance = await checkBalance(event.user);
	let message =
		"Thanks for sharing your stars! " +
		userBalance +
		" DM me !help for more features";
	postEphemeralMsg(message, event);
}

async function messageMentionedUsers(userList, event) {
	for (let user of userList) {
		let userBalance = await checkBalance(user);
		let message =
			"You got stars! " + userBalance + " DM me !help for more features";
		console.log(message);
		slackClient.chat.postEphemeral({
			channel: event.channel,
			text: message,
			user: user,
		});
	}
}

// TODO: Handle replies in thread
slackEvents.on("message", (event) => {
	let message = event.text;
	let sender = event.user;
	checkIfUser(sender);
	if (event.channel_type === "im") {
		if (message[0] === prefix) {
			handleMessage(message, slackClient, event);
			return;
		}
	}
	// console.log(message);
	if (event.channel_type === "channel") {
		if (message.includes(emoji)) {
			let starsSent = message.match(/:star-power:/gi).length;
			let usersMentioned = message.match(/@\w+/gm);
			let channel = slackClient.chat;

			if (!usersMentioned) {
				postEphemeralMsg(
					"I can't give any stars because you didn't @ anyone in your shoutout",
					event
				);
				return;
			}
			for (let x of usersMentioned) {
				if (x.includes(sender)) {
					postEphemeralMsg("You can't send stars to yourself.", event);
					return;
				}
				if (x.includes("U01SNC0TL9W")) {
					postEphemeralMsg(
						"Thanks, but no thanks - I don't have any use for stars",
						event
					);
					return;
				}
			}
			// check to make sure user has enough stars
			let flag = false;
			userHasEnoughStars(sender, starsSent).then((userHasEnough) => {
				if (!userHasEnough) {
					postEphemeralMsg(
						"You don't have enough stars :( DM me and say !balance to see how many stars you have.",
						event
					);
					flag = true;
					return;
				}
			});

			// Check if there is an even way to split stars with multiple people
			if (usersMentioned.length > 1) {
				if (starsSent % usersMentioned.length !== 0) {
					postEphemeralMsg(
						`I can't split the stars evenly between all the mentioned users, please try again`,
						event
					);
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
					handleTransaction(sender, sanitizedUsers, starsSent).then(
						(success) => {
							if (success) {
								messageSender(event);
								messageMentionedUsers(sanitizedUsers, event);
							} else {
								postEphemeralMsg(
									`I couldn't find one of the users you mentioned.`,
									event
								);
							}
						}
					);
				}
			}, 1000);
		}
	}
});

slackEvents.on("error", console.error);

slackEvents.start(port).then(() => {
	console.log(`Server started on port ${port}!`);
	connectToMongo();
});
