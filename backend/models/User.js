const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: String,
	stars: Number,
	amountGiven: Number,
});
export const User = mongoose.model("User", userSchema);
