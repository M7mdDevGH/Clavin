// ========== التشفير ==========
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encryptData(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(data)));
  return { salt: Array.from(salt), iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
}

async function decryptData(encryptedObj, password) {
  try {
    const salt = new Uint8Array(encryptedObj.salt);
    const iv = new Uint8Array(encryptedObj.iv);
    const data = new Uint8Array(encryptedObj.data);
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return JSON.parse(decoder.decode(decrypted));
  } catch { return null; }
}

// ========== إدارة Master Password ==========
let masterPassword = null;
let appData = { entries: [], history: [], settings: {} };
let isFirstTime = !localStorage.getItem('clavis_encrypted');

const lockScreen = document.getElementById('lockScreen');
const mainApp = document.getElementById('mainApp');
const masterInput = document.getElementById('masterPasswordInput');
const unlockBtn = document.getElementById('unlockBtn');
const lockError = document.getElementById('lockError');
const resetMasterBtn = document.getElementById('resetMasterBtn');
const forgotLink = document.getElementById('forgotPasswordLink');
const lockTitle = document.getElementById('lockTitle');
const lockDesc = document.getElementById('lockDesc');
const unlockText = document.getElementById('unlockText');
const biometricUnlockBtn = document.getElementById('biometricUnlockBtn');
const enableBiometricBtn = document.getElementById('enableBiometricBtn');

// ========== المصادقة البيومترية ==========
let biometricSupported = false;

async function checkBiometricSupport() {
  if (!window.PublicKeyCredential) return false;
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    biometricSupported = available;
    if (available) {
      biometricUnlockBtn.style.display = 'block';
      if (!isFirstTime && localStorage.getItem('clavis_biometric_enabled') === 'true') {
        enableBiometricBtn.style.display = 'none';
      } else if (!isFirstTime) {
        enableBiometricBtn.style.display = 'flex';
      }
    }
    return available;
  } catch { return false; }
}

async function enableBiometric() {
  if (!masterPassword) { toast(currentLang === 'ar' ? 'أدخل كلمة المرور أولاً' : 'Enter password first'); return; }
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Clavis Password Manager', id: window.location.hostname },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'clavis_user', displayName: 'Clavis User' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'required' },
        timeout: 60000,
        attestation: 'none'
      }
    });
    if (credential) {
      localStorage.setItem('clavis_biometric_enabled', 'true');
      localStorage.setItem('clavis_biometric_credential', JSON.stringify({
        id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        masterHash: await crypto.subtle.digest('SHA-256', encoder.encode(masterPassword)).then(h => btoa(String.fromCharCode(...new Uint8Array(h))))
      }));
      enableBiometricBtn.style.display = 'none';
      toast(currentLang === 'ar' ? '✅ تم تفعيل البصمة بنجاح!' : '✅ Biometric enabled!');
    }
  } catch (e) { toast(currentLang === 'ar' ? '❌ فشل تفعيل البصمة' : '❌ Biometric failed'); }
}

