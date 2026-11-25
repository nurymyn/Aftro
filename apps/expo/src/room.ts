export type Finish = 'before' | 'warm' | 'light';
export type Dimensions = { width: number; length: number; height: number };
export type Room = Dimensions & { source: 'camera' | 'manual'; finish: Finish };
export type Vector = { x: number; y: number; z: number };
export type Point = { x: number; z: number };

export const sampleRoom: Dimensions = { width: 4.5, length: 3.6, height: 2.8 };
export const meter = (value: number) => Math.round(value * 100) / 100;

function dot(a: Vector, b: Vector) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function scale(v: Vector, factor: number): Vector {
  return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}

export function subtract(a: Vector, b: Vector): Vector {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function unit(v: Vector): Vector | null {
  const length = Math.hypot(v.x, v.y, v.z);
  return Number.isFinite(length) && length > 0.001 ? scale(v, 1 / length) : null;
}

export function floorPoint(gravity: Vector, magneticField: Vector, phoneHeight: number): Point | null {
  const up = unit(scale(gravity, -1));
  if (!up || !Number.isFinite(phoneHeight)) return null;
  // The rear camera points along the negative Z axis of the device.
  const downward = up.z;
  if (downward < 0.18 || downward > 0.97) return null;
  const horizontalField = subtract(magneticField, scale(up, dot(magneticField, up)));
  if (Math.hypot(horizontalField.x, horizontalField.y, horizontalField.z) < 5) return null;
  const north = unit(horizontalField);
  if (!north) return null;
  const distance = phoneHeight / downward;
  const eastZ = north.x * up.y - north.y * up.x;
  return { x: -eastZ * distance, z: -north.z * distance };
}

export function estimateRoom(a: Point, b: Point, c: Point): Pick<Dimensions, 'width' | 'length'> | null {
  const ab = { x: b.x - a.x, z: b.z - a.z };
  const bc = { x: c.x - b.x, z: c.z - b.z };
  const width = Math.hypot(ab.x, ab.z);
  const length = Math.hypot(bc.x, bc.z);
  if (!validEdge(width) || !validEdge(length)) return null;
  const angle = Math.abs((ab.x * bc.x + ab.z * bc.z) / (width * length));
  if (angle > 0.35) return null;
  return { width: meter(width), length: meter(length) };
}

function validEdge(value: number) {
  return Number.isFinite(value) && value >= 0.8 && value <= 20;
}

export function parseMeasurement(value: string, min: number, max: number): number | null {
  const reading = value.trim().replace(',', '.');
  if (!/^\d{1,2}(\.\d{1,3})?$/.test(reading)) return null;
  const meters = Number(reading);
  return meters >= min && meters <= max ? meter(meters) : null;
}

export function roomQuantities({ width, length, height }: Dimensions) {
  const floor = width * length;
  return { floor, wall: 2 * (width + length) * height, order: floor * 1.1 };
}
