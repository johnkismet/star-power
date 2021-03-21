require("dotenv").config();
const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const port = 3000;

const slackEvents = createEventAdapter(process.env.SIGNING_SECRET);
const slackClient = new WebClient(process.env.SLACK_TOKEN);

slackEvents.on("app_mention", (event) => {
	console.log(`Got message from user ${event.user}: ${event.text}`);
	(async () => {
		try {
			await slackClient.chat.postMessage({
				channel: event.channel,
				text: `Hello <@${event.user}>! :tada:`,
			});
		} catch (error) {
			console.log(error.data);
		}
	})();
});

slackEvents.on("message", (event) => {
	let message = event.text;
	if (message.includes(":star-power:")) {
		slackClient.chat.postMessage({
			channel: event.channel,
			text: "You said the thing!!!",
		});
	}
});

slackEvents.on("error", console.error);

slackEvents.start(port).then(() => {
	console.log(`Server started on port ${port}!`);
});
