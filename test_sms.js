const twilio = require('twilio');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function test() {
  try {
    const msg = await client.messages.create({
      body: 'Test message from Prerna Silks',
      from: process.env.TWILIO_FROM_SMS,
      to: '+917019461619' // Assuming this is the user's number
    });
    console.log('Success:', msg.sid);
  } catch (err) {
    console.error('Twilio Error:', err.message);
  }
}
test();