async function unlockWithBiometric() {
  try {
    const savedCredential = JSON.parse(localStorage.getItem('clavis_biometric_credential') || '{}');
    if (!savedCredential.id) throw new Error('No credential');
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [{ id: Uint8Array.from(atob(savedCredential.id), c => c.charCodeAt(0)), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    if (credential) {
      const encrypted = JSON.parse(localStorage.getItem('clavis_encrypted'));
      if (!encrypted) { lockError.textContent = 'No data'; return; }
      const decrypted = await decryptData(encrypted, masterPassword || '');
      if (!decrypted) { lockError.textContent = currentLang === 'ar' ? 'تعذر فك التشفير' : 'Decryption failed'; return; }
      lockScreen.classList.add('hidden');
      mainApp.style.display = 'block';
      appData = decrypted;
      loadAppData();
    }
  } catch (e) { lockError.textContent = currentLang === 'ar' ? 'فشلت المصادقة' : 'Authentication failed'; }
}

function updateLockScreen() {
  if (isFirstTime) {
    lockTitle.textContent = currentLang === 'ar' ? 'إنشاء كلمة مرور رئيسية' : 'Create Master Password';
    lockDesc.textContent = currentLang === 'ar' ? 'أنشئ كلمة مرور قوية لحماية بياناتك' : 'Create a strong password to protect your data';
    unlockText.textContent = currentLang === 'ar' ? 'إنشاء' : 'Create';
    resetMasterBtn.style.display = 'none';
    forgotLink.style.display = 'none';
  } else {
    lockTitle.textContent = currentLang === 'ar' ? 'مرحباً بك في Clavis' : 'Welcome to Clavis';
    lockDesc.textContent = currentLang === 'ar' ? 'أدخل كلمة المرور الرئيسية لفتح التطبيق' : 'Enter master password to unlock';
    unlockText.textContent = currentLang === 'ar' ? 'فتح' : 'Unlock';
    resetMasterBtn.style.display = 'block';
    forgotLink.style.display = 'block';
  }
}

async function handleUnlock() {
  const password = masterInput.value;
  if (!password) { lockError.textContent = currentLang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'; return; }

  if (isFirstTime) {
    masterPassword = password;
    appData = { entries: [], history: [], settings: { currentType: 'password', currentPlatform: 'all', opts: { upper: true, lower: true, num: true, sym: false, nosim: false }, totpSecret: 'JBSWY3DPEHPK3PXP' } };
    await saveAllData();
    lockScreen.classList.add('hidden');
    mainApp.style.display = 'block';
    isFirstTime = false;
    loadAppData();
    updateLockScreen();
    checkBiometricSupport();
  } else {
    const encrypted = JSON.parse(localStorage.getItem('clavis_encrypted'));
    if (!encrypted) { lockError.textContent = currentLang === 'ar' ? 'لا توجد بيانات محفوظة' : 'No saved data'; return; }
    const decrypted = await decryptData(encrypted, password);
    if (decrypted) {
      masterPassword = password;
      appData = decrypted;
      lockScreen.classList.add('hidden');
      mainApp.style.display = 'block';
      loadAppData();
      checkBiometricSupport();
    } else { lockError.textContent = currentLang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password'; }
  }
  masterInput.value = '';
}

async function saveAllData() { if (!masterPassword) return; const encrypted = await encryptData(appData, masterPassword); localStorage.setItem('clavis_encrypted', JSON.stringify(encrypted)); }

function loadAppData() {
  entries = appData.entries || [];
  history = appData.history || [];
  const s = appData.settings || {};
  currentType = s.currentType || 'password';
  currentPlatform = s.currentPlatform || 'all';
  opts = s.opts || { upper: true, lower: true, num: true, sym: false, nosim: false };
  totpSecret = s.totpSecret || 'JBSWY3DPEHPK3PXP';
  document.getElementById('totpSecret').value = totpSecret;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-type="${currentType}"]`)?.classList.add('active');
  document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-platform="${currentPlatform}"]`)?.classList.add('active');
  document.getElementById('platformNote').textContent = t('platformNotes')[currentPlatform] || '';
  updateUIForType();
  updateHeaderStats();
  renderHistory();
  renderVault();
  renderActiveShares();
  if (currentType === 'totp') { startTOTPTimer(); generateTOTP(); } else { generatePassword(); }
}

function resetMasterPassword() {
  if (confirm(currentLang === 'ar' ? 'سيتم مسح جميع بياناتك. هل أنت متأكد؟' : 'All your data will be erased. Are you sure?')) {
    localStorage.removeItem('clavis_encrypted');
    localStorage.removeItem('clavis_biometric_enabled');
    localStorage.removeItem('clavis_biometric_credential');
    location.reload();
  }
}

async function changeMasterPassword() {
  const current = document.getElementById('currentMasterPassword').value;
  const newPass = document.getElementById('newMasterPassword').value;
  const confirm = document.getElementById('confirmMasterPassword').value;
  if (current !== masterPassword) { toast(currentLang === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Current password incorrect'); return; }
  if (newPass.length < 6) { toast(currentLang === 'ar' ? 'كلمة المرور الجديدة قصيرة جداً' : 'New password too short'); return; }
  if (newPass !== confirm) { toast(currentLang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return; }
  masterPassword = newPass;
  if (localStorage.getItem('clavis_biometric_enabled') === 'true') {
    const savedCredential = JSON.parse(localStorage.getItem('clavis_biometric_credential') || '{}');
    savedCredential.masterHash = await crypto.subtle.digest('SHA-256', encoder.encode(newPass)).then(h => btoa(String.fromCharCode(...new Uint8Array(h))));
    localStorage.setItem('clavis_biometric_credential', JSON.stringify(savedCredential));
  }
  await saveAllData();
  closeChangeMasterModal();
  toast(currentLang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
}

function openChangeMasterModal() {
  document.getElementById('currentMasterPassword').value = '';
  document.getElementById('newMasterPassword').value = '';
  document.getElementById('confirmMasterPassword').value = '';
  document.getElementById('changeMasterModal').classList.add('open');
}
function closeChangeMasterModal() { document.getElementById('changeMasterModal').classList.remove('open'); }
function closeChangeMasterModalOutside(e) { if (e.target === document.getElementById('changeMasterModal')) closeChangeMasterModal(); }

// ========== تصدير واستيراد ==========
async function exportData() {
  if (!appData) return;
  const encrypted = await encryptData(appData, masterPassword);
  const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `clavis-backup-${new Date().toISOString().slice(0,10)}.clavis`;
  a.click();
  toast(currentLang === 'ar' ? '✅ تم التصدير بنجاح' : '✅ Exported successfully');
}

function importData() {
  const input = document.getElementById('fileInput');
  input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const encrypted = JSON.parse(ev.target.result);
        const decrypted = await decryptData(encrypted, masterPassword);
        if (decrypted) { appData = decrypted; await saveAllData(); loadAppData(); toast(currentLang === 'ar' ? '✅ تم الاستيراد بنجاح' : '✅ Imported successfully'); }
        else { toast(currentLang === 'ar' ? '❌ كلمة المرور غير صحيحة أو الملف تالف' : '❌ Invalid password or corrupted file'); }
      } catch { toast(currentLang === 'ar' ? '❌ ملف غير صالح' : '❌ Invalid file'); }
    };
    reader.readAsText(file);
  };
}

// ========== PWA ==========
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const iosGuide = document.getElementById('iosInstallGuide');
function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; }
if (isIOS()) iosGuide.style.display = 'block';
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; if (!isIOS()) installBtn.style.display = 'flex'; });
installBtn.addEventListener('click', async () => {
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; installBtn.style.display = 'none'; }
  else { if (isIOS()) iosGuide.style.display = 'block'; else alert(currentLang === 'ar' ? 'يمكنك تثبيت التطبيق من قائمة المتصفح.' : 'You can install from browser menu.'); }
});
iosGuide.addEventListener('click', () => iosGuide.style.display = 'none');
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/clavis/sw.js').then(() => console.log('SW registered')).catch(() => console.log('SW failed')); });
}

