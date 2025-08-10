# Mirror Puzzle Generator - 4-Hour Spec v3

## Overview

A puzzle authoring tool for creating mirror reflection challenges with up to 3 mirrors. Teachers can position objects and touch points to test student understanding of virtual images and ray paths.

## Core Concept

Students discover that images in mirrors have definite locations that can be found by geometric reasoning. Through interactive exploration, they learn:

- Virtual images appear at predictable positions based on object placement
- The position of an object relative to mirrors determines where its reflections appear
- With multiple mirrors, reflection patterns follow geometric rules
- The path light travels affects where we perceive reflected images
- Cases with two parallel mirrors create infinite reflections at regular intervals

---

## API

```typescript
class MirrorPuzzle {
  // Mode management
  setMode(mode: "edit" | "play"): void;
  getMode(): "edit" | "play";

  // Object management (edit mode only)
  moveObject(type: "triangle" | "viewer", position: Point): void;
  getObjectPosition(type: "triangle" | "viewer"): Point;

  // Touch area management (edit mode only)
  addTouchArea(position?: Point): string; // Returns ID, defaults to center
  moveTouchArea(id: string, position: Point): void;
  setTouchAreaCorrect(id: string, isCorrect: boolean): void;
  deleteTouchArea(id: string): void;
  getAllTouchAreas(): TouchArea[];

  // Mirror configuration (edit mode only)
  setMirror(side: "top" | "right" | "bottom" | "left", enabled: boolean): void;
  toggleMirror(side: "top" | "right" | "bottom" | "left"): void;
  getMirrors(): {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };

  // Content editing (edit mode only)
  setProblemText(text: string): void;
  setExplanationText(text: string): void;
  setCorrectFeedback(text: string): void;
  setIncorrectFeedback(text: string): void;
  getContent(): Content;

  // Ray visualization (edit mode only)
  selectVirtualObjectForRay(virtualObjectId: string | null): void; // null to deselect
  getSelectedVirtualObject(): string | null;

  // Virtual object queries (read-only, both modes)
  getVirtualObjects(): VirtualObject[];
  getVirtualRooms(): VirtualRoom[];

  // Validation (play mode only)
  selectTouchArea(id: string): void;
  deselectTouchArea(id: string): void;
  getSelectedTouchAreas(): string[];
  submitAnswer(): ValidationResult;
  resetPuzzle(): void;

  // Export/Import
  exportJSON(): string;
  importJSON(json: string): void;

  // Configuration validation
  validateConfiguration(): { isValid: boolean; message: string };
  
  // Utility
  isPointInRoom(point: Point): boolean; // Checks if point is in [0,200] range
  transformToCanvas(roomPoint: Point): Point; // Adds (300,300) offset
  transformToRoom(canvasPoint: Point): Point; // Subtracts (300,300) offset
}

// Types used by the API
interface TouchArea {
  id: string;
  position: Point;
  isCorrect: boolean;
  radius: 30;
}

interface Content {
  problemText: string;
  explanationText: string;
  correctFeedback: string;
  incorrectFeedback: string;
}

interface ValidationResult {
  isCorrect: boolean;
  selectedCorrect: string[]; // IDs of correctly selected areas
  selectedIncorrect: string[]; // IDs of incorrectly selected areas
  missedCorrect: string[]; // IDs of correct areas not selected
  message: string; // Either correctFeedback or incorrectFeedback
}
```

---

## Example API Usage

