require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models/db');
const demoCredentialService = require('../src/services/demoCredentialService');

/**
 * CivicPulse AI – Secure 30 Department Demo Officer Accounts Seed Script
 * 
 * Generates and synchronizes 30 unique departmental accounts with:
 * - Scoped field officer privileges
 * - Standard bcrypt hashing (never storing plaintext in DB)
 * - Unique deterministic temporary passwords
 * - Administrative setup table display
 */

async function seedDemoOfficers() {
  console.log('\n================================================================');
  console.log('🏛️  CIVICPULSE AI – 30 DEPARTMENT DEMO OFFICER ACCOUNTS SEED');
  console.log('================================================================');
  console.log(`Demo Access Secret: ${process.env.DEMO_CREDENTIAL_ACCESS_SECRET ? '[CONFIGURED IN .ENV]' : '[USING DEFAULT SECRET]'}`);

  const accounts = demoCredentialService.getAllDemoAccounts();
  const syncResult = demoCredentialService.seedOrSyncDemoAccounts(db);

  console.log(`\nSynchronization Result:`, syncResult);
  console.log('\n-----------------------------------------------------------------------------------------------------------------');
  console.log('| ID | Officer ID     | Department Name                     | Login Email                  | Temp Demo Password  |');
  console.log('-----------------------------------------------------------------------------------------------------------------');

  accounts.forEach((acc, index) => {
    const idStr = String(index + 1).padStart(2, ' ');
    const officerIdStr = acc.officerId.padEnd(14, ' ');
    const nameStr = acc.name.slice(0, 35).padEnd(35, ' ');
    const emailStr = acc.email.padEnd(28, ' ');
    const pwStr = acc.tempPassword.padEnd(19, ' ');
    console.log(`| ${idStr} | ${officerIdStr} | ${nameStr} | ${emailStr} | ${pwStr} |`);
  });

  console.log('-----------------------------------------------------------------------------------------------------------------');
  console.log(`\n✓ All ${accounts.length} departmental accounts seeded with bcrypt password hashing.`);
  console.log('✓ Plaintext passwords are NEVER saved in MongoDB or database.json.');
  console.log('✓ Each account has isDemoAccount: true and accountType: "DEMO".\n');
}

seedDemoOfficers().catch(err => {
  console.error('Seed script error:', err);
  process.exit(1);
});
