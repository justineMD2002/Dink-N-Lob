#!/usr/bin/env node

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

console.log('🔐 Generating encryption key for booking references...\n')

// Generate a secure 32-byte key
const key = crypto.randomBytes(32).toString('hex')

console.log('✅ Generated encryption key:')
console.log('━'.repeat(80))
console.log(key)
console.log('━'.repeat(80))
console.log('\n📝 Add this to your .env.local file:\n')
console.log(`BOOKING_ENCRYPTION_KEY=${key}`)
console.log('\n⚠️  IMPORTANT:')
console.log('   - Keep this key secret!')
console.log('   - Never commit it to version control')
console.log('   - Use different keys for development and production')
console.log('   - Store production key securely (e.g., Vercel env vars)\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')

  if (envContent.includes('BOOKING_ENCRYPTION_KEY=')) {
    console.log('⚠️  Warning: BOOKING_ENCRYPTION_KEY already exists in .env.local')
    console.log('   If you replace it, old encrypted references will stop working.')
  } else {
    // Offer to append to .env.local
    console.log('💡 Would you like to add this to .env.local automatically?')
    console.log('   Run: echo "BOOKING_ENCRYPTION_KEY=' + key + '" >> .env.local')
  }
} else {
  console.log('💡 Create .env.local file and add the key:')
  console.log('   echo "BOOKING_ENCRYPTION_KEY=' + key + '" > .env.local')
}

console.log('\n🚀 After adding the key, restart your development server.\n')
