import { showLeaderboard } from "./backend/main";

export default function handleMessage(message) {
	if (message === "!leaderboard") {
		showLeaderboard();
	}
}
