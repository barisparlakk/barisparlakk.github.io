const output = document.getElementById("output");
const input = document.getElementById("commandInput");
const body = document.body;

const commands = {
  info: `I am a Computer Engineering student with a strong interest in data science and artificial intelligence.`,
  projects: `- Sensoria (Emotion recognition using EEG)\n- StepFree (Smart shoes for the visually impaired)\n- ChatBot App (built with Next.js, Supabase, Gemini API)`,
  github: `GitHub: https://github.com/barisparlakk`,
  linkedin: `LinkedIn: https://www.linkedin.com/in/barış-parlak-1a0a94252/`,
  socials: `Instagram: https://instagram.com/barissparlak\nTwitter: https://twitter.com/bvris`,
  cv: `Opening CV...`,
  help: `Available commands: info, projects, github, linkedin, socials, cv, theme, help, clear`,
  clear: "clear"
};

function typeText(text, callback) {
  let index = 0;
  const speed = 20;
  const typing = setInterval(() => {
    if (index < text.length) {
      output.innerHTML += text.charAt(index);
      index++;
      output.scrollTop = output.scrollHeight;
    } else {
      clearInterval(typing);
      if (callback) callback();
    }
  }, speed);
}

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    const command = input.value.trim().toLowerCase();
    output.innerHTML += `$ ${command}\n`;

    if (command === "clear") {
      output.innerHTML = "";
      input.value = "";
      return;
    }

    if (command === "theme") {
      body.classList.toggle("light-theme");
      typeText("Theme switched.\n");
    } else if (command === "cv") {
      typeText("Opening CV...\n", () => {
        window.open("cv.pdf", "_blank");
      });
    } else if (commands.hasOwnProperty(command)) {
      typeText(commands[command] + "\n");
    } else {
      typeText(`Command not found: ${command}\n`);
    }

    input.value = "";
  }
});

// Welcome message on load
window.onload = () => {
  const welcomeMessage = "Welcome, type `help` to see available commands.\n\n";
  typeText(welcomeMessage);
};
