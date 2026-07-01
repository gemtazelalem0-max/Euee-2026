// app.js - Supabase Exam Application Logic

// ==========================================
// SUPABASE CONFIGURATION
// Replace the values below with your project URL and API key
// ==========================================
const SUPABASE_URL = 'https://tpeuxtrtyptofzequhkn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZXV4dHJ0eXB0b2Z6ZXF1aGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTQ1ODQsImV4cCI6MjA5ODQzMDU4NH0.LYIYI4U5yG4J7Uh2UrJza333p-W0Rz0gMS8T6V5EHno';

// DOM Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const setupScreen = document.getElementById('setup-screen');
const examScreen = document.getElementById('exam-screen');
const resultsScreen = document.getElementById('results-screen');
const examSelect = document.getElementById('exam-select');
const startExamBtn = document.getElementById('start-exam-btn');
const activeStudentName = document.getElementById('active-student-name');
const activeExamName = document.getElementById('active-exam-name');
const questionsContainer = document.getElementById('questions-container');
const examForm = document.getElementById('exam-form');
const studentNameInput = document.getElementById('student-name');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Results elements
const resultStudentName = document.getElementById('result-student-name');
const scoreFraction = document.getElementById('score-fraction');
const scorePercentage = document.getElementById('score-percentage');
const scoreCircleProgress = document.getElementById('score-circle-progress');
const summaryCorrect = document.getElementById('summary-correct');
const summaryIncorrect = document.getElementById('summary-incorrect');
const reviewsContainer = document.getElementById('reviews-container');
const restartBtn = document.getElementById('restart-btn');

// App State Variables
let allQuestions = [];
let questions = [];
let selectedExamId = '';
let studentName = '';

// Helper: Check if values are placeholder credentials
function isPlaceholder(value) {
  return !value || 
         value === 'YOUR_SUPABASE_URL' || 
         value === 'YOUR_SUPABASE_ANON_KEY' || 
         value.trim() === '';
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// UI State Toggles
function showLoading() {
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
  setupScreen.classList.add('hidden');
  examScreen.classList.add('hidden');
  resultsScreen.classList.add('hidden');
}

function showError(message) {
  loadingState.classList.add('hidden');
  errorState.classList.remove('hidden');
  errorMessage.textContent = message;
  setupScreen.classList.add('hidden');
  examScreen.classList.add('hidden');
  resultsScreen.classList.add('hidden');
}

function showSetup() {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  setupScreen.classList.remove('hidden');
  examScreen.classList.add('hidden');
  resultsScreen.classList.add('hidden');
}

function showExam() {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  setupScreen.classList.add('hidden');
  examScreen.classList.remove('hidden');
  resultsScreen.classList.add('hidden');
}

// Show custom non-blocking toast warning
let toastTimeout;
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  // Trigger transition
  setTimeout(() => toast.classList.add('show'), 10);
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }, 4000);
}

// Fetch all questions from Supabase
async function fetchQuestions() {
  if (isPlaceholder(SUPABASE_URL) || isPlaceholder(SUPABASE_ANON_KEY)) {
    showError("Please configure SUPABASE_URL and SUPABASE_ANON_KEY at the top of app.js to connect to your Supabase project.");
    return;
  }

  try {
    showLoading();
    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_option, exam_id');

    if (error) throw error;

    if (!data || data.length === 0) {
      showError("Connected to Supabase, but no questions were found in the 'questions' table. Make sure to insert some records first.");
      return;
    }

    allQuestions = data;
    
    // Extract unique exam IDs, default empty/null values to 'General'
    const exams = [...new Set(allQuestions.map(q => {
      const examName = q.exam_id ? q.exam_id.trim() : 'General';
      return examName !== '' ? examName : 'General';
    }))];
    
    // Populate select dropdown
    examSelect.innerHTML = '<option value="" disabled selected>Choose an exam...</option>';
    exams.forEach(exam => {
      const option = document.createElement('option');
      option.value = exam;
      option.textContent = exam;
      examSelect.appendChild(option);
    });

    showSetup();
  } catch (err) {
    console.error("Fetch error details:", err);
    showError("Failed to fetch questions: " + (err.message || err));
  }
}

// Render dynamic question forms
function renderQuestions() {
  questionsContainer.innerHTML = '';
  
  questions.forEach((q, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'card question-card';
    
    // Group name keeps radio selections separated per question
    const groupName = `question_${q.id}`;
    
    questionCard.innerHTML = `
      <div class="question-header">
        <span class="question-number">Question ${index + 1}</span>
      </div>
      <h3 class="question-text">${escapeHtml(q.question_text)}</h3>
      <div class="options-grid">
        <label class="option-label">
          <input type="radio" name="${groupName}" value="a" class="real-radio">
          <span class="custom-radio">A</span>
          <span class="option-text">${escapeHtml(q.option_a)}</span>
        </label>
        <label class="option-label">
          <input type="radio" name="${groupName}" value="b" class="real-radio">
          <span class="custom-radio">B</span>
          <span class="option-text">${escapeHtml(q.option_b)}</span>
        </label>
        <label class="option-label">
          <input type="radio" name="${groupName}" value="c" class="real-radio">
          <span class="custom-radio">C</span>
          <span class="option-text">${escapeHtml(q.option_c)}</span>
        </label>
        <label class="option-label">
          <input type="radio" name="${groupName}" value="d" class="real-radio">
          <span class="custom-radio">D</span>
          <span class="option-text">${escapeHtml(q.option_d)}</span>
        </label>
      </div>
    `;
    questionsContainer.appendChild(questionCard);
  });
}