```typescript
// Creating a simple puzzle (LLM-friendly example)
const puzzle = new MirrorPuzzle();

// Set up the room with mirrors
puzzle.setMode("edit");
puzzle.setMirror("right", true); // Right wall mirror
puzzle.setMirror("left", true); // Left wall mirror

// Position the objects (in room coordinates)
puzzle.moveObject("triangle", { x: 100, y: 75 });
puzzle.moveObject("viewer", { x: 100, y: 175 });

// Add touch areas for answers (in room coordinates)
// Touch areas default to correct (green) when created
// Right reflection is at x=300 (outside room, but visible on canvas)
const touch1 = puzzle.addTouchArea({ x: 300, y: 75 });
// Already defaults to correct, no need to set

// Left reflection is at x=-100 (negative coordinate, visible on canvas)
const touch2 = puzzle.addTouchArea({ x: -100, y: 75 });
// Already defaults to correct

// Distractor in the actual room
const touch3 = puzzle.addTouchArea({ x: 100, y: 125 });
puzzle.setTouchAreaCorrect(touch3, false); // Mark as incorrect

// Set up content
puzzle.setProblemText("Click where you see reflections of the triangle");
puzzle.setCorrectFeedback("Great! You found both reflections.");
puzzle.setIncorrectFeedback("Try again. Look for the triangle in each mirror.");
puzzle.setExplanationText("Parallel mirrors create infinite reflections.");

// Select a virtual object to show its ray
const virtualObjects = puzzle.getVirtualObjects();
const firstReflection = virtualObjects.find(
  (v) => v.id === "triangle-d1-right",
);
if (firstReflection) {
  puzzle.selectVirtualObjectForRay(firstReflection.id);
}

// Export the puzzle
const json = puzzle.exportJSON();
console.log("Puzzle saved:", json);

// Switch to play mode for testing
puzzle.setMode("play");
```

---

## Features (MVP - 4 Hours)

### Core Features

- **Up to 3 mirrors** on room walls (configurable)
- **Edit/Play mode** toggle
- **Two object types**: Triangle and Viewer (always one of each)
- **Touch areas** for marking correct answers
- **Ray path visualization** showing light bounces
- **Virtual reflections** with proper flipping
- **Content editor** for problem and explanation text
- **Validation** with custom success/failure messages
- **JSON export/import**

---

## Data Model

```typescript
// Basic position type used throughout
interface Point {
  x: number;
  y: number;
}

// Input type for reflection calculations
interface Objects {
  triangle: {
    position: Point;
  };
  viewer: {
    position: Point;
  };
}

interface PuzzleState {
  mode: "edit" | "play";

  // Room with configurable mirrors
  room: {
    // Fixed dimensions (internal use only)
    width: 200;
    height: 200;
    // Which walls have mirrors [top, right, bottom, left]
    mirrors: [boolean, boolean, boolean, boolean];
  };

  // Always exactly 2 objects (implements Objects interface)
  objects: Objects;

  // Touch areas for answers
  touchAreas: {
    id: string;
    position: Point;
    isCorrect: boolean;
    radius: 30; // Fixed size
  }[];

  // Content fields
  content: {
    problemText: string;
    explanationText: string;
    correctFeedback: string;
    incorrectFeedback: string;
  };

  // Visualization settings
  selectedVirtualObjectForRay: string | null; // ID of virtual object to show ray for (set in edit mode)
  maxReflectionDepth: 3; // Limit for performance
}

// Calculated virtual objects (not stored)
interface VirtualObject {
  id: string; // Unique ID for selection (e.g., "triangle-depth1-mirror1")
  sourceType: "triangle" | "viewer";
  position: Point;
  flippedX: boolean; // Flipped horizontally
  flippedY: boolean; // Flipped vertically
  depth: number; // 1, 2, or 3
  opacity: number; // Decreases with depth
  rayPath?: Point[]; // Path light takes to reach viewer
}

// Virtual room structure (for rendering walls/mirrors)
interface VirtualRoom {
  position: Point; // Top-left corner
  mirrors: [boolean, boolean, boolean, boolean]; // Which walls are mirrors
  depth: number;
  opacity: number;
}
```

---

## Reflection Engine

