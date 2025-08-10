import type { Point, Objects, VirtualObject, VirtualRoom } from "./types";

export class ReflectionEngine {
  // TODO: let's refer to a constants.ts file that can contain varibles used across multiple classes
  private roomWidth: number = 200;
  private roomHeight: number = 200;

  // Calculate all virtual positions up to maxDepth
  calculateVirtualObjects(
    objects: Objects,
    _mirrors: boolean[], // [top, right, bottom, left]
    _maxDepth: number,
  ): { virtualObjects: VirtualObject[]; virtualRooms: VirtualRoom[] } {
    const virtualObjects: VirtualObject[] = [];
    const virtualRooms: VirtualRoom[] = [];
    
    console.log("calculateVirtualObjects called with mirrors:", _mirrors);
    console.log("Objects:", objects);

    // Step 1: Create first-order virtual rooms
    const baseRoom: VirtualRoom = {
      position: { x: 0, y: 0 },
      mirrors: _mirrors as [boolean, boolean, boolean, boolean],
      depth: 0,
      opacity: 1.0,
    };

    // Create depth-1 virtual rooms for each mirror
    if (_mirrors[0]) {
      // top - room above flips the top/bottom mirrors
      virtualRooms.push({
        position: { x: 0, y: -this.roomHeight },
        mirrors: [_mirrors[2], _mirrors[1], _mirrors[0], _mirrors[3]], // flip top/bottom
        depth: 1,
        opacity: 0.7,
      });
    }
    if (_mirrors[1]) {
      // right - room to the right flips the left/right mirrors
      virtualRooms.push({
        position: { x: this.roomWidth, y: 0 },
        mirrors: [_mirrors[0], _mirrors[3], _mirrors[2], _mirrors[1]], // flip left/right
        depth: 1,
        opacity: 0.7,
      });
    }
    if (_mirrors[2]) {
      // bottom - room below flips the top/bottom mirrors
      virtualRooms.push({
        position: { x: 0, y: this.roomHeight },
        mirrors: [_mirrors[2], _mirrors[1], _mirrors[0], _mirrors[3]], // flip top/bottom
        depth: 1,
        opacity: 0.7,
      });
    }
    if (_mirrors[3]) {
      // left - room to the left flips the left/right mirrors
      virtualRooms.push({
        position: { x: -this.roomWidth, y: 0 },
        mirrors: [_mirrors[0], _mirrors[3], _mirrors[2], _mirrors[1]], // flip left/right
        depth: 1,
        opacity: 0.7,
      });
    }

    // Step 2: For each mirror, calculate object reflections
    console.log("Creating virtual objects for active mirrors");
    
    if (_mirrors[0]) { // top mirror
      console.log("Top mirror active - reflecting objects");
      virtualObjects.push(
        this.reflectAcrossMirror(
          objects.triangle.position,
          "triangle",
          "top",
          1,
          0, // top mirror is at y=0
        ),
        this.reflectAcrossMirror(
          objects.viewer.position,
          "viewer",
          "top",
          1,
          0,
        ),
      );
    }
    
    if (_mirrors[1]) { // right mirror
      console.log("Right mirror active - reflecting objects");
      virtualObjects.push(
        this.reflectAcrossMirror(
          objects.triangle.position,
          "triangle",
          "right",
          1,
          this.roomWidth, // right mirror is at x=200
        ),
        this.reflectAcrossMirror(
          objects.viewer.position,
          "viewer",
          "right",
          1,
          this.roomWidth,
        ),
      );
    }
    
    if (_mirrors[2]) { // bottom mirror
      console.log("Bottom mirror active - reflecting objects");
      virtualObjects.push(
        this.reflectAcrossMirror(
          objects.triangle.position,
          "triangle",
          "bottom",
          1,
          this.roomHeight, // bottom mirror is at y=200
        ),
        this.reflectAcrossMirror(
          objects.viewer.position,
          "viewer",
          "bottom",
          1,
          this.roomHeight,
        ),
      );
    }
    
    if (_mirrors[3]) { // left mirror
      console.log("Left mirror active - reflecting objects");
      virtualObjects.push(
        this.reflectAcrossMirror(
          objects.triangle.position,
          "triangle",
          "left",
          1,
          0, // left mirror is at x=0
        ),
        this.reflectAcrossMirror(
          objects.viewer.position,
          "viewer",
          "left",
          1,
          0,
        ),
      );
    }

    // Implement depth 2+ reflections
    for (let currentDepth = 2; currentDepth <= _maxDepth; currentDepth++) {
      const prevDepthRooms = virtualRooms.filter(r => r.depth === currentDepth - 1);
      const prevDepthObjects = virtualObjects.filter(o => o.depth === currentDepth - 1);
      
      // Use a Set to track unique room positions and avoid duplicates
      const roomPositionSet = new Set<string>();
      virtualRooms.forEach(room => {
        roomPositionSet.add(`${room.position.x},${room.position.y}`);
      });
      
      // For each previous depth room, reflect it across each active mirror
      prevDepthRooms.forEach(prevRoom => {
        // Check each mirror in the base room
        if (_mirrors[0]) { // top mirror
          const newRoomY = -prevRoom.position.y - this.roomHeight;
          const posKey = `${prevRoom.position.x},${newRoomY}`;
          if (!roomPositionSet.has(posKey)) {
            roomPositionSet.add(posKey);
            // Flip top/bottom mirrors when reflecting across top
            const newMirrors: [boolean, boolean, boolean, boolean] = [
              prevRoom.mirrors[2], // top becomes bottom
              prevRoom.mirrors[1], // right stays
              prevRoom.mirrors[0], // bottom becomes top
              prevRoom.mirrors[3]  // left stays
            ];
            virtualRooms.push({
              position: { x: prevRoom.position.x, y: newRoomY },
              mirrors: newMirrors,
              depth: currentDepth,
              opacity: 1.0 - currentDepth * 0.3,
            });
          }
        }
        
        if (_mirrors[1]) { // right mirror
          const newRoomX = 2 * this.roomWidth - prevRoom.position.x;
          const posKey = `${newRoomX},${prevRoom.position.y}`;
          if (!roomPositionSet.has(posKey)) {
            roomPositionSet.add(posKey);
            // Flip left/right mirrors when reflecting across right
            const newMirrors: [boolean, boolean, boolean, boolean] = [
              prevRoom.mirrors[0], // top stays
              prevRoom.mirrors[3], // right becomes left
              prevRoom.mirrors[2], // bottom stays
              prevRoom.mirrors[1]  // left becomes right
            ];
            virtualRooms.push({
              position: { x: newRoomX, y: prevRoom.position.y },
              mirrors: newMirrors,
              depth: currentDepth,
              opacity: 1.0 - currentDepth * 0.3,
            });
          }
        }
        
        if (_mirrors[2]) { // bottom mirror
          const newRoomY = 2 * this.roomHeight - prevRoom.position.y;
          const posKey = `${prevRoom.position.x},${newRoomY}`;
          if (!roomPositionSet.has(posKey)) {
            roomPositionSet.add(posKey);
            // Flip top/bottom mirrors when reflecting across bottom
            const newMirrors: [boolean, boolean, boolean, boolean] = [
              prevRoom.mirrors[2], // top becomes bottom
              prevRoom.mirrors[1], // right stays
              prevRoom.mirrors[0], // bottom becomes top
              prevRoom.mirrors[3]  // left stays
            ];
            virtualRooms.push({
              position: { x: prevRoom.position.x, y: newRoomY },
              mirrors: newMirrors,
              depth: currentDepth,
              opacity: 1.0 - currentDepth * 0.3,
            });
          }
        }
        
        if (_mirrors[3]) { // left mirror
          const newRoomX = -prevRoom.position.x - this.roomWidth;
          const posKey = `${newRoomX},${prevRoom.position.y}`;
          if (!roomPositionSet.has(posKey)) {
            roomPositionSet.add(posKey);
            // Flip left/right mirrors when reflecting across left
            const newMirrors: [boolean, boolean, boolean, boolean] = [
              prevRoom.mirrors[0], // top stays
              prevRoom.mirrors[3], // right becomes left
              prevRoom.mirrors[2], // bottom stays
              prevRoom.mirrors[1]  // left becomes right
            ];
            virtualRooms.push({
              position: { x: newRoomX, y: prevRoom.position.y },
              mirrors: newMirrors,
              depth: currentDepth,
              opacity: 1.0 - currentDepth * 0.3,
            });
          }
        }
      });
      
      // For each previous depth object, reflect it across each active mirror
      prevDepthObjects.forEach(prevObj => {
        if (_mirrors[0]) { // top mirror
          const reflected = this.reflectAcrossMirror(
            prevObj.position,
            prevObj.sourceType,
            "top",
            currentDepth,
            0,
            { flippedX: prevObj.flippedX, flippedY: prevObj.flippedY }
          );
          reflected.id = `${prevObj.sourceType}-d${currentDepth}-${prevObj.id.split('-').slice(2).join('-')}-top`;
          virtualObjects.push(reflected);
        }
        
        if (_mirrors[1]) { // right mirror
          const reflected = this.reflectAcrossMirror(
            prevObj.position,
            prevObj.sourceType,
            "right",
            currentDepth,
            this.roomWidth,
            { flippedX: prevObj.flippedX, flippedY: prevObj.flippedY }
          );
          reflected.id = `${prevObj.sourceType}-d${currentDepth}-${prevObj.id.split('-').slice(2).join('-')}-right`;
          virtualObjects.push(reflected);
        }
        
        if (_mirrors[2]) { // bottom mirror
          const reflected = this.reflectAcrossMirror(
            prevObj.position,
            prevObj.sourceType,
            "bottom",
            currentDepth,
            this.roomHeight,
            { flippedX: prevObj.flippedX, flippedY: prevObj.flippedY }
          );
          reflected.id = `${prevObj.sourceType}-d${currentDepth}-${prevObj.id.split('-').slice(2).join('-')}-bottom`;
          virtualObjects.push(reflected);
        }
        
        if (_mirrors[3]) { // left mirror  
          const reflected = this.reflectAcrossMirror(
            prevObj.position,
            prevObj.sourceType,
            "left",
            currentDepth,
            0,
            { flippedX: prevObj.flippedX, flippedY: prevObj.flippedY }
          );
          reflected.id = `${prevObj.sourceType}-d${currentDepth}-${prevObj.id.split('-').slice(2).join('-')}-left`;
          virtualObjects.push(reflected);
        }
      });
    }

    console.log(`Generated ${virtualObjects.length} virtual objects up to depth ${_maxDepth}`);
    console.log(`Generated ${virtualRooms.length} virtual rooms up to depth ${_maxDepth}`);
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
    mirrorPosition: number,
    baseFlips?: { flippedX: boolean; flippedY: boolean },
  ): VirtualObject {
    // The reflected position in world coordinates
    const reflected = { ...position };
    let flippedX = baseFlips?.flippedX || false;
    let flippedY = baseFlips?.flippedY || false;

    switch (mirrorSide) {
      case "top": // horizontal mirror at y=0
        // Reflect across y=0: point at y becomes point at -y
        reflected.y = -position.y;
        flippedY = !flippedY;
        break;
      case "right": // vertical mirror at x=200
        // Reflect across x=200: point at x becomes 2*200 - x
        reflected.x = 2 * this.roomWidth - position.x;
        flippedX = !flippedX;
        break;
      case "bottom": // horizontal mirror at y=200
        // Reflect across y=200: point at y becomes 2*200 - y
        reflected.y = 2 * this.roomHeight - position.y;
        flippedY = !flippedY;
        break;
      case "left": // vertical mirror at x=0
        // Reflect across x=0: point at x becomes -x
        reflected.x = -position.x;
        flippedX = !flippedX;
        break;
    }

    console.log(`Reflecting ${sourceType} at (${position.x}, ${position.y}) across ${mirrorSide} mirror -> world coords (${reflected.x}, ${reflected.y})`);

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

  // Calculate ray path from real object to viewer with mirror bounces
  calculateRayPath(
    virtualObject: VirtualObject,
    realObjectPos: Point,
    viewer: Point,
    _mirrors: boolean[],
  ): Point[] {
    const path: Point[] = [];
    
    // Start from the real object position
    path.push(realObjectPos);
    
    // Parse the virtual object ID to get reflection sequence
    // ID format: "triangle-d2-top-left" means reflected top then left
    const idParts = virtualObject.id.split("-");
    const depth = virtualObject.depth;
    
    if (depth === 1) {
      // Single reflection - find mirror intersection
      const mirrorSide = idParts[2] as "top" | "right" | "bottom" | "left";
      const mirrorPos = this.getMirrorPosition(mirrorSide, { x: 0, y: 0 });
      
      // The intersection point is where the line from virtual object to viewer crosses the mirror
      // This ensures the angle of incidence equals angle of reflection
      const intersection = this.calculateMirrorIntersection(
        virtualObject.position,  // Use virtual position, not real
        viewer,
        mirrorSide,
        mirrorPos
      );
      
      if (intersection) {
        path.push(intersection);
      }
    } else if (depth === 2) {
      // Two reflections - extract mirror sequence from ID
      const mirrors = idParts.slice(2); // e.g., ["top", "left"]
      
      // The last mirror bounce must align with the virtual ray
      // So we work backwards from the virtual object position
      
      // Find the last mirror in the sequence
      const lastMirror = mirrors[mirrors.length - 1] as "top" | "right" | "bottom" | "left";
      const lastMirrorPos = this.getMirrorPosition(lastMirror, { x: 0, y: 0 });
      
      // Find where the line from virtual object to viewer crosses the last mirror
      const lastIntersection = this.calculateMirrorIntersection(
        virtualObject.position,
        viewer,
        lastMirror,
        lastMirrorPos
      );
      
      if (lastIntersection) {
        // Now find the first mirror intersection
        const firstMirror = mirrors[0] as "top" | "right" | "bottom" | "left";
        const firstMirrorPos = this.getMirrorPosition(firstMirror, { x: 0, y: 0 });
        
        // Find where ray from real object to last intersection hits first mirror
        const firstIntersection = this.calculateMirrorIntersection(
          realObjectPos,
          lastIntersection,
          firstMirror,
          firstMirrorPos
        );
        
        if (firstIntersection) {
          path.push(firstIntersection);
          path.push(lastIntersection);
        }
      }
    } else if (depth === 3) {
      // Three reflections - work backwards to ensure alignment
      const mirrors = idParts.slice(2);
      const intersections: Point[] = [];
      
      // Find the last mirror intersection (must align with virtual ray)
      const lastMirror = mirrors[mirrors.length - 1] as "top" | "right" | "bottom" | "left";
      const lastMirrorPos = this.getMirrorPosition(lastMirror, { x: 0, y: 0 });
      
      const lastIntersection = this.calculateMirrorIntersection(
        virtualObject.position,
        viewer,
        lastMirror,
        lastMirrorPos
      );
      
      if (lastIntersection) {
        intersections.push(lastIntersection);
        
        // Work backwards to find middle intersection
        if (mirrors.length > 2) {
          const middleMirror = mirrors[1] as "top" | "right" | "bottom" | "left";
          const middleMirrorPos = this.getMirrorPosition(middleMirror, { x: 0, y: 0 });
          
          // Create intermediate virtual by reflecting real object through first mirror
          const firstMirror = mirrors[0] as "top" | "right" | "bottom" | "left";
          const firstMirrorPos = this.getMirrorPosition(firstMirror, { x: 0, y: 0 });
          const intermediateVirtual = this.reflectPointAcrossMirror(
            realObjectPos,
            firstMirror,
            firstMirrorPos
          );
          
          // Find middle intersection
          const middleIntersection = this.calculateMirrorIntersection(
            intermediateVirtual,
            lastIntersection,
            middleMirror,
            middleMirrorPos
          );
          
          if (middleIntersection) {
            // Find first intersection
            const firstIntersection = this.calculateMirrorIntersection(
              realObjectPos,
              middleIntersection,
              firstMirror,
              firstMirrorPos
            );
            
            if (firstIntersection) {
              path.push(firstIntersection);
              path.push(middleIntersection);
              path.push(lastIntersection);
            }
          }
        }
      }
    }

    // End at viewer position
    path.push(viewer);

    return path;
  }
  
  // Helper to reflect a point across a mirror (used for intermediate calculations)
  private reflectPointAcrossMirror(
    point: Point,
    mirrorSide: "top" | "right" | "bottom" | "left",
    mirrorPosition: number
  ): Point {
    const reflected = { ...point };
    
    switch (mirrorSide) {
      case "top":
        reflected.y = 2 * mirrorPosition - point.y;
        break;
      case "right":
        reflected.x = 2 * mirrorPosition - point.x;
        break;
      case "bottom":
        reflected.y = 2 * mirrorPosition - point.y;
        break;
      case "left":
        reflected.x = 2 * mirrorPosition - point.x;
        break;
    }
    
    return reflected;
  }
  
  // Calculate where a line segment intersects with a mirror
  private calculateMirrorIntersection(
    from: Point,
    to: Point,
    mirrorSide: "top" | "right" | "bottom" | "left",
    mirrorPosition: number
  ): Point | null {
    // Line parametric equation: P = from + t * (to - from), where t ∈ [0,1]
    
    switch (mirrorSide) {
      case "top": // Mirror at y = mirrorPosition
        if (Math.abs(to.y - from.y) < 0.001) return null; // Parallel to mirror
        const t_top = (mirrorPosition - from.y) / (to.y - from.y);
        if (t_top >= 0 && t_top <= 1) {
          const x = from.x + t_top * (to.x - from.x);
          if (x >= 0 && x <= this.roomWidth) {
            return { x, y: mirrorPosition };
          }
        }
        break;
        
      case "right": // Mirror at x = mirrorPosition
        if (Math.abs(to.x - from.x) < 0.001) return null;
        const t_right = (mirrorPosition - from.x) / (to.x - from.x);
        if (t_right >= 0 && t_right <= 1) {
          const y = from.y + t_right * (to.y - from.y);
          if (y >= 0 && y <= this.roomHeight) {
            return { x: mirrorPosition, y };
          }
        }
        break;
        
      case "bottom": // Mirror at y = mirrorPosition
        if (Math.abs(to.y - from.y) < 0.001) return null;
        const t_bottom = (mirrorPosition - from.y) / (to.y - from.y);
        if (t_bottom >= 0 && t_bottom <= 1) {
          const x = from.x + t_bottom * (to.x - from.x);
          if (x >= 0 && x <= this.roomWidth) {
            return { x, y: mirrorPosition };
          }
        }
        break;
        
      case "left": // Mirror at x = mirrorPosition
        if (Math.abs(to.x - from.x) < 0.001) return null;
        const t_left = (mirrorPosition - from.x) / (to.x - from.x);
        if (t_left >= 0 && t_left <= 1) {
          const y = from.y + t_left * (to.y - from.y);
          if (y >= 0 && y <= this.roomHeight) {
            return { x: mirrorPosition, y };
          }
        }
        break;
    }
    
    return null;
  }

  // Find where a straight line from 'from' to 'to' intersects with a mirror
  getRayMirrorIntersection(
    from: Point,
    to: Point,
    mirrorSide: "top" | "right" | "bottom" | "left",
  ): Point | null {
    // Line equation: P = from + t * (to - from), where t ∈ [0,1]
    // We solve for t when the line crosses the mirror

    switch (mirrorSide) {
      case "top": // Mirror at y = 0
        const t_top = -from.y / (to.y - from.y);
        if (t_top >= 0 && t_top <= 1) {
          const x = from.x + t_top * (to.x - from.x);
          if (x >= 0 && x <= this.roomWidth) {
            return { x, y: 0 };
          }
        }
        break;

      case "right": // Mirror at x = roomWidth
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