// Insert result row to Supabase
async function submitResultsToDb(studentName, score, total, examId) {
  if (isPlaceholder(SUPABASE_URL) || isPlaceholder(SUPABASE_ANON_KEY)) {
    console.warn("Supabase placeholder detected. Skipping DB entry.");
    return;
  }

  try {
    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { error } = await supabase
      .from('results')
      .insert([
        {
          student_name: studentName,
          score: score,
          total: total,
          exam_id: examId
        }
      ]);

    if (error) {
      console.error("Supabase insert error:", error);
      showToast("Result not saved to DB: " + error.message);
    } else {
      console.log("Successfully saved result row to Supabase.");
    }
  } catch (err) {
    console.error("Supabase connection error while inserting:", err);
  }
}

// Display results screen
function displayResults(studentName, score, total, selectedAnswers) {
  examScreen.classList.add('hidden');
  setupScreen.classList.add('hidden');
  resultsScreen.classList.remove('hidden');
  
  resultStudentName.textContent = studentName;
  scoreFraction.textContent = `${score} / ${total}`;
  
  // Calculate percentage and update text
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  scorePercentage.textContent = `${percentage}%`;
  
  // Animate progress circle
  const circumference = 282.74; // 2 * pi * r (r=45)
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Small timeout to allow transition to trigger
  setTimeout(() => {
    scoreCircleProgress.style.strokeDashoffset = strokeDashoffset;
  }, 100);

  summaryCorrect.textContent = `${score} Correct`;
  summaryIncorrect.textContent = `${total - score} Incorrect`;
  
  // Build review section
  reviewsContainer.innerHTML = '';
  
  questions.forEach((q, index) => {
    const userChoice = selectedAnswers[q.id] || '';
    const correctChoice = (q.correct_option || '').toLowerCase().trim();
    const isCorrect = userChoice === correctChoice;
    
    const reviewCard = document.createElement('div');
    reviewCard.className = `card review-card ${isCorrect ? 'correct-border-glow' : 'incorrect-border-glow'}`;
    
    const getOptionContent = (opt) => {
      if (opt === 'a') return q.option_a;
      if (opt === 'b') return q.option_b;
      if (opt === 'c') return q.option_c;
      if (opt === 'd') return q.option_d;
      return '';
    };

    reviewCard.innerHTML = `
      <div class="review-header">
        <span class="question-number">Question ${index + 1}</span>
        <span class="review-status-indicator ${isCorrect ? 'correct-answer' : 'incorrect-answer'}">
          <i class="fa-solid ${isCorrect ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
          ${isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>
      <h3 class="question-text">${escapeHtml(q.question_text)}</h3>
      <div class="review-answers-grid">
        <div class="review-answer-row">
          <span>Your Answer:</span>
          <span class="answer-tag user-selected">${userChoice.toUpperCase()}</span>
          <span class="answer-text">${escapeHtml(getOptionContent(userChoice))}</span>
        </div>
        ${!isCorrect ? `
        <div class="review-answer-row">
          <span>Correct Answer:</span>
          <span class="answer-tag correct-badge">${correctChoice.toUpperCase()}</span>
          <span class="answer-text">${escapeHtml(getOptionContent(correctChoice))}</span>
        </div>
        ` : ''}
      </div>
    `;
    reviewsContainer.appendChild(reviewCard);
  });
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners
startExamBtn.addEventListener('click', () => {
  studentName = studentNameInput.value.trim();
  selectedExamId = examSelect.value;
  
  if (!studentName) {
    showToast("Please enter your name to start.");
    alert("Please enter your name.");
    studentNameInput.focus();
    return;
  }
  
  if (!selectedExamId) {
    showToast("Please select an exam subject to start.");
    alert("Please select an exam.");
    examSelect.focus();
    return;
  }
  
  // Filter questions for the selected exam
  questions = allQuestions.filter(q => {
    const examName = q.exam_id ? q.exam_id.trim() : 'General';
    const cleanExamName = examName !== '' ? examName : 'General';
    return cleanExamName === selectedExamId;
  });
  
  // Update header text
  activeStudentName.textContent = studentName;
  activeExamName.textContent = selectedExamId;
  
  renderQuestions();
  showExam();
});

examForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 1. Validate Questions answered
  const selectedAnswers = {};
  let allAnswered = true;
  
  for (const q of questions) {
    const selectedRadio = document.querySelector(`input[name="question_${q.id}"]:checked`);
    if (!selectedRadio) {
      allAnswered = false;
      break;
    }
    selectedAnswers[q.id] = selectedRadio.value;
  }
  
  if (!allAnswered) {
    showToast("All questions must be answered!");
    alert("Please answer all questions before submitting.");
    return;
  }
  
  // 2. Calculate score
  let score = 0;
  questions.forEach(q => {
    const userChoice = selectedAnswers[q.id];
    const correctChoice = (q.correct_option || '').toLowerCase().trim();
    if (userChoice === correctChoice) {
      score++;
    }
  });
  
  const total = questions.length;
  
  // 3. Save to Database
  await submitResultsToDb(studentName, score, total, selectedExamId);
  
  // 4. Display Results & Review Screen
  displayResults(studentName, score, total, selectedAnswers);
});

// Restart button listener (Return to Setup Screen)
restartBtn.addEventListener('click', () => {
  examForm.reset();
  studentNameInput.value = '';
  examSelect.value = '';
  // Reset SVGs progress bar offset
  scoreCircleProgress.style.strokeDashoffset = 282.74;
  showSetup();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Retry button listener
retryBtn.addEventListener('click', fetchQuestions);

// On Page Load
document.addEventListener('DOMContentLoaded', fetchQuestions);
