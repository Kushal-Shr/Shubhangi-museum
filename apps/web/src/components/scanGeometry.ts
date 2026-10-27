import { BufferAttribute, BufferGeometry, Mesh, Plane, Vector3, type Object3D } from "three";

/** Remove the ground captured with a static scan, without editing cached geometry.
 * The plane is measured in the original scene coordinates, before normalization.
 */
export function removeScanGround(model: Object3D, coefficients: [number, number, number, number]) {
  const plane = new Plane(new Vector3(coefficients[0], coefficients[1], coefficients[2]), coefficients[3]);
  const point = new Vector3();
  model.updateMatrixWorld(true);
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const source: BufferGeometry = object.geometry;
    const position = source.getAttribute("position");
    const above = Array.from({ length: position.count }, (_, i) =>
      plane.distanceToPoint(point.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld)) >= 0,
    );
    const vertices: number[] = [];
    const count = source.index?.count ?? position.count;
    for (let i = 0; i < count; i += 3) {
      const a = source.index?.getX(i) ?? i;
      const b = source.index?.getX(i + 1) ?? i + 1;
      const c = source.index?.getX(i + 2) ?? i + 2;
      if (above[a] && above[b] && above[c]) vertices.push(a, b, c);
    }
    const geometry = new BufferGeometry();
    for (const [name, attribute] of Object.entries(source.attributes)) {
      const values = new Float32Array(vertices.length * attribute.itemSize);
      vertices.forEach((index, i) => {
        for (let component = 0; component < attribute.itemSize; component++)
          values[i * attribute.itemSize + component] = attribute.getComponent(index, component);
      });
      geometry.setAttribute(name, new BufferAttribute(values, attribute.itemSize));
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    object.geometry = geometry;
  });
}
