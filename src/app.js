import { SIGNING_SECRET } from "./constants";

const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");

const slackEvents = createEventAdapter(SIGNING_SECRET);
