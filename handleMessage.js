import { showLeaderboard, checkBalance, reset } from "./backend/main";

export default function handleMessage(message, slackClient, event) {
	let channel = slackClient.chat;
	let usageMessage = `StarPower is a fun way to give praise to those who deserve it! In the #shoutouts channel just write your message to the person, make sure you @ them. And anywhere in the message send the star-power emoji to give them as many stars as you want (and can afford) \n
	Example message: Shoutout to @JohnAnderson for making this! :star-power: :star-power: \n

	BIG TIP: \n
	You can also give people stars by reacting with the star-power emoji on a message! When you react to a message it sends a star to the poster's account and takes one from yours. \n
	Usage: \n
	!leaderboard - Displays the top 5 star earners and top 5 philanthropists \n
	!balance - Shows you your star count and how many times you've given stars
	!help - Displays this message

	tip: You can send multiple shout outs at the same time and give everyone an even amount of stars! As long as Star-Power can divide it evenly you're good! \n
	e.g. "Thanks to @person1 @person2 @person3 for the help! :star-power: :star-power: :star-power:
	`;
	function sendMsg(text) {
		channel.postMessage({
			channel: event.channel,
			text: text,
		});
	}
	switch (message.toLowerCase()) {
		case "!leaderboard":
			showLeaderboard().then((leaderboard) => {
				let phils = `TOP GIVERS: \n`;
				let stars = `TOP STARS: \n`;
				for (let i = 0; i < leaderboard[0].length; i++) {
					phils += `${leaderboard[0][i]} \n`;
					stars += `${leaderboard[1][i]} \n`;
				}
				sendMsg(phils);
				sendMsg(stars);
			});
			break;
		case "!balance":
			checkBalance(event.user).then((balance) => {
				let message = `
:star-power: :star-power: :star-power: \n
You have ${balance.stars} stars and you've given stars ${balance.amountGiven} times \n
In total you've had ${balance.lifetimeStars} stars since you started using Star Power! Nice work! \n
:star-power: :star-power: :star-power: \n
`;
				sendMsg(message);
			});
			break;
		case "!help":
			sendMsg(usageMessage);
			break;
		case "!reset":
			if (event.user === "U019CRDTG3S") {
				reset();
				sendMsg("Reset!");
			}
			break;
		default:
			sendMsg(usageMessage);
	}
}
