const bcrypt = require('bcrypt');

async function generateHash() {
  try {
    const password = 'Rejin@123';
    const saltRounds = 12;
    
    console.log('🔧 Generating hash for password:', password);
    
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Generated hash:', hash);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification:', isValid);
    
    // Test against existing hash
    const existingHash = '$2b$12$Ihvzp7l9I2fYDosie1VRUeCp2UZKExbEiNBrUs/SusdtQRSMpyP9.';
    const isExistingValid = await bcrypt.compare(password, existingHash);
    console.log('Existing hash verification:', isExistingValid);
    
    // Try different variations
    const variations = ['Rejin@123', 'rejin@123', 'REJIN@123', 'Rejin123', 'rejin123'];
    
    console.log('\n🧪 Testing password variations against existing hash:');
    for (const variation of variations) {
      const result = await bcrypt.compare(variation, existingHash);
      console.log(`${variation}: ${result}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateHash();