import p5 from "p5";
import { MirrorPuzzle } from "./MirrorPuzzle";
import type { Point, TouchArea, VirtualObject } from "./types";

export class P5Renderer {
  private p!: p5;
  private puzzle: MirrorPuzzle;
  private canvas!: p5.Renderer;
  
  // Canvas and room dimensions
  private readonly canvasSize = 800;
  private readonly roomSize = 200;
  private readonly offset = 300; // (800 - 200) / 2
  
  // Dragging state
  private isDragging = false;
  private draggedObject: "triangle" | "viewer" | null = null;
  private draggedTouchArea: string | null = null;
  private dragOffset = { x: 0, y: 0 };
  private mouseDownPos = { x: 0, y: 0 };
  private hasMoved = false;
  
  constructor(puzzle: MirrorPuzzle, containerId: string) {
    this.puzzle = puzzle;
    
    // Create p5 sketch
    const sketch = (p: p5) => {
      this.p = p;
      
      p.setup = () => {
        this.canvas = p.createCanvas(this.canvasSize, this.canvasSize);
        this.canvas.parent(containerId);
        p.frameRate(30);
      };
      
      p.draw = () => {
        this.render();
      };
      
      p.mousePressed = () => {
        this.handleMouseDown();
      };
      
      p.mouseDragged = () => {
        this.handleMouseDrag();
      };
      
      p.mouseReleased = () => {
        this.handleMouseUp();
      };
      
      // Right-click for deleting touch areas
      p.mouseClicked = (event: MouseEvent) => {
        if (event.button === 2) { // Right click
          this.handleRightClick();
          return false; // Prevent context menu
        }
      };
    };
    
    new p5(sketch);
  }
  
  // Convert room coordinates to canvas coordinates
  private roomToCanvas(x: number, y: number): Point {
    return {
      x: x + this.offset,
      y: y + this.offset
    };
  }
  
  // Convert canvas coordinates to room coordinates
  private canvasToRoom(x: number, y: number): Point {
    return {
      x: x - this.offset,
      y: y - this.offset
    };
  }
  
  private render() {
    const p = this.p;
    
    // Clear background
    p.background(224); // #e0e0e0
    
    // Get state
    const mirrors = this.puzzle.getMirrors();
    const objects = this.puzzle.getObjects();
    const virtualData = this.puzzle.getVirtualObjects();
    const touchAreas = this.puzzle.getAllTouchAreas();
    const selectedAreas = this.puzzle.getSelectedTouchAreas();
    const mode = this.puzzle.getMode();
    const submissionResult = this.puzzle.getSubmissionResult();
    
    // Draw virtual rooms (dashed rectangles with mirrors)
    p.push();
    virtualData.virtualRooms.forEach((vRoom) => {
      if (vRoom.depth > 0) {
        const vRoomPos = this.roomToCanvas(vRoom.position.x, vRoom.position.y);
        
        // Draw dashed room outline
        p.noFill();
        p.strokeWeight(1);
        p.stroke(153, 153, 153, vRoom.opacity * 255); // #999 with opacity
        p.drawingContext.setLineDash([3, 3]);
        p.rect(vRoomPos.x, vRoomPos.y, this.roomSize, this.roomSize);
        p.drawingContext.setLineDash([]);
        
        // Draw mirrors on virtual room walls
        p.strokeWeight(3);
        p.stroke(74, 144, 226, vRoom.opacity * 255); // #4a90e2 with opacity
        if (vRoom.mirrors[0]) { // top
          p.line(vRoomPos.x, vRoomPos.y, vRoomPos.x + this.roomSize, vRoomPos.y);
        }
        if (vRoom.mirrors[1]) { // right
          p.line(vRoomPos.x + this.roomSize, vRoomPos.y, vRoomPos.x + this.roomSize, vRoomPos.y + this.roomSize);
        }
        if (vRoom.mirrors[2]) { // bottom
          p.line(vRoomPos.x, vRoomPos.y + this.roomSize, vRoomPos.x + this.roomSize, vRoomPos.y + this.roomSize);
        }
        if (vRoom.mirrors[3]) { // left
          p.line(vRoomPos.x, vRoomPos.y, vRoomPos.x, vRoomPos.y + this.roomSize);
        }
      }
    });
    p.pop();
    
    // Draw main room
    p.push();
    p.fill(255); // white
    p.stroke(51); // #333
    p.strokeWeight(2);
    p.rect(this.offset, this.offset, this.roomSize, this.roomSize);
    p.pop();
    
    // Draw mirrors
    p.push();
    p.strokeWeight(4);
    p.stroke(74, 144, 226); // #4a90e2
    if (mirrors.top) {
      p.line(this.offset, this.offset, this.offset + this.roomSize, this.offset);
    }
    if (mirrors.right) {
      p.line(this.offset + this.roomSize, this.offset, this.offset + this.roomSize, this.offset + this.roomSize);
    }
    if (mirrors.bottom) {
      p.line(this.offset, this.offset + this.roomSize, this.offset + this.roomSize, this.offset + this.roomSize);
    }
    if (mirrors.left) {
      p.line(this.offset, this.offset, this.offset, this.offset + this.roomSize);
    }
    p.pop();
    
    // Draw virtual objects (reflections)
    virtualData.virtualObjects.forEach((vObj) => {
      this.drawVirtualObject(vObj);
    });
    
    // Draw real objects
    this.drawTriangle(objects.triangle, false);
    this.drawViewer(objects.viewer, false);
    
    // Draw touch areas
    touchAreas.forEach((area) => {
      this.drawTouchArea(area, selectedAreas.includes(area.id), mode, submissionResult);
    });
  }
  
