require("dotenv").config();

import {
	connectToMongo,
	checkIfUser,
	userHasEnoughStars,
	handleTransaction,
	checkBalance,
	giveStars,
	takeStars,
} from "./backend/main";
import handleMessage from "./handleMessage";

const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const port = 3000;
const emoji = ":star-power:";
const prefix = "!";

const slackEvents = createEventAdapter(process.env.SIGNING_SECRET);
const slackClient = new WebClient(process.env.SLACK_TOKEN);

function postEphemeralMsg(text, event, user = event.user) {
	slackClient.chat.postEphemeral({
		channel: event.channel,
		user: user,
		text: text,
	});
}

async function bonusSurprise(username, event) {
	let entryChance = Math.floor(Math.random() * 1000);
	let maxBonus = 4; // Make the max 1 less than what you want the actual max to be, to account for negating 0's
	if (entryChance > 600) {
		let bonusAmount = Math.floor(Math.random() * maxBonus) + 1;
		if (Math.random() > 0.9) {
			bonusAmount += 1;
		}
		giveStars(username, bonusAmount).then((success) => {
			if (success) {
				postEphemeralMsg(
					`Wow! You got a bonus surprise of ${bonusAmount} star(s) :D`,
					event
				);
			}
		});
	}
}

async function messageSender(event) {
	let userBalance = await checkBalance(event.user);
	let msg = `Thanks for sharing your stars! Your new balance is ${userBalance.stars} stars and you have now given ${userBalance.amountGiven} stars! DM me !help for more features`;
	postEphemeralMsg(msg, event);
}

async function notEnoughStars(event) {
	let userBalance = await checkBalance(event.user);
	let msg = `I'm sorry, you don't have enough stars in your account.`;
	let balanceMsg =
		userBalance.stars === 1
			? "Your balance: 1 star"
			: `Your balance: ${userBalance.stars} stars`;
	msg += balanceMsg;
	postEphemeralMsg(msg, event);
}

async function messageMentionedUsers(userList, event) {
	for (let user of userList) {
		let userBalance = await checkBalance(user);
		let message = `You got a shoutout from <@${event.user}>! Your new balance is ${userBalance.stars} stars. DM me !help for more features `;
		postEphemeralMsg(message, event, user);
		console.log(message);
	}
}

// TODO: Handle replies in thread
slackEvents.on("message", (event) => {
	let message = event.text;
	let sender = event.user;
	checkIfUser(sender).then(() => {
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
										if (success) {
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
	if (event.user === event.item_user) return;
	if ("U01SNC0TL9W" === event.item_user) return;
	if (event.reaction === "star-power") {
		giveStars(event.item_user, 1);
		takeStars(event.user, 1);
	}
});

slackEvents.on("reaction_removed", (event) => {
	if (event.user === event.item_user) return;
	if ("U01SNC0TL9W" === event.item_user) return;

	if (event.reaction === "star-power") {
		// third parameter to signify the function should decrement giveAmount
		giveStars(event.user, 1, true);
		// 3rd parameter to skip the amountGiven
		takeStars(event.item_user, 1, true);
	}
});

slackEvents.on("error", console.error);

slackEvents.start(port).then(() => {
	console.log(`Server started on port ${port}!`);
	connectToMongo();
});
