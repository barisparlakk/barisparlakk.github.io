const output = document.getElementById("output");
const input = document.getElementById("commandInput");
const body = document.body;
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
    "Barış Parlak\nJr. Data Scientist / AI Developer and Computer Engineering student focused on autonomous systems, computer vision, deep learning, and local language intelligence.",
  projects:
    "Selected projects:\n\n- Seyir: CARLA autonomous driving stack with YOLOv11, UFLD-v2, Depth-Anything-V2, sensor fusion, SocialTransformer, A*, PPO, and MPC.\n- DeepDerm: YOLOv11 acne detection and treatment tracking system with doctor panel and patient app.\n- TurkRAG: Local Turkish RAG pipeline with BM25 + FAISS hybrid retrieval, Ollama, LangChain, and FastAPI.",
  seyir:
    "Seyir\nEnd-to-end autonomous driving system for Turkish traffic conditions in CARLA 0.9.15.\n\nFocus: perception -> prediction -> planning -> control\nStack: Python, C++, CARLA, YOLOv11, PyTorch, PPO, MPC, A*, FastAPI, React, Docker",
  deepderm:
    "DeepDerm\nMedical AI system for real-time acne lesion detection and remote treatment tracking.\n\nStack: YOLOv11, FastAPI, React, React Native, Spring Boot, PostgreSQL, Roboflow",
  turkrag:
    "TurkRAG\nCloud-free Turkish RAG pipeline designed for local, KVKK-conscious retrieval and question answering.\n\nStack: Python, LangChain, FAISS, BM25, Ollama, FastAPI, Sentence-Transformers",
  experience:
    "Experience:\n\nCaladrius - Artificial Intelligence Developer, Apr 2026 - May 2026\nDesigned a LoRA fine-tuning pipeline for MedGemma 27B and structured medical outputs for OED classification.\n\nUnidev Software Turkey - Machine Learning Developer, Feb 2025 - Oct 2025\nWorked on geospatial analysis, Folium maps, MyUni database/API integrations, and personalization with collaborative filtering + K-means.",
  skills:
    "Skills:\n\nAutonomy/Vision: A*, MPC, behavior FSM, PPO, sensor fusion, YOLOv11, lane/depth estimation, PyTorch, LSTM, SocialTransformer\nLLM/NLP: LoRA, MedGemma 27B, LangChain, FAISS, BM25, Hugging Face\nStack: Python, C++, SQL, FastAPI, Django, Spring Boot, PostgreSQL, MySQL, Docker, Git, React, React Native\nLanguages: Turkish, English C1, Polish B1, German A2, Indonesian A1",
  education:
    "Education:\n\nInonu University - Computer Engineering, Aug 2024 - Present\nWojskowa Akademia Techniczna w Warszawie - Computer Science, Erasmus+, Sep 2025 - Feb 2026\nMalatya Turgut Ozal University - Computer Engineering, Sep 2022 - Aug 2024",
  contact:
    "Contact:\nEmail: barisparlak36@gmail.com\nGitHub: github.com/barisparlakk\nLinkedIn: linkedin.com/in/baris-parlak",
  github: "Opening GitHub...",
  linkedin: "Opening LinkedIn...",
  cv: "Opening CV...",
  theme: "Theme switched.",
  clear: "",
  help:
    "Available commands:\nabout\nprojects\nseyir\ndeepderm\nturkrag\nexperience\nskills\neducation\ncontact\ngithub\nlinkedin\ncv\ntheme\nclear\nhelp",
};

const actions = {
  github: () => window.open("https://github.com/barisparlakk", "_blank", "noopener"),
  linkedin: () => window.open("https://www.linkedin.com/in/bar%C4%B1%C5%9F-parlak-1a0a94252/", "_blank", "noopener"),
  cv: () => window.open("cv.pdf", "_blank", "noopener"),
  theme: () => body.classList.toggle("light-theme"),
};

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

  appendLine(`$ ${command}`);
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

window.addEventListener("load", () => {
  resetInitialScroll();
  typeText('Welcome. Type "help" to explore the portfolio, or scroll for the full site.', resetInitialScroll);
});

window.addEventListener("pageshow", resetInitialScroll);