```typescript
// Input type for reflection calculations (defined above in Data Model)
// interface Objects { ... }
// interface Point { ... }

class ReflectionEngine {
  private roomWidth: number = 200;
  private roomHeight: number = 200;

  // Calculate all virtual positions up to maxDepth
  calculateVirtualObjects(
    objects: Objects,
    mirrors: boolean[], // [top, right, bottom, left]
    maxDepth: number,
  ): { virtualObjects: VirtualObject[]; virtualRooms: VirtualRoom[] } {
    const virtualObjects: VirtualObject[] = [];
    const virtualRooms: VirtualRoom[] = [];

    // Step 1: Create first-order virtual rooms
    const baseRoom: VirtualRoom = {
      position: { x: 0, y: 0 },
      mirrors,
      depth: 0,
      opacity: 1.0,
    };

    // Create depth-1 virtual rooms for each mirror
    if (mirrors[0]) {
      // top
      virtualRooms.push({
        position: { x: 0, y: -this.roomHeight },
        mirrors,
        depth: 1,
        opacity: 0.7,
      });
    }
    if (mirrors[1]) {
      // right
      virtualRooms.push({
        position: { x: this.roomWidth, y: 0 },
        mirrors,
        depth: 1,
        opacity: 0.7,
      });
    }
    if (mirrors[2]) {
      // bottom
      virtualRooms.push({
        position: { x: 0, y: this.roomHeight },
        mirrors,
        depth: 1,
        opacity: 0.7,
      });
    }
    if (mirrors[3]) {
      // left
      virtualRooms.push({
        position: { x: -this.roomWidth, y: 0 },
        mirrors,
        depth: 1,
        opacity: 0.7,
      });
    }

    // Step 2: For each virtual room, calculate object reflections
    virtualRooms.forEach((room) => {
      if (room.depth === 0) return; // Skip base room

      // Determine which mirror created this room based on position
      let mirrorSide: "top" | "right" | "bottom" | "left";
      if (room.position.y < 0) mirrorSide = "top";
      else if (room.position.x > 0) mirrorSide = "right";
      else if (room.position.y > 0) mirrorSide = "bottom";
      else mirrorSide = "left";

      const mirrorPos = this.getMirrorPosition(mirrorSide, baseRoom.position);

      virtualObjects.push(
        this.reflectAcrossMirror(
          objects.triangle.position,
          "triangle",
          mirrorSide,
          room.depth,
          mirrorPos,
        ),
        this.reflectAcrossMirror(
          objects.viewer.position,
          "viewer",
          mirrorSide,
          room.depth,
          mirrorPos,
        ),
      );
    });

    // Step 3: For depth 2+, create virtual rooms from virtual rooms
    // and reflect virtual objects across virtual mirrors
    // ... (continue pattern for maxDepth)

    return { virtualObjects, virtualRooms };
  }

  // Helper to get mirror position in world coordinates
  getMirrorPosition(
    side: "top" | "right" | "bottom" | "left",
    roomPos: Point,
  ): number {
    switch (side) {
      case "top":
        return roomPos.y;
      case "bottom":
        return roomPos.y + this.roomHeight;
      case "left":
        return roomPos.x;
      case "right":
        return roomPos.x + this.roomWidth;
    }
  }

  // This function generalizes to reflecting ANY point across ANY mirror
  reflectAcrossMirror(
    position: Point,
    sourceType: "triangle" | "viewer",
    mirrorSide: "top" | "right" | "bottom" | "left",
    depth: number,
    mirrorPosition?: number, // For virtual mirrors
    baseFlips?: { flippedX: boolean; flippedY: boolean }, // For higher-order reflections
  ): VirtualObject {
    const reflected = { ...position };
    let flippedX = baseFlips?.flippedX || false;
    let flippedY = baseFlips?.flippedY || false;

    switch (mirrorSide) {
      case "top": // horizontal mirror
        const topMirrorY = mirrorPosition ?? 0;
        reflected.y = 2 * topMirrorY - position.y;
        flippedY = !flippedY;
        break;
      case "right": // vertical mirror
        const rightMirrorX = mirrorPosition ?? this.roomWidth;
        reflected.x = 2 * rightMirrorX - position.x;
        flippedX = !flippedX;
        break;
      case "bottom": // horizontal mirror
        const bottomMirrorY = mirrorPosition ?? this.roomHeight;
        reflected.y = 2 * bottomMirrorY - position.y;
        flippedY = !flippedY;
        break;
      case "left": // vertical mirror
        const leftMirrorX = mirrorPosition ?? 0;
        reflected.x = 2 * leftMirrorX - position.x;
        flippedX = !flippedX;
        break;
    }

    return {
      id: `${sourceType}-d${depth}-${mirrorSide}`,
      sourceType,
      position: reflected,
      flippedX,
      flippedY,
      depth,
      opacity: 1.0 - depth * 0.3,
    };
  }

  // Calculate ray path from virtual object to viewer
  calculateRayPath(
    virtualObject: VirtualObject,
    viewer: Point,
    mirrors: boolean[],
  ): Point[] {
    const path: Point[] = [];

    // Start from virtual object position
    path.push(virtualObject.position);

    // For depth 1: simple bounce off one mirror
    if (virtualObject.depth === 1) {
      // Find intersection point on mirror
      const mirrorSide = virtualObject.id.split("-")[2] as
        | "top"
        | "right"
        | "bottom"
        | "left";
      const intersection = this.getRayMirrorIntersection(
        virtualObject.position,
        viewer,
        mirrorSide,
      );
      if (intersection) {
        path.push(intersection);
      }
    }
    // For depth 2+: multiple bounces
    else if (virtualObject.depth > 1) {
      // Work backwards from viewer through each reflection
      // to find all intersection points
      // ... (implementation for multiple bounces)
    }

    // End at viewer position
    path.push(viewer);

    return path;
  }

  // Find where a straight line from 'from' to 'to' intersects with a mirror
  // This simulates the light ray bouncing off the mirror
  getRayMirrorIntersection(
    from: Point, // Virtual object position
    to: Point, // Viewer position
    mirrorSide: "top" | "right" | "bottom" | "left",
  ): Point | null {
    // We're finding where the straight line from virtual to viewer
    // crosses the mirror plane. This is the bounce point.

    // Line equation: P = from + t * (to - from), where t ∈ [0,1]
    // We solve for t when the line crosses the mirror

    switch (mirrorSide) {
      case "top": // Mirror at y = 0
        // When does the line cross y = 0?
        // from.y + t * (to.y - from.y) = 0
        // t = -from.y / (to.y - from.y)
        const t_top = -from.y / (to.y - from.y);
        if (t_top >= 0 && t_top <= 1) {
          // Calculate x position at this t value
          const x = from.x + t_top * (to.x - from.x);
          // Check if intersection is within room bounds
          if (x >= 0 && x <= this.roomWidth) {
            return { x, y: 0 };
          }
        }
        break;

      case "right": // Mirror at x = roomWidth
        // When does the line cross x = roomWidth?
        const t_right = (this.roomWidth - from.x) / (to.x - from.x);
        if (t_right >= 0 && t_right <= 1) {
          const y = from.y + t_right * (to.y - from.y);
          if (y >= 0 && y <= this.roomHeight) {
            return { x: this.roomWidth, y };
          }
        }
        break;

      case "bottom": // Mirror at y = roomHeight
        const t_bottom = (this.roomHeight - from.y) / (to.y - from.y);
        if (t_bottom >= 0 && t_bottom <= 1) {
          const x = from.x + t_bottom * (to.x - from.x);
          if (x >= 0 && x <= this.roomWidth) {
            return { x, y: this.roomHeight };
          }
        }
        break;

      case "left": // Mirror at x = 0
        const t_left = -from.x / (to.x - from.x);
        if (t_left >= 0 && t_left <= 1) {
          const y = from.y + t_left * (to.y - from.y);
          if (y >= 0 && y <= this.roomHeight) {
            return { x: 0, y };
          }
        }
        break;
    }

    return null;
  }
}
```

