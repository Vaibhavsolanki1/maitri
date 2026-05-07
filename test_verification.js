const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- Phase 1: Backend Startup ---');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    console.log('1.4 Health endpoint works:', data.ok ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('1.4 Health endpoint works: FAIL', e.message);
  }

  console.log('\n--- Phase 2: Input Validation ---');
  try {
    const res = await fetch(`${BASE_URL}/chat`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({}) });
    console.log('2.1 Empty chat message rejected:', res.status === 400 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('2.1 Empty chat message rejected: FAIL', e.message);
  }

  try {
    const longMsg = 'a'.repeat(3000);
    const res = await fetch(`${BASE_URL}/chat`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: longMsg }) });
    console.log('2.2 Oversized message rejected:', res.status === 400 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('2.2 Oversized message rejected: FAIL', e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/chat`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: 'hi' }) });
    const data = await res.json();
    console.log('2.3 Valid chat accepted:', data.reply ? 'PASS' : 'FAIL');
    console.log('2.4 userName defaults to Guest:', data.userName === 'Guest' ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('2.3 & 2.4 Valid chat / default user: FAIL', e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/report`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ report: 'a'.repeat(700) }) });
    console.log('2.5 Report max 600 chars rejected:', res.status === 400 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('2.5 Report max 600 chars rejected: FAIL', e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/yoga`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ score: 9999, pose: 'mountain', duration: 10 }) });
    console.log('2.6 Yoga score capped at 100 rejected:', res.status === 400 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('2.6 Yoga score capped at 100 rejected: FAIL', e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/emergency`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({}) });
    console.log('2.7 Emergency with no body accepted:', res.status === 200 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('2.7 Emergency with no body accepted: FAIL', e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/chat`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: 'hi', vitals: { hr: 999 } }) });
    console.log('2.8 Invalid vitals rejected:', res.status === 400 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('2.8 Invalid vitals rejected: FAIL', e.message);
  }

  console.log('\n--- Phase 3: Tier System ---');
  try {
    const res = await fetch(`${BASE_URL}/api/weekly-report?userName=Aksh`);
    console.log('3.4 Weekly report blocked for free:', res.status === 403 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('3.4 Weekly report blocked for free: FAIL', e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/weekly-report?userName=Aksh`, { headers: { 'x-user-tier': 'pro' } });
    console.log('3.5 Weekly report works for pro:', res.status === 200 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('3.5 Weekly report works for pro: FAIL', e.message);
  }

  console.log('\n--- Phase 5: Other Endpoints ---');
  try {
    const res = await fetch(`${BASE_URL}/report`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ report: 'Good day', tags: ['Grateful'] }) });
    const data = await res.json();
    console.log('5.1 Submit report works:', data.ok ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('5.1 Submit report works: FAIL', e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/reports?userName=Guest`);
    const data = await res.json();
    console.log('5.2 Get reports works:', Array.isArray(data.items) ? 'PASS' : 'FAIL');
  } catch (e) {
    console.log('5.2 Get reports works: FAIL', e.message);
  }
}

runTests();