  private drawTriangle(position: Point, isVirtual: boolean, opacity: number = 1) {
    const pos = this.roomToCanvas(position.x, position.y);
    this.drawTriangleAtCanvasPos(pos, isVirtual, opacity, false, false);
  }
  
  private drawViewer(position: Point, isVirtual: boolean, opacity: number = 1) {
    const p = this.p;
    const pos = this.roomToCanvas(position.x, position.y);
    
    p.push();
    if (isVirtual) {
      p.fill(51, 51, 51, opacity * 255); // #333 with opacity
      p.stroke(0, 0, 0, opacity * 255); // black with opacity
    } else {
      p.fill(51); // #333
      p.stroke(0); // black
    }
    p.strokeWeight(2);
    p.ellipse(pos.x, pos.y, 24, 16); // rx=12, ry=8
    
    // Pupil
    p.fill(255, 255, 255, opacity * 255); // white
    p.noStroke();
    p.circle(pos.x, pos.y, 8); // r=4
    p.pop();
  }
  
  private drawVirtualObject(vObj: VirtualObject) {
    // Virtual objects are already in world coordinates, 
    // so we need to convert them directly to canvas coordinates
    const canvasPos = {
      x: vObj.position.x + this.offset,
      y: vObj.position.y + this.offset
    };
    
    if (vObj.sourceType === "triangle") {
      this.drawTriangleAtCanvasPos(canvasPos, true, vObj.opacity, vObj.flippedX, vObj.flippedY);
    } else if (vObj.sourceType === "viewer") {
      this.drawViewerAtCanvasPos(canvasPos, true, vObj.opacity);
    }
  }
  
  private drawTriangleAtCanvasPos(canvasPos: Point, isVirtual: boolean, opacity: number = 1, flippedX: boolean = false, flippedY: boolean = false) {
    const p = this.p;
    const size = 10;
    
    p.push();
    
    // Apply transformation for mirroring
    p.translate(canvasPos.x, canvasPos.y);
    if (flippedX) {
      p.scale(-1, 1); // Flip horizontally
    }
    if (flippedY) {
      p.scale(1, -1); // Flip vertically
    }
    
    if (isVirtual) {
      p.fill(255, 107, 107, opacity * 255); // #ff6b6b with opacity
      p.stroke(214, 48, 49, opacity * 255); // #d63031 with opacity
    } else {
      p.fill(255, 107, 107); // #ff6b6b
      p.stroke(214, 48, 49); // #d63031
    }
    p.strokeWeight(2);
    
    // Draw triangle centered at origin (since we translated)
    p.triangle(
      0, -size,
      -size, size,
      size, size
    );
    p.pop();
  }
  
  private drawViewerAtCanvasPos(canvasPos: Point, isVirtual: boolean, opacity: number = 1) {
    const p = this.p;
    
    p.push();
    if (isVirtual) {
      p.fill(51, 51, 51, opacity * 255); // #333 with opacity
      p.stroke(0, 0, 0, opacity * 255); // black with opacity
    } else {
      p.fill(51); // #333
      p.stroke(0); // black
    }
    p.strokeWeight(2);
    p.ellipse(canvasPos.x, canvasPos.y, 24, 16); // rx=12, ry=8
    
    // Pupil
    p.fill(255, 255, 255, opacity * 255); // white
    p.noStroke();
    p.circle(canvasPos.x, canvasPos.y, 8); // r=4
    p.pop();
  }
  
