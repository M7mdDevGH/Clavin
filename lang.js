// ========== ملف الترجمات ==========
const translations = {
  ar: {
    logoTitle: 'Clavis',
    logoSub: 'مدير كلمات المرور الأسطوري',
    langText: 'English',
    statLabel: 'كلمة مرور',
    tabGen: 'توليد',
    tabAnalyzer: 'فحص الأمان',
    tabAudit: 'تدقيق',
    tabVault: 'الخزينة',
    genTitle: 'مولد الأساطير',
    typePass: 'كلمة مرور',
    typePhrase: 'عبارة مرور',
    typePin: 'PIN',
    typeTOTP: '2FA',
    platAll: 'كل الرموز',
    platWeb: 'مواقع',
    platBank: 'بنوك',
    platMobile: 'جوال',
    platSimple: 'بسيط',
    platformNotes: { all: 'جميع الرموز متاحة', web: 'مواقع الويب', windows: 'Windows', bank: 'البنوك', mobile: 'الجوال', simple: 'رموز بسيطة' },
    strengthLabel: 'قوة كلمة المرور',
    crackText: 'وقت الاختراق:',
    lengthLabel: 'الطول',
    optUpper: 'أحرف كبيرة',
    optLower: 'أحرف صغيرة',
    optNumbers: 'أرقام',
    optSymbols: 'رموز',
    optAvoid: 'تجنب المتشابهة',
    genBtnText: 'توليد',
    historyTitle: 'آخر 5 رموز',
    analyzerTitle: 'فحص كلمة المرور',
    analyzerPlaceholder: 'اكتب كلمة المرور للفحص...',
    analyzerNote: '🔒 التحليل محلي 100% - لا يرسل بيانات',
    weak: 'ضعيفة',
    medium: 'متوسطة',
    strong: 'قوية',
    legendary: 'أسطورية',
    second: 'ثانية',
    minute: 'دقيقة',
    hour: 'ساعة',
    day: 'يوم',
    year: 'سنة',
    centuries: 'آلاف السنين',
    changeMasterText: 'تغيير',
    secretLabel: 'المفتاح السري (Secret Key)',
    secretHint: 'أدخل المفتاح السري من حسابك (Base32)',
    scanQRText: 'مسح QR Code',
    exportText: 'تصدير مشفر',
    importText: 'استيراد مشفر',
    biometricText: 'فتح بالبصمة',
    enableBiometricText: 'تفعيل البصمة',
    auditTitle: 'التدقيق الأمني',
    auditTotalLabel: 'كلمة مرور',
    auditWeakLabel: 'ضعيفة',
    auditReusedLabel: 'مكررة',
    auditOldLabel: 'قديمة',
    auditIssuesTitle: 'مشاكل تحتاج انتباه',
    recommendationsTitle: 'توصيات للتحسين',
    noIssues: '🎉 لا توجد مشاكل! خزينتك آمنة.',
    weakPassword: 'كلمة مرور ضعيفة',
    reusedPassword: 'كلمة مرور مكررة',
    oldPassword: 'كلمة مرور قديمة',
    changeIt: 'تغييرها',
    rec1: 'استخدم كلمات مرور أطول (12 حرف على الأقل)',
    rec2: 'أضف أرقاماً ورموزاً لكلمات المرور الضعيفة',
    rec3: 'لا تستخدم نفس كلمة المرور لأكثر من حساب',
    rec4: 'حدث كلمات المرور القديمة كل 90 يوم',
    rec5: 'فعل المصادقة الثنائية (2FA) للحسابات المهمة',
    shareModalTitle: 'مشاركة آمنة',
    expiryLabel: 'مدة الصلاحية',
    extraPasswordLabel: 'حماية إضافية (اختياري)',
    createShareText: 'إنشاء رابط',
    activeSharesTitle: 'المشاركات النشطة'
  },
  en: {
    logoTitle: 'Clavis',
    logoSub: 'Legendary Password Manager',
    langText: 'العربية',
    statLabel: 'Passwords',
    tabGen: 'Generator',
    tabAnalyzer: 'Analyzer',
    tabAudit: 'Audit',
    tabVault: 'Vault',
    genTitle: 'Legendary Generator',
    typePass: 'Password',
    typePhrase: 'Passphrase',
    typePin: 'PIN',
    typeTOTP: '2FA',
    platAll: 'All Symbols',
    platWeb: 'Websites',
    platBank: 'Banking',
    platMobile: 'Mobile',
    platSimple: 'Simple',
    platformNotes: { all: 'All symbols allowed', web: 'Websites', windows: 'Windows', bank: 'Banking', mobile: 'Mobile', simple: 'Simple symbols' },
    strengthLabel: 'Password Strength',
    crackText: 'Crack Time:',
    lengthLabel: 'Length',
    optUpper: 'Uppercase',
    optLower: 'Lowercase',
    optNumbers: 'Numbers',
    optSymbols: 'Symbols',
    optAvoid: 'Avoid Similar',
    genBtnText: 'Generate',
    historyTitle: 'Last 5 Tokens',
    analyzerTitle: 'Password Analyzer',
    analyzerPlaceholder: 'Type password to analyze...',
    analyzerNote: '🔒 100% Local Analysis - No Data Sent',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    legendary: 'Legendary',
    second: 'second',
    minute: 'minute',
    hour: 'hour',
    day: 'day',
    year: 'year',
    centuries: 'centuries',
    changeMasterText: 'Change',
    secretLabel: 'Secret Key',
    secretHint: 'Enter the secret key from your account (Base32)',
    scanQRText: 'Scan QR Code',
    exportText: 'Export Encrypted',
    importText: 'Import Encrypted',
    biometricText: 'Unlock with Biometric',
    enableBiometricText: 'Enable Biometric',
    auditTitle: 'Security Audit',
    auditTotalLabel: 'Passwords',
    auditWeakLabel: 'Weak',
    auditReusedLabel: 'Reused',
    auditOldLabel: 'Old',
    auditIssuesTitle: 'Issues Need Attention',
    recommendationsTitle: 'Recommendations',
    noIssues: '🎉 No issues found! Your vault is secure.',
    weakPassword: 'Weak password',
    reusedPassword: 'Reused password',
    oldPassword: 'Old password',
    changeIt: 'Change',
    rec1: 'Use longer passwords (at least 12 characters)',
    rec2: 'Add numbers and symbols to weak passwords',
    rec3: 'Do not reuse the same password',
    rec4: 'Update old passwords every 90 days',
    rec5: 'Enable 2FA for important accounts',
    shareModalTitle: 'Secure Share',
    expiryLabel: 'Expiry Time',
    extraPasswordLabel: 'Extra Protection (optional)',
    createShareText: 'Create Link',
    activeSharesTitle: 'Active Shares'
  }
};

