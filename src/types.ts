// Basic position type used throughout
export interface Point {
  x: number;
  y: number;
}

// Input type for reflection calculations
export interface Objects {
  triangle: {
    position: Point;
  };
  viewer: {
    position: Point;
  };
}

// Touch area for marking correct answers
export interface TouchArea {
  id: string;
  position: Point;
  isCorrect: boolean;
  radius: 30; // Fixed size
}

// Content fields for the puzzle
export interface Content {
  problemText: string;
  explanationText: string;
  correctFeedback: string;
  incorrectFeedback: string;
}

// Validation result when submitting answers
export interface ValidationResult {
  isCorrect: boolean;
  selectedCorrect: string[]; // IDs of correctly selected areas
  selectedIncorrect: string[]; // IDs of incorrectly selected areas
  missedCorrect: string[]; // IDs of correct areas not selected
  message: string; // Either correctFeedback or incorrectFeedback
}

// Main puzzle state
export interface PuzzleState {
  mode: "edit" | "play";

  // Room with configurable mirrors
  room: {
    width: 200; // Fixed dimensions
    height: 200;
    mirrors: [boolean, boolean, boolean, boolean]; // [top, right, bottom, left]
  };

  // Always exactly 2 objects
  objects: Objects;

  // Touch areas for answers
  touchAreas: TouchArea[];

  // Content fields
  content: Content;

  // Visualization settings
  selectedVirtualObjectsForRay: Set<string>; // IDs of virtual objects to show rays for
  maxReflectionDepth: 3; // Limit for performance
}

// Calculated virtual objects (not stored)
export interface VirtualObject {
  id: string; // Unique ID for selection (e.g., "triangle-d1-right")
  sourceType: "triangle" | "viewer";
  position: Point;
  flippedX: boolean; // Flipped horizontally
  flippedY: boolean; // Flipped vertically
  depth: number; // 1, 2, or 3
  opacity: number; // Decreases with depth
  rayPath?: Point[]; // Path light takes to reach viewer
}

// Virtual room structure (for rendering walls/mirrors)
export interface VirtualRoom {
  position: Point; // Top-left corner
  mirrors: [boolean, boolean, boolean, boolean]; // Which walls are mirrors
  depth: number;
  opacity: number;
}