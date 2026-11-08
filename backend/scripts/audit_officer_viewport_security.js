const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'citizen_complaint_portal_secret_key_2026';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  { width: 320, height: 800, name: '320x800 Mobile XS' },
  { width: 360, height: 800, name: '360x800 Mobile S' },
  { width: 375, height: 812, name: '375x812 iPhone X' },
  { width: 390, height: 844, name: '390x844 iPhone 12/13/14' },
  { width: 393, height: 873, name: '393x873 Vivo Y200e' },
  { width: 430, height: 932, name: '430x932 iPhone 14 Pro Max' },
  { width: 768, height: 1024, name: '768x1024 iPad Portrait' },
  { width: 1024, height: 768, name: '1024x768 iPad Landscape' },
  { width: 1280, height: 800, name: '1280x800 Laptop' },
  { width: 1366, height: 768, name: '1366x768 Laptop HD' },
  { width: 1440, height: 900, name: '1440x900 Desktop Pro' }
];

async function runViewportAudit() {
  console.log('=== STARTING MULTI-VIEWPORT OFFICER REPORTING UI AUDIT ===\n');

  const tempProfile = path.join(os.tmpdir(), `civic_puppeteer_${Date.now()}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      userDataDir: tempProfile,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  } catch (err) {
    console.error('Could not launch Chrome:', err.message);
    process.exit(1);
  }

  const page = await browser.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Load the app
    console.log('--- Loading CivicPulse AI at localhost:3000 ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });

    // Set officer in localStorage directly and refresh
    console.log('--- Simulating Officer Login (Roads & Public Works Officer) ---');
    const officerToken = jwt.sign({
      id: 5,
      name: 'Dr. Alok Mukherjee (Demo)',
      email: 'demo.rpw@civicpulse.gov.in',
      officer_id: 'DEMO-RPW-005',
      role: 'officer',
      department_id: 5,
      department_name: 'Roads & Public Works',
      ward: 'West Bengal State Operations'
    }, JWT_SECRET, { expiresIn: '7d' });

    await page.evaluate((tok) => {
      const officerUser = {
        id: 5,
        name: 'Dr. Alok Mukherjee (Demo)',
        email: 'demo.rpw@civicpulse.gov.in',
        officer_id: 'DEMO-RPW-005',
        role: 'officer',
        department_id: 5,
        department_name: 'Roads & Public Works',
        ward: 'West Bengal State Operations'
      };
      localStorage.setItem('civic_user', JSON.stringify(officerUser));
      localStorage.setItem('civic_token', tok);
    }, officerToken);

    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // 2. Loop through all 11 viewports
    for (const vp of VIEWPORTS) {
      console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.width < 768 });
      await new Promise(r => setTimeout(r, 400));

      // Test Officer Dashboard
      await page.evaluate(() => {
        if (window.__CIVICPULSE_NAVIGATE__) {
          window.__CIVICPULSE_NAVIGATE__('officer-dashboard');
        }
      });
      await new Promise(r => setTimeout(r, 600));

      // Scan page for citizen reporting text/elements
      const officerPageAudit = await page.evaluate(() => {
        const pageText = document.body.innerText || '';
        const lowerText = pageText.toLowerCase();

        // Check prohibited keywords on officer page
        const hasReportAnIssue = lowerText.includes('report an issue') || lowerText.includes('report field issue');
        const hasReportedByMe = lowerText.includes('reported by me');
        const hasGrievanceForm = lowerText.includes('report a civic grievance') || lowerText.includes('incident & issue summary');

        // Check navigation items
        const allNavButtons = Array.from(document.querySelectorAll('nav button, aside button, .mobile-bottom-nav button'));
        const navLabels = allNavButtons.map(b => (b.innerText || '').trim().toLowerCase());
        const hasReportNav = navLabels.some(l => l.includes('report') && !l.includes('log'));

        // Check if NewComplaint form elements exist
        const hasComplaintTitleInput = Boolean(document.querySelector('input[placeholder*="pothole"], input[placeholder*="Grievance"]'));

        return {
          hasReportAnIssue,
          hasReportedByMe,
          hasGrievanceForm,
          hasReportNav,
          hasComplaintTitleInput,
          navLabels
        };
      });

      assert(!officerPageAudit.hasReportAnIssue, `${vp.name}: No "Report an Issue" or "Report Field Issue" buttons`);
      assert(!officerPageAudit.hasReportedByMe, `${vp.name}: No "Reported by Me" filter tab`);
      assert(!officerPageAudit.hasGrievanceForm, `${vp.name}: No citizen grievance form text`);
      assert(!officerPageAudit.hasReportNav, `${vp.name}: No "Report" navigation link in sidebar/bottom nav`);
      assert(!officerPageAudit.hasComplaintTitleInput, `${vp.name}: No citizen complaint input fields`);

      // Attempt Direct Navigation to 'new-complaint'
      await page.evaluate(() => {
        if (window.__CIVICPULSE_NAVIGATE__) {
          window.__CIVICPULSE_NAVIGATE__('new-complaint');
        }
      });
      await new Promise(r => setTimeout(r, 600));

      const directNavAudit = await page.evaluate(() => {
        const text = (document.body.innerText || '').toLowerCase();
        const hasForm = text.includes('report a civic grievance') || text.includes('issue details');
        const isRedirectedToOfficer = text.includes('officer') || text.includes('taskforce') || text.includes('queue');
        return { hasForm, isRedirectedToOfficer };
      });

      assert(!directNavAudit.hasForm, `${vp.name}: Direct navigation to /new-complaint DOES NOT display citizen reporting wizard`);
      assert(directNavAudit.isRedirectedToOfficer, `${vp.name}: Direct navigation safely redirected/handled for Officer`);
    }

    // 3. Verify Citizen Portal retains complaint reporting
    console.log('\n--- 3. Verifying Citizen Portal Retains Reporting Functionality ---');
    const citizenToken = jwt.sign({
      id: 1,
      name: 'Citizen Demo',
      email: 'citizen@demo.com',
      role: 'citizen'
    }, JWT_SECRET, { expiresIn: '7d' });

    await page.evaluate((tok) => {
      const citizenUser = {
        id: 1,
        name: 'Citizen Demo',
        email: 'citizen@demo.com',
        role: 'citizen'
      };
      localStorage.setItem('civic_user', JSON.stringify(citizenUser));
      localStorage.setItem('civic_token', tok);
    }, citizenToken);

    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
      if (window.__CIVICPULSE_NAVIGATE__) {
        window.__CIVICPULSE_NAVIGATE__('new-complaint');
      }
    });
    await new Promise(r => setTimeout(r, 800));

    const citizenAudit = await page.evaluate(() => {
      const text = (document.body.innerText || '').toLowerCase();
      const hasCitizenReportHeader = text.includes('report a civic grievance') || text.includes('step 1') || text.includes('issue details');
      const hasInput = Boolean(document.querySelector('input, textarea'));
      return { hasCitizenReportHeader, hasInput };
    });

    assert(citizenAudit.hasCitizenReportHeader, 'Citizen portal correctly displays complaint reporting wizard');
    assert(citizenAudit.hasInput, 'Citizen complaint inputs are fully active and available');

    console.log(`\n========================================`);
    console.log(`TOTAL MULTI-VIEWPORT TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Audit exception:', err);
  } finally {
    await browser.close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runViewportAudit();