---

## UI Layout

### Edit Mode Layout

```
+-------------------------------------------------------+
|  [Edit Mode ✓] [Play Mode]      [Export] [Import]    |
+-------------------------------------------------------+
|                          |                            |
|  Canvas (800x800)        |  Content Editor            |
|                          |                            |
|  Extended view to show   |  Problem:                  |
|  virtual rooms outside   |  [__________________]      |
|  main room boundaries    |                            |
|                          |  Explanation:              |
|  +-------+               |  [__________________]      |
|  | Main  |               |                            |
|  | Room  |  Virtual      |  Correct Feedback:         |
|  |  △ 👁  |  Rooms        |  [__________________]      |
|  +-------+               |                            |
|                          |  Incorrect Feedback:       |
|        Virtual           |  [__________________]      |
|        Objects           |                            |
|                          |  Mirror Configuration:     |
|                          |       [ ] Top              |
|                          |  [ ] Left [▢] Right [ ]    |
|                          |      [ ] Bottom            |
|                          |                            |
|                          |  [Add Touch Area]          |
|                          |                            |
|                          |  Right-click touch areas   |
|                          |  to delete                 |
|                          |                            |
|                          |  ⚠️ Configuration warnings |
|                          |  appear here when invalid  |
+-------------------------------------------------------+
```

