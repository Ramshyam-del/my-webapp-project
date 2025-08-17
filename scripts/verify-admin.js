#!/usr/bin/env node

/**
 * Admin Authentication Verification Script
 * 
 * Usage:
 * 1. Start backend: npm run start:backend
 * 2. Get a JWT token from Supabase login
 * 3. Run: node scripts/verify-admin.js <JWT_TOKEN>
 */

const fetch = require('node-fetch');

async function verifyAdmin(token) {
  if (!token) {
    console.log('❌ No token provided');
    console.log('Usage: node scripts/verify-admin.js <JWT_TOKEN>');
    console.log('Get token from: localStorage.getItem("sb-access-token") in browser console');
    return;
  }

  try {
    console.log('🔍 Testing admin authentication...');
    
    const response = await fetch('http://localhost:4001/api/admin/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok && data.ok) {
      console.log('✅ Admin authentication successful!');
      console.log('👤 User:', data.user);
    } else {
      console.log('❌ Admin authentication failed');
      console.log('📄 Response:', data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Get token from command line argument
const token = process.argv[2];
verifyAdmin(token);
