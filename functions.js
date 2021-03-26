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

export async function notEnoughStars(event) {
	let userBalance = await checkBalance(event.user);
	let msg = `I'm sorry, you don't have enough stars in your account. `;
	let balanceMsg =
		userBalance.stars === 1
			? "Your balance: 1 star"
			: `Your balance: ${userBalance.stars} stars`;
	msg += balanceMsg;
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
				type: "section",
				text: {
					type: "mrkdwn",
					text:
						"*Now you're all set to start using Star-Power!* Too often we get caught up in our own work and forget to recognize each other, have a little fun, and celebrate! \n \n • In the #shoutouts channel send your praise, just @ the people you're recognizing and include the star-power emoji. Each emoji you send will come from your balance and go into theirs. Like this: \n>Shout out to @JohnAnderson for making Star-Power! :star-power: \n • React to any message with :star-power: to send a free star to the poster",
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
	if (usersMentioned.length > 1) {
		if (starsSent % usersMentioned.length !== 0) {
			postEphemeralMsg(
				`I can't split the stars evenly between all the mentioned users, please try again`,
				event
			);
			return;
		}
	}
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
