import type {
  Point,
  TouchArea,
  Content,
  ValidationResult,
  PuzzleState,
  VirtualObject,
  VirtualRoom,
} from "./types";
import { ReflectionEngine } from "./ReflectionEngine";

export class MirrorPuzzle {
  private state: PuzzleState;
  private reflectionEngine: ReflectionEngine;
  private selectedTouchAreas: Set<string> = new Set();
  private submissionResult: ValidationResult | null = null;

  constructor() {
    // Initialize with default state
    this.state = {
      mode: "edit",
      room: {
        width: 200,
        height: 200,
        mirrors: [false, false, false, false],
      },
      objects: {
        triangle: { position: { x: 100, y: 75 } },
        viewer: { position: { x: 100, y: 175 } },
      },
      touchAreas: [],
      content: {
        problemText: "",
        explanationText: "",
        correctFeedback: "",
        incorrectFeedback: "",
      },
      selectedVirtualObjectForRay: null,
      maxReflectionDepth: 3,
    };

    this.reflectionEngine = new ReflectionEngine();
  }

  // Mode management
  setMode(mode: "edit" | "play"): void {
    this.state.mode = mode;
    // Clear selections and submission result when switching modes
    this.selectedTouchAreas.clear();
    this.submissionResult = null;
  }

  getMode(): "edit" | "play" {
    return this.state.mode;
  }

  // Get current object positions
  getObjects(): { triangle: Point; viewer: Point } {
    return {
      triangle: { ...this.state.objects.triangle.position },
      viewer: { ...this.state.objects.viewer.position },
    };
  }

  // Object management (edit mode only)
  moveObject(type: "triangle" | "viewer", position: Point): void {
    if (this.state.mode !== "edit") return;

    // Ensure position is within room bounds with padding
    const padding = 20;
    const clampedPosition = {
      x: Math.max(
        padding,
        Math.min(this.state.room.width - padding, position.x),
      ),
      y: Math.max(
        padding,
        Math.min(this.state.room.height - padding, position.y),
      ),
    };

    this.state.objects[type].position = clampedPosition;
  }

  getObjectPosition(type: "triangle" | "viewer"): Point {
    return { ...this.state.objects[type].position };
  }

