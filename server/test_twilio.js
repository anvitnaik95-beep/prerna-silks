// Direct Twilio test - run from server directory
require('dotenv').config();
const twilio = require('twilio');

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_SMS = process.env.TWILIO_FROM_SMS;
const FROM_WA = process.env.TWILIO_FROM_WHATSAPP || '+14155238886';
const TO = '+917019461619';

console.log('=== TWILIO DIAGNOSTIC ===');
console.log('SID:', SID ? SID.substring(0, 10) + '...' : 'MISSING!');
console.log('TOKEN:', TOKEN ? TOKEN.substring(0, 6) + '...' : 'MISSING!');
console.log('FROM_SMS:', FROM_SMS || 'MISSING!');
console.log('FROM_WA:', FROM_WA);
console.log('TO:', TO);
console.log('');

if (!SID || !TOKEN) {
  console.log('FATAL: Twilio credentials missing from .env');
  process.exit(1);
}

const client = twilio(SID, TOKEN);

async function test() {
  // Test 1: SMS
  console.log('--- Test 1: Sending SMS ---');
  try {
    const msg = await client.messages.create({
      body: 'Prerna Silks TEST: SMS is working!',
      from: FROM_SMS,
      to: TO
    });
    console.log('SMS SUCCESS! SID:', msg.sid, 'Status:', msg.status);
  } catch (err) {
    console.error('SMS FAILED!');
    console.error('  Code:', err.code);
    console.error('  Message:', err.message);
    console.error('  More Info:', err.moreInfo || 'N/A');
  }

  console.log('');

  // Test 2: WhatsApp
  console.log('--- Test 2: Sending WhatsApp ---');
  try {
    const msg = await client.messages.create({
      body: 'Prerna Silks TEST: WhatsApp is working!',
      from: `whatsapp:${FROM_WA}`,
      to: `whatsapp:${TO}`
    });
    console.log('WHATSAPP SUCCESS! SID:', msg.sid, 'Status:', msg.status);
  } catch (err) {
    console.error('WHATSAPP FAILED!');
    console.error('  Code:', err.code);
    console.error('  Message:', err.message);
    console.error('  More Info:', err.moreInfo || 'N/A');
  }

  // Test 3: Check account info
  console.log('\n--- Test 3: Account Info ---');
  try {
    const account = await client.api.accounts(SID).fetch();
    console.log('Account Status:', account.status);
    console.log('Account Type:', account.type);
    console.log('Account Name:', account.friendlyName);
  } catch (err) {
    console.error('Account fetch failed:', err.message);
  }
}

test();
