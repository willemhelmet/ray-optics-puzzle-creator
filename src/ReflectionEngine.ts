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
      // top
      virtualRooms.push({
        position: { x: 0, y: -this.roomHeight },
        mirrors: _mirrors as [boolean, boolean, boolean, boolean],
        depth: 1,
        opacity: 0.7,
      });
    }
    if (_mirrors[1]) {
      // right
      virtualRooms.push({
        position: { x: this.roomWidth, y: 0 },
        mirrors: _mirrors as [boolean, boolean, boolean, boolean],
        depth: 1,
        opacity: 0.7,
      });
    }
    if (_mirrors[2]) {
      // bottom
      virtualRooms.push({
        position: { x: 0, y: this.roomHeight },
        mirrors: _mirrors as [boolean, boolean, boolean, boolean],
        depth: 1,
        opacity: 0.7,
      });
    }
    if (_mirrors[3]) {
      // left
      virtualRooms.push({
        position: { x: -this.roomWidth, y: 0 },
        mirrors: _mirrors as [boolean, boolean, boolean, boolean],
        depth: 1,
        opacity: 0.7,
      });
    }

    // Step 2: For each virtual room, calculate object reflections
    console.log("Virtual rooms created:", virtualRooms.length);
    virtualRooms.forEach((room) => {

      // Determine which mirror created this room based on position
      let mirrorSide: "top" | "right" | "bottom" | "left";
      if (room.position.y < 0) mirrorSide = "top";
      else if (room.position.x > 0) mirrorSide = "right";
      else if (room.position.y > 0) mirrorSide = "bottom";
      else mirrorSide = "left";

      console.log("Processing room at", room.position, "mirror side:", mirrorSide);
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

    // For now, limiting to depth 1 for the skeleton
    // TODO: Implement depth 2+ reflections

    console.log("Returning virtualObjects:", virtualObjects);
    console.log("Returning virtualRooms:", virtualRooms);
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
    mirrorPosition?: number,
    baseFlips?: { flippedX: boolean; flippedY: boolean },
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
    _mirrors: boolean[],
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
      // TODO: Implement multiple bounce calculation
      // For now, just draw direct line
    }

    // End at viewer position
    path.push(viewer);

    return path;
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

