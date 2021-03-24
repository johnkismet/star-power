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
slackEvents.on("message", (event) => {
	let message = event.text;
	let sender = event.user;

	checkIfUser(sender).then((result) => {
		if (result === "NEW_USER") {
			greetNewUser(event);
		}
		switch (event.channel_type) {
			case "im":
				if (message[0] === prefix) {
					handleMessage(message, slackClient, event);
					return;
				}
				break;
			case "channel":
				if (message.includes(emoji)) {
					let starsSent = message.match(/:star-power:/gi).length;
					let usersMentioned = message.match(/@\w+/gm);
					// Guard for no mentioned users
					if (!usersMentioned) {
						postEphemeralMsg(
							"I can't give any stars because you didn't @ anyone in your shoutout",
							event
						);
						return;
					}
					// Guard for trying to give yourself/bot stars
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
					// check to make sure user has enough stars
					setTimeout(() => {
						userHasEnoughStars(sender, starsSent)
							.then((userHasEnough) => {
								if (!userHasEnough) {
									notEnoughStars(event);
									return false;
								}
								return true;
							})
							.then((userHasEnough) => {
								if (!userHasEnough) return;
								handleTransaction(sender, sanitizedUsers, starsSent).then(
									(success) => {
										if (success >= 0) {
											messageSender(event);
											messageMentionedUsers(sanitizedUsers, event);
											setTimeout(() => {
												bonusSurprise(sender, event);
											}, 1000);
										} else {
											postEphemeralMsg(
												`Sorry, something went wrong on my end.`,
												event
											);
										}
									}
								);
							});
					}, 1000);
				}
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
