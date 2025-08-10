import "./styles.css";
import { MirrorPuzzle } from "./MirrorPuzzle";
import { P5Renderer } from "./P5Renderer";

// Initialize the puzzle
const puzzle = new MirrorPuzzle();
let renderer: P5Renderer | null = null;

// Initialize UI elements
function initializeUI() {
  // Initialize the P5 renderer
  renderer = new P5Renderer(puzzle, "p5-canvas-container");
  
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
    });
  });

  // Content editor
  const problemText = document.getElementById("problem-text") as HTMLTextAreaElement;
  const explanationText = document.getElementById("explanation-text") as HTMLTextAreaElement;
  const correctFeedback = document.getElementById("correct-feedback") as HTMLTextAreaElement;
  const incorrectFeedback = document.getElementById("incorrect-feedback") as HTMLTextAreaElement;
  
  problemText?.addEventListener("input", () => {
    puzzle.setProblemText(problemText.value);
    updateConfigurationWarning();
  });
  
  explanationText?.addEventListener("input", () => {
    puzzle.setExplanationText(explanationText.value);
    updateConfigurationWarning();
  });
  
  correctFeedback?.addEventListener("input", () => {
    puzzle.setCorrectFeedback(correctFeedback.value);
    updateConfigurationWarning();
  });
  
  incorrectFeedback?.addEventListener("input", () => {
    puzzle.setIncorrectFeedback(incorrectFeedback.value);
    updateConfigurationWarning();
  });

  // Touch area button
  const addTouchAreaBtn = document.getElementById("add-touch-area-btn") as HTMLButtonElement;
  addTouchAreaBtn?.addEventListener("click", () => {
    puzzle.addTouchArea(); // Use default position (center of canvas)
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
    puzzle.clearSubmissionResult();
    updateUI();
  });
  
  whyBtn?.addEventListener("click", () => {
    const explanationContainer = document.getElementById("explanation-container");
    const explanationDisplay = document.getElementById("explanation-display");
    if (explanationContainer && explanationDisplay) {
      const explanationText = puzzle.getContent().explanationText;
      explanationDisplay.textContent = explanationText || "Light bounces off mirrors to create virtual images. The position of these reflections follows the laws of physics - the angle of incidence equals the angle of reflection.";
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
    
    // Update problem display with default if empty
    const problemDisplay = document.getElementById("problem-display");
    if (problemDisplay) {
      const problemText = puzzle.getContent().problemText;
      problemDisplay.textContent = problemText || "Click where you see reflections of the triangle";
    }
  }
  
  // Reset play mode state
  const feedbackContainer = document.getElementById("feedback-container");
  const explanationContainer = document.getElementById("explanation-container");
  const submitBtn = document.getElementById("submit-answer-btn");
  if (feedbackContainer) feedbackContainer.style.display = "none";
  if (explanationContainer) explanationContainer.style.display = "none";
  if (submitBtn) submitBtn.style.display = "block";
  
  // Clear submission result when switching modes
  puzzle.clearSubmissionResult();
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
  const warningsContainer = document.getElementById("configuration-warnings");
  
  if (!warningsContainer) return;
  
  const validation = puzzle.validateConfiguration();
  
  // Clear existing warnings
  warningsContainer.innerHTML = "";
  
  // Add warning boxes for each warning
  validation.warnings.forEach(warning => {
    const warningBox = document.createElement("div");
    warningBox.className = `warning-box ${warning.type}`;
    
    const icon = document.createElement("span");
    icon.className = "warning-icon";
    if (warning.type === "error") {
      icon.textContent = "❌";
    } else if (warning.type === "warning") {
      icon.textContent = "⚠️";
    } else {
      icon.textContent = "ℹ️";
    }
    
    const message = document.createElement("span");
    message.className = "warning-message";
    message.textContent = warning.message;
    
    warningBox.appendChild(icon);
    warningBox.appendChild(message);
    warningsContainer.appendChild(warningBox);
  });
  
  // Also update the renderer's warning display if needed
  renderer?.updateConfigurationWarning();
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
  
  // Store the submission result for rendering
  puzzle.storeSubmissionResult(result);
}

function updateUI() {
  updateModeUI();
  updateMirrorVisualization();
  updateConfigurationWarning();
  
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
  document.addEventListener("DOMContentLoaded", () => {
    initializeUI();
  });
} else {
  initializeUI();
}