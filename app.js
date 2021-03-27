require("dotenv").config();

import {
	connectToMongo,
	checkIfUser,
	userHasEnoughStars,
	handleTransaction,
	giveStars,
	takeStars,
} from "./backend/main";
import {
	bonusSurprise,
	notEnoughStars,
	messageMentionedUsers,
	messageSender,
	greetNewUser,
	postEphemeralMsg,
	checkUsersMentioned,
} from "./functions";
import handleMessage from "./handleMessage";

const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const port = 3000;
export const emoji = ":star-power:";
const prefix = "!";

const slackEvents = createEventAdapter(process.env.SIGNING_SECRET);
export const slackClient = new WebClient(process.env.SLACK_TOKEN);
// TODO: Handle replies in thread

async function asyncFunc(event) {
	let message = event.text;
	let sender = event.user;
	let flag = false;

	let starsSent = message.match(/:star-power:/gi).length;
	let usersMentioned = message.match(/@\w+/gm);
	if (!usersMentioned) {
		postEphemeralMsg(
			"I can't give any stars because you didn't @ anyone in your shoutout",
			event
		);
		return false;
	}
	let sanitizedUsers = [];
	for (let user of usersMentioned) {
		if (user[0] === "@") {
			user = user.substring(1);
			sanitizedUsers.push(user);
		}
	}
	sanitizedUsers = new Set(sanitizedUsers);
	if (sanitizedUsers.size > 1) starsSent = starsSent * sanitizedUsers.size;

	try {
		await checkUsersMentioned(sanitizedUsers, event);
		let response = await userHasEnoughStars(sender, starsSent);
		if (response !== true) {
			// Determine how many stars can be sent to each mentioned user when the sender doesn't have as much as they tried to send
			if (sanitizedUsers.size > 1) {
				if (response !== 0) {
					starsSent = Math.floor(response / sanitizedUsers.size);
				} else {
					starsSent = 0;
				}
				// this flag tells handleTransaction that there were > 1 mentionedUsers, so it needs to do some extra calculations to figure out how much to take from the sender vs how much to give to each user.
				flag = true;
			} else {
				starsSent = response;
			}
			notEnoughStars(starsSent, event);
			if (starsSent === 0) return;
		}
		const success = await handleTransaction(
			sender,
			sanitizedUsers,
			starsSent,
			flag
		);

		if (success >= 0) {
			messageSender(event);
			messageMentionedUsers(sanitizedUsers, event);
			setTimeout(() => {
				bonusSurprise(sender, event);
			}, 1000);
		} else {
			postEphemeralMsg(`Sorry, something went wrong on my end.`, event);
		}
	} catch (err) {
		console.log(err);
		return;
	}
}
slackEvents.on("message", async (event) => {
	let message = event.text;
	let sender = event.user;
	if (
		event.subtype === "message_changed" ||
		event.subtype === "message_deleted" ||
		event.subtype === "bot_message" ||
		event.subtype === "channel_archive" ||
		event.subtype === "channel_join" ||
		event.subtype === "channel_leave" ||
		event.subtype === "channel_name" ||
		event.subtype === "channel_topic" ||
		event.subtype === "channel_unarchive" ||
		event.subtype === "file_mention" ||
		event.subtype === "asd" ||
		event.subtype === "channel_posting_permissions"
	)
		return;
	checkIfUser(sender).then((result) => {
		if (result === "NEW_USER") {
			greetNewUser(event);
		}
		// console.log(event);
		switch (event.channel_type) {
			case "im":
				if (message[0] === prefix) {
					handleMessage(message, slackClient, event);
					return;
				} else {
					handleMessage("!help", slackClient, event);
				}
				break;
			case "channel":
				// This is the cheap way to make it so staff can get infinite stars to dole out since they don't participate in the reward system
				if (message === "!motherlode") {
					handleMessage(message, slackClient, event);
					return;
				}
				if (!message.includes(emoji) && event.parent_user_id === undefined) {
					postEphemeralMsg(
						"Did you mean to include the star-power emoji in this message? If you want to give the people you mentioned a star please copy/paste your message and add the star-power emoji in it :)",
						event
					);
					return;
				} else if (message.includes(emoji)) {
					asyncFunc(event);
				}

				// check to make sure user has enough stars
				// setTimeout(() => {

				// }, 1000);
				break;
		}
	});
});

slackEvents.on("reaction_added", (event) => {
	// Guards for adding emojis on your posts/bot posts
	if (event.user === event.item_user || "U01SNC0TL9W" === event.item_user)
		return;
	if (event.reaction === "star-power") {
		// Check if user before giving stars. if they are not a user wait 1 second for the creation to go through.
		checkIfUser(event.item_user).then((result) => {
			if (result === "NEW_USER") {
				setTimeout(() => {
					giveStars(event.item_user, 1);
				}, 1000);
			} else {
				giveStars(event.item_user, 1);
			}
		});
	}
});

slackEvents.on("reaction_removed", (event) => {
	if (event.user === event.item_user) return;
	if ("U01SNC0TL9W" === event.item_user) return;

	if (event.reaction === "star-power") {
		// 3rd parameter to skip the amountGiven
		takeStars(event.item_user, 1, true);
	}
});

slackEvents.on("error", console.error);

slackEvents.start(process.env.PORT || port).then(() => {
	console.log(`Server started on port ${port}!`);
	connectToMongo();
});