### Play Mode Layout (Before Submit)

```
+-------------------------------------------------------+
|  [Edit Mode] [Play Mode ✓]                           |
+-------------------------------------------------------+
|                                                       |
|  Problem: Click all locations where you see the      |
|           triangle's reflection                      |
|                                                       |
|  Canvas (800x800)                                    |
|                                                       |
|  Extended view showing                               |
|  virtual rooms                                       |
|                                                       |
|  +-------+                                           |
|  | Main  |                                           |
|  | Room  |  Virtual                                  |
|  |  △ 👁  |  Rooms                                    |
|  +-------+                                           |
|                                                       |
|        Virtual                                       |
|        Objects                                       |
|                                                       |
|                    [Submit Answer]                   |
|                                                       |
+-------------------------------------------------------+
```

### Play Mode Layout (After Submit)

```
+-------------------------------------------------------+
|  [Edit Mode] [Play Mode ✓]                           |
+-------------------------------------------------------+
|                                                       |
|  ✅ Correct! / ❌ Try Again                          |
|                                                       |
|  Canvas (800x800)                                    |
|                                                       |
|  Extended view showing                               |
|  virtual rooms                                       |
|                                                       |
|  +-------+                                           |
|  | Main  |                                           |
|  | Room  |  Virtual                                  |
|  |  △ 👁  |  Rooms        (Touch areas show          |
|  +-------+                ✓ or ✗ indicators)        |
|                                                       |
|        Virtual                                       |
|        Objects                                       |
|                                                       |
|            [Reset]     [Why?]                        |
|                                                       |
+-------------------------------------------------------+
|  [Feedback message displays here]                    |
|  [Explanation text appears here when Why? clicked]   |
+-------------------------------------------------------+
```

---

## Visual Design

```css
/* Room and mirrors */
.room {
  stroke: #374151; /* Gray walls */
  stroke-width: 2;
  fill: #f9fafb; /* Light gray background */
}

.mirror {
  stroke: #06b6d4; /* Cyan */
  stroke-width: 4;
}

/* Objects */
.triangle-real {
  fill: #ef4444; /* Red */
  stroke: #dc2626;
}

.viewer-real {
  fill: #000000; /* Black */
  stroke: #000000;
}

/* Virtual objects */
.virtual-object {
  stroke-dasharray: 4;
  cursor: pointer; /* In edit mode */
  /* opacity set dynamically: 0.7, 0.4, 0.1 */
}

.virtual-object:hover {
  stroke-width: 3; /* Highlight on hover in edit mode */
}

.virtual-object.ray-selected {
  stroke: #8b5cf6; /* Purple outline when ray is shown */
  stroke-width: 3;
}

.virtual-object.flipped-x {
  transform: scaleX(-1);
}

.virtual-object.flipped-y {
  transform: scaleY(-1);
}

/* Ray paths */
.ray-path {
  stroke: #8b5cf6; /* Purple */
  stroke-width: 2;
  opacity: 0.6;
  stroke-dasharray: 5, 5;
  animation: dash 1s linear infinite;
}

.ray-path.single {
  stroke-width: 3; /* Thicker when showing single selected ray */
  opacity: 0.8;
}

/* Virtual rooms */
.virtual-room {
  stroke: #9ca3af; /* Gray walls */
  stroke-width: 2;
  fill: none;
  /* opacity set dynamically based on depth: 0.7, 0.4, 0.1 */
}

.virtual-room .mirror {
  stroke: #06b6d4; /* Cyan */
  stroke-width: 3;
  /* inherits opacity from parent */
}

/* Touch areas - Rounded squares with outline styling */
.touch-area {
  fill: rgba(255, 255, 255, 0.1);
  stroke: #6b7280;
  stroke-width: 2;
  rx: 8; /* Rounded corners */
  transition: all 0.2s ease;
}

.touch-area.correct {
  stroke: #10b981; /* Green outline */
  stroke-width: 3;
}

.touch-area.incorrect {
  stroke: #ef4444; /* Red outline */
  stroke-width: 3;
}

.touch-area.selected {
  fill: rgba(59, 130, 246, 0.2);
  stroke: #3b82f6; /* Blue outline */
  stroke-width: 3;
}

/* Submission result states */
.touch-area.submission-correct-full {
  stroke: #10b981; /* Green for fully correct */
}

.touch-area.submission-correct-partial {
  stroke: #6b7280; /* Gray for partially correct */
}

.touch-area.submission-incorrect {
  stroke: #fbbf24; /* Yellow for incorrect selection */
}

/* Canvas extends beyond room to show virtual spaces */
.canvas {
  width: 800px; /* 2x room size */
  height: 800px;
  background: #e5e7eb; /* Darker outside room */
}

/* Mirror configuration mini room visualization */
.mirror-center {
  width: 60px;
  height: 60px;
  border: 2px solid #374151;
  background-color: #f9fafb;
  border-radius: 0.25rem;
}

.mirror-center.mirror-top-active {
  border-top: 4px solid #06b6d4;
}

.mirror-center.mirror-right-active {
  border-right: 4px solid #06b6d4;
}

.mirror-center.mirror-bottom-active {
  border-bottom: 4px solid #06b6d4;
}

.mirror-center.mirror-left-active {
  border-left: 4px solid #06b6d4;
}
```

