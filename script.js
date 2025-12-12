document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://opentdb.com/api.php?amount=12&category=11&difficulty=easy&type=multiple";
  const questionBox = document.getElementById("question");
  const optionsBox = document.getElementById("options");
  const result = document.getElementById("result");
  const scoreBox = document.getElementById("score");
  const quizBox = document.querySelector(".quiz-box");

  let veckansFragor = [];
  let aktuellIndex = 0;
  let poang = 0;
  let harSvarat = false;

  function decodeHTML(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  function getWeekNumber(date) {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisSince = date - onejan + ((onejan.getTimezoneOffset() - date.getTimezoneOffset()) * 60000);
    const dayNum = Math.floor(millisSince / 86400000) + 1;
    return Math.ceil(dayNum / 7);
  }

  async function hamtaVeckansFragor() {
    const weekNumber = getWeekNumber(new Date());

    try {
      const lagrade = JSON.parse(localStorage.getItem("fredagsQuiz"));
      if (lagrade && lagrade.week === weekNumber && Array.isArray(lagrade.data) && lagrade.data.length === 5) {
        veckansFragor = lagrade.data;
        aktuellIndex = 0;
        poang = 0;
        visaFraga();
        return;
      }
    } catch (e) {}

    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        questionBox.textContent = "Kunde inte hämta frågor just nu.";
        return;
      }

      veckansFragor = data.results
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(q => {
          const allOptions = [...q.incorrect_answers, q.correct_answer].map(decodeHTML);
          return {
            question: decodeHTML(q.question),
            options: allOptions.sort(() => Math.random() - 0.5),
            answer: decodeHTML(q.correct_answer)
          };
        });

      localStorage.setItem("fredagsQuiz", JSON.stringify({ week: weekNumber, data: veckansFragor }));
      aktuellIndex = 0;
      poang = 0;
      visaFraga();
    } catch (err) {
      console.error("Fel vid hämtning av frågor:", err);
      questionBox.textContent = "Fel vid hämtning av frågorna.";
    }
  }

  function visaFraga() {
    if (aktuellIndex >= veckansFragor.length) return visaSlut();
    harSvarat = false;
    const fraga = veckansFragor[aktuellIndex];

    questionBox.textContent = `Fråga ${aktuellIndex + 1} av 5: ${fraga.question}`;
    optionsBox.innerHTML = "";
    result.textContent = "";
    scoreBox.textContent = `Poäng: ${poang}/${veckansFragor.length}`;

    fraga.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => kontrolleraSvar(btn, opt));
      optionsBox.appendChild(btn);
    });
  }

  function kontrolleraSvar(btn, val) {
    if (harSvarat) return;
    harSvarat = true;

    const fraga = veckansFragor[aktuellIndex];
    const knappar = optionsBox.querySelectorAll("button");
    knappar.forEach(b => b.disabled = true);

    if (val.trim() === fraga.answer.trim()) {
      poang++;
      btn.style.backgroundColor = "#00cc66";
      result.textContent = "✅ Rätt!";
    } else {
      btn.style.backgroundColor = "#cc0033";
      knappar.forEach(b => {
        if (b.textContent.trim() === fraga.answer.trim()) b.style.backgroundColor = "#00cc66";
      });
      result.textContent = `❌ Fel! Rätt svar är: ${fraga.answer}`;
    }

    scoreBox.textContent = `Poäng: ${poang}/${veckansFragor.length}`;

    setTimeout(() => {
      aktuellIndex++;
      visaFraga();
    }, 1000);
  }

  function visaSlut() {
    questionBox.textContent = "🎉 Klart! Du har gjort alla 5 fredagsfrågorna!";
    optionsBox.innerHTML = "";
    result.textContent = `Din slutpoäng: ${poang}/${veckansFragor.length}`;
    if (poang === veckansFragor.length && typeof confetti === "function") startConfetti();
  }

  function startConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 6, spread: 60, origin: { y: 0.6 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  // Visa bara fredag
  if (new Date().getDay() !== 5) {
    quizBox.innerHTML = "<p>Kom tillbaka på fredag för veckans 5 frågor! 📅</p>";
  } else {
    hamtaVeckansFragor();
  }
});
