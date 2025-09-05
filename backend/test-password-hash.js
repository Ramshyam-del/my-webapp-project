const bcrypt = require('bcrypt');

// The hash from the database
const storedHash = '$2b$12$ePuB1HXNV.LK8BWwzXTYtOktfYG4gDg7sddokQcVwk4DRLenskSFu';

// Common test passwords to try
const passwordList = [
  'password',
  'password123',
  'test123',
  'testpassword',
  'Password123!',
  'Test123!',
  'admin123',
  '123456',
  'qwerty',
  'test',
  'user123',
  'Test@123'
];

async function testPasswords() {
  console.log('Testing passwords against hash:', storedHash);
  console.log('\n--- Testing Common Passwords ---');
  
  for (const password of passwordList) {
    try {
      const isMatch = await bcrypt.compare(password, storedHash);
      console.log(`Password: '${password}' -> ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
      
      if (isMatch) {
        console.log(`\n🎉 Found matching password: '${password}'`);
        return password;
      }
    } catch (error) {
      console.log(`Password: '${password}' -> ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ No matching password found from common test passwords');
  return null;
}

testPasswords();