---

## Interactions

### Edit Mode

1. **Move objects**: Drag triangle or viewer to reposition within room
2. **Toggle mirrors**: Check/uncheck boxes to enable walls as mirrors
3. **Add touch areas**: Click button, appears at center (defaults to correct), drag to position
4. **Configure touch areas**: Click to toggle between correct (green outline with ✓) / incorrect (red outline with ✗)
   - Icons appear in top-right corner of touch area
   - Touch areas are rounded squares, not circles
5. **Delete touch areas**: Right-click any touch area to remove it
6. **Select virtual object for ray**: Click any virtual object to show its ray path
   - Click same object again to hide ray
   - Click different object to switch ray to that object
   - Only one ray visible at a time
7. **Edit content**: Type in text fields for problem, explanation, feedback

### Play Mode

1. **View puzzle**: See objects and their virtual reflections
2. **See pre-selected ray**: If puzzle author selected a virtual object, its ray is visible
3. **Select answers**: Click touch areas (blue outline when selected)
4. **Submit**: Click submit button (button hides after submission)
5. **See feedback**: 
   - Correct selections: Green (fully correct) or gray (partially correct) with checkmark
   - Incorrect selections: Yellow with X icon
   - Unselected areas disappear
   - Shows feedback message from content editor

---

## Implementation Timeline (4 Hours)

### Hour 1: Foundation (60 min)

- **0-15 min**: HTML structure with canvas and content panel
- **15-30 min**: Room rendering with configurable mirrors
- **30-45 min**: Triangle and viewer objects (draggable)
- **45-60 min**: Extended canvas showing space outside room

### Hour 2: Reflection System (60 min)

- **0-20 min**: Single mirror reflection calculation
- **20-40 min**: Multiple mirror reflections (depth 2-3)
- **40-50 min**: Proper flipping for virtual objects
- **50-60 min**: Opacity based on depth

### Hour 3: Interactions & Content (60 min)

- **0-15 min**: Touch area creation and positioning
- **15-30 min**: Touch area correct/incorrect toggling
- **30-45 min**: Content editor fields binding
- **45-60 min**: Edit/Play mode switching

### Hour 4: Gameplay & Polish (60 min)

- **0-15 min**: Ray path calculation and rendering
- **15-30 min**: Submit and validation logic
- **30-45 min**: JSON export/import
- **45-60 min**: Visual polish and bug fixes

---

## Example Puzzle JSON

```json
{
  "mode": "play",
  "room": {
    "width": 200,
    "height": 200,
    "mirrors": [false, true, false, true] // Right and left walls
  },
  "objects": {
    "triangle": {
      "position": { "x": 100, "y": 50 }
    },
    "viewer": {
      "position": { "x": 100, "y": 150 }
    }
  },
  "touchAreas": [
    {
      "id": "touch-1",
      "position": { "x": 300, "y": 50 }, // In room coords (outside room bounds)
      "isCorrect": true,
      "radius": 30
    },
    {
      "id": "touch-2",
      "position": { "x": -100, "y": 50 }, // In room coords (negative is valid)
      "isCorrect": true,
      "radius": 30
    }
  ],
  "content": {
    "problemText": "Click all locations where you see the triangle's reflection",
    "explanationText": "With parallel mirrors, infinite reflections appear at regular intervals",
    "correctFeedback": "Excellent! You found all the reflections.",
    "incorrectFeedback": "Not quite. Remember that each mirror creates a virtual image."
  },
  "selectedVirtualObjectForRay": "triangle-d1-right", // Pre-selected ray to show
  "maxReflectionDepth": 3
}
```

