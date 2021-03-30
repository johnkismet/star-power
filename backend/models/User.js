const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: String,
	stars: Number,
	amountGiven: Number,
	lifetimeStars: Number,
	lifetimeGiven: Number,
	needsReminder: Boolean,
	latestTs: Object,
});
export const User = mongoose.model("User", userSchema);
