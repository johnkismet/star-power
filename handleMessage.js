import { showLeaderboard } from "./backend/main";

export default function handleMessage(message, slackClient, event) {
	let channel = slackClient.chat;
	if (message === "!leaderboard") {
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
	}
}
