#!/usr/bin/env node
/**
 * Test script to verify RSVP flow end-to-end
 * Tests: RSVP submission -> Host viewing applications -> Inbox display
 */

const BASE_URL = 'http://localhost:5000';

// Helper function to make authenticated requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  return { status: response.status, data, ok: response.ok };
}

async function testRSVPFlow() {
  console.log('🧪 Starting RSVP Flow Test\n');

  // Step 1: Get available events
  console.log('1️⃣ Fetching available events...');
  const eventsResult = await makeRequest('/api/events');
  
  if (!eventsResult.ok) {
    console.error('❌ Failed to fetch events:', eventsResult.data);
    return;
  }

  const events = eventsResult.data;
  if (events.length === 0) {
    console.error('❌ No events found');
    return;
  }

  const testEvent = events[0];
  console.log(`✅ Found test event: "${testEvent.title}" (ID: ${testEvent.id})`);
  console.log(`   Created by user ${testEvent.creatorId}\n`);

  // Step 2: Check current authentication status
  console.log('2️⃣ Checking authentication status...');
  const authResult = await makeRequest('/api/auth/check');
  console.log(`   Auth status: ${authResult.status} - ${JSON.stringify(authResult.data).slice(0, 100)}...\n`);

  // Step 3: Test RSVP submission (will fail without auth, that's expected)
  console.log('3️⃣ Testing RSVP submission...');
  const rsvpResult = await makeRequest(`/api/events/${testEvent.id}/participate`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'pending_approval',
      ticketQuantity: 1
    })
  });
  
  console.log(`   RSVP result: ${rsvpResult.status} - ${JSON.stringify(rsvpResult.data)}\n`);

  // Step 4: Test applications endpoint (for hosts)
  console.log('4️⃣ Testing RSVP applications endpoint...');
  const appsResult = await makeRequest('/api/events/applications');
  console.log(`   Applications result: ${appsResult.status} - ${JSON.stringify(appsResult.data)}\n`);

  // Step 5: Test connection requests endpoint
  console.log('5️⃣ Testing connection requests endpoint...');
  const connectionResult = await makeRequest('/api/connections/pending');
  console.log(`   Connection requests result: ${connectionResult.status} - ${JSON.stringify(connectionResult.data)}\n`);

  // Step 6: Test specific event applications
  console.log('6️⃣ Testing specific event applications...');
  const eventAppsResult = await makeRequest(`/api/events/${testEvent.id}/applications`);
  console.log(`   Event applications result: ${eventAppsResult.status} - ${JSON.stringify(eventAppsResult.data)}\n`);

  console.log('🏁 RSVP Flow Test Complete');
  console.log('\n📋 Summary:');
  console.log(`   • Events available: ${events.length}`);
  console.log(`   • Auth status: ${authResult.data?.authenticated ? '✅ Authenticated' : '❌ Not authenticated'}`);
  console.log(`   • RSVP submission: ${rsvpResult.ok ? '✅ Success' : '❌ Failed (expected if not auth)'}`);
  console.log(`   • Applications endpoint: ${appsResult.ok ? '✅ Success' : '❌ Failed (expected if not auth)'}`);
  console.log(`   • Connection requests: ${connectionResult.ok ? '✅ Success' : '❌ Failed (expected if not auth)'}`);
}

// Run the test
testRSVPFlow().catch(console.error);