  // Touch area management (edit mode only)
  addTouchArea(position?: Point): string {
    if (this.state.mode !== "edit") return "";

    const id = `touch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const touchArea: TouchArea = {
      id,
      position: position || { x: 400, y: 400 }, // Default to center of 800x800 canvas
      isCorrect: true, // Default to correct
      radius: 30,
    };

    this.state.touchAreas.push(touchArea);
    return id;
  }

  moveTouchArea(id: string, position: Point): void {
    if (this.state.mode !== "edit") return;

    const touchArea = this.state.touchAreas.find((ta) => ta.id === id);
    if (touchArea) {
      touchArea.position = position;
    }
  }

  setTouchAreaCorrect(id: string, isCorrect: boolean): void {
    if (this.state.mode !== "edit") return;

    const touchArea = this.state.touchAreas.find((ta) => ta.id === id);
    if (touchArea) {
      touchArea.isCorrect = isCorrect;
    }
  }

  deleteTouchArea(id: string): void {
    if (this.state.mode !== "edit") return;

    this.state.touchAreas = this.state.touchAreas.filter((ta) => ta.id !== id);
  }

  getAllTouchAreas(): TouchArea[] {
    return [...this.state.touchAreas];
  }

  // Mirror configuration (edit mode only)
  setMirror(side: "top" | "right" | "bottom" | "left", enabled: boolean): void {
    if (this.state.mode !== "edit") return;

    const index = this.getMirrorIndex(side);
    this.state.room.mirrors[index] = enabled;
  }

  toggleMirror(side: "top" | "right" | "bottom" | "left"): void {
    if (this.state.mode !== "edit") return;

    const index = this.getMirrorIndex(side);
    this.state.room.mirrors[index] = !this.state.room.mirrors[index];
  }

  getMirrors(): {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  } {
    return {
      top: this.state.room.mirrors[0],
      right: this.state.room.mirrors[1],
      bottom: this.state.room.mirrors[2],
      left: this.state.room.mirrors[3],
    };
  }

  private getMirrorIndex(side: "top" | "right" | "bottom" | "left"): number {
    switch (side) {
      case "top":
        return 0;
      case "right":
        return 1;
      case "bottom":
        return 2;
      case "left":
        return 3;
    }
  }

  // Content editing (edit mode only)
  setProblemText(text: string): void {
    if (this.state.mode !== "edit") return;
    this.state.content.problemText = text;
  }

  setExplanationText(text: string): void {
    if (this.state.mode !== "edit") return;
    this.state.content.explanationText = text;
  }

  setCorrectFeedback(text: string): void {
    if (this.state.mode !== "edit") return;
    this.state.content.correctFeedback = text;
  }

  setIncorrectFeedback(text: string): void {
    if (this.state.mode !== "edit") return;
    this.state.content.incorrectFeedback = text;
  }

  getContent(): Content {
    return { ...this.state.content };
  }

  // Ray visualization (edit mode only)
  selectVirtualObjectForRay(virtualObjectId: string | null): void {
    if (this.state.mode !== "edit") return;
    this.state.selectedVirtualObjectForRay = virtualObjectId;
  }

  getSelectedVirtualObject(): string | null {
    return this.state.selectedVirtualObjectForRay;
  }

  // Virtual object queries (read-only, both modes)
  getVirtualObjects(): {
    virtualObjects: VirtualObject[];
    virtualRooms: VirtualRoom[];
  } {
    const result = this.reflectionEngine.calculateVirtualObjects(
      this.state.objects,
      this.state.room.mirrors,
      this.state.maxReflectionDepth,
    );

    // Calculate ray paths for objects if needed
    if (this.state.selectedVirtualObjectForRay) {
      const selectedObject = result.virtualObjects.find(
        (vo) => vo.id === this.state.selectedVirtualObjectForRay,
      );
      if (selectedObject) {
        selectedObject.rayPath = this.reflectionEngine.calculateRayPath(
          selectedObject,
          this.state.objects.viewer.position,
          this.state.room.mirrors,
        );
      }
    }

    return result;
  }

  getVirtualRooms(): VirtualRoom[] {
    const result = this.reflectionEngine.calculateVirtualObjects(
      this.state.objects,
      this.state.room.mirrors,
      this.state.maxReflectionDepth,
    );
    return result.virtualRooms;
  }

  // Validation (play mode only)
  selectTouchArea(id: string): void {
    if (this.state.mode !== "play") return;
    this.selectedTouchAreas.add(id);
  }

  deselectTouchArea(id: string): void {
    if (this.state.mode !== "play") return;
    this.selectedTouchAreas.delete(id);
  }

  getSelectedTouchAreas(): string[] {
    return Array.from(this.selectedTouchAreas);
  }

  submitAnswer(): ValidationResult {
    if (this.state.mode !== "play") {
      return {
        isCorrect: false,
        selectedCorrect: [],
        selectedIncorrect: [],
        missedCorrect: [],
        message: "Can only submit in play mode",
      };
    }

    const selectedCorrect: string[] = [];
    const selectedIncorrect: string[] = [];
    const missedCorrect: string[] = [];

    // Check selected areas
    for (const id of this.selectedTouchAreas) {
      const touchArea = this.state.touchAreas.find((ta) => ta.id === id);
      if (touchArea) {
        if (touchArea.isCorrect) {
          selectedCorrect.push(id);
        } else {
          selectedIncorrect.push(id);
        }
      }
    }

    // Check missed correct areas
    for (const touchArea of this.state.touchAreas) {
      if (touchArea.isCorrect && !this.selectedTouchAreas.has(touchArea.id)) {
        missedCorrect.push(touchArea.id);
      }
    }

    const isCorrect =
      selectedIncorrect.length === 0 && missedCorrect.length === 0;
    const message = isCorrect
      ? this.state.content.correctFeedback || "Correct!"
      : this.state.content.incorrectFeedback || "Try again!";

    const result = {
      isCorrect,
      selectedCorrect,
      selectedIncorrect,
      missedCorrect,
      message,
    };

    // Store the submission result for rendering
    this.submissionResult = result;

    return result;
  }

  resetPuzzle(): void {
    this.selectedTouchAreas.clear();
    this.submissionResult = null;
  }

  // Store submission result for rendering feedback
  storeSubmissionResult(result: ValidationResult): void {
    this.submissionResult = result;
  }

  // Get stored submission result
  getSubmissionResult(): ValidationResult | null {
    return this.submissionResult;
  }

  // Clear submission result
  clearSubmissionResult(): void {
    this.submissionResult = null;
  }

  // Export/Import
  exportJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importJSON(json: string): void {
    try {
      const importedState = JSON.parse(json) as PuzzleState;
      // Validate the imported state has required fields
      if (
        importedState.mode &&
        importedState.room &&
        importedState.objects &&
        importedState.touchAreas &&
        importedState.content
      ) {
        this.state = importedState;
        this.selectedTouchAreas.clear();
      }
    } catch (error) {
      console.error("Failed to import JSON:", error);
    }
  }

  // Configuration validation
  validateConfiguration(): { 
    isValid: boolean; 
    warnings: Array<{ type: 'error' | 'warning' | 'info'; message: string }> 
  } {
    const warnings: Array<{ type: 'error' | 'warning' | 'info'; message: string }> = [];

    // Check for touch areas
    if (this.state.touchAreas.length === 0) {
      warnings.push({ 
        type: 'error', 
        message: 'No touch areas defined - puzzle cannot be played' 
      });
    } else {
      // Check for correct touch areas (only if there are touch areas)
      const hasCorrectArea = this.state.touchAreas.some((ta) => ta.isCorrect);
      if (!hasCorrectArea) {
        warnings.push({ 
          type: 'error', 
          message: 'No correct touch areas defined - puzzle has no solution' 
        });
      }
    }

    // Check for complexity
    if (this.state.touchAreas.length >= 5) {
      warnings.push({ 
        type: 'warning', 
        message: '5+ touch areas - puzzle is getting too complex' 
      });
    }

    // Check for empty content fields
    const emptyFields: string[] = [];
    if (!this.state.content.problemText) emptyFields.push('Problem');
    if (!this.state.content.explanationText) emptyFields.push('Explanation');
    if (!this.state.content.correctFeedback) emptyFields.push('Correct Feedback');
    if (!this.state.content.incorrectFeedback) emptyFields.push('Incorrect Feedback');
    
    if (emptyFields.length > 0) {
      warnings.push({ 
        type: 'info', 
        message: `${emptyFields.length} empty text field${emptyFields.length > 1 ? 's' : ''}: ${emptyFields.join(', ')}` 
      });
    }

    // Validation is only invalid if there are error-level warnings
    const isValid = !warnings.some(w => w.type === 'error');

    return { isValid, warnings };
  }

  // Utility
  isPointInRoom(point: Point): boolean {
    return (
      point.x >= 0 &&
      point.x <= this.state.room.width &&
      point.y >= 0 &&
      point.y <= this.state.room.height
    );
  }

  transformToCanvas(roomPoint: Point): Point {
    return {
      x: roomPoint.x + 300,
      y: roomPoint.y + 300,
    };
  }

  transformToRoom(canvasPoint: Point): Point {
    return {
      x: canvasPoint.x - 300,
      y: canvasPoint.y - 300,
    };
  }

  // Get current state (for rendering)
  getState(): PuzzleState {
    return this.state;
  }
}