let currentLang = 'ar';

function t(key) {
  return translations[currentLang][key] || key;
}

function updateLanguage() {
  document.getElementById('logoTitle').textContent = t('logoTitle');
  document.getElementById('logoSub').textContent = t('logoSub');
  document.getElementById('langText').textContent = t('langText');
  document.getElementById('statLabel').textContent = t('statLabel');
  document.getElementById('tabGen').innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t('tabGen')}`;
  document.getElementById('tabAnalyzer').innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${t('tabAnalyzer')}`;
  document.getElementById('tabAudit').innerHTML = `<i class="fa-solid fa-chart-simple"></i> ${t('tabAudit')}`;
  document.getElementById('tabVault').innerHTML = `<i class="fa-solid fa-database"></i> ${t('tabVault')}`;
  document.getElementById('genTitle').textContent = t('genTitle');
  document.getElementById('typePass').textContent = t('typePass');
  document.getElementById('typePhrase').textContent = t('typePhrase');
  document.getElementById('typePin').textContent = t('typePin');
  document.getElementById('typeTOTP').textContent = t('typeTOTP');
  document.getElementById('platAll').textContent = t('platAll');
  document.getElementById('platWeb').textContent = t('platWeb');
  document.getElementById('platBank').textContent = t('platBank');
  document.getElementById('platMobile').textContent = t('platMobile');
  document.getElementById('platSimple').textContent = t('platSimple');
  document.getElementById('strengthLabel').textContent = t('strengthLabel');
  document.getElementById('lengthLabel').textContent = t('lengthLabel');
  document.getElementById('optUpper').textContent = t('optUpper');
  document.getElementById('optLower').textContent = t('optLower');
  document.getElementById('optNumbers').textContent = t('optNumbers');
  document.getElementById('optSymbols').textContent = t('optSymbols');
  document.getElementById('optAvoid').textContent = t('optAvoid');
  document.getElementById('genBtnText').textContent = t('genBtnText');
  document.getElementById('historyTitle').textContent = t('historyTitle');
  document.getElementById('analyzerTitle').textContent = t('analyzerTitle');
  document.getElementById('analyzerInput').placeholder = t('analyzerPlaceholder');
  document.getElementById('analyzerNote').textContent = t('analyzerNote');
  document.getElementById('changeMasterText').textContent = t('changeMasterText');
  document.getElementById('secretLabel').textContent = t('secretLabel');
  document.getElementById('secretHint').textContent = t('secretHint');
  document.getElementById('scanQRText').textContent = t('scanQRText');
  document.getElementById('exportText').textContent = t('exportText');
  document.getElementById('importText').textContent = t('importText');
  document.getElementById('biometricText').textContent = t('biometricText');
  document.getElementById('enableBiometricText').textContent = t('enableBiometricText');
  document.getElementById('auditTitle').textContent = t('auditTitle');
  document.getElementById('auditTotalLabel').textContent = t('auditTotalLabel');
  document.getElementById('auditWeakLabel').textContent = t('auditWeakLabel');
  document.getElementById('auditReusedLabel').textContent = t('auditReusedLabel');
  document.getElementById('auditOldLabel').textContent = t('auditOldLabel');
  document.getElementById('auditIssuesTitle').textContent = t('auditIssuesTitle');
  document.getElementById('recommendationsTitle').textContent = t('recommendationsTitle');
  document.getElementById('shareModalTitle').textContent = t('shareModalTitle');
  document.getElementById('expiryLabel').textContent = t('expiryLabel');
  document.getElementById('extraPasswordLabel').textContent = t('extraPasswordLabel');
  document.getElementById('createShareText').textContent = t('createShareText');
  document.getElementById('activeSharesTitle').textContent = t('activeSharesTitle');
  updateLockScreen();
  if (typeof currentPw !== 'undefined' && currentPw) updateStrength(currentPw);
  if (typeof renderHistory === 'function') renderHistory();
  if (typeof renderVault === 'function') renderVault();
    }
