import "./styles.css";
import { MirrorPuzzle } from "./MirrorPuzzle";

// Initialize the puzzle
const puzzle = new MirrorPuzzle();

// Initialize UI elements
function initializeUI() {
  // Mode buttons
  const editModeBtn = document.getElementById("edit-mode-btn") as HTMLButtonElement;
  const playModeBtn = document.getElementById("play-mode-btn") as HTMLButtonElement;
  
  editModeBtn?.addEventListener("click", () => {
    puzzle.setMode("edit");
    updateModeUI();
  });
  
  playModeBtn?.addEventListener("click", () => {
    puzzle.setMode("play");
    updateModeUI();
  });

  // Export/Import buttons
  const exportBtn = document.getElementById("export-btn") as HTMLButtonElement;
  const importBtn = document.getElementById("import-btn") as HTMLButtonElement;
  const importInput = document.getElementById("import-input") as HTMLInputElement;
  
  exportBtn?.addEventListener("click", () => {
    const json = puzzle.exportJSON();
    downloadJSON(json, "puzzle.json");
  });
  
  importBtn?.addEventListener("click", () => {
    importInput?.click();
  });
  
  importInput?.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        puzzle.importJSON(json);
        updateUI();
      };
      reader.readAsText(file);
    }
  });

  // Mirror configuration
  const mirrorCheckboxes = {
    top: document.getElementById("mirror-top") as HTMLInputElement,
    right: document.getElementById("mirror-right") as HTMLInputElement,
    bottom: document.getElementById("mirror-bottom") as HTMLInputElement,
    left: document.getElementById("mirror-left") as HTMLInputElement,
  };
  
  Object.entries(mirrorCheckboxes).forEach(([side, checkbox]) => {
    checkbox?.addEventListener("change", () => {
      puzzle.setMirror(side as "top" | "right" | "bottom" | "left", checkbox.checked);
      updateMirrorVisualization();
      updateCanvas();
    });
  });

  // Content editor
  const problemText = document.getElementById("problem-text") as HTMLTextAreaElement;
  const explanationText = document.getElementById("explanation-text") as HTMLTextAreaElement;
  const correctFeedback = document.getElementById("correct-feedback") as HTMLTextAreaElement;
  const incorrectFeedback = document.getElementById("incorrect-feedback") as HTMLTextAreaElement;
  
  problemText?.addEventListener("input", () => {
    puzzle.setProblemText(problemText.value);
  });
  
  explanationText?.addEventListener("input", () => {
    puzzle.setExplanationText(explanationText.value);
  });
  
  correctFeedback?.addEventListener("input", () => {
    puzzle.setCorrectFeedback(correctFeedback.value);
  });
  
  incorrectFeedback?.addEventListener("input", () => {
    puzzle.setIncorrectFeedback(incorrectFeedback.value);
  });

  // Touch area button
  const addTouchAreaBtn = document.getElementById("add-touch-area-btn") as HTMLButtonElement;
  addTouchAreaBtn?.addEventListener("click", () => {
    puzzle.addTouchArea({ x: 100, y: 100 });
    updateCanvas();
    updateConfigurationWarning();
  });

  // Play mode controls
  const submitBtn = document.getElementById("submit-answer-btn") as HTMLButtonElement;
  const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
  const whyBtn = document.getElementById("why-btn") as HTMLButtonElement;
  
  submitBtn?.addEventListener("click", () => {
    const result = puzzle.submitAnswer();
    showFeedback(result);
  });
  
  resetBtn?.addEventListener("click", () => {
    puzzle.resetPuzzle();
    updateUI();
  });
  
  whyBtn?.addEventListener("click", () => {
    const explanationContainer = document.getElementById("explanation-container");
    const explanationDisplay = document.getElementById("explanation-display");
    if (explanationContainer && explanationDisplay) {
      explanationDisplay.textContent = puzzle.getContent().explanationText;
      explanationContainer.style.display = "block";
    }
  });

  // Initialize the UI
  updateUI();
}