// ========== المتغيرات العامة ==========
let opts = { upper: true, lower: true, num: true, sym: false, nosim: false };
let currentPw = '';
let currentType = 'password';
let currentPlatform = 'all';
let history = [];
let entries = [];
let editingId = null;
let totpSecret = 'JBSWY3DPEHPK3PXP';
let totpInterval = null;
let qrStream = null;

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMS = '0123456789';
const SYMS_ALL = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const SYMS_WEB = '!@#$%^&*_-+=.';
const SYMS_BANK = '!@#$%&*';
const SYMS_MOBILE = '!@#$%&*_-';
const SYMS_SIMPLE = '!@#$';
const SIM = 'O0oIl1i|5S8B';
const ARABIC_WORDS = ['كتاب','قلم','شمس','قمر','نجم','بحر','جبل','ورد','شجرة','بيت','باب','نافذة','سحاب','مطر','ريح','نار','تراب','ذهب','فضة','أسد','نمر','فيل','طائر','قهوة','خبز','عسل'];
const platformSymbols = { all: SYMS_ALL, web: SYMS_WEB, windows: SYMS_ALL, bank: SYMS_BANK, mobile: SYMS_MOBILE, simple: SYMS_SIMPLE };
const CAT_META = {
  'مواقع': { icon: '<i class="fa-solid fa-globe"></i>', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  'تطبيقات': { icon: '<i class="fa-solid fa-mobile-screen"></i>', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  'بريد': { icon: '<i class="fa-solid fa-envelope"></i>', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'بنوك': { icon: '<i class="fa-solid fa-building-columns"></i>', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  'أخرى': { icon: '<i class="fa-solid fa-folder"></i>', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' }
};

// ========== TOTP ==========
function generateTOTP() {
  try {
    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(totpSecret), digits: 6, period: 30 });
    currentPw = totp.generate();
    document.getElementById('totpCode').textContent = currentPw;
    updateTimer();
  } catch { document.getElementById('totpCode').textContent = 'خطأ'; }
}
function updateTimer() {
  const now = Math.floor(Date.now() / 1000);
  const remaining = 30 - (now % 30);
  document.getElementById('timerText').textContent = remaining + 's';
  document.getElementById('timerFill').style.width = (remaining / 30 * 100) + '%';
}
function startTOTPTimer() { if (totpInterval) clearInterval(totpInterval); totpInterval = setInterval(() => { generateTOTP(); updateTimer(); }, 1000); }
function stopTOTPTimer() { if (totpInterval) { clearInterval(totpInterval); totpInterval = null; } }

// ========== QR Scanner ==========
async function startQRScanner() {
  const video = document.getElementById('qrVideo');
  const scanBtn = document.getElementById('scanQRBtn');
  try {
    qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = qrStream;
    video.classList.add('show');
    scanBtn.style.display = 'none';
    const scanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          const secret = extractSecretFromOTPAuth(code.data);
          if (secret) {
            document.getElementById('totpSecret').value = secret;
            totpSecret = secret;
            appData.settings.totpSecret = secret;
            saveAllData();
            if (currentType === 'totp') generateTOTP();
            toast(currentLang === 'ar' ? '✅ تم مسح QR بنجاح!' : '✅ QR Scanned!');
          }
          stopQRScanner();
          clearInterval(scanInterval);
        }
      }
    }, 500);
    setTimeout(() => { stopQRScanner(); scanBtn.style.display = 'flex'; }, 15000);
  } catch { toast(currentLang === 'ar' ? '❌ تعذر الوصول للكاميرا' : '❌ Camera access denied'); }
}
function extractSecretFromOTPAuth(uri) {
  try { const url = new URL(uri); if (url.protocol === 'otpauth:') return url.searchParams.get('secret')?.toUpperCase().replace(/[^A-Z2-7]/g, '') || null; } catch { return null; }
  return null;
}
function stopQRScanner() { if (qrStream) { qrStream.getTracks().forEach(t => t.stop()); qrStream = null; } document.getElementById('qrVideo').classList.remove('show'); document.getElementById('scanQRBtn').style.display = 'flex'; }