  private drawTouchArea(area: TouchArea, isSelected: boolean, mode: string, submissionResult: any) {
    const p = this.p;
    const size = 60;
    const halfSize = size / 2;
    
    let fillColor: p5.Color;
    let strokeColor: p5.Color;
    let strokeWidth = 2;
    let showIndicator = false;
    let indicatorColor: p5.Color | null = null;
    let indicatorSymbol = "";
    
    if (mode === "edit") {
      // Edit mode colors
      if (area.isCorrect) {
        fillColor = p.color(76, 175, 80, 51); // rgba(76, 175, 80, 0.2)
        strokeColor = p.color(76, 175, 80); // #4caf50
        indicatorColor = p.color(76, 175, 80);
        indicatorSymbol = "✓";
      } else {
        fillColor = p.color(244, 67, 54, 51); // rgba(244, 67, 54, 0.2)
        strokeColor = p.color(244, 67, 54); // #f44336
        indicatorColor = p.color(244, 67, 54);
        indicatorSymbol = "✗";
      }
      showIndicator = true;
    } else if (submissionResult) {
      // Play mode with submission
      if (!isSelected) {
        return; // Don't draw unselected areas after submission
      }
      
      if (submissionResult.isCorrect) {
        fillColor = p.color(76, 175, 80, 77); // rgba(76, 175, 80, 0.3)
        strokeColor = p.color(76, 175, 80);
        strokeWidth = 3;
        showIndicator = true;
        indicatorColor = p.color(76, 175, 80);
        indicatorSymbol = "✓";
      } else {
        if (submissionResult.selectedCorrect.includes(area.id)) {
          fillColor = p.color(158, 158, 158, 77); // gray
          strokeColor = p.color(117, 117, 117);
          strokeWidth = 3;
          showIndicator = true;
          indicatorColor = p.color(117, 117, 117);
          indicatorSymbol = "✓";
        } else if (submissionResult.selectedIncorrect.includes(area.id)) {
          fillColor = p.color(255, 193, 7, 77); // yellow
          strokeColor = p.color(255, 152, 0);
          strokeWidth = 3;
          showIndicator = true;
          indicatorColor = p.color(255, 152, 0);
          indicatorSymbol = "✗";
        } else {
          // This shouldn't happen for selected areas, but provide defaults
          fillColor = p.color(158, 158, 158, 13);
          strokeColor = p.color(153);
        }
      }
    } else {
      // Play mode before submission
      if (isSelected) {
        fillColor = p.color(33, 150, 243, 77); // rgba(33, 150, 243, 0.3)
        strokeColor = p.color(33, 150, 243); // #2196f3
        strokeWidth = 3;
      } else {
        fillColor = p.color(158, 158, 158, 13); // rgba(158, 158, 158, 0.05)
        strokeColor = p.color(153); // #999999
      }
    }
    
    // Draw rounded rectangle
    p.push();
    p.fill(fillColor);
    p.stroke(strokeColor);
    p.strokeWeight(strokeWidth);
    p.rect(area.position.x - halfSize, area.position.y - halfSize, size, size, 8);
    
    // Draw indicator if needed
    if (showIndicator && indicatorColor) {
      const indicatorX = area.position.x + halfSize - 10;
      const indicatorY = area.position.y - halfSize + 10;
      
      // Background circle
      p.fill(indicatorColor);
      p.noStroke();
      p.circle(indicatorX, indicatorY, 20);
      
      // Symbol
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.textStyle(p.BOLD);
      p.text(indicatorSymbol, indicatorX, indicatorY);
    }
    p.pop();
  }
  
