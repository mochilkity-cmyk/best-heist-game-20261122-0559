// Geometry helpers for the heist: cones, sight lines and collisions.
// Everything here is pure math on room coordinates (x right, y down).

export function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

export function distance(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

// Shortest signed difference between two angles, in (-PI, PI].
export function angleDifference(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// True when (px, py) sits inside the cone that starts at (ox, oy),
// faces `facing` radians, opens `halfAngle` each side and reaches `range`.
export function pointInVisionCone(px, py, ox, oy, facing, halfAngle, range) {
  const d = distance(px, py, ox, oy);
  if (d > range) return false;
  if (d < 1) return true;
  const toTarget = Math.atan2(py - oy, px - ox);
  return Math.abs(angleDifference(facing, toTarget)) <= halfAngle;
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

// Orientation test for segment intersection.
function orientation(ax, ay, bx, by, cx, cy) {
  const v = (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
  if (v === 0) return 0;
  return v > 0 ? 1 : 2;
}

function onSegment(ax, ay, bx, by, cx, cy) {
  return bx <= Math.max(ax, cx) && bx >= Math.min(ax, cx) &&
    by <= Math.max(ay, cy) && by >= Math.min(ay, cy);
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const o1 = orientation(ax, ay, bx, by, cx, cy);
  const o2 = orientation(ax, ay, bx, by, dx, dy);
  const o3 = orientation(cx, cy, dx, dy, ax, ay);
  const o4 = orientation(cx, cy, dx, dy, bx, by);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(ax, ay, cx, cy, bx, by)) return true;
  if (o2 === 0 && onSegment(ax, ay, dx, dy, bx, by)) return true;
  if (o3 === 0 && onSegment(cx, cy, ax, ay, dx, dy)) return true;
  if (o4 === 0 && onSegment(cx, cy, bx, by, dx, dy)) return true;
  return false;
}

// True when the segment from (x1, y1) to (x2, y2) touches the rectangle.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
  const rx = rect.x;
  const ry = rect.y;
  const rw = rect.x + rect.w;
  const rh = rect.y + rect.h;
  return segmentsCross(x1, y1, x2, y2, rx, ry, rw, ry) ||
    segmentsCross(x1, y1, x2, y2, rw, ry, rw, rh) ||
    segmentsCross(x1, y1, x2, y2, rw, rh, rx, rh) ||
    segmentsCross(x1, y1, x2, y2, rx, rh, rx, ry);
}

// True when the segment from (x1, y1) to (x2, y2) passes through the circle.
export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const nearX = x1 + t * dx;
  const nearY = y1 + t * dy;
  return distance(nearX, nearY, cx, cy) <= radius;
}

// Push a circle out of a rectangle it overlaps. Returns true when pushed.
export function pushCircleOutOfRect(circle, rect) {
  const nearX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - nearX;
  const dy = circle.y - nearY;
  const dSq = dx * dx + dy * dy;
  if (dSq >= circle.r * circle.r) return false;
  if (dSq === 0) {
    // Centre is inside the rectangle: push out along the shallowest side.
    const left = circle.x - rect.x;
    const right = rect.x + rect.w - circle.x;
    const top = circle.y - rect.y;
    const bottom = rect.y + rect.h - circle.y;
    const min = Math.min(left, right, top, bottom);
    if (min === left) circle.x = rect.x - circle.r;
    else if (min === right) circle.x = rect.x + rect.w + circle.r;
    else if (min === top) circle.y = rect.y - circle.r;
    else circle.y = rect.y + rect.h + circle.r;
    return true;
  }
  const d = Math.sqrt(dSq);
  circle.x = nearX + (dx / d) * circle.r;
  circle.y = nearY + (dy / d) * circle.r;
  return true;
}