---

## Critical Implementation Notes

### Virtual Rooms & Walls

- Must render virtual copies of the room itself (walls and mirrors)
- Each virtual room shows which walls are mirrors vs regular walls
- Virtual rooms have same opacity falloff as virtual objects
- Virtual room walls are rendered with reduced opacity (no stroke-dasharray)
- Virtual walls appear slightly transparent to distinguish from real room

### Coordinate System (CRITICAL)

- **Room Coordinates**: The `ReflectionEngine` and all game logic use "room coordinates"
  - Origin (0,0) is top-left of the room
  - Room spans from (0,0) to (400,400)
  - All object positions stored in room coordinates
  - All calculations done in room coordinates
- **Canvas Coordinates**: Used only for rendering
  - Canvas is 800x800 pixels
  - Room is centered at canvas offset (200,200)
  - Rendering layer transforms: `canvasX = roomX + 200`, `canvasY = roomY + 200`
  - Virtual objects outside room (negative positions) are visible on canvas

- **Transformation Responsibility**:
  - `ReflectionEngine`: Works entirely in room coordinates
  - Rendering layer: Applies offset when drawing to canvas
  - Touch areas: Stored in room coordinates, clicks transformed from canvas→room

### Mirror Positions (in room coordinates)

- Top: y = 0 (in room coordinates)
- Right: x = 400
- Bottom: y = 400
- Left: x = 0

### Virtual Object Rendering

- Must handle flipping correctly (scaleX/scaleY transforms)
- Triangle points up when not flipped
- Opacity decreases with depth: 0.7, 0.4, 0.1
- Draw virtual objects before real objects (z-order)

### Ray Path Selection

- In edit mode, clicking a virtual object selects it for ray display
- Only one ray path visible at a time (from selected virtual object to viewer)
- Click same object to deselect and hide ray
- Selected object has purple outline
- This selection is saved in puzzle JSON as `selectedVirtualObjectForRay`
- Students see this pre-selected ray in play mode (if set by the author)

---

## Success Criteria

### Must Have (4 hours)

- ✅ Configure 0-3 mirrors on walls
- ✅ See correct virtual reflections with proper flipping
- ✅ Drag triangle and viewer positions
- ✅ Add and position touch areas
- ✅ Validate correct/incorrect answers
- ✅ Show ray paths (basic)
- ✅ Edit problem and feedback text
- ✅ Export/import JSON

### Stretch Goals (if time permits)

- Animated ray paths
- Better visual feedback on submit
- Grid snapping for precise positioning
- Hover effects on virtual objects
- Sound effects

---

## Design Decisions and Improvements

### Room Size Optimization (50% Reduction)
- **Original**: 400x400 room centered in 800x800 canvas
- **Updated**: 200x200 room for better reflection visibility
- **Benefit**: Smaller room allows more virtual reflections to be visible within the same canvas size
- **Canvas offset**: Changed from 200px to 300px to maintain centering

### Touch Area Visual Design
- **Shape**: Changed from circles to rounded squares (8px border radius)
- **Size**: 30px radius (60x60 total area)
- **Visual indicators**: 
  - Checkmark (✓) for correct areas in top-right corner
  - X mark (✗) for incorrect areas in top-right corner
  - Icons use matching colors to their outlines
- **Default state**: Touch areas default to "correct" when created
- **Interaction modes**:
  - Edit mode: Click to toggle correct/incorrect, drag to move, right-click to delete
  - Play mode: Click to select/deselect for answer submission

