/* Site content. index.html renders everything from this file. */
window.SITE = {
  name: "Andrew Ngo",
  kanji: "呉",
  email: "an@drewngo.com",
  github: "https://github.com/drewngo",
  linkedin: "https://www.linkedin.com/in/andrewngo26/",
  tagline: "Computer engineering @ Wichita State · FPGA & DSP",
  about: [
    "hello i'm andrew, a 3rd year student majoring in computer engineering at Wichita State, focusing on RTL design and verification, with the intention of building FPGA and embedded systems for space and avionics communications.",
    "i currently work as a software engineer intern at Bombardier, and a researcher in the Quantum Science and Engineering Lab, where i'm designing the FPGA and electronics for a quantum magnetometer. i also serve as the external vice president of our Society of Asian Scientists and Engineers chapter, and co-lead CosmoShox, our NASA SUITS team.",
    "in my personal time, i enjoy spending it with friends and family, or doing the variety of hobbies i partake in like amateur radio, rock climbing, reading, watching films, finding new music, or playing video games."
  ],
  jobs: [
    { co: "NASA Langley Research Center", unit: "Electronic Systems Branch", role: "Incoming Pathways Intern", loc: "Hampton, VA", date: "01/2027 (spring)", start: "2027", live: false, logo: "nasa_logo.jpg" },
    { co: "Wichita State University", unit: "Quantum Science and Engineering Lab", role: "FPGA & DSP Design Researcher", loc: "Wichita, KS", date: "09/2026 – now", start: "2026", live: true, logo: "wichita_state_university_logo.jpg" },
    { co: "Bombardier", role: "Software Engineer Intern", loc: "Wichita, KS", date: "05/2026 – now", start: "2026", live: true, logo: "bombardier_logo.jpg" },
    { co: "Koch Industries", role: "Product Support Analyst Co-op", loc: "Wichita, KS", date: "01/2026 – 05/2026", start: "2026", live: false, logo: "kochindustries_logo.jpg" },
    { co: "NetApp", role: "QA Analyst Intern", loc: "Wichita, KS", date: "03/2025 – 01/2026", start: "2025", live: false, logo: "netapp_logo.jpg" },
    { co: "Boeing", role: "Information Technology Intern", loc: "Wichita, KS", date: "11/2024 – 03/2025", start: "2024", live: false, logo: "boeing_logo.jpg" }
  ],
  school: { co: "Wichita State University", role: "B.S. Computer Engineering, minor in Computer Science", date: "08/2024 – 05/2028" },
  projects: [
    {
      title: "FireWatch", jp: "火の見", year: "2026",
      href: "https://github.com/isaksmith/Firewatch", linkText: "github",
      award: "2nd place · Lockheed Martin Skunk Works hackathon",
      tags: ["satellites", "goes / viirs / modis", "lora mesh", "meshtastic", "python", "react"],
      blurb: "A detect, confirm and respond system for rural Kansas volunteer fire districts, built in one weekend by a five-person team.",
      body: [
        "A detect, confirm and respond system for rural Kansas volunteer fire districts, built in one weekend by a five-person team at Firewatch 2026, the WSU Innovation Works × Lockheed Martin Skunk Works hackathon. It fuses GOES, VIIRS and MODIS satellite hotspots with power-line faults and texted reports, then pages over SMS and a Meshtastic LoRa mesh, so alerts still go out on one bar of cell.",
        "Built the fire spread forecast: an NLCD/CDL fuel map, terrain, hourly wind and a 24-member ensemble. Back-tested against archived VIIRS, MODIS and GOES-19 fire detections from real Plains fires: starting from the first satellite pass, its range covered 77% of later polar-orbiter detections, against 34% for a single-run baseline."
      ]
    },
    {
      title: "VHDLBits", jp: "練習帳", year: "2026",
      href: "https://vhdl.drewngo.com", linkText: "vhdl.drewngo.com",
      tags: ["vhdl-2008", "ghdl", "python", "cloud run", "cloudflare workers"],
      blurb: "216 VHDL-2008 practice problems with an online grader, for people who already know Verilog.",
      body: [
        "I learned a lot from Henry Wong's HDLBits but couldn't find anything like it for VHDL, so I built one: 216 VHDL-2008 practice problems with an online grader, for people who already know Verilog. Sixteen sections run from one-line assignments through numeric_std, FSMs, memories and testbench writing to bigger builds and bug hunts.",
        "The grader compiles the submission and a reference design side by side in GHDL, drives both with identical stimulus and compares every output exactly, down to 'U', 'X' and 'Z'. Submissions run as untrusted code in sandboxed child processes on Cloud Run, behind a Cloudflare Worker with Turnstile and rate limits."
      ]
    },
    {
      title: "NOAA APT Satellite Decoder", jp: "気象衛星", year: "2026",
      href: "https://github.com/drewngo/noaa-apt-decoder-artix7", linkText: "github",
      tags: ["verilog", "nexys a7-100t", "vivado", "python", "dsp", "fixed-point fir"],
      blurb: "A weather-satellite decoder for an Artix-7 FPGA, from raw IQ recordings to decoded imagery.",
      body: [
        "A dual-implementation NOAA APT weather-satellite decoder for a Xilinx Artix-7 FPGA, turning archived pre-demodulation IQ recordings into decoded imagery. A 5-stage Python reference pipeline validates the full chain: a Kaiser-windowed channel-select FIR, FM demodulation by phase differentiation, and a cascaded decimation bank that brings 62,400 Hz to the 4,160 Hz APT word rate exactly at Nyquist.",
        "Now in RTL: a CORDIC-based fixed-point FM demodulator and a time-multiplexed serial FIR that reuses a single DSP slice across every tap, inside a ~1,600-cycle-per-sample budget at 100 MHz."
      ]
    },
    {
      title: "FPGA Temperature Monitor", jp: "温度計", year: "2025",
      href: "https://github.com/drewngo/Nexys-A7-ADT7420-Temperature-Sensor", linkText: "github",
      tags: ["verilog", "i2c", "vivado", "icarus verilog"],
      blurb: "A from-scratch I2C master reading an ADT7420, shown on a seven-segment display.",
      body: [
        "A from-scratch I2C master FSM reading an ADT7420 on a Nexys A7-100T, with the clock divided into quarter-phases so SDA transitions land well away from SCL edges. Readings become Celsius or Fahrenheit BCD on a multiplexed seven-segment display. A self-checking testbench models the ADT7420 as a slave and asserts every byte and ACK/NACK bit."
      ]
    },
    {
      title: "Home Lab", jp: "自宅鯖", year: "2025",
      href: null, linkText: null,
      tags: ["proxmox", "docker-compose", "zfs", "ubuntu server", "cloudflare"],
      blurb: "A Proxmox hypervisor on ZFS mirrors running self-hosted services and a media server.",
      body: [
        "A Proxmox hypervisor on ZFS mirrors with automated S.M.A.R.T. checks, running self-hosted cloud services and a media server that handles 7+ concurrent streams. Remote access goes through VPN and Cloudflare tunnels, which also served the infrastructure for a 60+ participant regional student hackathon."
      ]
    },
    {
      title: "Ollama Home Assistant", jp: "音声助手", year: "2024",
      href: "https://github.com/prestondinh22/ollama_assistant", linkText: "github",
      tags: ["python", "ollama", "whisper", "flask", "raspberry pi", "gpio"],
      blurb: "An offline, voice-activated assistant on a Raspberry Pi with a physical button.",
      body: [
        "An offline, voice-activated assistant on a Raspberry Pi with a physical GPIO button. A small Flask layer captures audio, transcribes it locally with Whisper, and runs Llama 3.1 through Ollama, all on the device."
      ]
    }
  ],
  artifacts: {
    facom: { src: "img/archive/facom.jpg",       alt: "The FACOM 201A parametron computer at the Ridai Museum", label: "FACOM 201A parametron computer, 1960", credit: "Darklanlan, CC0", page: "https://commons.wikimedia.org/wiki/File:FACOM_201A_at_Ridai_Museum.jpg" },
    kappa: { src: "img/archive/kappa.jpg",       alt: "A Kappa-9 sounding rocket on its stand, a man in a suit beside it, late 1950s", label: "Kappa-9 sounding rocket, c. 1958", credit: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Kappa-9_rocket-01_(cropped).jpg" },
    ohsumi: { src: "img/archive/ohsumi.jpg",     alt: "The Ohsumi satellite at a diagonal on a red-orange background", label: "Ohsumi satellite, 1970", credit: "Wikid77, CC BY 2.5", page: "https://commons.wikimedia.org/wiki/File:Osumi_satellite.jpg" },
    tr55: { src: "img/archive/tr55.jpg",      alt: "A green Sony TR-55 transistor radio", label: "Sony TR-55 transistor radio, 1955", credit: "ブルーノ・プラス, CC0", page: "https://commons.wikimedia.org/wiki/File:Transistor_radio_TR-55_by_sony.jpg" },
    busicom: { src: "img/archive/busicom.jpg",     alt: "A Busicom 141-PF printing calculator", label: "Busicom 141-PF calculator, 1971", credit: "Christian Bassow, CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Busicom_141_PF_1.jpg" }
  }
};

/* Small helpers. */
window.LAB = {
  esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  /* Resolves to [{category, label, items:[...]}], same labelling rules as the live site. */
  currently() {
    const URL = "https://gist.githubusercontent.com/drewngo/86e6049381f2a0b9dcfb0e731ec97c48/raw/currently.json";
    return fetch(URL + "?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const out = [];
        ["reading", "watching", "listening"].forEach((cat) => {
          (data[cat] || []).forEach((it) => {
            const label = it.status !== "finished" ? "currently " + cat
              : cat === "watching" ? "last watched" : cat === "reading" ? "last read" : "recently finished " + cat;
            let g = out.find((x) => x.category === cat && x.label === label);
            if (!g) out.push((g = { category: cat, label, items: [] }));
            g.items.push({ ...it, by: it.author || it.creator || "" });
          });
        });
        return out;
      });
  },
  src(p) { return p; },
  year: new Date().getFullYear()
};
