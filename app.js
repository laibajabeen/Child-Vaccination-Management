const faqContainer = document.getElementById("faq-container");
const faqForm = document.getElementById("faq-form");
const questionInput = document.getElementById("question");
const answerInput = document.getElementById("answer");

// Fetch FAQs from the server
async function fetchFAQs() {
  const response = await fetch("http://localhost:5000/faqs");
  const faqs = await response.json();

  faqContainer.innerHTML = "";
  faqs.forEach((faq) => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>Q:</strong> ${faq.question} <br> <strong>A:</strong> ${faq.answer}<br><hr>`;
    faqContainer.appendChild(div);
  });
}

// Submit new FAQ
faqForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = questionInput.value;
  const answer = answerInput.value;

  await fetch("http://localhost:5000/faqs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, answer }),
  });

  questionInput.value = "";
  answerInput.value = "";
  fetchFAQs();
});

// Initial load
fetchFAQs();
