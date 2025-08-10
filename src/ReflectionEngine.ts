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

    if (_mirrors[0]) {
      // top mirror
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

    if (_mirrors[1]) {
      // right mirror
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

    if (_mirrors[2]) {
      // bottom mirror
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

    if (_mirrors[3]) {
      // left mirror
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
      const prevDepthRooms = virtualRooms.filter(
        (r) => r.depth === currentDepth - 1,
      );
      const prevDepthObjects = virtualObjects.filter(
        (o) => o.depth === currentDepth - 1,
      );

      // Use a Set to track unique room positions and avoid duplicates
      const roomPositionSet = new Set<string>();
      virtualRooms.forEach((room) => {
        roomPositionSet.add(`${room.position.x},${room.position.y}`);
      });

      // For each previous depth room, reflect it across each active mirror
      prevDepthRooms.forEach((prevRoom) => {
        // Check each mirror in the base room
        if (_mirrors[0]) {
          // top mirror
          const newRoomY = -prevRoom.position.y - this.roomHeight;
          const posKey = `${prevRoom.position.x},${newRoomY}`;
          if (!roomPositionSet.has(posKey)) {
            roomPositionSet.add(posKey);
            // Flip top/bottom mirrors when reflecting across top
            const newMirrors: [boolean, boolean, boolean, boolean] = [
              prevRoom.mirrors[2], // top becomes bottom
              prevRoom.mirrors[1], // right stays
              prevRoom.mirrors[0], // bottom becomes top
              prevRoom.mirrors[3], // left stays
            ];
            virtualRooms.push({
              position: { x: prevRoom.position.x, y: newRoomY },
              mirrors: newMirrors,
              depth: currentDepth,
              opacity: 1.0 - currentDepth * 0.3,
            });
          }
        }

        if (_mirrors[1]) {
          // right mirror
          const newRoomX = 2 * this.roomWidth - prevRoom.position.x;
          const posKey = `${newRoomX},${prevRoom.position.y}`;
          if (!roomPositionSet.has(posKey)) {
            roomPositionSet.add(posKey);
            // Flip left/right mirrors when reflecting across right
            const newMirrors: [boolean, boolean, boolean, boolean] = [
              prevRoom.mirrors[0], // top stays
              prevRoom.mirrors[3], // right becomes left
              prevRoom.mirrors[2], // bottom stays
              prevRoom.mirrors[1], // left becomes right
            ];
            virtualRooms.push({
              position: { x: newRoomX, y: prevRoom.position.y },
              mirrors: newMirrors,
              depth: currentDepth,
              opacity: 1.0 - currentDepth * 0.3,
            });
          }
        }

        if (_mirrors[2]) {
          // bottom mirror
          const newRoomY = 2 * this.roomHeight - prevRoom.position.y;
          const posKey = `${prevRoom.position.x},${newRoomY}`;
          if (!roomPositionSet.has(posKey)) {
            roomPositionSet.add(posKey);
            // Flip top/bottom mirrors when reflecting across bottom
            const newMirrors: [boolean, boolean, boolean, boolean] = [
              prevRoom.mirrors[2], // top becomes bottom
              prevRoom.mirrors[1], // right stays
              prevRoom.mirrors[0], // bottom becomes top
              prevRoom.mirrors[3], // left stays
            ];
            virtualRooms.push({
              position: { x: prevRoom.position.x, y: newRoomY },
              mirrors: newMirrors,
              depth: currentDepth,
              opacity: 1.0 - currentDepth * 0.3,
            });
          }
        }

        if (_mirrors[3]) {
          // left mirror
          const newRoomX = -prevRoom.position.x - this.roomWidth;
          const posKey = `${newRoomX},${prevRoom.position.y}`;
          if (!roomPositionSet.has(posKey)) {
            roomPositionSet.add(posKey);
            // Flip left/right mirrors when reflecting across left
            const newMirrors: [boolean, boolean, boolean, boolean] = [
              prevRoom.mirrors[0], // top stays
              prevRoom.mirrors[3], // right becomes left
              prevRoom.mirrors[2], // bottom stays
              prevRoom.mirrors[1], // left becomes right
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
      prevDepthObjects.forEach((prevObj) => {
        if (_mirrors[0]) {
          // top mirror
          const reflected = this.reflectAcrossMirror(
            prevObj.position,
            prevObj.sourceType,
            "top",
            currentDepth,
            0,
            { flippedX: prevObj.flippedX, flippedY: prevObj.flippedY },
          );
          reflected.id = `${prevObj.sourceType}-d${currentDepth}-${prevObj.id.split("-").slice(2).join("-")}-top`;
          virtualObjects.push(reflected);
        }

        if (_mirrors[1]) {
          // right mirror
          const reflected = this.reflectAcrossMirror(
            prevObj.position,
            prevObj.sourceType,
            "right",
            currentDepth,
            this.roomWidth,
            { flippedX: prevObj.flippedX, flippedY: prevObj.flippedY },
          );
          reflected.id = `${prevObj.sourceType}-d${currentDepth}-${prevObj.id.split("-").slice(2).join("-")}-right`;
          virtualObjects.push(reflected);
        }

        if (_mirrors[2]) {
          // bottom mirror
          const reflected = this.reflectAcrossMirror(
            prevObj.position,
            prevObj.sourceType,
            "bottom",
            currentDepth,
            this.roomHeight,
            { flippedX: prevObj.flippedX, flippedY: prevObj.flippedY },
          );
          reflected.id = `${prevObj.sourceType}-d${currentDepth}-${prevObj.id.split("-").slice(2).join("-")}-bottom`;
          virtualObjects.push(reflected);
        }

        if (_mirrors[3]) {
          // left mirror
          const reflected = this.reflectAcrossMirror(
            prevObj.position,
            prevObj.sourceType,
            "left",
            currentDepth,
            0,
            { flippedX: prevObj.flippedX, flippedY: prevObj.flippedY },
          );
          reflected.id = `${prevObj.sourceType}-d${currentDepth}-${prevObj.id.split("-").slice(2).join("-")}-left`;
          virtualObjects.push(reflected);
        }
      });
    }

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
    _mirrorPosition: number,
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
    // For depth-0 (real object), just return direct path
    if (virtualObject.depth === 0) {
      return [realObjectPos, viewer];
    }

    // Build the ray path working backwards from virtual to real
    const rayPath: Point[] = [];
    
    // We'll work backwards: virtual object -> viewer, finding mirror bounces
    const mirrorBounces: Point[] = [];
    
    // Start the recursive path building from virtual object to viewer
    this.buildRayPathRecursive(
      virtualObject.position,
      viewer,
      viewer,
      mirrors,
      mirrorBounces,
    );
    
    // Build final path: real object -> mirror bounces -> viewer
    rayPath.push(realObjectPos);
    
    // Add mirror bounces in reverse order (since we found them backwards)
    for (let i = mirrorBounces.length - 1; i >= 0; i--) {
      rayPath.push(mirrorBounces[i]);
    }
    
    rayPath.push(viewer);

    return rayPath;
  }

  // Recursive function to build ray path (working backwards from virtual to real)
  private buildRayPathRecursive(
    currentStart: Point, // Current segment start (initially virtual object position)
    currentEnd: Point, // Current segment end (initially viewer position)
    viewer: Point, // Original viewer position (kept for reference)
    mirrors: boolean[],
    bouncesFound: Point[], // Accumulator for mirror bounce points
  ): void {
    // Find mirror crossings between current start and end
    const crossings = this.findAllMirrorCrossings(
      currentStart,
      currentEnd,
      mirrors,
    );
    
    console.log('Segment from', currentStart, 'to', currentEnd);
    console.log('Found', crossings.length, 'crossings:', crossings);

    if (crossings.length === 0) {
      // Base case: no mirrors between these points
      // We've traced back to a segment that goes directly to the real object
      console.log('No more crossings - reached real object segment');
      return;
    }

    // Get the mirror crossing FURTHEST from currentStart (closest to currentEnd)
    // This is the last crossing in our sorted array (sorted by t parameter)
    const lastCrossing = crossings[crossings.length - 1];
    console.log('Last crossing (closest to end) at:', lastCrossing.point, 'on', lastCrossing.mirror);

    // Add this crossing point to our bounces
    bouncesFound.push(lastCrossing.point);

    // To continue backwards, we need to "unfold" the reflection
    // The segment from currentStart to lastCrossing.point needs to be reflected
    // across the mirror to find where it came from
    
    // Calculate the remaining segment length (from start to crossing)
    const segmentToMirror = {
      x: lastCrossing.point.x - currentStart.x,
      y: lastCrossing.point.y - currentStart.y
    };
    
    // Reflect this segment across the mirror to get the incoming ray direction
    let incomingSegment = { ...segmentToMirror };
    switch (lastCrossing.mirror) {
      case "top":
      case "bottom":
        // Horizontal mirror - flip Y component
        incomingSegment.y = -incomingSegment.y;
        break;
      case "left":  
      case "right":
        // Vertical mirror - flip X component
        incomingSegment.x = -incomingSegment.x;
        break;
    }
    
    // The new segment starts at the mirror and extends in the reflected direction
    const newStart = {
      x: lastCrossing.point.x - incomingSegment.x,
      y: lastCrossing.point.y - incomingSegment.y
    };

    // Recursively continue with the reflected segment
    this.buildRayPathRecursive(
      newStart, // New start is the reflected position
      lastCrossing.point, // New end is the mirror crossing
      viewer,
      mirrors,
      bouncesFound,
    );
  }

  // Find all points where a line crosses active mirrors
  private findAllMirrorCrossings(
    from: Point,
    to: Point,
    mirrors: boolean[],
  ): {
    point: Point;
    mirror: "top" | "right" | "bottom" | "left";
    t: number;
  }[] {
    const crossings: {
      point: Point;
      mirror: "top" | "right" | "bottom" | "left";
      t: number;
    }[] = [];

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
    mirrorSide: "top" | "right" | "bottom" | "left",
  ): { point: Point; mirror: typeof mirrorSide; t: number } | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    let t: number = -1;
    let point: Point | null = null;

    switch (mirrorSide) {
      case "top": // Mirror at y = 0
        if (Math.abs(dy) > 0.001) {
          t = (0 - from.y) / dy;
          if (t > 0.001 && t < 0.999) {
            // Small tolerance to avoid endpoint issues
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

}
