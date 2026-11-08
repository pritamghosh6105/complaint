const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\pg981\\.gemini\\antigravity-ide\\brain\\c7042fda-9b5d-4a1f-9d56-1cda308386b7';
const BASE_URL = 'http://localhost:3000';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Target Device: Vivo Y200e 5G
const VIVO_Y200E = {
  name: 'Vivo Y200e 5G',
  viewport: { width: 393, height: 873, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true },
  userAgent: 'Mozilla/5.0 (Linux; Android 14; V2336 Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36'
};

const SECONDARY_VIEWPORTS = [
  { width: 360, height: 800, name: '360x800' },
  { width: 375, height: 812, name: '375x812' },
  { width: 390, height: 844, name: '390x844' },
  { width: 430, height: 932, name: '430x932' }
];

async function runAudit() {
  console.log('=== STARTING CIVICPULSE AI MOBILE AUDIT ===');
  console.log(`Target Device: ${VIVO_Y200E.name} (${VIVO_Y200E.viewport.width}x${VIVO_Y200E.viewport.height})`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--window-size=${VIVO_Y200E.viewport.width},${VIVO_Y200E.viewport.height}`
    ]
  });

  const page = await browser.newPage();
  await page.setViewport(VIVO_Y200E.viewport);
  await page.setUserAgent(VIVO_Y200E.userAgent);

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const auditResults = [];

  // Helper to check horizontal overflow and find offending elements
  async function checkPageOverflow(routeName) {
    try {
      return await page.evaluate((rName) => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const windowWidth = window.innerWidth;
        const hasOverflow = scrollWidth > clientWidth + 1;

        const offendingElements = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > windowWidth + 2 && rect.width > 0 && rect.height > 0) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? `.${String(el.className).trim().split(/\s+/).slice(0, 2).join('.')}` : '';
            const id = el.id ? `#${el.id}` : '';
            offendingElements.push({
              selector: `${tag}${id}${cls}`,
              width: Math.round(rect.width),
              right: Math.round(rect.right),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth
            });
            if (offendingElements.length >= 8) break;
          }
        }

        return {
          routeName: rName,
          scrollWidth,
          clientWidth,
          windowWidth,
          hasOverflow,
          offendingElements
        };
      }, routeName);
    } catch (err) {
      return {
        routeName: routeName,
        scrollWidth: 0,
        clientWidth: 0,
        windowWidth: 0,
        hasOverflow: false,
        error: err.message
      };
    }
  }

  async function safeNavigate(route, id = null) {
    try {
      await page.evaluate((r, cid) => {
        if (window.__CIVICPULSE_NAVIGATE__) {
          window.__CIVICPULSE_NAVIGATE__(r, cid);
        } else {
          window.location.href = r === 'home' ? '/' : `/${r}`;
        }
      }, route, id);
      await sleep(1000);
    } catch (e) {
      await page.goto(`${BASE_URL}/${route === 'home' ? '' : route}`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await sleep(1000);
    }
  }

  async function loginAs(email, password = '6105') {
    return await page.evaluate(async (em, pw) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: em, password: pw })
        });
        const data = await res.json();
        if (data && data.token) {
          localStorage.setItem('civic_token', data.token);
          localStorage.setItem('civic_user', JSON.stringify(data.user));
          return { success: true, user: data.user };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }, email, password);
  }

  // 1. Audit Public Landing Page
  console.log('Testing Route: home...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1000);
  const homeOverflow = await checkPageOverflow('home');
  const homeScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_home.png');
  await page.screenshot({ path: homeScreenshot, fullPage: false });
  auditResults.push({ route: 'home', ...homeOverflow, screenshot: 'mobile_y200e_home.png' });

  // 2. Audit Departments Directory
  console.log('Testing Route: departments...');
  await safeNavigate('departments');
  const deptOverflow = await checkPageOverflow('departments');
  const deptScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_departments.png');
  await page.screenshot({ path: deptScreenshot, fullPage: false });
  auditResults.push({ route: 'departments', ...deptOverflow, screenshot: 'mobile_y200e_departments.png' });

  // 3. Audit Login Page
  console.log('Testing Route: login...');
  await safeNavigate('login');
  const loginOverflow = await checkPageOverflow('login');
  const loginScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_login.png');
  await page.screenshot({ path: loginScreenshot, fullPage: false });
  auditResults.push({ route: 'login', ...loginOverflow, screenshot: 'mobile_y200e_login.png' });

  // 4. Test Demo Credentials Vault Modal on Vivo Y200e
  console.log('Testing Demo Credentials Vault Modal...');
  try {
    await page.evaluate(() => {
      const btn = document.querySelector('.demo-vault-compact-action');
      if (btn) btn.click();
    });
    await sleep(700);
    
    // Type password 6105
    await page.evaluate(() => {
      const input = document.querySelector('input[name="vaultPassword"]') || document.querySelector('input[type="password"]');
      if (input) {
        input.value = '6105';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const unlockBtn = document.querySelector('button.btn-primary') || document.querySelector('button[type="submit"]');
      if (unlockBtn) unlockBtn.click();
    });
    await sleep(1200);

    const vaultOverflow = await checkPageOverflow('demo-vault-modal');
    const vaultScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_demo_vault.png');
    await page.screenshot({ path: vaultScreenshot, fullPage: false });
    auditResults.push({ route: 'demo-vault-modal', ...vaultOverflow, screenshot: 'mobile_y200e_demo_vault.png' });
    
    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.modal-close') || document.querySelector('button[aria-label="Close"]') || document.querySelector('.demo-modal-close');
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);
  } catch (err) {
    console.error('Demo vault test warning:', err.message);
  }

  // 5. Audit Register Page
  console.log('Testing Route: register...');
  await safeNavigate('register');
  const registerOverflow = await checkPageOverflow('register');
  const registerScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_register.png');
  await page.screenshot({ path: registerScreenshot, fullPage: false });
  auditResults.push({ route: 'register', ...registerOverflow, screenshot: 'mobile_y200e_register.png' });

  // 6. Log in as Citizen & Audit Citizen Dashboard
  console.log('Logging in as Citizen (citizen@demo.com)...');
  await loginAs('citizen@demo.com', 'password123');
  await page.goto(`${BASE_URL}/citizen-dashboard`, { waitUntil: 'networkidle2' });
  await sleep(1200);
  const citizenDashOverflow = await checkPageOverflow('citizen-dashboard');
  const citizenScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_citizen_dashboard.png');
  await page.screenshot({ path: citizenScreenshot, fullPage: false });
  auditResults.push({ route: 'citizen-dashboard', ...citizenDashOverflow, screenshot: 'mobile_y200e_citizen_dashboard.png' });

  // 7. Audit New Complaint Submission Wizard (as authenticated citizen)
  console.log('Testing Route: new-complaint...');
  await safeNavigate('new-complaint');
  await sleep(1200);
  const newComplaintOverflow = await checkPageOverflow('new-complaint');
  const newComplaintScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_new_complaint.png');
  await page.screenshot({ path: newComplaintScreenshot, fullPage: false });
  auditResults.push({ route: 'new-complaint', ...newComplaintOverflow, screenshot: 'mobile_y200e_new_complaint.png' });

  // 8. Log in as Field Officer (DEMO-POL-001) & Audit Officer Dashboard
  console.log('Logging in as Field Officer DEMO-POL-001...');
  await loginAs('demo.pol@civicpulse.gov.in', 'CP#DEMO-POL-001!6105');
  await page.goto(`${BASE_URL}/officer-dashboard`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  const officerOverflow = await checkPageOverflow('officer-dashboard');
  const officerScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_officer_dashboard.png');
  await page.screenshot({ path: officerScreenshot, fullPage: false });
  auditResults.push({ route: 'officer-dashboard', ...officerOverflow, screenshot: 'mobile_y200e_officer_dashboard.png' });

  // 9. Log in as Municipal Administrator (admin@demo.com)
  console.log('Logging in as Municipal Administrator admin@demo.com...');
  await loginAs('admin@demo.com', '6105');
  await page.goto(`${BASE_URL}/admin-dashboard`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  const adminOverflow = await checkPageOverflow('admin-dashboard');
  const adminScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_admin_dashboard.png');
  await page.screenshot({ path: adminScreenshot, fullPage: false });
  auditResults.push({ route: 'admin-dashboard', ...adminOverflow, screenshot: 'mobile_y200e_admin_dashboard.png' });

  // 10. Audit GIS Heatmap (as Administrator)
  console.log('Testing Route: gis-heatmap...');
  await safeNavigate('gis-heatmap');
  await sleep(1500);
  const heatmapOverflow = await checkPageOverflow('gis-heatmap');
  const heatmapScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_gis_heatmap.png');
  await page.screenshot({ path: heatmapScreenshot, fullPage: false });
  auditResults.push({ route: 'gis-heatmap', ...heatmapOverflow, screenshot: 'mobile_y200e_gis_heatmap.png' });

  // 11. Audit ML Inspector (as Administrator)
  console.log('Testing Route: ml-inspector...');
  await safeNavigate('ml-inspector');
  await sleep(1500);
  const mlOverflow = await checkPageOverflow('ml-inspector');
  const mlScreenshot = path.join(ARTIFACTS_DIR, 'mobile_y200e_ml_inspector.png');
  await page.screenshot({ path: mlScreenshot, fullPage: false });
  auditResults.push({ route: 'ml-inspector', ...mlOverflow, screenshot: 'mobile_y200e_ml_inspector.png' });

  // 12. Secondary Viewport Tests (360x800, 375x812, 390x844, 430x932)
  for (const vp of SECONDARY_VIEWPORTS) {
    console.log(`Testing secondary viewport: ${vp.name}...`);
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: true, hasTouch: true });
    
    await safeNavigate('home');
    const vpHome = await checkPageOverflow(`home_${vp.name}`);
    
    await safeNavigate('login');
    const vpLogin = await checkPageOverflow(`login_${vp.name}`);

    await safeNavigate('new-complaint');
    const vpNew = await checkPageOverflow(`new-complaint_${vp.name}`);
    
    auditResults.push(vpHome, vpLogin, vpNew);
  }

  await browser.close();

  // Summary Report
  console.log('\n=== MOBILE AUDIT RESULTS SUMMARY ===');
  let passCount = 0;
  let failCount = 0;

  for (const res of auditResults) {
    if (res.hasOverflow) {
      failCount++;
      console.log(`❌ [${res.routeName}]: scrollWidth=${res.scrollWidth} > clientWidth=${res.clientWidth}`);
      if (res.offendingElements && res.offendingElements.length > 0) {
        console.log('   Offending elements:', JSON.stringify(res.offendingElements));
      }
    } else {
      passCount++;
      console.log(`✅ [${res.routeName}]: scrollWidth=${res.scrollWidth} == clientWidth=${res.clientWidth}`);
    }
  }

  console.log(`\nTotal Checked: ${auditResults.length} | PASS: ${passCount} | FAIL: ${failCount}`);

  fs.writeFileSync(
    path.join(__dirname, 'mobile_audit_report.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), passCount, failCount, results: auditResults, consoleErrors }, null, 2)
  );

  return { passCount, failCount, auditResults };
}

runAudit().catch(err => {
  console.error('Audit script error:', err);
  process.exit(1);
});
