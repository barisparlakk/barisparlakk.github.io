const output = document.getElementById("output");
const input = document.getElementById("commandInput");
const root = document.documentElement;
const shouldStartAtTop = !window.location.hash;

const commandHistory = [];
let historyIndex = 0;

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function resetInitialScroll() {
  if (shouldStartAtTop) {
    window.scrollTo(0, 0);
  }
}

const responses = {
  about:
    "Barış Parlak\nAI developer and computer engineering student in Istanbul, working on autonomous systems, computer vision, deep learning and local language models.",
  projects:
    "Selected projects:\n\n- Seyir: CARLA autonomous driving stack with YOLOv11, UFLD-v2, Depth-Anything-V2, sensor fusion, SocialTransformer, A*, PPO, and MPC.\n- DeepDerm: YOLOv11 acne detection and treatment tracking system with doctor panel and patient app.\n- TurkRAG: Local Turkish RAG pipeline with BM25 + FAISS hybrid retrieval, Ollama, LangChain, and FastAPI.",
  seyir:
    "Seyir\nEnd-to-end autonomous driving system for Turkish traffic conditions in CARLA 0.9.15.\n\nPipeline: perception -> prediction -> planning -> control\nStack: Python, C++, CARLA, YOLOv11, PyTorch, PPO, MPC, A*, FastAPI, React, Docker",
  deepderm:
    "DeepDerm\nMedical AI system for real-time acne lesion detection and remote treatment tracking.\n\nStack: YOLOv11, FastAPI, React, React Native, Spring Boot, PostgreSQL, Roboflow",
  turkrag:
    "TurkRAG\nCloud-free Turkish RAG pipeline designed for local, KVKK-conscious retrieval and question answering.\n\nStack: Python, LangChain, FAISS, BM25, Ollama, FastAPI, Sentence-Transformers",
  experience:
    "Experience:\n\nCaladrius - Artificial Intelligence Developer, Apr 2026 - May 2026\nDesigned a LoRA fine-tuning pipeline for MedGemma 27B and structured medical outputs for OED classification.\n\nUnidev Software Turkey - Machine Learning Developer, Feb 2025 - Oct 2025\nWorked on geospatial analysis, Folium maps, MyUni database/API integrations, and personalization with collaborative filtering + K-means.",
  skills:
    "Skills:\n\nAutonomy/Vision: A*, MPC, behavior FSM, PPO, sensor fusion, YOLOv11, lane/depth estimation, PyTorch, LSTM, SocialTransformer\nLLM/NLP: LoRA, MedGemma 27B, LangChain, FAISS, BM25, Hugging Face\nStack: Python, C++, SQL, FastAPI, Django, Spring Boot, PostgreSQL, MySQL, Docker, Git, React, React Native\nLanguages: Turkish (native), English C1, Polish B1, German A2, Indonesian A1",
  education:
    "Education:\n\nİnönü University - Computer Engineering, Aug 2024 - present\nMilitary University of Technology, Warsaw - Computer Science (Erasmus+), Sep 2025 - Feb 2026\nMalatya Turgut Özal University - Computer Engineering, Sep 2022 - Aug 2024",
  contact:
    "Contact:\nEmail: barisparlak36@gmail.com\nGitHub: github.com/barisparlakk\nLinkedIn: linkedin.com/in/barış-parlak-1a0a94252",
  github: "Opening GitHub...",
  linkedin: "Opening LinkedIn...",
  cv: "Opening CV...",
  theme: "Switched colour theme.",
  clear: "",
  help:
    "Available commands:\nabout\nprojects\nseyir\ndeepderm\nturkrag\nexperience\nskills\neducation\ncontact\ngithub\nlinkedin\ncv\ntheme\nclear\nhelp",
};

const actions = {
  github: () => window.open("https://github.com/barisparlakk", "_blank", "noopener"),
  linkedin: () => window.open("https://www.linkedin.com/in/bar%C4%B1%C5%9F-parlak-1a0a94252/", "_blank", "noopener"),
  cv: () => window.open("cv.pdf", "_blank", "noopener"),
  theme: toggleTheme,
};

function toggleTheme() {
  const current =
    root.dataset.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = current === "dark" ? "light" : "dark";
}

function appendLine(text = "", className = "") {
  const line = document.createElement("div");
  if (className) {
    line.className = className;
  }
  line.textContent = text;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function typeText(text, callback) {
  const line = document.createElement("div");
  output.appendChild(line);

  let index = 0;
  const speed = 8;
  const typing = window.setInterval(() => {
    if (index < text.length) {
      line.textContent += text.charAt(index);
      index += 1;
      output.scrollTop = output.scrollHeight;
      return;
    }

    window.clearInterval(typing);
    appendLine();
    if (callback) {
      callback();
    }
  }, speed);
}

function runCommand(rawCommand) {
  const command = rawCommand.trim().toLowerCase();
  if (!command) {
    return;
  }

  appendLine(`$ ${command}`, "cmd");
  commandHistory.push(command);
  historyIndex = commandHistory.length;

  if (command === "clear") {
    output.textContent = "";
    return;
  }

  const response = responses[command];
  if (!response) {
    typeText(`Command not found: ${command}\nType "help" to see available commands.`);
    return;
  }

  if (actions[command]) {
    typeText(response, actions[command]);
    return;
  }

  typeText(response);
}

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runCommand(input.value);
    input.value = "";
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = commandHistory[historyIndex] || "";
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    historyIndex = Math.min(commandHistory.length, historyIndex + 1);
    input.value = commandHistory[historyIndex] || "";
  }
});

document.querySelector(".terminal").addEventListener("click", () => {
  input.focus();
});

// The hero name is framed like a YOLO detection: the box settles over a few
// "frames" while the confidence climbs, then locks on.
function runDetection() {
  const box = document.querySelector(".det-box");
  const conf = document.getElementById("det-conf");
  if (!box || !conf || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const frames = [
    { inset: "22% 38% 34% -7%", conf: "0.41" },
    { inset: "9% 14% 16% 5%", conf: "0.67" },
    { inset: "-4% 5% 5% -2%", conf: "0.89" },
    { inset: "", conf: "0.98" },
  ];

  frames.forEach((frame, index) => {
    window.setTimeout(() => {
      box.style.inset = frame.inset;
      conf.textContent = frame.conf;
    }, index * 170);
  });
}

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
fontsReady.then(runDetection);

window.addEventListener("load", () => {
  resetInitialScroll();
  typeText('Type "help" to list commands.', resetInitialScroll);
});

window.addEventListener("pageshow", resetInitialScroll);
