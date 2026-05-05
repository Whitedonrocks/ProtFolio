# ProtFolio
# Prayag | B.Sc. CSIT & Cybersecurity Portfolio

> 5th Semester @ Himalaya College of Engineering | Kathmandu, Nepal

---

## 🎯 Quick Links

- **GitHub Notes & Resources**: [Notes_CyberSec](https://github.com/Whitedonrocks/Notes_CyberSec)
- **Projects & Labs**: [Whitedonrocks](https://github.com/Whitedonrocks)
- **CSIT Association**: Treasurer (Current), formerly Executive Member

---

## 📚 Certification Roadmap

### Full Roadmap (CSIT-Aligned)

| Phase | Content | Duration | Status | Notes |
|---|---|---|---|---|
| **1** | CompTIA A+ Core 1 + Core 2 | ~6 weeks | ✅ COMPLETE | Self-studied (Exam pending) |
| **2** | Networking — CCNA 200-301 (Jeremy's IT Lab) | 6 weeks | 🔄 IN PROGRESS | Cisco Packet Tracer labs, foundation networking |
| **3** | Linux + Python practical skills | 4 weeks | Upcoming | System administration & scripting |
| **4** | Security Fundamentals — Security+ / Google Cert | 6 weeks | Upcoming | Core security principles |
| **5** | Practical Hacking — PortSwigger + TryHackMe | 8 weeks | Upcoming | Hands-on vulnerability testing |
| **6** | HackTheBox + CTFs — Portfolio building | 6 weeks | Upcoming | Advanced lab scenarios |
| **7** | Advanced Certifications — eJPT / PJPT | 5 weeks | Upcoming | Professional pentesting credentials |

**Total Timeline**: ~41 weeks (~10 months from Phase 1)

---

## 👤 About

I'm a CSIT student passionate about **system internals**, **networking fundamentals**, and **cybersecurity**. I believe that understanding Operating Systems is the foundation of every security discipline.

**Environment**:
- Primary OS: Ubuntu 24.04 LTS (Linux CLI, Bash scripting, security tools)
- Secondary OS: Windows 11 (productivity, office work)

---

## 🛠️ Technical Stack

### Operating Systems
- Windows 11
- Ubuntu 24.04 LTS
- Linux CLI & Bash Scripting

### Networking
- Cisco CCNA 200-301 (in progress)
- Cisco Packet Tracer Labs
- Network fundamentals & routing/switching concepts

### Languages & Tools
- **Languages**: Python, Bash, JavaScript
- **Networking**: Cisco Packet Tracer, Wireshark, Netstat
- **Security**: TryHackMe, PortSwigger, HackTheBox (upcoming)
- **System Admin**: Linux administration, service management

### Projects
See linked GitHub repositories:
- [CyberSec Notes](https://github.com/Whitedonrocks/Notes_CyberSec) — Phase 1 & Phase 2 content
- [Main GitHub](https://github.com/Whitedonrocks) — All projects, Cisco labs, networking labs

---

## 🏆 Leadership & Involvement

### CSIT Association of Nepal
- **Current Role**: Treasurer
- **Previous Role**: Executive Member
- Involved in student community development and knowledge sharing

---

## 💡 Daily Learning Insight

### Cyber Fact of the Day
The portfolio now uses a **Vercel Cron job** to publish one scheduled quote per day into `data/daily-quote.json`:

**Automation Setup**:
- **Trigger**: Vercel Cron running once per day
- **Storage**: GitHub repo file updated by the cron job
- **Frontend Source**: `data/daily-quote.json`
- **Fallback**: Manual refresh still uses the API route for an instant new fact

**To Deploy the Vercel Automation**:
1. Add `GITHUB_TOKEN` to the Vercel project environment variables with permission to update the repo contents.
2. Keep `HUGGING_FACE_TOKEN` set for the manual instant-fact API route.
3. Deploy the repo on Vercel.
4. The cron is configured in `vercel.json` to run at `15 9 * * *` UTC (09:15 UTC = 3:00 PM Nepal Time).
5. Confirm `data/daily-quote.json` updates in GitHub after the first cron run.
6. Verify the live site shows the committed daily quote.

**⚠️ Hobby Plan Timing Note**:  
On Vercel's free Hobby plan, cron jobs are limited to once per day with loose timing precision. A job scheduled for 3:00 PM may fire anytime within that hour (e.g., 3:00–3:59 PM). The quote will still update daily, but not at an exact time. For precise timing, upgrade to Vercel Pro or use an external scheduler like n8n.

---

## 📁 Project Structure

```
files/
├── index.html              # Main portfolio website
├── main.js                 # Interaction logic, matrix rain, animations
├── style.css               # Cyber/terminal aesthetic styling
├── README.md               # This file
│
├── assets/
│   ├── images/            # Icons, logos, decorative elements
│   └── photos/            # **Your profile photo & additional photos**
│
├── projects/
│   ├── cisco-labs/        # CCNA Packet Tracer labs
│   ├── ctf-writeups/      # HackTheBox / TryHackMe writeups
│   └── python-scripts/    # Python automation & tools
│
├── data/
│   ├── cyber-facts.json   # For n8n automation
│   └── roadmap.json       # Structured roadmap data
│
└── config/
    └── n8n-workflow.json  # n8n automation template
```

---

## 📸 Photo Setup

**Place your profile photo here:**
- Location: `assets/images/profile-picture.jpeg` (or another image in `assets/images/`)
- Recommended size: 300x300px or 400x400px
- Format: JPG or PNG

The website references this in the About section.

---

## 🚀 Getting Started

1. **Add your photo** to `/assets/images/profile-picture.jpeg`
2. **Update GitHub links** in HTML (already set up)
3. **Deploy n8n workflow** for daily cyber facts
4. **Host on GitHub Pages** or your server

---

## 📞 Contact & Social

- **Email**: prayagnepal2060@gmail.com
- **GitHub**: [@Whitedonrocks](https://github.com/Whitedonrocks)
- **Location**: Kathmandu, Nepal

---

**Last Updated**: May 2026 | **Phase**: 2 (CCNA) | **Status**: 🔄 Active Learning
