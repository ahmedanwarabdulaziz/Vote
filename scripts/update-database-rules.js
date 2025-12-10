/**
 * Script to update Firebase Realtime Database rules
 * Uses Firebase REST API with proper authentication
 */

const admin = require('firebase-admin');
const path = require('path');
const https = require('https');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'vote-732f7-firebase-adminsdk-fbsvc-636fbe4aad.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Read rules from file
const rulesFile = path.join(__dirname, '..', 'database.rules.json');
const rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));

async function updateRules() {
  try {
    console.log('🔐 Getting OAuth access token...');
    
    // Get access token with proper scopes
    const tokenResponse = await admin.app().options.credential.getAccessToken();
    const accessToken = tokenResponse.access_token;
    
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }
    
    console.log('✅ Access token obtained');
    console.log('📝 Updating Realtime Database rules...');
    console.log('Rules to apply:', JSON.stringify(rules, null, 2));
    
    // Use the correct Firebase REST API endpoint for Realtime Database rules
    // The endpoint format: https://[PROJECT_ID]-default-rtdb.[REGION].firebasedatabase.app/.settings/rules.json
    const projectId = 'vote-732f7';
    const databaseURL = `${projectId}-default-rtdb.firebaseio.com`;
    
    const rulesJson = JSON.stringify(rules);
    
    const options = {
      hostname: databaseURL,
      path: `/.settings/rules.json?access_token=${encodeURIComponent(accessToken)}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(rulesJson),
        'Authorization': `Bearer ${accessToken}`
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`Response status: ${res.statusCode}`);
          if (res.statusCode === 200 || res.statusCode === 204) {
            console.log('✅ Database rules updated successfully!');
            resolve(data);
          } else {
            // Try without the Authorization header (some endpoints don't need it in the header)
            console.log(`⚠️  Status ${res.statusCode}, trying alternative authentication...`);
            tryAlternativeAuth(accessToken, rules, databaseURL)
              .then(resolve)
              .catch((err) => {
                console.error('Response:', data);
                reject(new Error(`Failed: ${res.statusCode} - ${data.substring(0, 200)}`));
              });
          }
        });
      });

      req.on('error', (error) => {
        console.log('⚠️  Request error, trying alternative method...');
        tryAlternativeAuth(accessToken, rules, databaseURL)
          .then(resolve)
          .catch(reject);
      });

      req.write(rulesJson);
      req.end();
    });
  } catch (error) {
    throw error;
  }
}

async function tryAlternativeAuth(accessToken, rules, databaseURL) {
  return new Promise((resolve, reject) => {
    const rulesJson = JSON.stringify(rules);
    
    // Try with access_token only in query string
    const options = {
      hostname: databaseURL,
      path: `/.settings/rules.json?access_token=${encodeURIComponent(accessToken)}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(rulesJson)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log('✅ Rules updated successfully!');
          resolve(data);
        } else {
          reject(new Error(`Alternative method failed: ${res.statusCode} - ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(rulesJson);
    req.end();
  });
}

// Run the update
updateRules()
  .then(() => {
    console.log('\n✅ Rules update completed!');
    console.log('⚠️  Security Note: These rules allow public read/write.');
    console.log('   Add authentication for production use.');
    console.log('\n🔄 Please refresh your app to verify the connection.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Automatic update failed:', error.message);
    console.error('\n📋 Required rules (copy these):');
    console.error(JSON.stringify(rules, null, 2));
    console.error('\n📝 Manual update steps:');
    console.error('1. Open: https://console.firebase.google.com/project/vote-732f7/database/vote-732f7-default-rtdb/rules');
    console.error('2. Click "Edit rules" or replace the existing rules');
    console.error('3. Paste the JSON above');
    console.error('4. Click "Publish"');
    console.error('\n💡 Note: Realtime Database rules are typically updated via Console.');
    console.error('   The REST API endpoint may require special permissions.');
    process.exit(1);
  });
