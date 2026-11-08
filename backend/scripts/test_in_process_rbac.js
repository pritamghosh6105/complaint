const db = require('../src/models/db');
const complaintController = require('../src/controllers/complaintController');
const officerController = require('../src/controllers/officerController');
const { requireRoles } = require('../src/middleware/roleMiddleware');
const demoCredentialService = require('../src/services/demoCredentialService');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

async function runTests() {
  console.log('=== CIVICPULSE AI IN-PROCESS ROLE-BASED ACCESS CONTROL (RBAC) TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // TEST 1: roleMiddleware with Officer
  console.log('--- 1. Testing roleMiddleware ---');
  let middlewareNextCalled = false;
  const officerReq = { user: { id: 2, role: 'officer', name: 'Officer Test' } };
  const officerRes = mockRes();
  const citizenRoleGuard = requireRoles('citizen', 'admin');

  citizenRoleGuard(officerReq, officerRes, () => { middlewareNextCalled = true; });
  assert(!middlewareNextCalled && officerRes.statusCode === 403, 'requireRoles("citizen", "admin") BLOCKS officer with 403', `Status: ${officerRes.statusCode}, Body: ${JSON.stringify(officerRes.body)}`);

  // TEST 2: roleMiddleware with Citizen
  middlewareNextCalled = false;
  const citizenReq = { user: { id: 1, role: 'citizen', name: 'Citizen Test' } };
  const citizenRes = mockRes();
  citizenRoleGuard(citizenReq, citizenRes, () => { middlewareNextCalled = true; });
  assert(middlewareNextCalled, 'requireRoles("citizen", "admin") PERMITS citizen');

  // TEST 3: complaintController.createComplaint with Officer
  console.log('\n--- 2. Testing complaintController.createComplaint Defense-in-Depth ---');
  const officerCreateRes = mockRes();
  await complaintController.createComplaint(officerReq, officerCreateRes);
  assert(officerCreateRes.statusCode === 403, 'complaintController.createComplaint BLOCKS officer with 403 Forbidden', `Status: ${officerCreateRes.statusCode}, Body: ${JSON.stringify(officerCreateRes.body)}`);

  // TEST 4: complaintController.createComplaint with Citizen
  console.log('\n--- 3. Testing complaintController.createComplaint Citizen Success ---');
  const citizenCreateReq = {
    user: { id: 1, role: 'citizen', name: 'Citizen Pritam' },
    body: {
      title: 'Water Leakage in Ward 1',
      description: 'Major pipeline leak flooding residential street.',
      category: 'Water Supply',
      ward: 'Ward 1',
      severity: 'Medium'
    },
    files: {}
  };
  const citizenCreateRes = mockRes();
  await complaintController.createComplaint(citizenCreateReq, citizenCreateRes);
  assert(citizenCreateRes.statusCode === 201 || citizenCreateRes.statusCode === 200, 'Citizen can successfully create complaint', `Status: ${citizenCreateRes.statusCode}`);
  const createdComplaint = citizenCreateRes.body?.complaint;
  assert(createdComplaint && createdComplaint.tracking_id, 'Created complaint has valid tracking_id');

  // TEST 5: officerController.getMyAssignedTasks
  console.log('\n--- 4. Testing officerController.getMyAssignedTasks Queue Isolation ---');
  const deptOfficerReq = {
    user: { id: 2, role: 'officer', department_id: 1, name: 'Police Officer' }
  };
  const deptOfficerRes = mockRes();
  officerController.getMyAssignedTasks(deptOfficerReq, deptOfficerRes);
  assert(deptOfficerRes.statusCode === 200, 'Officer getMyAssignedTasks responds with 200');
  const tasks = deptOfficerRes.body?.tasks || [];
  assert(Array.isArray(tasks), `Officer tasks is an array (returned ${tasks.length} tasks)`);

  // Verify no citizen_id leak: all tasks belong to officer's dept (dept_id = 1) or officer_id = 2
  const invalidTasks = tasks.filter(t => t.department_id !== 1 && t.officer_id !== 2);
  assert(invalidTasks.length === 0, 'Officer ONLY receives tasks matching their department or officer assignment', `Found ${invalidTasks.length} unassigned tasks`);

  // TEST 6: All 30 Department Demo Officer Accounts
  console.log('\n--- 5. Testing All 30 Department Demo Officer Accounts ---');
  const demoAccounts = demoCredentialService.getAllDemoAccounts();
  const officerDemos = demoAccounts.filter(a => a.role === 'officer');
  assert(officerDemos.length >= 30, `Found ${officerDemos.length} demo officer accounts (>= 30 required)`);

  let all30BlockedByMiddleware = true;
  let all30BlockedByController = true;
  let all30HaveDepartmentId = true;

  for (const acc of officerDemos) {
    if (!acc.departmentId) {
      all30HaveDepartmentId = false;
      console.error(`Account ${acc.email} is missing departmentId!`);
    }

    const testReq = {
      user: { id: acc.id, role: 'officer', department_id: acc.departmentId, name: acc.officerName }
    };
    const testResMid = mockRes();
    citizenRoleGuard(testReq, testResMid, () => {});
    if (testResMid.statusCode !== 403) {
      all30BlockedByMiddleware = false;
      console.error(`Account ${acc.email} was NOT blocked by middleware!`);
    }

    const testResCtrl = mockRes();
    await complaintController.createComplaint(testReq, testResCtrl);
    if (testResCtrl.statusCode !== 403) {
      all30BlockedByController = false;
      console.error(`Account ${acc.email} was NOT blocked by controller!`);
    }
  }

  assert(all30HaveDepartmentId, 'All 30 department demo accounts have valid departmentId configured');
  assert(all30BlockedByMiddleware, 'All 30 department demo accounts are strictly blocked by route middleware');
  assert(all30BlockedByController, 'All 30 department demo accounts are strictly blocked by complaint controller');

  console.log(`\n========================================`);
  console.log(`TOTAL IN-PROCESS TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

