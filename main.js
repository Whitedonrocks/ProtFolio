/* =============================================
   PRAYAG PORTFOLIO — main.js
   Matrix Rain · Typed Text · Cyber Facts ·
   Scroll Reveal · Nav Sticky · Mobile Menu
   ============================================= */

/* ══════════════════════════════════════
   0. LOAD CURRENT PHASE STATUS
   ══════════════════════════════════════ */
(function loadPhaseStatus() {
  fetch('./data/phases.json')
    .then(res => res.json())
    .then(data => {
      const currentPhase = data.phases.find(p => p.current);
      if (currentPhase) {
        // store current phase id on the hero-status container for later use
        const heroStatus = document.getElementById('hero-status');
        if (heroStatus) {
          heroStatus.dataset.currentPhase = String(currentPhase.id).padStart(2, '0');
        }
      }
    })
    .catch(err => console.log('Phases data not loaded (ok on first load)'));
})();

/* ══════════════════════════════════════
   0.5. UPDATE CERT PROGRESS BASED ON DATES
   ══════════════════════════════════════ */
(function updateCertProgress() {
  const today = new Date();
  const projectStart = new Date('2026-05-04'); // Project start date

  const phaseTargets = {
    '01': new Date('2026-05-31'), // Phase 1: May 2026
    '02': new Date('2026-08-31'), // Phase 2: Aug 2026
    '03': new Date('2026-10-31'), // Phase 3: Oct 2026
    '04': new Date('2026-12-31'), // Phase 4: Dec 2026
    '05': new Date('2027-02-28'), // Phase 5: Feb 2027
    '06': new Date('2027-04-30'), // Phase 6: Apr 2027
    '07': new Date('2027-06-30')  // Phase 7: Jun 2027
  };

  function calculateProgress(targetDate, completed = false) {
    if (completed) return 100;
    
    const totalTime = targetDate - projectStart;
    const elapsedTime = today - projectStart;
    const progress = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
    return Math.round(progress);
  }

  // Update Phase 1 (completed)
  const phase1Progress = document.querySelector('[data-phase="01"] .cert-progress-fill');
  if (phase1Progress) {
    phase1Progress.style.setProperty('--fill', '100%');
  }

  // Update Phase 2 (in progress at 55%)
  const phase2Progress = document.querySelector('[data-phase="02"] .cert-progress-fill');
  if (phase2Progress) {
    const prog = calculateProgress(phaseTargets['02'], false);
    phase2Progress.style.setProperty('--fill', `${Math.max(55, prog)}%`);
    document.querySelector('[data-phase="02"] .cert-pct').textContent = `~${Math.max(55, prog)}%`;
  }

  // Keep future phases at their stated roadmap values until work actually starts.
  // Their percentage and target month are already defined in the HTML.

  // Update compact hero cert badge (if present)
  try {
    const badgePhaseEl = document.getElementById('badge-phase');
    const badgePctEl = document.getElementById('badge-pct');
    if (badgePhaseEl && badgePctEl) {
      const activeCard = document.querySelector('.cert-card.active');
      if (activeCard) {
        const name = activeCard.querySelector('.cert-name')?.textContent || activeCard.querySelector('.cert-phase')?.textContent || '';
        const pct = activeCard.querySelector('.cert-pct')?.textContent || '';
        badgePhaseEl.textContent = name;
        badgePctEl.textContent = pct;
      }
    }
  } catch (e) { /* ignore in older browsers */ }

  // Update hero status countdown/ETA based on active phase
  try {
    const statusTextEl = document.getElementById('status-text');
    const activeCard = document.querySelector('.cert-card.active');
    if (statusTextEl && activeCard) {
      const phase = activeCard.getAttribute('data-phase');
      const target = phaseTargets[phase];
      if (target) {
        const msRemaining = target - today;
        const days = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
        const dateStr = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        if (days > 1) {
          statusTextEl.textContent = `Next exam: ${dateStr} — ${days} days`;
        } else if (days === 1) {
          statusTextEl.textContent = `Next exam: ${dateStr} — 1 day`;
        } else if (days === 0) {
          statusTextEl.textContent = `Next exam: ${dateStr} — Today`;
        } else {
          statusTextEl.textContent = `Target: ${dateStr}`;
        }
      }
    }
  } catch (e) { /* ignore */ }
})();

