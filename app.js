require("dotenv").config();

import {
	connectToMongo,
	checkIfUser,
	giveStars,
	takeStars,
} from "./backend/main";

import { handleMessage, handleCommand } from "./handleFunction";
import { greetNewUser, postEphemeralMsg } from "./functions";

const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const port = 3000;
export const emoji = ":star-power:";
const prefix = "!";
const slackEvents = createEventAdapter(process.env.SIGNING_SECRET);
export const slackClient = new WebClient(process.env.SLACK_TOKEN);
// TODO: Handle replies in thread

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
		event.subtype === "channel_posting_permissions"
	)
		return;

	checkIfUser(sender).then((result) => {
		if (result === "NEW_USER") {
			greetNewUser(event);
		} else if (result === "NEEDS_REMINDER") {
			handleCommand("!reminder", slackClient, event);
		}
	});

	setTimeout(() => {
		switch (event.channel_type) {
			case "im":
				if (message[0] === prefix) {
					handleCommand(message, slackClient, event);
					return;
				} else {
					handleCommand("!help", slackClient, event);
				}
				break;
			case "channel":
				// This is the cheap way to make it so staff can get infinite stars to dole out since they don't participate in the reward system
				if (message === "!motherlode") {
					handleCommand(message, slackClient, event);
					return;
				}
				// the 2nd condition checks for if the message is in a thread. It's a little wonky, but the event object doesn't have any other information to use.
				if (!message.includes(emoji) && event.parent_user_id === undefined) {
					postEphemeralMsg(
						"Did you mean to include the star-power emoji in this message? \n If you want to give the people you mentioned a star please copy/paste your message and add the star-power emoji in it :) \n Otherwise ignore this message",
						event
					);
					return;
				} else if (message.includes(emoji)) {
					handleMessage(event);
				}
				break;
		}
	}, 1000);
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