// ========== المشاركة الآمنة ==========
let activeShares = JSON.parse(localStorage.getItem('clavis_shares') || '{}');
let currentShareEntry = null;

function cleanExpiredShares() {
  const now = Date.now();
  let changed = false;
  Object.keys(activeShares).forEach(id => { if (activeShares[id].expires < now) { delete activeShares[id]; changed = true; } });
  if (changed) localStorage.setItem('clavis_shares', JSON.stringify(activeShares));
  return activeShares;
}
function openShareModal(id) {
  currentShareEntry = entries.find(e => e.id === id);
  if (!currentShareEntry) return;
  document.getElementById('shareEntryName').textContent = `مشاركة: ${currentShareEntry.name}`;
  document.getElementById('shareLinkBox').style.display = 'none';
  document.getElementById('createShareBtn').style.display = 'flex';
  document.getElementById('shareModalOverlay').classList.add('open');
}
function createSecureShare() {
  if (!currentShareEntry) return;
  const shareId = Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
  const expiryHours = parseInt(document.getElementById('shareExpiry').value);
  const extraPassword = document.getElementById('shareExtraPassword').value;
  activeShares[shareId] = { id: shareId, entryId: currentShareEntry.id, pw: currentShareEntry.pw, name: currentShareEntry.name, expires: Date.now() + (expiryHours * 60 * 60 * 1000), extraPassword: extraPassword || null, used: false, created: Date.now() };
  localStorage.setItem('clavis_shares', JSON.stringify(activeShares));
  document.getElementById('shareLinkInput').value = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
  document.getElementById('shareLinkBox').style.display = 'flex';
  document.getElementById('createShareBtn').style.display = 'none';
  renderActiveShares();
  toast(currentLang === 'ar' ? '✅ تم إنشاء الرابط!' : '✅ Link created!');
}
function copyShareLink() { const input = document.getElementById('shareLinkInput'); input.select(); navigator.clipboard.writeText(input.value); toast(currentLang === 'ar' ? '✅ تم نسخ الرابط!' : '✅ Link copied!'); }
function closeShareModal() { document.getElementById('shareModalOverlay').classList.remove('open'); }
function closeShareModalOutside(e) { if (e.target === document.getElementById('shareModalOverlay')) closeShareModal(); }
function cancelShare(shareId) {
  if (confirm(currentLang === 'ar' ? 'إلغاء هذا الرابط؟' : 'Cancel this link?')) {
    delete activeShares[shareId];
    localStorage.setItem('clavis_shares', JSON.stringify(activeShares));
    renderActiveShares();
    toast(currentLang === 'ar' ? '✅ تم إلغاء الرابط' : '✅ Link cancelled');
  }
}
function renderActiveShares() {
  activeShares = cleanExpiredShares();
  const section = document.getElementById('activeSharesSection');
  const list = document.getElementById('activeSharesList');
  if (Object.keys(activeShares).length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = Object.values(activeShares).map(share => {
    const entry = entries.find(e => e.id === share.entryId) || { name: share.name };
    const expiresIn = Math.max(0, Math.floor((share.expires - Date.now()) / (60 * 60 * 1000)));
    return `<div class="share-item"><div class="share-info"><i class="fa-solid fa-link"></i><div class="share-details"><h4>${entry.name}</h4><p>${share.extraPassword ? '🔒 محمي بكلمة مرور · ' : ''}⏳ ${expiresIn} ساعة متبقية</p></div></div><div class="share-actions"><button class="icon-btn" onclick="copyShareUrl('${share.id}')"><i class="fa-regular fa-copy"></i></button><button class="icon-btn" style="color:var(--danger);" onclick="cancelShare('${share.id}')"><i class="fa-regular fa-trash-can"></i></button></div></div>`;
  }).join('');
}
window.copyShareUrl = (shareId) => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?share=${shareId}`); toast(currentLang === 'ar' ? '✅ تم نسخ الرابط!' : '✅ Link copied!'); };
function checkSharedLink() {
  const params = new URLSearchParams(window.location.search);
  const shareId = params.get('share');
  if (!shareId) return;
  const share = activeShares[shareId];
  if (!share) { alert(currentLang === 'ar' ? 'الرابط غير صالح' : 'Invalid link'); return; }
  if (share.used) { alert(currentLang === 'ar' ? 'تم استخدام الرابط مسبقاً' : 'Link already used'); return; }
  if (Date.now() > share.expires) { alert(currentLang === 'ar' ? 'انتهت صلاحية الرابط' : 'Link expired'); return; }
  if (share.extraPassword) { const entered = prompt(currentLang === 'ar' ? 'أدخل كلمة المرور للرابط:' : 'Enter password for this link:'); if (entered !== share.extraPassword) { alert(currentLang === 'ar' ? 'كلمة مرور غير صحيحة' : 'Incorrect password'); return; } }
  const entry = entries.find(e => e.id === share.entryId);
  alert(`${currentLang === 'ar' ? 'كلمة المرور:' : 'Password:'} ${entry ? entry.pw : share.pw}`);
  share.used = true;
  activeShares[shareId] = share;
  localStorage.setItem('clavis_shares', JSON.stringify(activeShares));
  window.history.replaceState({}, document.title, window.location.pathname);
}

// ========== UI ==========
function updateUIForType() {
  const isTOTP = currentType === 'totp', isPIN = currentType === 'pin';
  document.getElementById('pwOutput').style.display = isTOTP ? 'none' : 'flex';
  document.getElementById('totpDisplay').style.display = isTOTP ? 'block' : 'none';
  document.getElementById('secretInputWrapper').classList.toggle('show', isTOTP);
  document.getElementById('strengthSection').style.display = isTOTP ? 'none' : 'block';
  document.getElementById('optionsSection').style.display = (isTOTP || isPIN) ? 'none' : 'block';
  document.getElementById('platformSection').style.display = isTOTP ? 'none' : 'block';
  document.getElementById('generateBtn').style.display = isTOTP ? 'none' : 'block';
  if (isTOTP) { startTOTPTimer(); generateTOTP(); } else { stopTOTPTimer(); }
}
function switchTab(t) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  if (t === 'gen') { document.querySelectorAll('.tab')[0].classList.add('active'); document.getElementById('sec-gen').classList.add('active'); }
  else if (t === 'analyzer') { document.querySelectorAll('.tab')[1].classList.add('active'); document.getElementById('sec-analyzer').classList.add('active'); }
  else if (t === 'audit') { document.querySelectorAll('.tab')[2].classList.add('active'); document.getElementById('sec-audit').classList.add('active'); performAudit(); }
  else { document.querySelectorAll('.tab')[3].classList.add('active'); document.getElementById('sec-vault').classList.add('active'); renderVault(); renderActiveShares(); }
}
function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-type="${type}"]`).classList.add('active');
  const slider = document.getElementById('lenSlider');
  slider.min = type === 'pin' ? 4 : 8;
  if (type === 'pin' && slider.value < 4) slider.value = 4;
  else if (slider.value < 8) slider.value = 8;
  document.getElementById('lenLabel').textContent = slider.value;
  updateUIForType();
  if (type !== 'totp') generatePassword();
  appData.settings.currentType = type;
  saveAllData();
}
function setPlatform(platform) {
  currentPlatform = platform;
  document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-platform="${platform}"]`).classList.add('active');
  document.getElementById('platformNote').textContent = t('platformNotes')[platform] || '';
  generatePassword();
  appData.settings.currentPlatform = platform;
  saveAllData();
}
function toggleOpt(el, key) {
  const active = ['upper','lower','num','sym'].filter(k => k !== key && opts[k]);
  if (opts[key] && active.length === 0) { toast('⚠️ يجب تفعيل نوع واحد على الأقل!'); return; }
  opts[key] = !opts[key];
  el.classList.toggle('checked', opts[key]);
  generatePassword();
  appData.settings.opts = opts;
  saveAllData();
}
function updateLenLabel() { document.getElementById('lenLabel').textContent = document.getElementById('lenSlider').value; generatePassword(); }
function generatePassword() {
  if (currentType === 'totp') return;
  const len = parseInt(document.getElementById('lenSlider').value);
  if (currentType === 'pin') currentPw = Array.from({length: len}, () => Math.floor(Math.random() * 10)).join('');
  else if (currentType === 'passphrase') {
    const cnt = Math.min(6, Math.max(2, Math.floor(len / 5))), words = [];
    for (let i = 0; i < cnt; i++) words.push(ARABIC_WORDS[Math.floor(Math.random() * ARABIC_WORDS.length)]);
    currentPw = words.join('-');
    if (opts.num) currentPw += '-' + Math.floor(Math.random() * 1000);
  } else {
    let pool = '';
    if (opts.upper) pool += UPPER; if (opts.lower) pool += LOWER; if (opts.num) pool += NUMS; if (opts.sym) pool += platformSymbols[currentPlatform];
    if (!pool) pool = LOWER + NUMS;
    if (opts.nosim) pool = pool.split('').filter(c => !SIM.includes(c)).join('');
    let pw = [];
    if (opts.upper) pw.push(randFrom(UPPER)); if (opts.lower) pw.push(randFrom(LOWER)); if (opts.num) pw.push(randFrom(NUMS)); if (opts.sym) pw.push(randFrom(platformSymbols[currentPlatform]));
    for (let i = pw.length; i < len; i++) pw.push(randFrom(pool));
    shuffle(pw);
    currentPw = pw.join('');
  }
  document.getElementById('genPw').textContent = currentPw;
  updateStrength(currentPw);
  addToHistory(currentPw);
}
function randFrom(s) { return s[Math.floor(Math.random() * s.length)]; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
function updateStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++; if (pw.length >= 12) score++; if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++; if (/[a-z]/.test(pw)) score++; if (/[0-9]/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score += 2;
  const levels = [{ min: 0, max: 2, name: t('weak'), color: '#ef4444', pct: 15 },{ min: 3, max: 3, name: t('weak'), color: '#f97316', pct: 30 },{ min: 4, max: 4, name: t('medium'), color: '#f59e0b', pct: 50 },{ min: 5, max: 5, name: t('strong'), color: '#84cc16', pct: 70 },{ min: 6, max: 6, name: t('strong'), color: '#22c55e', pct: 85 },{ min: 7, max: 99, name: t('legendary'), color: '#00d4aa', pct: 100 }];
  const lvl = levels.find(l => score >= l.min && score <= l.max) || levels[0];
  document.getElementById('strengthName').textContent = lvl.name;
  document.getElementById('strengthName').style.color = lvl.color;
  document.getElementById('strengthFill').style.width = lvl.pct + '%';
  document.getElementById('strengthFill').style.background = lvl.color;
  const entropy = pw.length * Math.log2(currentType==='pin'?10:(currentType==='passphrase'?ARABIC_WORDS.length:70));
  const sec = Math.pow(2, entropy) / 1e9;
  let time = t('centuries');
  if (sec < 60) time = `${Math.round(sec)} ${t('second')}`;
  else if (sec < 3600) time = `${Math.round(sec/60)} ${t('minute')}`;
  else if (sec < 86400) time = `${Math.round(sec/3600)} ${t('hour')}`;
  else if (sec < 31536000) time = `${Math.round(sec/86400)} ${t('day')}`;
  else if (sec < 315360000) time = `${Math.round(sec/31536000)} ${t('year')}`;
  document.getElementById('crackText').textContent = `${t('crackText')} ${time}`;
}
function addToHistory(pw) { history = [pw, ...history.filter(p => p !== pw)].slice(0, 5); appData.history = history; saveAllData(); renderHistory(); }
function renderHistory() {
  const list = document.getElementById('historyList');
  if (!history.length) { list.innerHTML = `<span style="color:var(--text3);">—</span>`; return; }
  list.innerHTML = history.map(p => `<div class="history-item" onclick="useHistory('${p.replace(/'/g, "\\'")}')"><span>${p.length > 15 ? p.slice(0,12)+'...' : p}</span><i class="fa-regular fa-copy"></i></div>`).join('');
}
function useHistory(pw) {
  currentPw = pw;
  if (currentType === 'totp') document.getElementById('totpCode').textContent = pw;
  else { document.getElementById('genPw').textContent = pw; updateStrength(pw); }
  toast('تم استعادة الرمز');
}
async function copyGen() { if (!currentPw) return; try { await navigator.clipboard.writeText(currentPw); toast('<i class="fa-solid fa-check"></i> تم النسخ!'); } catch { toast('<i class="fa-solid fa-triangle-exclamation"></i> تعذّر النسخ'); } }