/* ══════════════════════════════════════
   1. KALI LINUX TERMINAL (initialized in DOMContentLoaded)
   ══════════════════════════════════════ */
function initKaliTerminal() {
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  const sectionIndicator = document.getElementById('section-indicator');
  const MAX_COMMAND_LENGTH = 80;
  const COMMAND_PATTERN = /^[a-z0-9 _-]+$/i;
  
  if (!input || !output) return;

  const commands = {
    'cd about': { section: '#about', msg: 'Navigating to About section...' },
    'cd certs': { section: '#certs', msg: 'Navigating to Certifications...' },
    'cd cert': { section: '#certs', msg: 'Navigating to Certifications...' },
    'cd leadership': { section: '#leadership', msg: 'Navigating to Leadership...' },
    'cd projects': { section: '#projects', msg: 'Navigating to Projects...' },
    'cd project': { section: '#projects', msg: 'Navigating to Projects...' },
    'cd insight': { section: '#insight', msg: 'Navigating to Daily Insight...' },
    'cd insights': { section: '#insight', msg: 'Navigating to Daily Insight...' },
    'cd contact': { section: '#contact', msg: 'Navigating to Contact...' },
    'ls': { msg: 'about/  certs/  leadership/  projects/  insight/  contact/' },
    'pwd': { msg: '/root/prayag' },
    'whoami': { msg: 'root' },
    'help': { msg: 'Available commands:\n  cd about       - Go to About section\n  cd certs       - Go to Certifications\n  cd leadership  - Go to Leadership\n  cd projects    - Go to Projects\n  cd insight     - Go to Daily Insight\n  cd contact     - Go to Contact\n  ls             - List available sections\n  pwd            - Print current directory\n  whoami         - Current user\n  clear          - Clear terminal\n  help           - Show this help' },
    'clear': { clear: true }
  };

  function addOutput(text) {
    const line = document.createElement('div');
    line.className = 'output-line';
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function sanitizeCommand(cmd) {
    if (typeof cmd !== 'string') {
      return { ok: false, reason: 'invalid input' };
    }

    const normalized = cmd.replace(/\s+/g, ' ').trim().toLowerCase();

    if (!normalized) {
      return { ok: false, reason: 'empty input' };
    }

    if (normalized.length > MAX_COMMAND_LENGTH) {
      return { ok: false, reason: 'input too long' };
    }

    if (!COMMAND_PATTERN.test(normalized)) {
      return { ok: false, reason: 'malformed input' };
    }

    return { ok: true, value: normalized };
  }

  function processCommand(cmd) {
    const sanitized = sanitizeCommand(cmd);
    
    if (!sanitized.ok) {
      addOutput('input rejected: command must be short and contain only letters, numbers, spaces, hyphens, or underscores.');
      addOutput('');
      return;
    }

    const trimmed = sanitized.value;

    // Show the sanitized command that was typed
    addOutput(`root@prayag:~# ${trimmed}`);

    if (trimmed === 'clear') {
      output.innerHTML = '';
      addOutput('');
      return;
    }

    const command = commands[trimmed];
    
    if (command) {
      if (command.clear) {
        output.innerHTML = '';
      } else if (command.section) {
        addOutput(command.msg);
        setTimeout(() => {
          const section = document.querySelector(command.section);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      } else {
        addOutput(command.msg);
      }
    } else {
      addOutput(`command not found: ${trimmed}`);
    }

    addOutput('');
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      processCommand(input.value);
      input.value = '';
    }
  });

  // Initialize with fun vibe coding messages
  function initializeTerminal() {
    const messages = [
      '╔════════════════════════════════════════╗',
      '║   INITIALIZING PRAYAG NEPAL...         ║',
      '║   VIBE CODING PROTOCOL ACTIVATED ✨    ║',
      '╚════════════════════════════════════════╝',
      '$ Loading cybersecurity vibes...',
      '$ Syncing portfolio energy fields...',
      '$ Engaging creative mode 🧠',
      '✓ Prayag Nepal initialized successfully',
      '✓ This website was VIBE CODED with passion 🎨',
      '✓ Ready to explore my journey',
      'Type "help" for commands or use the navigation above'
    ];

    messages.forEach((msg, idx) => {
      setTimeout(() => {
        addOutput(msg);
      }, idx * 50);
    });
  }

  initializeTerminal();

  // Auto-focus terminal on page load
  setTimeout(() => {
    input.focus();
  }, 500);

  // Track navigation hover
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionMap = {
    '#about': 'about',
    '#certs': 'certs',
    '#leadership': 'leadership',
    '#projects': 'projects',
    '#insight': 'insight',
    '#contact': 'contact'
  };

  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href');
      const sectionName = sectionMap[href] || 'portfolio';
      if (sectionIndicator) {
        sectionIndicator.textContent = `[ ${sectionName} ]`;
      }
    });
  });

  document.addEventListener('mouseleave', () => {
    if (sectionIndicator) {
      sectionIndicator.textContent = '[ portfolio ]';
    }
  });
}



