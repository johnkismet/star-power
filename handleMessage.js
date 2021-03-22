import { showLeaderboard, checkBalance } from "./backend/main";

export default function handleMessage(message, slackClient, event) {
	let channel = slackClient.chat;
	let usageMessage = `StarPower is a fun way to give praise to those who deserve it! In the #shoutouts channel just write your message to the person, make sure you @ them. And anywhere in the message write out star-power (with colon's (:) surrounding it) to give them as many stars as you want (and can afford) \n
	Example message: Shoutout to @JohnAnderson for making this! :star-power: :star-power: \n
	Usage: \n
	!leaderboard - Displays the top 5 star earners and top 5 philanthropists \n
	!balance - Shows you your star count and how many times you've given stars
	!help - Displays this message

	tip: You can send multiple shout outs at the same time and give everyone an even amount of stars! As long as Star-Power can divide it evenly you're good! \n
	e.g. "Thanks to @person1 @person2 @person3 for the help! :star-power: :star-power: :star-power:
	`;

	switch (message.toLowerCase()) {
		case "!leaderboard":
			showLeaderboard().then((leaderboard) => {
				let phils = `TOP GIVERS: \n`;
				for (let entry of leaderboard[0]) {
					phils += `${entry} \n`;
				}
				let stars = `TOP STARS: \n`;
				for (let entry of leaderboard[1]) {
					stars += `${entry} \n`;
				}

				channel.postMessage({
					channel: event.channel,
					text: phils,
				});
				channel.postMessage({
					channel: event.channel,
					text: stars,
				});
			});
			break;
		case "!balance":
			checkBalance(event.user).then((balance) => {
				channel.postMessage({
					channel: event.channel,
					text: balance,
				});
			});
			break;
		case "!help":
			channel.postMessage({
				channel: event.channel,
				text: usageMessage,
			});
			break;
		default:
			channel.postMessage({
				channel: event.channel,
				text: usageMessage,
			});
	}
}
