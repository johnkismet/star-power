import { checkBalance, giveStars, takeStars } from "./backend/main";
import { slackClient, emoji } from "./app";
import handleMessage from "./handleMessage";

export function postEphemeralMsg(message, event, user = event.user) {
	slackClient.chat.postEphemeral({
		channel: event.channel,
		user: user,
		text: message,
	});
}

export async function bonusSurprise(username, event) {
	//TODO: Base off of however many people are in db, and how long message is, and a little bit of random luck
	// Have multiplyer for amountGiven
	let entryChance = Math.floor(Math.random() * 1000);
	let maxBonus = 4; // Make the max 1 less than what you want the actual max to be, to account for negating 0's
	if (entryChance > 600) {
		let bonusAmount = Math.floor(Math.random() * maxBonus) + 1;
		if (Math.random() > 0.9) {
			bonusAmount += 1;
		}
		giveStars(username, bonusAmount).then((success) => {
			if (success) {
				let msg = `Wow! You got a bonus surprise of ${bonusAmount} star(s) `;
				for (let i = 0; i < bonusAmount; i++) {
					msg += emoji;
				}
				postEphemeralMsg(msg, event);
			}
		});
	}
}

export async function notEnoughStars(response, event) {
	let userBalance = await checkBalance(event.user);
	let singPluralWord = response === 1 ? "star" : "stars";
	let msg =
		response > 0
			? `Note: You didn't have enough in your balance, so I was only able to give ${response} ${singPluralWord} to each user.`
			: `Sorry, your balance is ${userBalance.stars} so I couldn't give everyone you mentioned any stars. `;
	postEphemeralMsg(msg, event);
}

export async function messageSender(event) {
	let userBalance = await checkBalance(event.user);
	let msg = `Thanks for sharing your stars! Your new balance is ${userBalance.stars} stars and you have now given ${userBalance.amountGiven} stars! DM me !help for more features`;
	postEphemeralMsg(msg, event);
}

export async function messageMentionedUsers(userList, event) {
	for (let user of userList) {
		let userBalance = await checkBalance(user);
		let message = `You got a shoutout from <@${event.user}>! Your new balance is ${userBalance.stars} stars. Write !help for more features `;

		slackClient.chat.postMessage({
			channel: user,
			text: message,
		});
		console.log(message);
	}
}

export function greetNewUser(event) {
	slackClient.chat.postMessage({
		channel: event.user,
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: "Here's two stars! :star-power: :star-power:",
					emoji: true,
				},
			},
			{
				type: "divider",
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text:
						"*Now you're all set to start using Star-Power!* Too often we get caught up in our own work and forget to recognize each other, have a little fun, and celebrate! \n \n *How to send stars:* \n Send a message in the #shoutouts channel, write out a nice message recognizing whomever and make sure to @ them and include the amount of stars you want to send to them *(using the star-power emoji)*. I'll handle the rest. \n \n>Thanks for making this @JohnAnderson :star-power:\n\n>@Adam @Joe @Max You guys are the best! :star-power: \n \n>Big thanks to @KenzieAcademy for teaching me how to code, have some stars! :star-power: :star-power: \n You can also react to messages with the star-power emote to send them a star!",
				},
			},
			{
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text:
							"DM Star-Power *!help* for more features, such as checking your balance, or seeing a leaderboard of the top users in Kenzie",
					},
				],
			},
			{
				type: "divider",
			},
		],
	});
	setTimeout(() => {
		handleMessage("!balance", slackClient, event);
	}, 500);
}

export function checkUsersMentioned(usersMentioned, event) {
	if (!usersMentioned) {
		postEphemeralMsg(
			"I can't give any stars because you didn't @ anyone in your shoutout",
			event
		);
		return;
	}

	// Guard for trying to give yourself/bot stars
	for (let user of usersMentioned) {
		if (user.includes(event.user)) {
			postEphemeralMsg("You can't send stars to yourself.", event);
			return;
		}
		if (user.includes("U01SNC0TL9W")) {
			postEphemeralMsg(
				"Thanks, but no thanks - I don't have any use for stars",
				event
			);
			return;
		}
	}

	// Check if there is an even way to split stars with multiple people
	// if (usersMentioned.length > 1) {
	// 	if (starsSent % usersMentioned.length !== 0) {
	// 		postEphemeralMsg(
	// 			`I can't split the stars evenly between all the mentioned users, please try again`,
	// 			event
	// 		);
	// 		return;
	// 	}
	// }
	// if present remove @ from beginning of username
	let sanitizedUsers = [];
	for (let user of usersMentioned) {
		if (user[0] === "@") {
			user = user.substring(1);
			sanitizedUsers.push(user);
		}
	}
	return sanitizedUsers;
}
