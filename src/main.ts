import "./styles.css";
import { MirrorPuzzle } from "./MirrorPuzzle";
import type { Point } from "./types";

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
    updateCanvas();
  });
  
  playModeBtn?.addEventListener("click", () => {
    puzzle.setMode("play");
    updateModeUI();
    updateCanvas();
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
    puzzle.addTouchArea(); // Use default position (center of canvas)
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
  
  // Store the submission result for rendering
  puzzle.storeSubmissionResult(result);
  updateCanvas();
}

function updateCanvas() {
  const canvas = document.getElementById("canvas") as unknown as SVGElement;
  if (!canvas) return;

  // Clear existing content (except for persistent groups)
  const roomGroup = document.getElementById("room-group") || createGroup(canvas, "room-group");
  const objectsGroup = document.getElementById("objects-group") || createGroup(canvas, "objects-group");
  const virtualObjectsGroup = document.getElementById("virtual-objects") || canvas.querySelector("#virtual-objects");
  const virtualRoomsGroup = document.getElementById("virtual-rooms") || canvas.querySelector("#virtual-rooms");
  const touchAreasGroup = document.getElementById("touch-areas-group") || createGroup(canvas, "touch-areas-group");
  const rayPathsGroup = document.getElementById("ray-paths-group") || createGroup(canvas, "ray-paths-group");

  // Clear content
  roomGroup.innerHTML = "";
  objectsGroup.innerHTML = "";
  if (virtualObjectsGroup) virtualObjectsGroup.innerHTML = "";
  if (virtualRoomsGroup) virtualRoomsGroup.innerHTML = "";
  touchAreasGroup.innerHTML = "";
  rayPathsGroup.innerHTML = "";

  // Room is 200x200, centered in 800x800 canvas
  const roomSize = 200;
  const canvasSize = 800;
  const offset = (canvasSize - roomSize) / 2; // 300px offset to center the room
  
  // Helper to convert room coordinates to canvas coordinates
  const roomToCanvas = (x: number, y: number) => {
    return {
      x: x + offset,
      y: y + offset
    };
  };

  // Draw background
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", "800");
  bg.setAttribute("height", "800");
  bg.setAttribute("fill", "#e0e0e0");
  roomGroup.appendChild(bg);

  // Draw main room (200x200 centered)
  const roomRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  roomRect.setAttribute("x", String(offset));
  roomRect.setAttribute("y", String(offset));
  roomRect.setAttribute("width", String(roomSize));
  roomRect.setAttribute("height", String(roomSize));
  roomRect.setAttribute("fill", "#ffffff");
  roomRect.setAttribute("stroke", "#333");
  roomRect.setAttribute("stroke-width", "2");
  roomGroup.appendChild(roomRect);

  // Draw mirrors on room edges
  const mirrors = puzzle.getMirrors();
  const mirrorStyle = "stroke: #4a90e2; stroke-width: 3; stroke-linecap: round;";
  
  if (mirrors.top) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(offset));
    line.setAttribute("y1", String(offset));
    line.setAttribute("x2", String(offset + roomSize));
    line.setAttribute("y2", String(offset));
    line.setAttribute("style", mirrorStyle);
    roomGroup.appendChild(line);
  }
  
  if (mirrors.right) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(offset + roomSize));
    line.setAttribute("y1", String(offset));
    line.setAttribute("x2", String(offset + roomSize));
    line.setAttribute("y2", String(offset + roomSize));
    line.setAttribute("style", mirrorStyle);
    roomGroup.appendChild(line);
  }
  
  if (mirrors.bottom) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(offset));
    line.setAttribute("y1", String(offset + roomSize));
    line.setAttribute("x2", String(offset + roomSize));
    line.setAttribute("y2", String(offset + roomSize));
    line.setAttribute("style", mirrorStyle);
    roomGroup.appendChild(line);
  }
  
  if (mirrors.left) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(offset));
    line.setAttribute("y1", String(offset));
    line.setAttribute("x2", String(offset));
    line.setAttribute("y2", String(offset + roomSize));
    line.setAttribute("style", mirrorStyle);
    roomGroup.appendChild(line);
  }

  // Get object positions
  const objects = puzzle.getObjects();
  
  // Draw triangle object (positions are in room coordinates 0-200)
  const trianglePos = roomToCanvas(objects.triangle.x, objects.triangle.y);
  const triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  const size = 10;
  const points = `${trianglePos.x},${trianglePos.y - size} ${trianglePos.x - size},${trianglePos.y + size} ${trianglePos.x + size},${trianglePos.y + size}`;
  triangle.setAttribute("points", points);
  triangle.setAttribute("fill", "#ff6b6b");
  triangle.setAttribute("stroke", "#d63031");
  triangle.setAttribute("stroke-width", "2");
  triangle.setAttribute("class", "draggable-object");
  triangle.setAttribute("data-object", "triangle");
  triangle.setAttribute("cursor", puzzle.getMode() === "edit" ? "move" : "default");
  objectsGroup.appendChild(triangle);

  // Draw viewer (eye symbol)
  const viewerPos = roomToCanvas(objects.viewer.x, objects.viewer.y);
  
  // Eye outline (circle)
  const eyeOutline = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  eyeOutline.setAttribute("cx", String(viewerPos.x));
  eyeOutline.setAttribute("cy", String(viewerPos.y));
  eyeOutline.setAttribute("rx", "12");
  eyeOutline.setAttribute("ry", "8");
  eyeOutline.setAttribute("fill", "#333");
  eyeOutline.setAttribute("stroke", "#000");
  eyeOutline.setAttribute("stroke-width", "2");
  eyeOutline.setAttribute("class", "draggable-object");
  eyeOutline.setAttribute("data-object", "viewer");
  eyeOutline.setAttribute("cursor", puzzle.getMode() === "edit" ? "move" : "default");
  objectsGroup.appendChild(eyeOutline);
  
  // Eye pupil
  const pupil = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  pupil.setAttribute("cx", String(viewerPos.x));
  pupil.setAttribute("cy", String(viewerPos.y));
  pupil.setAttribute("r", "4");
  pupil.setAttribute("fill", "#fff");
  pupil.setAttribute("pointer-events", "none");
  objectsGroup.appendChild(pupil);

  // Draw virtual rooms (reflected room boundaries)
  const virtualData = puzzle.getVirtualObjects();
  virtualData.virtualRooms.forEach((vRoom) => {
    if (vRoom.depth > 0) {
      const vRoomPos = roomToCanvas(vRoom.position.x, vRoom.position.y);
      const vRoomRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      vRoomRect.setAttribute("x", String(vRoomPos.x));
      vRoomRect.setAttribute("y", String(vRoomPos.y));
      vRoomRect.setAttribute("width", String(roomSize));
      vRoomRect.setAttribute("height", String(roomSize));
      vRoomRect.setAttribute("fill", "none");
      vRoomRect.setAttribute("stroke", "#999");
      vRoomRect.setAttribute("stroke-width", "1");
      vRoomRect.setAttribute("stroke-dasharray", "3,3");
      vRoomRect.setAttribute("opacity", String(vRoom.opacity));
      if (virtualRoomsGroup) virtualRoomsGroup.appendChild(vRoomRect);
    }
  });

  // Draw virtual objects (reflections)
  virtualData.virtualObjects.forEach((vObj) => {
    const vPos = roomToCanvas(vObj.position.x, vObj.position.y);
    
    if (vObj.sourceType === "triangle") {
      const vTriangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      const vPoints = `${vPos.x},${vPos.y - size} ${vPos.x - size},${vPos.y + size} ${vPos.x + size},${vPos.y + size}`;
      vTriangle.setAttribute("points", vPoints);
      vTriangle.setAttribute("fill", "#ff6b6b");
      vTriangle.setAttribute("stroke", "#d63031");
      vTriangle.setAttribute("stroke-width", "1");
      vTriangle.setAttribute("opacity", String(vObj.opacity));
      vTriangle.setAttribute("stroke-dasharray", "2,2");
      if (virtualObjectsGroup) virtualObjectsGroup.appendChild(vTriangle);
    }
  });

  // Draw touch areas
  const touchAreas = puzzle.getAllTouchAreas();
  const selectedAreas = puzzle.getSelectedTouchAreas();
  const mode = puzzle.getMode();
  const submissionResult = puzzle.getSubmissionResult();
  
  touchAreas.forEach((area) => {
    // Touch areas can be anywhere on canvas, not restricted to room
    const areaX = area.position.x;
    const areaY = area.position.y;
    const size = 60; // Size of the square touch area
    
    // Check if we have submission feedback to show
    const hasSubmissionFeedback = mode === "play" && submissionResult;
    
    // Determine the visual state based on submission result
    let fillColor, strokeColor, strokeWidth, opacity = "1";
    let showIndicator = false;
    let indicatorColor = "";
    let indicatorSymbol = "";
    
    if (mode === "edit") {
      // Edit mode: show correct/incorrect status with lighter fill
      fillColor = area.isCorrect ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)";
      strokeColor = area.isCorrect ? "#4caf50" : "#f44336";
      strokeWidth = "2";
      showIndicator = true;
      indicatorColor = area.isCorrect ? "#4caf50" : "#f44336";
      indicatorSymbol = area.isCorrect ? "✓" : "✗";
    } else if (hasSubmissionFeedback) {
      // Play mode with submission feedback
      const isSelected = selectedAreas.includes(area.id);
      
      if (!isSelected) {
        // Unselected areas become invisible
        opacity = "0";
        fillColor = "transparent";
        strokeColor = "transparent";
        strokeWidth = "0";
      } else if (submissionResult.isCorrect) {
        // User got everything correct - all selected areas are green
        fillColor = "rgba(76, 175, 80, 0.3)";
        strokeColor = "#4caf50";
        strokeWidth = "3";
        showIndicator = true;
        indicatorColor = "#4caf50";
        indicatorSymbol = "✓";
      } else {
        // User made mistakes - check each area
        if (submissionResult.selectedCorrect.includes(area.id)) {
          // Correctly selected area but answer is wrong overall - grey
          fillColor = "rgba(158, 158, 158, 0.3)";
          strokeColor = "#757575";
          strokeWidth = "3";
          showIndicator = true;
          indicatorColor = "#757575";
          indicatorSymbol = "✓";
        } else if (submissionResult.selectedIncorrect.includes(area.id)) {
          // Incorrectly selected area - yellow/orange
          fillColor = "rgba(255, 193, 7, 0.3)";
          strokeColor = "#ff9800";
          strokeWidth = "3";
          showIndicator = true;
          indicatorColor = "#ff9800";
          indicatorSymbol = "✗";
        } else {
          // This shouldn't happen for selected areas
          opacity = "0";
          fillColor = "transparent";
          strokeColor = "transparent";
          strokeWidth = "0";
        }
      }
    } else {
      // Play mode without submission - normal selection state
      const isSelected = selectedAreas.includes(area.id);
      fillColor = isSelected ? "rgba(33, 150, 243, 0.3)" : "rgba(158, 158, 158, 0.05)";
      strokeColor = isSelected ? "#2196f3" : "#999999";
      strokeWidth = isSelected ? "3" : "2";
    }
    
    // Create rounded rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(areaX - size/2));
    rect.setAttribute("y", String(areaY - size/2));
    rect.setAttribute("width", String(size));
    rect.setAttribute("height", String(size));
    rect.setAttribute("rx", "8"); // Rounded corners
    rect.setAttribute("ry", "8");
    rect.setAttribute("opacity", opacity);
    
    if (mode === "edit") {
      rect.setAttribute("style", `fill: ${fillColor}; stroke: ${strokeColor}; stroke-width: ${strokeWidth}; cursor: move; opacity: ${opacity}`);
      rect.setAttribute("title", "Click to toggle correct/incorrect, Drag to move, Right-click to delete");
    } else if (hasSubmissionFeedback) {
      // Disable interaction after submission
      rect.setAttribute("style", `fill: ${fillColor}; stroke: ${strokeColor}; stroke-width: ${strokeWidth}; cursor: default; opacity: ${opacity}; pointer-events: none;`);
    } else {
      rect.setAttribute("style", `fill: ${fillColor}; stroke: ${strokeColor}; stroke-width: ${strokeWidth}; cursor: pointer; opacity: ${opacity}`);
    }
    
    rect.setAttribute("class", "touch-area");
    rect.setAttribute("data-id", area.id);
    touchAreasGroup.appendChild(rect);
    
    // Add checkmark or X in top-right corner when needed
    if (showIndicator && opacity !== "0") {
      // Background circle for the indicator
      const indicatorBg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const indicatorX = areaX + size/2 - 10;
      const indicatorY = areaY - size/2 + 10;
      indicatorBg.setAttribute("cx", String(indicatorX));
      indicatorBg.setAttribute("cy", String(indicatorY));
      indicatorBg.setAttribute("r", "10");
      indicatorBg.setAttribute("fill", indicatorColor);
      indicatorBg.setAttribute("pointer-events", "none");
      touchAreasGroup.appendChild(indicatorBg);
      
      // Checkmark or X symbol
      const symbol = document.createElementNS("http://www.w3.org/2000/svg", "text");
      symbol.setAttribute("x", String(indicatorX));
      symbol.setAttribute("y", String(indicatorY + 4));
      symbol.setAttribute("text-anchor", "middle");
      symbol.setAttribute("font-size", "14");
      symbol.setAttribute("font-weight", "bold");
      symbol.setAttribute("fill", "white");
      symbol.setAttribute("pointer-events", "none");
      symbol.textContent = indicatorSymbol;
      touchAreasGroup.appendChild(symbol);
    }
  });
}

