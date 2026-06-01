/* BuzzMind i18n — English ⇄ Arabic, text-only (layout stays LTR).
   Translates by exact English UI text, so server-rendered AND
   client-rendered content both switch. Choice persists in localStorage. */
(function () {
  'use strict';
  if (window.__buzzI18n) return;

  // English UI text -> Arabic. Keys must match the on-screen text exactly (trimmed).
  var AR = {
    // ----- Navigation / sidebar / roles -----
    'Home': 'الرئيسية',
    'Library': 'المكتبة',
    'Assignments': 'الواجبات',
    'Reports': 'التقارير',
    'Messages': 'الرسائل',
    'Settings': 'الإعدادات',
    'Classes': 'الفصول',
    'Quiz Builder': 'منشئ الاختبارات',
    'Users': 'المستخدمون',
    'Analytics': 'التحليلات',
    'Professors': 'الأساتذة',
    'Sign Out': 'تسجيل الخروج',
    'Dashboard': 'لوحة التحكم',
    'Student': 'طالب',
    'Professor': 'أستاذ',
    'Management': 'الإدارة',
    'student': 'طالب',
    'professor': 'أستاذ',
    'admin': 'مدير',

    // ----- Auth / landing -----
    'Log in': 'تسجيل الدخول',
    'Login': 'تسجيل الدخول',
    'Logout': 'تسجيل الخروج',
    'Sign up': 'إنشاء حساب',
    'Sign Up': 'إنشاء حساب',
    'Sign up free': 'أنشئ حسابًا مجانًا',
    'Go to Dashboard': 'الذهاب إلى لوحة التحكم',
    'Hi,': 'مرحبًا،',
    'Level Up Your': 'طوّر',
    'Learning!': 'تعلّمك!',
    'Turn every classroom into a game. Interactive quizzes that make learning feel like winning.':
      'حوّل كل فصل دراسي إلى لعبة. اختبارات تفاعلية تجعل التعلّم يبدو وكأنه فوز.',
    'How We Play': 'كيف نلعب',
    'The Game Plan': 'خطة اللعب',
    'Quest Library': 'مكتبة المهام',
    'Explore thousands of teacher-made quizzes across every subject imaginable. Your next adventure starts here.':
      'استكشف آلاف الاختبارات التي أعدّها المعلمون في كل المواد التي يمكن تخيّلها. مغامرتك التالية تبدأ هنا.',
    'Real-time Stats': 'إحصائيات فورية',
    'Watch progress happen live with kinetic charts. Get instant feedback and celebrate every milestone in high definition.':
      'تابع التقدّم مباشرةً عبر رسوم بيانية حيّة. احصل على تغذية راجعة فورية واحتفِ بكل إنجاز بدقّة عالية.',
    'Group Power': 'قوة المجموعة',
    'Collaborate with classmates in Squad Mode. Victory is sweeter when the whole team levels up together.':
      'تعاون مع زملائك في وضع الفريق. النصر أحلى عندما يتطوّر الفريق بأكمله معًا.',
    'Ready to Transform Your Classroom?': 'هل أنت مستعد لتطوير فصلك الدراسي؟',
    'Join thousands of educators and students already leveling up their learning experience.':
      'انضم إلى آلاف المعلمين والطلاب الذين يطوّرون تجربتهم التعليمية بالفعل.',
    'Sign up as a Student': 'سجّل كطالب',
    'Sign up as a Professor': 'سجّل كأستاذ',
    '© 2026 BuzzMind. Level Up Your Learning!': '© 2026 BuzzMind. طوّر تعلّمك!',
    'Empowering learners and educators through kinetic, high-energy play.':
      'نُمكّن المتعلمين والمعلمين عبر اللعب الحيوي عالي الطاقة.',
    '© 2026 BuzzMind. All rights reserved.': '© 2026 BuzzMind. جميع الحقوق محفوظة.',

    // ----- Login / register -----
    'Create Your Account': 'أنشئ حسابك',
    'Join the BuzzMind community today.': 'انضم إلى مجتمع BuzzMind اليوم.',
    'Full Name': 'الاسم الكامل',
    'Username': 'اسم المستخدم',
    'Email Address': 'البريد الإلكتروني',
    'Password': 'كلمة المرور',
    'Create Account': 'إنشاء حساب',
    'Login to Your Account': 'تسجيل الدخول إلى حسابك',
    'Welcome back to BuzzMind.': 'مرحبًا بعودتك إلى BuzzMind.',
    'Email or Username': 'البريد الإلكتروني أو اسم المستخدم',
    'That email is already registered.': 'هذا البريد الإلكتروني مسجّل بالفعل.',
    'That username is already taken.': 'اسم المستخدم هذا مستخدَم بالفعل.',
    'Email or username already exists.': 'البريد الإلكتروني أو اسم المستخدم موجود بالفعل.',
    'No account found with that email or username.': 'لا يوجد حساب بهذا البريد الإلكتروني أو اسم المستخدم.',
    'Incorrect password.': 'كلمة المرور غير صحيحة.',
    'Invalid email/username or password.': 'بريد إلكتروني/اسم مستخدم أو كلمة مرور غير صحيحة.',
    'Please fill in all sign-up fields.': 'يرجى ملء جميع حقول التسجيل.',
    'Something went wrong. Please try again.': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',

    // ----- Role picker -----
    'Pick Your': 'اختر',
    'Power!': 'قوتك!',
    'Ready to start the game? Choose the role that fits your mission today.':
      'مستعد لبدء اللعبة؟ اختر الدور الذي يناسب مهمتك اليوم.',
    'Create and manage quizzes, track student progress': 'أنشئ الاختبارات وأدِرها وتابع تقدّم الطلاب',
    'Take quizzes, view results, learn and grow': 'خُض الاختبارات، واطّلع على النتائج، وتعلّم وتطوّر',
    'Continue Journey': 'تابع الرحلة',
    'CHOOSE A ROLE TO UNLOCK THE NEXT LEVEL': 'اختر دورًا لفتح المستوى التالي',
    'Please choose a valid role before continuing.': 'يرجى اختيار دور صالح قبل المتابعة.',

    // ----- Contact -----
    'Get in touch': 'تواصل معنا',
    'Questions, problems or feedback? Send the admin team a message.':
      'أسئلة أو مشكلات أو ملاحظات؟ أرسل رسالة إلى فريق الإدارة.',
    'Name': 'الاسم',
    'Email': 'البريد الإلكتروني',
    'Subject': 'الموضوع',
    'Message': 'الرسالة',
    'Send message': 'إرسال الرسالة',
    'Sending…': 'جارٍ الإرسال…',
    'Your name': 'اسمك',
    'What is this about?': 'ما موضوع رسالتك؟',
    'Tell us what you need…': 'أخبرنا بما تحتاجه…',

    // ----- Settings -----
    'Account settings': 'إعدادات الحساب',
    'Display name': 'الاسم المعروض',
    'Email address': 'البريد الإلكتروني',
    'Username / ID': 'اسم المستخدم / المعرّف',
    'Save changes': 'حفظ التغييرات',
    'Security & password': 'الأمان وكلمة المرور',
    'Current password': 'كلمة المرور الحالية',
    'New password': 'كلمة المرور الجديدة',
    'Confirm new password': 'تأكيد كلمة المرور الجديدة',
    'Update password': 'تحديث كلمة المرور',
    'Enter your name': 'أدخل اسمك',
    'Enter your email': 'أدخل بريدك الإلكتروني',
    'Enter current password': 'أدخل كلمة المرور الحالية',
    'Enter new password': 'أدخل كلمة المرور الجديدة',

    // ----- Dashboards (common) -----
    'Discover': 'اكتشف',
    'Join a live game and play with your class.': 'انضم إلى لعبة مباشرة والعب مع فصلك.',
    'The fun way to': 'الطريقة الممتعة لـ',
    'learn': 'التعلّم',
    'and': 'و',
    'play!': 'اللعب!',
    'Host a game, challenge your friends, and master any subject.':
      'استضِف لعبة، وتحدَّ أصدقاءك، وأتقِن أي مادة.',
    'Game PIN': 'رمز اللعبة',
    'Join Game': 'انضم للعبة',
    'Ask your host for the game PIN to join.': 'اطلب رمز اللعبة من المضيف للانضمام.',
    'Professor Directory': 'دليل الأساتذة',
    'Create, edit and manage every faculty member.': 'أنشئ كل عضو هيئة تدريس وعدّله وأدِره.',
    'Add Professor': 'إضافة أستاذ',
    'Edit Professor': 'تعديل الأستاذ',
    'Active staff': 'الكادر النشط',
    'Total students': 'إجمالي الطلاب',
    'Classes taught': 'الفصول المُدرّسة',
    'Departments': 'الأقسام',
    'Loading professors…': 'جارٍ تحميل الأساتذة…',
    'Full name': 'الاسم الكامل',
    'Department': 'القسم',
    'Cancel': 'إلغاء',
    'View': 'عرض',
    'Edit': 'تعديل',
    'Search name, email, department...': 'ابحث بالاسم أو البريد أو القسم...',
    'Accounts are created instantly. Share the generated password with the professor.':
      'يتم إنشاء الحسابات فورًا. شارك كلمة المرور المُولَّدة مع الأستاذ.',
  };

  var KEY = 'bm_lang';
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var GLOBE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';

  var seenText = new Map(); // textNode -> original English
  var seenAttr = new Map(); // element -> { attr: originalValue }
  var observer = null;

  function getLang() {
    try { return localStorage.getItem(KEY) || 'en'; } catch (e) { return 'en'; }
  }
  function storeLang(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
  }

  function skip(node) {
    var p = node.parentNode;
    while (p && p.nodeType === 1) {
      if (SKIP[p.tagName]) return true;
      if (p.hasAttribute && p.hasAttribute('data-no-i18n')) return true;
      if (p.isContentEditable) return true;
      p = p.parentNode;
    }
    return false;
  }

  function translateText(node) {
    var raw = node.nodeValue;
    if (!raw || seenText.has(node)) return;
    var t = raw.trim();
    if (!t || !AR.hasOwnProperty(t) || skip(node)) return;
    var lead = raw.slice(0, raw.length - raw.replace(/^\s+/, '').length);
    var trail = raw.slice(raw.replace(/\s+$/, '').length);
    seenText.set(node, raw);
    node.nodeValue = lead + AR[t] + trail;
  }

  function translateAttrs(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.closest && el.closest('[data-no-i18n]')) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a);
      var t = v && v.trim();
      if (!t || !AR.hasOwnProperty(t)) continue;
      var store = seenAttr.get(el) || {};
      if (store.hasOwnProperty(a)) continue;
      store[a] = v;
      seenAttr.set(el, store);
      el.setAttribute(a, v.replace(t, AR[t]));
    }
  }

  function walk(root) {
    if (root.nodeType === 3) { translateText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var batch = [], n;
    while ((n = tw.nextNode())) batch.push(n);
    batch.forEach(translateText);
    if (root.querySelectorAll) {
      root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(translateAttrs);
    }
    if (root.nodeType === 1) translateAttrs(root);
  }

  function toArabic() { walk(document.body); }

  function toEnglish() {
    seenText.forEach(function (orig, node) {
      if (node && node.isConnected) node.nodeValue = orig;
    });
    seenText.clear();
    seenAttr.forEach(function (store, el) {
      if (el && el.isConnected) {
        Object.keys(store).forEach(function (a) { el.setAttribute(a, store[a]); });
      }
    });
    seenAttr.clear();
  }

  function apply(l) {
    document.documentElement.setAttribute('lang', l);
    if (l === 'ar') toArabic();
    else toEnglish();
    updateToggles();
  }

  function setLang(l) {
    storeLang(l);
    apply(l);
    try { window.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: l } })); } catch (e) {}
  }

  function toggle() { setLang(getLang() === 'ar' ? 'en' : 'ar'); }

  function updateToggles() {
    var label = getLang() === 'ar' ? 'English' : 'العربية';
    document.querySelectorAll('[data-lang-toggle]').forEach(function (el) {
      var lbl = el.querySelector('.lt-label') || el;
      lbl.textContent = label;
    });
  }

  function makeToggle(sidebar) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-lang-toggle', '');
    btn.setAttribute('data-no-i18n', '');
    btn.innerHTML = '<span class="ic" style="display:inline-flex">' + GLOBE + '</span> <span class="lt-label"></span>';
    if (sidebar) {
      btn.style.cssText =
        'display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;margin-top:4px;' +
        'border:none;background:none;border-radius:10px;color:#475569;font:600 14px/1.2 inherit;cursor:pointer;';
    } else {
      btn.style.cssText =
        'position:fixed;z-index:99999;bottom:18px;right:18px;display:inline-flex;align-items:center;gap:7px;' +
        'padding:9px 14px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;color:#4f46e5;' +
        'font:600 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 18px rgba(2,6,23,.14);cursor:pointer;';
    }
    btn.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    return btn;
  }

  function injectToggle() {
    if (document.querySelector('[data-lang-toggle]')) return; // explicit toggle present
    var side = document.querySelector('.dash-side');
    if (side) {
      var signout = side.querySelector('.signout');
      var el = makeToggle(true);
      if (signout) side.insertBefore(el, signout);
      else side.appendChild(el);
    } else {
      document.body.appendChild(makeToggle(false));
    }
  }

  function wireExplicit() {
    document.querySelectorAll('[data-lang-toggle]').forEach(function (el) {
      if (el.__bmWired) return;
      el.__bmWired = true;
      if (!el.querySelector('.lt-label')) {
        var span = document.createElement('span');
        span.className = 'lt-label';
        el.appendChild(span);
      }
      el.setAttribute('data-no-i18n', '');
      el.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    });
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(function (muts) {
      if (getLang() !== 'ar') return;
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 3) translateText(node);
          else if (node.nodeType === 1) walk(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    wireExplicit();
    injectToggle();
    apply(getLang());
    startObserver();
  }

  window.__buzzI18n = { setLang: setLang, toggle: toggle, getLang: getLang,
    t: function (k) { return (getLang() === 'ar' && AR[k]) ? AR[k] : k; } };
  window.I18n = window.__buzzI18n;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
