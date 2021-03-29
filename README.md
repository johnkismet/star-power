## 🌟 Star Power 🌟

**Star Power is a Slack bot built for my technical school, Kenzie Academy.**

Star Power brings together your community and encourages praise - because that's always nice.

## How to use

In Star Power's dedicated shoutout channel users can give praise to whomever they want to by @ing thing and including :star-power: anywhere in the message.

> Shoutout to @JohnAnderson for building this bot! :star-power:

> Big thanks to @KenzieAcademy for teaching me how to code, have some stars! :star-power: :star-power:

> @Adam @Joe @Zach You guys are the best! :star-power:

_You can mention multiple people and each of them will receive however many stars you include in the message. So in this example Adam, Joe, and Zach each got 1 star (and the sender withdrew 3 stars)_

### Don't forget reactions!

Users can also react on any message with :star-power: to give a freebie star to the poster!

## Features

- !leaderboard

  - Displays 2 leaderboards for the top 5 people with the most stars and the most donations given.

- !balance

  - Displays your current balance and how many times you've donated

- !help

  - Displays this help message

- !reset

  - This command is ran once a month automatically. It will go through every user in the db and set their amountGiven to 0 and give them 5 stars

- !motherlode

  - For use by staff (not coaches) to increase their star count so they can distribute stars to their students. This will not show up on the leaderboard

## Setup & Development

For local development:

You will need collaborator status on the Star-Power app page to run the bot

1. Clone this repo

2. NPM install while inside the repo directory

3. Set up enviroment variables. Must have MONGO_URI, SIGNING_SECRET, and SLACK_TOKEN

4. `npm run dev` to start nodemon development

   a. Make sure you do this before trying to the next steps, or else you may be confused by ngrok receiving the slack events but the bot isn't working.

5. Use [Ngrok](https://ngrok.com/) to set up localhost tunnel

   a. Syntax: `ngrok http { desired port number }`
   
6. Take the HTTPS forwarding address and change the Request URL on the [Slack Event Subscriptions page](https://api.slack.com/apps/A01SB6HNPCZ/event-subscriptions?)

   a. Make sure you append /slack/events to the end of the forwarding address
   
   b. Also make sure Slack can verify the link
   
## Reward Ideas

If you have an idea you'd like to contribute DM John Anderson on Slack!

Also, please note these are just brainstorm ideas. I understand some of these may not be viable, but I see value in listing them anyways.

Lastly, StarPower shouldn't need rewards to thrive. Think of Reddit, there's hardly any use for Karma but that system still works well. So even if we never offer any of these rewards it should be okay.

**--- No money necessary ---**

- Get access to a special members-only slack channel (The Gold Lounge)

- The gold lounge could have scheduled online game days (like Jackbox, chess, etc)

- There could also be scheduled movie nights (using a watch-together app/website)

- It could have scheduled contests between members

- 10 extra credit points (redeemable once)

- IOU for one rubric point (under a certain amount of points to the assignment)

- They get to shout out something on Kenzie social media

- Chok gets a pie in the face (or something like that. This would be worth 1,000 stars and everyone can put their stars in the pool)

- Be host in your facilitator's zoom call

- Choose one group member for upcoming group project

- Lunch with Chok (or some other big name.)

- Facilitator (or higher) shaves his beard (would need a volunteer)

**--- Involves money ---**

Alternatively, people could buy a raffle ticket to get a chance to get one of these rewards each month.

- Kenzie makes a donation to a charity in students name - (1 star = 10 pennies)

- Get Kenzie merch

- Get a doordash order

- $10 credit for a udemy/learning course