### Touch Area Color States
- **Edit Mode**:
  - Correct: Green outline (#10b981) with green checkmark
  - Incorrect: Red outline (#ef4444) with red X
- **Play Mode (before submission)**:
  - Unselected: Gray outline (#6b7280)
  - Selected: Blue outline (#3b82f6) with blue fill
- **Play Mode (after submission)**:
  - Fully correct selection: Green outline with green checkmark
  - Partially correct selection: Gray outline with gray checkmark
  - Incorrect selection: Yellow outline (#fbbf24) with yellow X
  - Unselected areas: Hidden from view

### Configuration Validation System
- **Warning display**: Below "Add Touch Area" button in edit mode
- **Warning conditions**:
  - No touch areas defined: "No touch areas defined - puzzle cannot be played"
  - No correct areas: "No correct touch areas defined - puzzle has no solution"
  - 5+ touch areas: "5+ touch areas - puzzle is getting too complex"
- **Multiple warnings**: Displayed with bullet separator (•)
- **Real-time updates**: Warnings update immediately on touch area add/delete/toggle

### Submit Button Behavior
- **Visibility**: Hidden after submission to prevent re-submission
- **Reset**: Reappears when puzzle is reset or mode is switched
- **Purpose**: Prevents accidental multiple submissions and confusion

### Object Positioning Constraints
- **Wall padding**: 20px offset from walls (reduced from 25px for smaller room)
- **Prevents**: Objects from overlapping or passing through walls
- **Maintains**: Visual clarity and realistic physics

### Coordinate System Refinements
- **Room coordinates**: 0,0 to 200,200 (internal logic)
- **Canvas coordinates**: 800x800 with room centered at 300,300
- **Touch areas**: Can extend 300px outside room bounds for virtual object placement
- **Transformation functions**: 
  - `toCanvas(point)`: Adds 300px offset
  - `toRoom(point)`: Subtracts 300px offset

### User Experience Improvements
- **Mode switching**: Clears selections and submission results
- **Visual feedback**: All interactive elements have hover states
- **Drag vs click detection**: 5px movement threshold prevents accidental toggles
- **Right-click context menu**: Disabled on touch areas to allow deletion
- **Global warning updates**: Configuration warnings update from any component

### Code Architecture Decisions
- **Separation of concerns**: 
  - MirrorPuzzle: State management and business logic
  - Renderer: All visual rendering and SVG manipulation
  - ReflectionEngine: Physics calculations for reflections
- **Event handling**: Renderer handles all mouse events to maintain clean separation
- **State persistence**: All state stored in PuzzleState for easy JSON export/import
- **Validation**: Centralized in validateConfiguration() method

### Default Content Behavior
- **Empty field handling**: When content fields are left empty, the app provides sensible defaults
- **Default values**:
  - Problem text: "Click where you see reflections of the triangle"
  - Correct feedback: "Correct!"
  - Incorrect feedback: "Try again!"
  - Explanation: "Light bounces off mirrors to create virtual images. The virtual images appear at the same distance behind the mirror as the object is in front of it."
- **Content initialization**: Edit mode fields auto-populate with defaults for better UX
- **Fallback mechanism**: Play mode always displays content, using defaults when custom text is missing

### Mirror Configuration Visualization
- **Spatial layout**: Mirror checkboxes arranged to match room geometry
  - Top checkbox positioned above center
  - Left checkbox on the left side
  - Right checkbox on the right side  
  - Bottom checkbox below center
- **Mini room preview**: 60x60px square in the center showing real-time mirror state
  - Matches room styling (#f9fafb background, #374151 border)
  - Active mirrors shown with cyan (#06b6d4) 4px borders
  - Updates instantly when checkboxes toggle (no transition delay)
- **Import behavior**: When importing puzzles, both checkboxes and mini room update to reflect saved state
- **Visual feedback**: Provides immediate understanding of mirror configuration

### Bug Fixes and Improvements
- **Feedback Display Fix**: Resolved issue where feedback text wouldn't display after submission
  - Added fallback messages when content fields are empty
  - Implemented console logging for debugging submission flow
  - Ensured feedback container always becomes visible on submit
- **Performance Optimization**: Removed 200ms CSS transition from mirror visualization for instant feedback
- **Import State Sync**: Fixed mirror checkbox states not updating when importing JSON files
- **Content Field Initialization**: Pre-populated edit fields with helpful placeholder content