// ========== Analyzer ==========
const commonWords = ['password','123456','qwerty','admin','welcome','login','master','hello','abc123','letmein','pass','secret'];
const commonNames = ['mohammed','ahmed','ali','omar','khalid','sara','fatima','noor','john','david'];
function analyzePassword() {
  const pw = document.getElementById('analyzerInput').value;
  if (!pw) { document.getElementById('analyzerScore').textContent = '—'; document.getElementById('analyzerRating').textContent = '—'; document.getElementById('analyzerDetails').innerHTML = ''; return; }
  let score = 100, strengths = [], issues = [], lowerPw = pw.toLowerCase();
  if (pw.length >= 16) strengths.push('طول ممتاز (16+ حرف)');
  else if (pw.length >= 12) strengths.push('طول جيد جداً (12+ حرف)');
  else if (pw.length >= 8) strengths.push('طول جيد (8+ حرف)');
  else { issues.push('قصيرة جداً (أقل من 8 أحرف)'); score -= 30; }
  const variety = [/[A-Z]/.test(pw), /[a-z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  if (variety === 4) strengths.push('تنوع ممتاز');
  else if (variety === 3) strengths.push('تنوع جيد');
  else { issues.push('تنوع ضعيف'); score -= 20; }
  const foundCommon = commonWords.find(w => lowerPw.includes(w));
  if (foundCommon) { issues.push(`تحتوي كلمة شائعة: "${foundCommon}"`); score -= 25; }
  const foundName = commonNames.find(n => lowerPw.includes(n));
  if (foundName) { issues.push(`تحتوي اسم شائع: "${foundName}"`); score -= 15; }
  if (/(\d)\1{2,}/.test(pw)) { issues.push('تكرار أرقام متتالية'); score -= 15; }
  const yearMatch = pw.match(/19\d{2}|20\d{2}/);
  if (yearMatch) { issues.push(`تحتوي سنة: ${yearMatch[0]}`); score -= 15; }
  score = Math.max(0, Math.min(100, score));
  let color = '#22c55e', rating = 'ممتازة';
  if (score < 40) { color = '#ef4444'; rating = 'ضعيفة جداً'; }
  else if (score < 60) { color = '#f97316'; rating = 'ضعيفة'; }
  else if (score < 80) { color = '#f59e0b'; rating = 'متوسطة'; }
  document.getElementById('analyzerScore').textContent = score;
  document.getElementById('analyzerScore').style.color = color;
  document.getElementById('analyzerRating').textContent = rating;
  document.getElementById('analyzerRating').style.color = color;
  document.getElementById('analyzerDetails').innerHTML = `${strengths.length ? `<div style="margin-bottom:8px; color:var(--success);">✅ ${strengths.join('<br>✅ ')}</div>` : ''}${issues.length ? `<div style="color:var(--danger);">❌ ${issues.join('<br>❌ ')}</div>` : ''}`;
}

// ========== Audit ==========
function performAudit() {
  const total = entries.length;
  const weak = entries.filter(e => { const pw = e.pw; let score = 0; if (pw.length >= 8) score++; if (pw.length >= 12) score++; if (/[A-Z]/.test(pw)) score++; if (/[a-z]/.test(pw)) score++; if (/[0-9]/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++; return score < 3; });
  const reused = entries.filter((e, i) => entries.some((x, j) => i !== j && x.pw === e.pw));
  const old = entries.filter(e => Date.now() - (e.created || 0) > 90 * 24 * 60 * 60 * 1000);
  document.getElementById('auditTotal').textContent = total;
  document.getElementById('auditWeak').textContent = weak.length;
  document.getElementById('auditReused').textContent = reused.length;
  document.getElementById('auditOld').textContent = old.length;
  const list = document.getElementById('auditList');
  const issues = [];
  weak.forEach(e => issues.push({ type: 'weak', entry: e, title: t('weakPassword'), desc: `${e.name}: ${e.pw.substring(0, 4)}...` }));
  reused.forEach(e => issues.push({ type: 'reused', entry: e, title: t('reusedPassword'), desc: `${e.name}: ${e.pw.substring(0, 4)}...` }));
  old.forEach(e => issues.push({ type: 'old', entry: e, title: t('oldPassword'), desc: `${e.name} - ${Math.floor((Date.now() - (e.created || 0)) / (24 * 60 * 60 * 1000))} يوم` }));
  if (issues.length === 0) list.innerHTML = `<div class="empty-state" style="padding:20px;"><i class="fa-solid fa-check-circle" style="color:var(--success); font-size:32px;"></i><p>${t('noIssues')}</p></div>`;
  else list.innerHTML = issues.slice(0, 10).map(i => `<div class="audit-item"><div class="audit-item-icon ${i.type === 'weak' ? 'danger' : 'warning'}"><i class="fa-solid fa-${i.type === 'weak' ? 'key' : (i.type === 'reused' ? 'copy' : 'clock')}"></i></div><div class="audit-item-content"><div class="audit-item-title">${i.title}</div><div class="audit-item-desc">${i.desc}</div></div><button class="audit-item-action" onclick="focusEntry('${i.entry.name}')"><i class="fa-solid fa-pen"></i> ${t('changeIt')}</button></div>`).join('');
  const recList = document.getElementById('recommendationsList');
  const recs = [];
  if (weak.length > 0) recs.push(t('rec2'));
  if (entries.some(e => e.pw.length < 12)) recs.push(t('rec1'));
  if (reused.length > 0) recs.push(t('rec3'));
  if (old.length > 0) recs.push(t('rec4'));
  recs.push(t('rec5'));
  recList.innerHTML = recs.map(r => `<div class="recommendation-item"><div class="recommendation-icon"><i class="fa-solid fa-check"></i></div><div class="recommendation-text">${r}</div></div>`).join('');
}
window.focusEntry = (name) => { switchTab('vault'); document.getElementById('searchInput').value = name; renderVault(); };

// ========== Vault ==========
function renderVault() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const cat = document.getElementById('filterCat').value;
  let filtered = entries.filter(e => { const matchQ = !q || e.name.toLowerCase().includes(q) || (e.user || '').toLowerCase().includes(q); const matchC = !cat || e.cat === cat; return matchQ && matchC; });
  const list = document.getElementById('entriesList');
  if (filtered.length === 0) { list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fa-solid fa-lock"></i></div><h3>الخزينة فارغة</h3><p>ولّد كلمة مرور واحفظها!</p></div>`; return; }
  list.innerHTML = filtered.map(e => { const m = CAT_META[e.cat] || CAT_META['أخرى']; return `<div class="entry-card"><div class="entry-top"><div class="entry-icon" style="background:${m.bg}; color:${m.color}">${m.icon}</div><div class="entry-info"><div class="entry-name">${escHtml(e.name)}</div><div class="entry-user">${escHtml(e.user || '—')}</div></div><div class="entry-actions"><button class="icon-btn" onclick="copyEntry(${e.id})"><i class="fa-regular fa-copy"></i></button><button class="icon-btn share-btn" onclick="openShareModal(${e.id})"><i class="fa-solid fa-share-nodes"></i></button><button class="icon-btn" onclick="deleteEntry(${e.id})" style="color:var(--danger);"><i class="fa-regular fa-trash-can"></i></button></div></div></div>`; }).join('');
}
async function copyEntry(id) { const e = entries.find(x => x.id === id); if (!e) return; try { await navigator.clipboard.writeText(e.pw); toast('<i class="fa-solid fa-check"></i> تم النسخ!'); } catch { toast('<i class="fa-solid fa-triangle-exclamation"></i> تعذّر النسخ'); } }
function deleteEntry(id) { if (!confirm('حذف كلمة المرور؟')) return; entries = entries.filter(e => e.id !== id); appData.entries = entries; saveAllData(); renderVault(); updateHeaderStats(); toast('<i class="fa-regular fa-trash-can"></i> تم الحذف'); }
function updateHeaderStats() { document.getElementById('totalCount').textContent = entries.length; }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function openSaveModal() {
  if (!currentPw) { toast('<i class="fa-solid fa-triangle-exclamation"></i> ولّد رمزاً أولاً!'); return; }
  document.getElementById('modalPwPreview').textContent = currentPw;
  document.getElementById('f-name').value = document.getElementById('f-user').value = document.getElementById('f-note').value = '';
  document.getElementById('f-cat').value = 'مواقع';
  editingId = null;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function closeModalOutside(e) { if (e.target === document.getElementById('modalOverlay')) closeModal(); }
function saveEntry() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { toast('<i class="fa-solid fa-triangle-exclamation"></i> أدخل اسم الموقع!'); return; }
  const pw = document.getElementById('modalPwPreview').textContent;
  const entry = { id: editingId || Date.now(), name, user: document.getElementById('f-user').value.trim(), pw, cat: document.getElementById('f-cat').value, note: document.getElementById('f-note').value.trim(), created: editingId ? (entries.find(e=>e.id===editingId)?.created || Date.now()) : Date.now(), updated: Date.now() };
  if (editingId) { const idx = entries.findIndex(e => e.id === editingId); if (idx !== -1) entries[idx] = entry; }
  else entries.unshift(entry);
  appData.entries = entries;
  saveAllData();
  closeModal();
  toast('<i class="fa-solid fa-check"></i> تم الحفظ!');
  updateHeaderStats();
  renderVault();
}
let toastTimer;
function toast(msg) { clearTimeout(toastTimer); const el = document.getElementById('toast'); el.innerHTML = msg; el.classList.add('show'); toastTimer = setTimeout(() => el.classList.remove('show'), 2500); }

// ========== الأحداث ==========
unlockBtn.addEventListener('click', handleUnlock);
masterInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUnlock(); });
resetMasterBtn.addEventListener('click', resetMasterPassword);
forgotLink.addEventListener('click', resetMasterPassword);
biometricUnlockBtn.addEventListener('click', unlockWithBiometric);
enableBiometricBtn.addEventListener('click', enableBiometric);
document.getElementById('changeMasterBtn').addEventListener('click', openChangeMasterModal);
document.getElementById('scanQRBtn').addEventListener('click', startQRScanner);
document.getElementById('totpSecret').addEventListener('input', function() { totpSecret = this.value; appData.settings.totpSecret = totpSecret; saveAllData(); if (currentType === 'totp') generateTOTP(); });
document.getElementById('langToggle').addEventListener('click', function() { currentLang = currentLang === 'ar' ? 'en' : 'ar'; document.documentElement.lang = currentLang; document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr'; updateLanguage(); });

// ========== بدء التشغيل ==========
updateLanguage();
checkBiometricSupport();
checkSharedLink();
if (isFirstTime) { lockScreen.classList.remove('hidden'); mainApp.style.display = 'none'; }
else { lockScreen.classList.remove('hidden'); mainApp.style.display = 'none'; }