  private handleMouseDown() {
    const mode = this.puzzle.getMode();
    const mouseX = this.p.mouseX;
    const mouseY = this.p.mouseY;
    
    if (mode === "edit") {
      // Check if clicking on an object
      const objects = this.puzzle.getObjects();
      const trianglePos = this.roomToCanvas(objects.triangle.x, objects.triangle.y);
      const viewerPos = this.roomToCanvas(objects.viewer.x, objects.viewer.y);
      
      // Check triangle (simple distance check)
      if (this.p.dist(mouseX, mouseY, trianglePos.x, trianglePos.y) < 15) {
        this.isDragging = true;
        this.draggedObject = "triangle";
        this.dragOffset = {
          x: mouseX - trianglePos.x,
          y: mouseY - trianglePos.y
        };
        return;
      }
      
      // Check viewer
      if (this.p.dist(mouseX, mouseY, viewerPos.x, viewerPos.y) < 15) {
        this.isDragging = true;
        this.draggedObject = "viewer";
        this.dragOffset = {
          x: mouseX - viewerPos.x,
          y: mouseY - viewerPos.y
        };
        return;
      }
      
      // Check touch areas
      const touchAreas = this.puzzle.getAllTouchAreas();
      for (const area of touchAreas) {
        if (this.isPointInTouchArea(mouseX, mouseY, area)) {
          this.mouseDownPos = { x: mouseX, y: mouseY };
          this.hasMoved = false;
          this.draggedTouchArea = area.id;
          this.dragOffset = {
            x: mouseX - area.position.x,
            y: mouseY - area.position.y
          };
          return;
        }
      }
    } else if (mode === "play") {
      // Check touch areas for selection
      const touchAreas = this.puzzle.getAllTouchAreas();
      for (const area of touchAreas) {
        if (this.isPointInTouchArea(mouseX, mouseY, area)) {
          const selected = this.puzzle.getSelectedTouchAreas();
          if (selected.includes(area.id)) {
            this.puzzle.deselectTouchArea(area.id);
          } else {
            this.puzzle.selectTouchArea(area.id);
          }
          return;
        }
      }
    }
  }
  
  private handleMouseDrag() {
    const mouseX = this.p.mouseX;
    const mouseY = this.p.mouseY;
    
    // Check if we should start dragging a touch area
    if (this.draggedTouchArea && !this.isDragging) {
      const distance = this.p.dist(mouseX, mouseY, this.mouseDownPos.x, this.mouseDownPos.y);
      if (distance > 5) {
        this.isDragging = true;
        this.hasMoved = true;
      }
    }
    
    if (!this.isDragging) return;
    
    if (this.draggedObject) {
      const roomPos = this.canvasToRoom(mouseX - this.dragOffset.x, mouseY - this.dragOffset.y);
      const constrainedPos = this.constrainPosition(roomPos.x, roomPos.y, this.draggedObject);
      this.puzzle.moveObject(this.draggedObject, constrainedPos);
    } else if (this.draggedTouchArea) {
      const canvasPos = {
        x: mouseX - this.dragOffset.x,
        y: mouseY - this.dragOffset.y
      };
      // Constrain to canvas bounds
      const constrainedPos = {
        x: this.p.constrain(canvasPos.x, 30, this.canvasSize - 30),
        y: this.p.constrain(canvasPos.y, 30, this.canvasSize - 30)
      };
      this.puzzle.moveTouchArea(this.draggedTouchArea, constrainedPos);
    }
  }
  
  private handleMouseUp() {
    // If we have a touch area and didn't move, toggle it
    if (this.draggedTouchArea && !this.hasMoved && this.puzzle.getMode() === "edit") {
      const touchAreas = this.puzzle.getAllTouchAreas();
      const area = touchAreas.find(a => a.id === this.draggedTouchArea);
      if (area) {
        this.puzzle.setTouchAreaCorrect(this.draggedTouchArea, !area.isCorrect);
      }
    }
    
    this.isDragging = false;
    this.draggedObject = null;
    this.draggedTouchArea = null;
    this.hasMoved = false;
  }
  
  private handleRightClick() {
    if (this.puzzle.getMode() !== "edit") return;
    
    const mouseX = this.p.mouseX;
    const mouseY = this.p.mouseY;
    const touchAreas = this.puzzle.getAllTouchAreas();
    
    for (const area of touchAreas) {
      if (this.isPointInTouchArea(mouseX, mouseY, area)) {
        this.puzzle.deleteTouchArea(area.id);
        return;
      }
    }
  }
  
  private isPointInTouchArea(x: number, y: number, area: TouchArea): boolean {
    const halfSize = 30;
    return x >= area.position.x - halfSize &&
           x <= area.position.x + halfSize &&
           y >= area.position.y - halfSize &&
           y <= area.position.y + halfSize;
  }
  
  private constrainPosition(x: number, y: number, objectType: "triangle" | "viewer"): Point {
    const padding = objectType === "triangle" ? 10 : 12;
    return {
      x: this.p.constrain(x, padding, this.roomSize - padding),
      y: this.p.constrain(y, padding, this.roomSize - padding)
    };
  }
  
  public updateConfigurationWarning() {
    // This will be called from main.ts
    // Configuration warnings are handled in the HTML UI
  }
}