/* ══════════════════════════════════════
   2. TYPED NAME EFFECT (initialized in DOMContentLoaded)
   ══════════════════════════════════════ */
function typedName() {
  const el = document.getElementById('typed-name');
  console.log('typedName called, element:', el);
  if (!el) {
    console.error('typed-name element not found');
    return;
  }

  const text = 'Prayag Nepal';
  let i = 0;

  function type() {
    if (i < text.length) {
      el.textContent += text[i++];
      console.log('Typed:', el.textContent);
      setTimeout(type, 110);
    } else {
      // Remove the cursor after typing completes (CSS handles it for a while)
      setTimeout(() => {
        el.style.borderRight = 'none';
      }, 2000);
    }
  }

  setTimeout(type, 600);
}


/* ══════════════════════════════════════
   3. CYBERSECURITY FACTS
   ══════════════════════════════════════ */
let CYBER_FACTS = [
  "The first computer virus, 'Creeper', was created in 1971 as an experiment on ARPANET — it displayed the message 'I'm the creeper, catch me if you can!'",
  "Over 90% of successful cyberattacks begin with a phishing email. Social engineering remains the most effective initial attack vector.",
  "A new cyberattack occurs somewhere in the world every 39 seconds, according to a University of Maryland study.",
  "The CIA Triad — Confidentiality, Integrity, and Availability — forms the foundational model for information security systems.",
  "Zero-day vulnerabilities are flaws unknown to the software vendor. The name comes from the fact that developers have had 'zero days' to fix the issue.",
  "ARP Spoofing allows an attacker to link their MAC address to a legitimate IP address, enabling Man-in-the-Middle attacks on a local network.",
  "The 'Three-Way Handshake' (SYN → SYN-ACK → ACK) in TCP/IP is exploited in SYN Flood DoS attacks by leaving connections half-open.",
  "Kerckhoffs's Principle states: a cryptosystem should be secure even if everything about the system is public knowledge, except the key.",
  "SQL Injection remains in the OWASP Top 10 after decades. Parameterized queries are the primary mitigation against it.",
  "Public Key Infrastructure (PKI) uses asymmetric cryptography — data encrypted with a public key can only be decrypted with the corresponding private key.",
  "The Mirai botnet (2016) compromised IoT devices using default credentials and launched record 620 Gbps DDoS attacks.",
  "VLAN hopping attacks exploit misconfigured trunk ports to gain access to traffic on different VLANs without authorization.",
  "Port 443 (HTTPS) uses TLS to encrypt web traffic. TLS 1.3 reduces the handshake from 2 round-trips to 1, improving performance.",
  "Penetration testing follows a defined lifecycle: Reconnaissance → Scanning → Exploitation → Post-Exploitation → Reporting.",
  "The principle of least privilege dictates users and processes should have the minimum permissions necessary to perform their function.",
  "CompTIA A+ covers both hardware and operating systems — it's the most recognized entry-level IT certification globally.",
  "Linux permissions are expressed in octal: rwx = 7, rw- = 6, r-- = 4. chmod 755 means owner can read/write/execute; others can only read/execute.",
  "Firewalls operate at different OSI layers: packet filters at Layer 3-4, application firewalls at Layer 7.",
  "In OSPF, routers form adjacencies and exchange Link State Advertisements (LSAs) to build a complete map of the network topology.",
  "Buffer overflow attacks write data beyond a buffer's boundary to overwrite adjacent memory — the basis for many historic exploits.",
];

// Load facts from JSON file if available (for n8n integration)
async function loadCyberFacts() {
  try {
    const response = await fetch('./data/cyber-facts.json');
    if (response.ok) {
      const data = await response.json();
      if (data.facts && Array.isArray(data.facts)) {
        CYBER_FACTS = data.facts.map(f => f.fact || f);
      }
    }
  } catch (err) {
    // Using built-in facts as fallback (silently)
  }
}

