const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: String,
	stars: Number,
	amountGiven: Number,
	lifetimeStars: Number,
	lifetimeGiven: Number,
	needsReminder: Boolean,
});
export const User = mongoose.model("User", userSchema);
