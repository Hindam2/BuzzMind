document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("quizSearch");
  const quizCards = document.querySelectorAll(".quiz-card");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();

      quizCards.forEach((card) => {
        const titleEl = card.querySelector("h3");
        const title = titleEl ? titleEl.innerText.toLowerCase() : "";

        if (title.includes(term)) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  const playButtons = document.querySelectorAll(".play-btn, .play-circle");

  playButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Find correct parent container
      const card = btn.closest(".quiz-card") || btn.closest(".shared-item");

      const titleElement = card?.querySelector("h3, h4");
      const quizTitle = titleElement?.innerText || "Quiz";

      alert(`Starting Game: ${quizTitle}`);
    });
  });
});