loadCyberFacts();

let lastFactIndex = -1;

function getRandomFact() {
  let idx;
  do { idx = Math.floor(Math.random() * CYBER_FACTS.length); }
  while (idx === lastFactIndex);
  lastFactIndex = idx;
  
  const fact = CYBER_FACTS[idx];
  return typeof fact === 'string' ? fact : fact.fact || fact;
}

async function getAIFact() {
  try {
    // Call Vercel serverless function (token is safe on server)
    // Add a timestamp and no-store to avoid CDN/browser caching
    const response = await fetch(`/api/get-fact?ts=${Date.now()}`, { cache: 'no-store' });

    if (!response.ok) {
      console.warn('API failed, using static facts');
      return { fact: getRandomFact(), persisted: false };
    }

    const data = await response.json();
    return {
      fact: data.fact || getRandomFact(),
      persisted: !!data.persisted,
      commit: data.commit || null,
      cooldownActive: !!data.cooldownActive,
      cooldownRemainingMinutes: data.cooldownRemainingMinutes || 0
    };
  } catch (error) {
    console.error('Error fetching AI fact:', error);
    return { fact: getRandomFact(), persisted: false };
  }
}

async function getScheduledFact() {
  try {
    const response = await fetch('/api/daily-quote', { cache: 'no-store' });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data && data.fact ? data : null;
  } catch (error) {
    console.error('Error fetching scheduled fact:', error);
    return null;
  }
}

function typeFactIntoTerminal(fact) {
  const el = document.getElementById('daily-fact');
  const afterPrompt = document.getElementById('after-prompt');
  if (!el) return;

  el.innerHTML = '';
  if (afterPrompt) afterPrompt.style.display = 'none';

  let i = 0;
  const speed = 18;

  function typeChar() {
    if (i < fact.length) {
      el.textContent += fact[i++];
      setTimeout(typeChar, speed);
    } else {
      if (afterPrompt) afterPrompt.style.display = 'block';
    }
  }

  typeChar();
}

// Keep the displayed quote in sync with the scheduled file.
function setupAutoFactUpdates() {
  async function syncScheduledFact() {
    const scheduledFact = await getScheduledFact();
    if (!scheduledFact?.fact) {
      return;
    }

    const factStamp = scheduledFact.updatedAt || scheduledFact.generatedAt || scheduledFact.fact;
    const storedStamp = localStorage.getItem('lastFactStamp');

    if (storedStamp !== factStamp) {
      localStorage.setItem('lastFact', scheduledFact.fact);
      localStorage.setItem('lastFactDate', new Date().toDateString());
      localStorage.setItem('lastFactStamp', factStamp);
      typeFactIntoTerminal(scheduledFact.fact);
    }
  }

  // Check periodically so a long-open tab picks up the next cron-generated quote.
  setInterval(syncScheduledFact, 15 * 60 * 1000);

  // Initial check on page load
  syncScheduledFact();
}

// Init on load
if (document.readyState === 'loading') {
  console.log('Document still loading, attaching DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    // Initialize terminal and typed name
    initKaliTerminal();
    typedName();
    console.log('Both initKaliTerminal and typedName called');
    
    setTimeout(() => {
      const today = new Date().toDateString();
      const lastFact = localStorage.getItem('lastFact');
      const lastFactStamp = localStorage.getItem('lastFactStamp');

      (async () => {
        const scheduledFact = await getScheduledFact();

        if (scheduledFact?.fact) {
          const factStamp = scheduledFact.updatedAt || scheduledFact.generatedAt || scheduledFact.fact;
          if (lastFactStamp !== factStamp || !lastFact) {
            localStorage.setItem('lastFact', scheduledFact.fact);
            localStorage.setItem('lastFactDate', today);
            localStorage.setItem('lastFactStamp', factStamp);
          }

          typeFactIntoTerminal(scheduledFact.fact);
          return;
        }

        if (lastFact) {
          typeFactIntoTerminal(lastFact);
          return;
        }

        const newFact = getRandomFact();
        localStorage.setItem('lastFact', newFact);
        localStorage.setItem('lastFactDate', today);
        localStorage.setItem('lastFactStamp', newFact);
        typeFactIntoTerminal(newFact);
      })();

      // Keep the displayed fact in sync with the cron-generated file.
      setupAutoFactUpdates();
      
      // Set footer year dynamically
      try {
        const el = document.getElementById('footer-year');
        const currentYear = String(new Date().getFullYear());
        if (el) {
          el.textContent = currentYear;
          console.log('Footer year updated to:', currentYear);
        }
      } catch (e) { console.error('Footer year error:', e); }
      
      // Setup contact form
      setupContactForm();
    }, 400);
  });
} else {
  console.log('Document already loaded, calling initKaliTerminal and typedName immediately');
  initKaliTerminal();
  typedName();
}

