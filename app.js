require("dotenv").config();

import {
	connectToMongo,
	checkIfUser,
	giveStars,
	takeStars,
	setLatestTimestamp,
	getUserInfo,
} from "./backend/main";

import { handleMessage, handleCommand } from "./handleFunction";
import { greetNewUser, postEphemeralMsg, fetchMessage } from "./functions";

const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const { createMessageAdapter } = require("@slack/interactive-messages");

const port = 3000;
export const emoji = ":star-power:";
const prefix = "!";
const slackEvents = createEventAdapter(process.env.SIGNING_SECRET);
const slackInteractions = createMessageAdapter(process.env.SIGNING_SECRET);
export const slackClient = new WebClient(process.env.SLACK_TOKEN);
console.log(slackClient.users.identity);

slackEvents.on("message", async (event) => {
	/*
	Overall message flow:
	1. Check if sender is a user in the db
	2. Check if message includes Star-Power emoji (unless it's in a thread)
	3. Sanitize users mentioned then check them
	4. Check if sender has enough stars
	5. Determine how many stars to take/give
	6. Handle the transaction
		a. Take stars from sender
		b. Give stars to users mentioned
	*/
	let message = event.text;
	let sender = event.user;
	// console.log(event);
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
			// result == "NEEDS_REMINDER" after their second message
		} else if (result === "NEEDS_REMINDER") {
			handleCommand("!reminder", slackClient, event);
		}
	});
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
			if (
				!message.includes(emoji) &&
				event.parent_user_id === undefined &&
				event.channel !== "C01SDRQFE7Q"
			) {
				slackClient.chat.postEphemeral({
					channel: event.channel,
					user: event.user,
					blocks: [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text:
									"I noticed you didn't include the Star-Power emoji in your message! Would you like me to send one star to the user(s) you mentioned?",
							},
						},
						{
							type: "actions",
							elements: [
								{
									type: "button",
									text: {
										type: "plain_text",
										text: "Yes, send one",
										emoji: true,
									},
									value: "yes",
									action_id: "yes-1",
								},
							],
						},
						{
							type: "actions",
							elements: [
								{
									type: "button",
									text: {
										type: "plain_text",
										text: "No, carry on",
										emoji: true,
									},
									value: "no",
									action_id: "no-0",
								},
							],
						},
					],
				});
				setLatestTimestamp(event);
				return;
			} else if (message.includes(emoji)) {
				handleMessage(event);
			}
			break;
	}
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

slackInteractions.action({ type: "button" }, async (payload, respond) => {
	// Logs the contents of the action to the console
	const buttonResponse = payload.actions[0].action_id;

	if (buttonResponse === "no-0") {
		respond({ text: "Cool, just checking!" });
	} else if (buttonResponse === "yes-1") {
		/*
		1. Get users latestTs object info
		2. Invoke fetchMessage to get the text (and users mentioned)
		3. Make an object  {
			text: text,
			user: user,
			channel: channel,
		}
		4. Invoke handleMessage with that object replacing the event
		*/

		(async () => {
			let userInfo = await getUserInfo(payload.user.id);
			let message = await fetchMessage(userInfo.id, userInfo.ts);
			message += ":star-power:";
			let info = {
				text: message,
				user: payload.user.id,
				channel: payload.container.channel_id,
			};
			handleMessage(info);
		})();

		respond({
			text:
				"Great, I've sent 1 star. Next time please include the amount of star-power emoji's that you want to send in your message :) ",
		});
	}

	// Send an additional message to the whole channel
	// doWork()
	//   .then(() => {
	//   })
	//   .catch((error) => {
	// 	respond({ text: 'Sorry, there\'s been an error. Try again later.' });
	//   });

	// If you'd like to replace the original message, use `chat.update`.
	// Not returning any value.
});

slackEvents.on("error", console.error);
slackEvents.start(process.env.PORT || port).then(() => {
	console.log(`Server started on port ${port}!`);
	connectToMongo();
});

const interactivePort = 8080;
(async () => {
	// Start the built-in server
	const server = await slackInteractions.start(interactivePort);

	// Log a message when the server is ready
	console.log(`Listening for events on ${server.address().port}`);
})();
