# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript-based interactive web application for creating and playing optical reflection puzzles. Uses geometric transformations to teach mirror reflection concepts through draggable objects and visual ray paths.

## Development Commands

```bash
npm run dev      # Start Vite development server at localhost:5173
npm run build    # Compile TypeScript and build production assets
npm run preview  # Preview production build locally
```

## Architecture

### Technology Stack
- **Vite 7.1.0** (no custom config - uses defaults)
- **TypeScript 5.8.3** with strict mode (`noUnusedLocals`, `noUnusedParameters`)
- **Vanilla TypeScript/DOM** - no UI framework
- **ES2022 target** with bundler module resolution

### Core Class Structure

```typescript
// Central orchestrator managing state and interactions
MirrorPuzzle {
  private state: PuzzleState
  private engine: ReflectionEngine
  switchMode(mode: "edit" | "play")
  exportPuzzle(): string
  importPuzzle(json: string)
}

// Pure computational engine for optics
ReflectionEngine {
  calculateVirtualObjects(room, objects, depth)
  calculateRayPath(object, viewer, mirrors)
  getReflectedPoint(point, mirror)
}
```

### State Model

```typescript
interface PuzzleState {
  mode: "edit" | "play"
  room: {
    dimensions: { width: 200, height: 200 }  // Fixed size
    mirrors: [boolean, boolean, boolean, boolean]  // [top, right, bottom, left]
  }
  objects: {
    triangle: Point
    viewer: Point
  }
  touchAreas: TouchArea[]  // Answer validation zones
  content: Content  // Problem text, feedback
}
```

## Critical Implementation Details

### Geometric Constraints
- **Room**: Fixed 200x200 units with 20-unit object padding
- **Mirrors**: Max 4 (walls only), no curved/angled mirrors
- **Reflections**: Max depth 3 for performance
- **Objects**: Triangle and viewer only, positions clamped to valid range

### Reflection Algorithm
- Uses **symmetry transformations** (not ray tracing)
- Calculates virtual rooms via geometric reflection across mirror axes
- Virtual object opacity = `1.0 - (depth * 0.3)`
- Ray paths calculated FROM objects TO viewer

### Current Implementation Status

**Completed**:
- ✅ Full TypeScript architecture (src/MirrorPuzzle.ts, src/ReflectionEngine.ts, src/types.ts)
- ✅ State management with mode switching
- ✅ Depth-1 reflection calculations
- ✅ Touch area validation logic
- ✅ JSON import/export

**Not Implemented**:
- ❌ SVG rendering (`updateCanvas()` is placeholder)
- ❌ Mouse/touch event handlers for dragging
- ❌ Visual ray path rendering
- ❌ Multi-depth reflections (TODO at line 52 in ReflectionEngine.ts)
- ❌ UI feedback for validation

### Key Files & Entry Points

- **src/main.ts**: Application entry, DOM setup, event listeners
- **src/MirrorPuzzle.ts**: Main puzzle controller class
- **src/ReflectionEngine.ts**: Geometric calculations
- **src/types.ts**: Complete TypeScript interfaces
- **index.html**: Single page with `<svg id="canvas">` container

## Implementation Notes

### Canvas Rendering Strategy
SVG-based rendering expected in `updateCanvas()`:
```typescript
// Current placeholder at src/MirrorPuzzle.ts:119
private updateCanvas(): void {
  console.log("Canvas update needed");
  // TODO: Implement SVG rendering
}
```

### Coordinate System
- Room coords: (0,0) top-left, (200,200) bottom-right
- Canvas transform needed: `canvasToRoom()` and `roomToCanvas()`
- Object positions use center points

### Event Handling Pattern
Drag-and-drop implementation needed:
1. Check mode (edit vs play)
2. Identify draggable element (triangle or viewer)
3. Update state.objects positions
4. Recalculate virtual objects
5. Trigger canvas update

### Performance Considerations
- Reflection depth limited to prevent exponential virtual object growth
- Position clamping prevents invalid states
- Virtual objects calculated on-demand (not cached)

## Testing & Validation

No test framework configured. Manual testing via:
```bash
npm run dev  # Then interact with UI at localhost:5173
```

For validation logic testing, use browser console:
```javascript
puzzle.importPuzzle(jsonString)  // Load test state
puzzle.validateAnswer(clickPoint)  // Test touch areas
```