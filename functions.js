import { checkBalance, giveStars, takeStars } from "./backend/main";
import { slackClient, emoji } from "./app";

export function postEphemeralMsg(text, event, user = event.user) {
	slackClient.chat.postEphemeral({
		channel: event.channel,
		user: user,
		text: text,
	});
}

export async function bonusSurprise(username, event) {
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
		let message = `You got a shoutout from <@${event.user}>! Your new balance is ${userBalance.stars} stars. DM me !help for more features `;
		postEphemeralMsg(message, event, user);
		console.log(message);
	}
}

export function greetNewUser(event) {
	let msg = `Here's two stars! You're ready to start using Star-Power. Head over to the #shoutouts channel and thank someone that deserves it. \n
You can also DM me "!help" to see what other features I have!
        `;
	postEphemeralMsg(msg, event);
}
