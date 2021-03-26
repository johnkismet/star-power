import { showLeaderboard, checkBalance, reset } from "./backend/main";

export default function handleMessage(message, slackClient, event) {
	if (event.user === "U01SNC0TL9W") return;
	let channel = slackClient.chat;
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
							"*How to send stars:* \n Send a message in the #shoutouts channel, write out a nice message recognizing whomever and make sure to @ them and include the amount of stars you want to send to them. I'll handle the rest. \n \n>Thanks for making this @JohnAnderson :star-power:\n\n>@Adam @Joe @Max You guys are the best! :star-power: :star-power: :star-power: \n You can also react to messages with the star-power emote to send them a star!",
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
				let stars = `*TOP STARS:* \n`;
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
			if (event.user === "U019CRDTG3S") {
				reset();
				sendMsg("Reset!");
			}
			break;
		default:
			sendHelpMsg();
	}
}