function createGroup(parent: SVGElement, id: string): SVGGElement {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("id", id);
  parent.appendChild(group);
  return group;
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

// Drag and drop functionality
function initializeDragAndDrop() {
  const canvas = document.getElementById("canvas") as unknown as SVGElement;
  if (!canvas) return;

  let isDragging = false;
  let draggedObject: "triangle" | "viewer" | null = null;
  let draggedTouchArea: string | null = null;
  let dragOffset = { x: 0, y: 0 };
  let mouseDownPos = { x: 0, y: 0 };
  let hasMoved = false;

  // Constants for room and canvas dimensions
  const roomSize = 200;
  const canvasSize = 800;
  const canvasOffset = (canvasSize - roomSize) / 2; // 300px
  
  // Object sizes (half-widths for boundary calculation)
  const triangleHalfSize = 10;
  const viewerHalfWidth = 12;
  const viewerHalfHeight = 8;

  // Convert canvas coordinates to room coordinates
  function canvasToRoom(canvasX: number, canvasY: number): Point {
    return {
      x: canvasX - canvasOffset,
      y: canvasY - canvasOffset
    };
  }

  // Get mouse position relative to canvas
  function getMousePos(e: MouseEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // Constrain position within room bounds with object size consideration
  function constrainPosition(x: number, y: number, objectType: "triangle" | "viewer"): Point {
    let minX: number, maxX: number, minY: number, maxY: number;
    
    if (objectType === "triangle") {
      minX = triangleHalfSize;
      maxX = roomSize - triangleHalfSize;
      minY = triangleHalfSize;
      maxY = roomSize - triangleHalfSize;
    } else {
      minX = viewerHalfWidth;
      maxX = roomSize - viewerHalfWidth;
      minY = viewerHalfHeight;
      maxY = roomSize - viewerHalfHeight;
    }
    
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  }

  // Mouse down handler
  canvas.addEventListener("mousedown", (e: MouseEvent) => {
    const target = e.target as SVGElement;
    const mode = puzzle.getMode();
    
    if (mode === "edit") {
      const objectType = target.getAttribute("data-object");
      const touchAreaId = target.getAttribute("data-id");
      
      if (objectType === "triangle" || objectType === "viewer") {
        // Start dragging object
        isDragging = true;
        draggedObject = objectType as "triangle" | "viewer";
        
        const mousePos = getMousePos(e);
        const objects = puzzle.getObjects();
        const objPos = draggedObject === "triangle" ? objects.triangle : objects.viewer;
        
        dragOffset = {
          x: mousePos.x - (objPos.x + canvasOffset),
          y: mousePos.y - (objPos.y + canvasOffset)
        };
        
        e.preventDefault();
      } else if (touchAreaId) {
        // Prepare for potential drag
        const mousePos = getMousePos(e);
        mouseDownPos = { x: mousePos.x, y: mousePos.y };
        hasMoved = false;
        draggedTouchArea = touchAreaId;
        
        const touchAreas = puzzle.getAllTouchAreas();
        const area = touchAreas.find(a => a.id === touchAreaId);
        
        if (area) {
          dragOffset = {
            x: mousePos.x - area.position.x,
            y: mousePos.y - area.position.y
          };
        }
        
        e.preventDefault();
      }
    } else if (mode === "play") {
      // Handle touch area selection in play mode
      const touchAreaId = target.getAttribute("data-id");
      if (touchAreaId) {
        const touchAreas = puzzle.getAllTouchAreas();
        const area = touchAreas.find(a => a.id === touchAreaId);
        if (area) {
          // Toggle selection
          const selected = puzzle.getSelectedTouchAreas();
          if (selected.includes(touchAreaId)) {
            puzzle.deselectTouchArea(touchAreaId);
          } else {
            puzzle.selectTouchArea(touchAreaId);
          }
          updateCanvas();
        }
        e.preventDefault();
      }
    }
  });

  // Mouse move handler
  canvas.addEventListener("mousemove", (e: MouseEvent) => {
    const mousePos = getMousePos(e);
    
    // Check if we should start dragging (mouse moved more than 5 pixels)
    if (draggedTouchArea && !isDragging) {
      const distance = Math.sqrt(
        Math.pow(mousePos.x - mouseDownPos.x, 2) + 
        Math.pow(mousePos.y - mouseDownPos.y, 2)
      );
      if (distance > 5) {
        isDragging = true;
        hasMoved = true;
      }
    }
    
    if (!isDragging) return;
    
    if (draggedObject) {
      const roomPos = canvasToRoom(mousePos.x - dragOffset.x, mousePos.y - dragOffset.y);
      const constrainedPos = constrainPosition(roomPos.x, roomPos.y, draggedObject);
      puzzle.moveObject(draggedObject, constrainedPos);
      updateCanvas();
    } else if (draggedTouchArea) {
      // Touch areas can be placed anywhere on the canvas
      const canvasPos = {
        x: mousePos.x - dragOffset.x,
        y: mousePos.y - dragOffset.y
      };
      // Constrain to canvas bounds only
      const constrainedPos = {
        x: Math.max(30, Math.min(canvasSize - 30, canvasPos.x)),
        y: Math.max(30, Math.min(canvasSize - 30, canvasPos.y))
      };
      puzzle.moveTouchArea(draggedTouchArea, constrainedPos);
      updateCanvas();
    }
    
    e.preventDefault();
  });

  // Mouse up handler
  canvas.addEventListener("mouseup", () => {
    // If we have a touch area and didn't move, toggle it
    if (draggedTouchArea && !hasMoved && puzzle.getMode() === "edit") {
      const touchAreas = puzzle.getAllTouchAreas();
      const area = touchAreas.find(a => a.id === draggedTouchArea);
      if (area) {
        puzzle.setTouchAreaCorrect(draggedTouchArea, !area.isCorrect);
        updateCanvas();
      }
    }
    
    isDragging = false;
    draggedObject = null;
    draggedTouchArea = null;
    hasMoved = false;
  });

  // Mouse leave handler (stop dragging if mouse leaves canvas)
  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
    draggedObject = null;
    draggedTouchArea = null;
    hasMoved = false;
  });
  
  // Remove the automatic touch area creation on canvas click
  // Touch areas should only be created via the Add Touch Area button
  
  // Right-click handler for deleting touch areas
  canvas.addEventListener("contextmenu", (e: MouseEvent) => {
    if (puzzle.getMode() !== "edit") return;
    
    const target = e.target as SVGElement;
    const touchAreaId = target.getAttribute("data-id");
    
    if (touchAreaId) {
      puzzle.deleteTouchArea(touchAreaId);
      updateCanvas();
      e.preventDefault();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeUI();
    initializeDragAndDrop();
    updateUI();
  });
} else {
  initializeUI();
  initializeDragAndDrop();
  updateUI();
}
