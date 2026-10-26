// Marco del modelo. La anatomía se escribe en RAS (mm, origen en la comisura anterior: +x derecha, +y delante, +z arriba).
// El mundo del kit es RAS reflejado en x (la proyección del kit es especular) y elevado LIFT sobre la peana.
export const LIFT = 158;
export const W = ([x, y, z]) => [-x, y, z + LIFT];
export const Wd = ([x, y, z]) => [-x, y, z];
export const R = ([x, y, z]) => [-x, y, z - LIFT];
