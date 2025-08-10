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
    
    if (_mirrors[0]) { // top mirror
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

    return { virtualObjects, virtualRooms };
  }

  // Get mirror index from side name
  private getMirrorIndex(side: "top" | "right" | "bottom" | "left"): number {
    switch (side) {
      case "top": return 0;
      case "right": return 1;
      case "bottom": return 2;
      case "left": return 3;
    }
  }
  
  // Get the start point of a mirror line segment
  private getMirrorStart(side: "top" | "right" | "bottom" | "left"): Point {
    switch (side) {
      case "top":
        return { x: 0, y: 0 };
      case "right":
        return { x: this.roomWidth, y: 0 };
      case "bottom":
        return { x: 0, y: this.roomHeight };
      case "left":
        return { x: 0, y: 0 };
    }
  }
  
  // Get the end point of a mirror line segment
  private getMirrorEnd(side: "top" | "right" | "bottom" | "left"): Point {
    switch (side) {
      case "top":
        return { x: this.roomWidth, y: 0 };
      case "right":
        return { x: this.roomWidth, y: this.roomHeight };
      case "bottom":
        return { x: this.roomWidth, y: this.roomHeight };
      case "left":
        return { x: 0, y: this.roomHeight };
    }
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
    mirrors: boolean[],
  ): Point[] {
    // Use recursive algorithm to build the ray path
    const rayPath: Point[] = [];
    
    // Start the recursive path building
    this.buildRayPathRecursive(
      realObjectPos,
      virtualObject.position,
      viewer,
      mirrors,
      rayPath
    );
    
    // Add the viewer as the final point
    rayPath.push(viewer);
    
    // Verify the path length invariant
    const virtualDistance = Math.hypot(
      viewer.x - virtualObject.position.x,
      viewer.y - virtualObject.position.y
    );
    
    let totalPathLength = 0;
    for (let i = 0; i < rayPath.length - 1; i++) {
      const segmentLength = Math.hypot(
        rayPath[i + 1].x - rayPath[i].x,
        rayPath[i + 1].y - rayPath[i].y
      );
      totalPathLength += segmentLength;
    }
    
    const difference = Math.abs(totalPathLength - virtualDistance);
    
    if (difference > 0.1) {
      console.error(`ERROR: Path length mismatch for ${virtualObject.id}!`);
      console.error(`Virtual distance: ${virtualDistance.toFixed(2)}, Actual path: ${totalPathLength.toFixed(2)}, Diff: ${difference.toFixed(2)}`);
    }
    
    return rayPath;
  }
  
  // Recursive function to build ray path
  private buildRayPathRecursive(
    startPoint: Point,      // Where the ray starts (initially real object)
    virtualPoint: Point,    // Current virtual position we're aiming for
    finalTarget: Point,     // The viewer position
    mirrors: boolean[],
    pathSoFar: Point[]      // Accumulator for the path
  ): void {
    // Add the starting point if this is the first call (path is empty)
    if (pathSoFar.length === 0) {
      pathSoFar.push(startPoint);
    }
    
    // Find all mirror crossings from virtual to final target
    const crossings = this.findAllMirrorCrossings(
      virtualPoint,
      finalTarget,
      mirrors
    );
    
    if (crossings.length === 0) {
      // Base case: no mirrors between virtual and target
      // The path is complete
      return;
    }
    
    // Get the crossing closest to the virtual point (first in sorted list)
    const closestCrossing = crossings[0];
    
    // Add the crossing point to the path
    pathSoFar.push(closestCrossing.point);
    
    // Reflect the virtual point across the mirror to get new virtual position
    const newVirtualPoint = this.reflectPointAcrossMirror(
      virtualPoint,
      closestCrossing.mirror,
      this.getMirrorPosition(closestCrossing.mirror, { x: 0, y: 0 })
    );
    
    // Recursively process from the crossing point to the final target
    // with the new virtual position
    this.buildRayPathRecursive(
      closestCrossing.point,  // New starting point is the crossing
      newVirtualPoint,        // New virtual position after reflection
      finalTarget,
      mirrors,
      pathSoFar
    );
  }
  
  // Find all points where a line crosses active mirrors
  private findAllMirrorCrossings(
    from: Point,
    to: Point,
    mirrors: boolean[]
  ): {point: Point, mirror: "top" | "right" | "bottom" | "left", t: number}[] {
    const crossings: {point: Point, mirror: "top" | "right" | "bottom" | "left", t: number}[] = [];
    
    // Check each active mirror
    const mirrorSides: ("top" | "right" | "bottom" | "left")[] = [];
    if (mirrors[0]) mirrorSides.push("top");
    if (mirrors[1]) mirrorSides.push("right");
    if (mirrors[2]) mirrorSides.push("bottom");
    if (mirrors[3]) mirrorSides.push("left");
    
    for (const mirrorSide of mirrorSides) {
      const intersection = this.findLineSegmentCrossing(from, to, mirrorSide);
      if (intersection) {
        crossings.push(intersection);
      }
    }
    
    // Sort by parameter t (distance along the line from 'from' to 'to')
    crossings.sort((a, b) => a.t - b.t);
    
    return crossings;
  }
  
  // Find where a line segment crosses a mirror (if at all)
  private findLineSegmentCrossing(
    from: Point,
    to: Point,
    mirrorSide: "top" | "right" | "bottom" | "left"
  ): {point: Point, mirror: typeof mirrorSide, t: number} | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    let t: number = -1;
    let point: Point | null = null;
    
    switch (mirrorSide) {
      case "top": // Mirror at y = 0
        if (Math.abs(dy) > 0.001) {
          t = (0 - from.y) / dy;
          if (t > 0.001 && t < 0.999) { // Small tolerance to avoid endpoint issues
            const x = from.x + t * dx;
            if (x >= 0 && x <= this.roomWidth) {
              point = { x, y: 0 };
            }
          }
        }
        break;
        
      case "right": // Mirror at x = roomWidth
        if (Math.abs(dx) > 0.001) {
          t = (this.roomWidth - from.x) / dx;
          if (t > 0.001 && t < 0.999) {
            const y = from.y + t * dy;
            if (y >= 0 && y <= this.roomHeight) {
              point = { x: this.roomWidth, y };
            }
          }
        }
        break;
        
      case "bottom": // Mirror at y = roomHeight
        if (Math.abs(dy) > 0.001) {
          t = (this.roomHeight - from.y) / dy;
          if (t > 0.001 && t < 0.999) {
            const x = from.x + t * dx;
            if (x >= 0 && x <= this.roomWidth) {
              point = { x, y: this.roomHeight };
            }
          }
        }
        break;
        
      case "left": // Mirror at x = 0
        if (Math.abs(dx) > 0.001) {
          t = (0 - from.x) / dx;
          if (t > 0.001 && t < 0.999) {
            const y = from.y + t * dy;
            if (y >= 0 && y <= this.roomHeight) {
              point = { x: 0, y };
            }
          }
        }
        break;
    }
    
    if (point) {
      return { point, mirror: mirrorSide, t };
    }
    
    return null;
  }
  
  // Find where a line segment intersects with a mirror, returning the intersection point and parameter t
  private findLineSegmentMirrorIntersection(
    from: Point,
    to: Point,
    mirrorSide: "top" | "right" | "bottom" | "left"
  ): {point: Point, mirror: typeof mirrorSide, t: number} | null {
    // Line parametric equation: P = from + t * (to - from)
    // t ∈ [0,1] represents points on the segment from 'from' to 'to'
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    let t: number = -1;
    let intersectionPoint: Point | null = null;
    
    switch (mirrorSide) {
      case "top": // Mirror at y = 0
        if (Math.abs(dy) < 0.001) return null; // Parallel
        t = (0 - from.y) / dy;
        if (t >= 0 && t <= 1) { // Include endpoints for now
          const x = from.x + t * dx;
          if (x >= 0 && x <= this.roomWidth) {
            intersectionPoint = { x, y: 0 };
          }
        }
        break;
        
      case "right": // Mirror at x = roomWidth
        if (Math.abs(dx) < 0.001) return null;
        t = (this.roomWidth - from.x) / dx;
        if (t >= 0 && t <= 1) {
          const y = from.y + t * dy;
          if (y >= 0 && y <= this.roomHeight) {
            intersectionPoint = { x: this.roomWidth, y };
          }
        }
        break;
        
      case "bottom": // Mirror at y = roomHeight
        if (Math.abs(dy) < 0.001) return null;
        t = (this.roomHeight - from.y) / dy;
        if (t >= 0 && t <= 1) {
          const x = from.x + t * dx;
          if (x >= 0 && x <= this.roomWidth) {
            intersectionPoint = { x, y: this.roomHeight };
          }
        }
        break;
        
      case "left": // Mirror at x = 0
        if (Math.abs(dx) < 0.001) return null;
        t = (0 - from.x) / dx;
        if (t >= 0 && t <= 1) {
          const y = from.y + t * dy;
          if (y >= 0 && y <= this.roomHeight) {
            intersectionPoint = { x: 0, y };
          }
        }
        break;
    }
    
    if (intersectionPoint && t > 0.001 && t < 0.999) { // Exclude endpoints with small tolerance
      return { point: intersectionPoint, mirror: mirrorSide, t };
    }
    
    return null;
  }
  
  // Check if a point is within the room bounds
  private isPointInRoom(p: Point): boolean {
    return p.x >= 0 && p.x <= this.roomWidth && p.y >= 0 && p.y <= this.roomHeight;
  }
  
  // Find where a ray hits a specific mirror
  private findRayMirrorIntersection(
    from: Point,
    to: Point,
    mirrorSide: "top" | "right" | "bottom" | "left"
  ): Point | null {
    // Line equation: P = from + t * (to - from)
    // We solve for t when the line crosses the mirror
    // t can be any value to handle rays from virtual objects outside the room
    
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    switch (mirrorSide) {
      case "top": // Mirror at y = 0
        if (Math.abs(dy) < 0.001) return null; // Parallel
        const t_top = (0 - from.y) / dy;
        // We want the intersection regardless of direction for virtual->viewer lines
        const x_top = from.x + t_top * dx;
        if (x_top >= 0 && x_top <= this.roomWidth) {
          return { x: x_top, y: 0 };
        }
        break;
        
      case "right": // Mirror at x = roomWidth
        if (Math.abs(dx) < 0.001) return null;
        const t_right = (this.roomWidth - from.x) / dx;
        const y_right = from.y + t_right * dy;
        if (y_right >= 0 && y_right <= this.roomHeight) {
          return { x: this.roomWidth, y: y_right };
        }
        break;
        
      case "bottom": // Mirror at y = roomHeight
        if (Math.abs(dy) < 0.001) return null;
        const t_bottom = (this.roomHeight - from.y) / dy;
        const x_bottom = from.x + t_bottom * dx;
        if (x_bottom >= 0 && x_bottom <= this.roomWidth) {
          return { x: x_bottom, y: this.roomHeight };
        }
        break;
        
      case "left": // Mirror at x = 0
        if (Math.abs(dx) < 0.001) return null;
        const t_left = (0 - from.x) / dx;
        const y_left = from.y + t_left * dy;
        if (y_left >= 0 && y_left <= this.roomHeight) {
          return { x: 0, y: y_left };
        }
        break;
    }
    
    return null;
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
}

