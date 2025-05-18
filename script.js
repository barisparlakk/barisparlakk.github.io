const output = document.getElementById("output");
const input = document.getElementById("commandInput");
const body = document.body;

const asciiArt = `
   ____        _   _                 
  |  _ \\ _   _| |_| |__   ___  _ __  
  | | | | | | | __| '_ \\ / _ \\| '_ \\ 
  | |_| | |_| | |_| | | | (_) | | | |
  |____/ \\__,_|\\__|_| |_|\\___/|_| |_|
`;

const commands = {
  info: `Ben Bilgisayar Mühendisliği öğrencisiyim. Veri bilimi ve yapay zekaya ilgi duyuyorum.`,
  projects: `- Sensoria (EEG ile duygu tanıma)\n- Engelsiz Adım (Görme engelliler için yardımcı sensör)\n- ChatBot App (Next.js, Supabase, Gemini API)`,
  github: `GitHub: https://github.com/kullaniciadiniz`,
  linkedin: `LinkedIn: https://www.linkedin.com/in/kullaniciadiniz`,
  socials: `Instagram: https://instagram.com/kullaniciadiniz\nTwitter: https://twitter.com/kullaniciadiniz`,
  cv: `CV bağlantısı açılıyor...`,
  ascii: asciiArt,
  help: `Mevcut komutlar: info, projects, github, linkedin, socials, cv, theme, ascii, help, clear`,
  clear: "clear"
};

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    const command = input.value.trim().toLowerCase();
    output.innerHTML += `$ ${command}\n`;

    if (command === "clear") {
      output.innerHTML = "";
    } else if (command === "theme") {
      body.classList.toggle("light-theme");
      output.innerHTML += "Tema değiştirildi.\n";
    } else if (command === "cv") {
      output.innerHTML += "CV bağlantısı açılıyor...\n";
      window.open("cv.pdf", "_blank");
    } else if (commands.hasOwnProperty(command)) {
      output.innerHTML += `${commands[command]}\n`;
    } else {
      output.innerHTML += `Komut bulunamadı: ${command}\n`;
    }

    input.value = "";
    output.scrollTop = output.scrollHeight;
  }
});
