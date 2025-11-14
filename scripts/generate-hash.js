const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = process.argv[2];
  
  if (!password) {
    console.error('Usage: node generate-hash.js <password>');
    process.exit(1);
  }
  
  const hash = await bcrypt.hash(password, 12);
  console.log('Hash generated successfully');
  console.log('Hash:', hash);
  
  // Test the hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash validation:', isValid);
}

generateHash().catch(console.error);