/* ══════════════════════════════════════
   CONTACT FORM SUBMISSION (Formspree)
   ══════════════════════════════════════ */
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-status');
  
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    statusEl.textContent = 'Sending…';
    statusEl.className = '';
    
    const formData = new FormData(form);
    
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        statusEl.textContent = '✓ Thanks for reaching out! I'll reply soon.';
        statusEl.classList.add('success');
        form.reset();
        
        // Clear status message after 5 seconds
        setTimeout(() => {
          statusEl.textContent = '';
        }, 5000);
      } else {
        const json = await response.json().catch(() => ({}));
        statusEl.textContent = '✗ ' + (json.error || 'Failed to send. Please try again or email directly.');
        statusEl.classList.add('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      statusEl.textContent = '✗ Network error — please try emailing directly: prayagnepal2060@gmail.com';
      statusEl.classList.add('error');
    }
  });
}

/* ══════════════════════════════════════
   4. STICKY NAV SHADOW ON SCROLL
   ══════════════════════════════════════ */
(function stickyNav() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();


/* ══════════════════════════════════════
   5. MOBILE HAMBURGER MENU
   ══════════════════════════════════════ */
(function mobileMenu() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    links.classList.toggle('open');
  });

  // Close on nav link click
  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      links.classList.remove('open');
    });
  });
})();


/* ══════════════════════════════════════
   5.5. CERT CARD GITHUB LINKS
   ══════════════════════════════════════ */
(function certCardLinks() {
  fetch('./data/phases.json')
    .then(res => res.json())
    .then(data => {
      const cards = document.querySelectorAll('.cert-card');
      cards.forEach(card => {
        const phaseNum = parseInt(card.dataset.phase);
        const phase = data.phases.find(p => p.id === phaseNum);
        
        if (phase && phase.githubRepo) {
          card.style.cursor = 'pointer';
          card.addEventListener('click', () => {
            window.open(phase.githubRepo, '_blank', 'noopener,noreferrer');
          });
        }
      });
    })
    .catch(err => { /* ignore phase link load errors */ });
})();


/* ══════════════════════════════════════
   6. SCROLL REVEAL
   ══════════════════════════════════════ */
(function scrollReveal() {
  const targets = [
    '.section-title', '.section-label', '.about-text',
    '.about-skills', '.skill-block', '.cert-card',
    '.leadership-card', '.project-card', '.insight-terminal',
    '.section-sub', '.contact-links', '.hero-status',
  ];

  const elements = document.querySelectorAll(targets.join(','));
  elements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();


/* ══════════════════════════════════════
   7. ACTIVE NAV LINK HIGHLIGHT
   ══════════════════════════════════════ */
(function activeNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}`
            ? 'var(--accent)'
            : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();


/* ══════════════════════════════════════
   8. CERT PROGRESS BAR ANIMATE ON VIEW
   ══════════════════════════════════════ */
(function animateCertBars() {
  const fills = document.querySelectorAll('.cert-progress-fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = el.style.getPropertyValue('--fill');
        el.style.setProperty('--fill', '0%');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.setProperty('--fill', target);
          });
        });
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  fills.forEach(f => observer.observe(f));
})();


/* ══════════════════════════════════════
   9. TERMINAL GLITCH EFFECT (random)
   ══════════════════════════════════════ */
(function terminalGlitch() {
  const terminal = document.querySelector('.insight-terminal');
  if (!terminal) return;

  setInterval(() => {
    if (Math.random() > 0.85) {
      terminal.style.transform = `translateX(${Math.random() > 0.5 ? 1 : -1}px)`;
      setTimeout(() => { terminal.style.transform = ''; }, 80);
    }
  }, 3000);
})();