function updateModeUI() {
  const editModeBtn = document.getElementById("edit-mode-btn");
  const playModeBtn = document.getElementById("play-mode-btn");
  const editControls = document.getElementById("edit-controls");
  const playControls = document.getElementById("play-controls");
  const mode = puzzle.getMode();
  
  if (mode === "edit") {
    editModeBtn?.classList.add("active");
    playModeBtn?.classList.remove("active");
    if (editControls) editControls.style.display = "block";
    if (playControls) playControls.style.display = "none";
  } else {
    editModeBtn?.classList.remove("active");
    playModeBtn?.classList.add("active");
    if (editControls) editControls.style.display = "none";
    if (playControls) playControls.style.display = "block";
    
    // Update problem display
    const problemDisplay = document.getElementById("problem-display");
    if (problemDisplay) {
      problemDisplay.textContent = puzzle.getContent().problemText;
    }
  }
  
  // Reset play mode state
  const feedbackContainer = document.getElementById("feedback-container");
  const explanationContainer = document.getElementById("explanation-container");
  const submitBtn = document.getElementById("submit-answer-btn");
  if (feedbackContainer) feedbackContainer.style.display = "none";
  if (explanationContainer) explanationContainer.style.display = "none";
  if (submitBtn) submitBtn.style.display = "block";
}

function updateMirrorVisualization() {
  const mirrorCenter = document.querySelector(".mirror-center");
  if (!mirrorCenter) return;
  
  const mirrors = puzzle.getMirrors();
  
  mirrorCenter.classList.toggle("mirror-top-active", mirrors.top);
  mirrorCenter.classList.toggle("mirror-right-active", mirrors.right);
  mirrorCenter.classList.toggle("mirror-bottom-active", mirrors.bottom);
  mirrorCenter.classList.toggle("mirror-left-active", mirrors.left);
}

function updateConfigurationWarning() {
  const warningContainer = document.getElementById("configuration-warning");
  const warningMessage = document.getElementById("warning-message");
  
  if (!warningContainer || !warningMessage) return;
  
  const validation = puzzle.validateConfiguration();
  
  if (validation.message) {
    warningMessage.textContent = validation.message;
    warningContainer.style.display = "flex";
  } else {
    warningContainer.style.display = "none";
  }
}

function showFeedback(result: any) {
  const feedbackContainer = document.getElementById("feedback-container");
  const feedbackMessage = document.getElementById("feedback-message");
  const submitBtn = document.getElementById("submit-answer-btn");
  
  if (!feedbackContainer || !feedbackMessage) return;
  
  feedbackMessage.textContent = result.message;
  feedbackMessage.className = result.isCorrect ? "correct" : "incorrect";
  feedbackContainer.style.display = "block";
  if (submitBtn) submitBtn.style.display = "none";
  
  // Update touch area visuals based on results
  // TODO: Implement visual feedback on touch areas
}

function updateCanvas() {
  // TODO: Implement canvas rendering
  // This will render the room, mirrors, objects, virtual objects, etc.
  console.log("Canvas update needed");
}

function updateUI() {
  updateModeUI();
  updateMirrorVisualization();
  updateConfigurationWarning();
  updateCanvas();
  
  // Update content fields
  const content = puzzle.getContent();
  const problemText = document.getElementById("problem-text") as HTMLTextAreaElement;
  const explanationText = document.getElementById("explanation-text") as HTMLTextAreaElement;
  const correctFeedback = document.getElementById("correct-feedback") as HTMLTextAreaElement;
  const incorrectFeedback = document.getElementById("incorrect-feedback") as HTMLTextAreaElement;
  
  if (problemText) problemText.value = content.problemText;
  if (explanationText) explanationText.value = content.explanationText;
  if (correctFeedback) correctFeedback.value = content.correctFeedback;
  if (incorrectFeedback) incorrectFeedback.value = content.incorrectFeedback;
  
  // Update mirror checkboxes
  const mirrors = puzzle.getMirrors();
  const mirrorTop = document.getElementById("mirror-top") as HTMLInputElement;
  const mirrorRight = document.getElementById("mirror-right") as HTMLInputElement;
  const mirrorBottom = document.getElementById("mirror-bottom") as HTMLInputElement;
  const mirrorLeft = document.getElementById("mirror-left") as HTMLInputElement;
  
  if (mirrorTop) mirrorTop.checked = mirrors.top;
  if (mirrorRight) mirrorRight.checked = mirrors.right;
  if (mirrorBottom) mirrorBottom.checked = mirrors.bottom;
  if (mirrorLeft) mirrorLeft.checked = mirrors.left;
}

function downloadJSON(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeUI);
} else {
  initializeUI();
}
