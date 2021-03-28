import {
	userHasEnoughStars,
	handleTransaction,
	checkBalance,
	reset,
	motherlode,
	showLeaderboard,
	getUserInfo,
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

export function handleCommand(message, slackClient, event) {
	// if event.user === Star-Power return
	if (event.user === "U01SNC0TL9W") return;

	const channel = slackClient.chat;
	function sendHelpMsg() {
		channel.postMessage({
			channel: event.channel,
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text:
							"*Usage:* _must be DM'd to the StarPower bot_ \n • !leaderboard - Displays top 5 stars/philanthropists in Kenzie Academy. This is also posted weekly in Kenzie Academy \n • !balance - Displays your current account balance \n • !help - Displays this message",
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
							"*How to send stars:* \n Send a message in the #shoutouts channel, write out a nice message recognizing whomever and make sure to @ them and include the amount of stars you want to send to them. I'll handle the rest. \n \n>Thanks for making this @JohnAnderson :star-power:\n\n>@Adam @Joe @Max You guys are the best! :star-power: \n \n>Big thanks to @KenzieAcademy for teaching me how to code, have some stars! :star-power: :star-power: \n You can also react to messages with the star-power emote to send them a star!",
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
							"*Star-Power is open source!* This is a great way to start reading code and making your own contributions! Even fixing typo's/adding to the README is a great help! <https://github.com/johnkismet/star-power|Here's the Github repository>",
					},
				},
			],
		});
	}
	function sendMsg(text) {
		channel.postMessage({
			channel: event.channel,
			text: text,
		});
	}
	switch (message.toLowerCase()) {
		case "!leaderboard":
			showLeaderboard().then((leaderboard) => {
				let givers = `*TOP GIVERS:* \n`;
				let stars = `*TOP LIFETIME STARS:* \n`;
				for (let i = 0; i < leaderboard[0].length; i++) {
					givers += `#${i + 1} ${leaderboard[0][i]} \n`;
					stars += `#${i + 1} ${leaderboard[1][i]} \n`;
				}
				channel.postMessage({
					channel: event.channel,
					blocks: [
						{
							type: "header",
							text: {
								type: "plain_text",
								text: ":star-power: Kenzie Star-Power Leaderboard :star-power:",
								emoji: true,
							},
						},
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: givers,
							},
						},
						{
							type: "divider",
						},
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: stars,
							},
						},
						{
							type: "context",
							elements: [
								{
									type: "mrkdwn",
									text:
										"This list is refreshed monthly! The best way to see your name on the leaderboard is to spread the love more :heart: :kenzie:",
								},
							],
						},
					],
				});
			});

			break;
		case "!balance":
			checkBalance(event.user).then((balance) => {
				channel.postMessage({
					channel: event.user,
					blocks: [
						{
							type: "header",
							text: {
								type: "plain_text",
								text: "Your balance:",
								emoji: true,
							},
						},
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: `• Stars: ${balance.stars} \n • Times given (this month): ${balance.amountGiven} \n Overall you've had ${balance.lifetimeStars} stars and given ${balance.lifetimeGiven} times`,
							},
						},
						{
							type: "context",
							elements: [
								{
									type: "mrkdwn",
									text:
										"The best way to get more stars is to increase your times given! Spread the love :heart: :kenzie:",
								},
							],
						},
					],
				});
			});
			break;
		case "!help":
			sendHelpMsg();
			break;
		case "!reset":
			if (event.user !== "U019CRDTG3S") return;
			reset();
			sendMsg("Reset!");
			break;
		case "!reminder":
			channel.postMessage({
				channel: event.user,
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text:
								"We all sometimes get caught up in our own work and forget to recognize those around us. Here's a couple ideas for reasons to send stars: \n\n • Send a star to a coach after they help you \n • Just had a long after school study session with a friend? Send them a star for spending that time with you \n • Are you a facilitator? Send your students some stars for doing great! You can mention however many people you want to in a message and they'll each get however many stars you include \n • Send some stars to the people who go above and beyond! \n \n*Remember, you can react to anyone's message (in a public channel) to send them a star as well!*",
						},
					},
					{
						type: "divider",
					},
					{
						type: "context",
						elements: [
							{
								type: "mrkdwn",
								text:
									"Example message: 'Thanks to @Chok for founding Kenzie! :star-power:' (use the star-power emoji) ",
							},
						],
					},
				],
			});
			break;
		case "!motherlode":
			if (event.channel !== "C01SDRQFE7Q") return;
			motherlode(event.user);
			channel.postEphemeral({
				channel: event.channel,
				user: event.user,
				text: "You now have 50,000 more stars! Use them wisely.",
			});
			break;
		default:
			sendHelpMsg();
	}
}

export async function handleMessage(event) {
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

	if (message.includes("!user")) {
		// if channel !== facilitator-channel
		if (event.channel !== "C01SDRQFE7Q") return;
		if (sanitizedUsers.size < 1) {
			postEphemeralMsg("You must include a user", event);
		}
		getUserInfo(sanitizedUsers);
	}

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
