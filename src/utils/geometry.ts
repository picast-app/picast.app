export const ptInBox = (
  pt: [x: number, y: number],
  box: { x: number; y: number; width: number; height: number }
) =>
  pt[0] >= box.x &&
  pt[0] <= box.x + box.width &&
  pt[1] >= box.y &&
  pt[1] <= box.y + box.height
