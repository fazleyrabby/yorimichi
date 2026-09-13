import * as THREE from 'three';
import { World } from '../world/World';

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: World;
  private size: number = 180;

  constructor(container: HTMLElement, world: World) {
    this.world = world;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'aoe-minimap-canvas';
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d')!;
    container.appendChild(this.canvas);
  }

  public update(playerPos: THREE.Vector3, playerRotY: number): void {
    const ctx = this.ctx;
    const w = this.size;
    const h = this.size;

    ctx.clearRect(0, 0, w, h);

    // Save for diamond rotation (45 degrees isometric diamond)
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.scale(0.85, 0.85);

    // Map bounds: -70 to 70 in world coordinates
    const mapExtent = 75;
    const toMapCoord = (val: number) => (val / mapExtent) * (w / 2);

    // 1. Terrain Base (Lush Green Meadow)
    ctx.fillStyle = '#2d4a2d';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // 2. River Stream (Blue ribbon)
    ctx.fillStyle = '#2a5a68';
    ctx.strokeStyle = '#38788a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(toMapCoord(0), toMapCoord(-70));
    ctx.quadraticCurveTo(toMapCoord(6), toMapCoord(-15), toMapCoord(0), toMapCoord(0));
    ctx.quadraticCurveTo(toMapCoord(-8), toMapCoord(25), toMapCoord(-15), toMapCoord(70));
    ctx.stroke();

    // 3. Lake (Water body)
    ctx.beginPath();
    ctx.ellipse(toMapCoord(0), toMapCoord(-40), toMapCoord(20), toMapCoord(14), 0, 0, Math.PI * 2);
    ctx.fillStyle = '#214e5b';
    ctx.fill();

    // 4. Roads (Lowland paths & Grand Mountain Cycling Circuit)
    ctx.strokeStyle = '#998660';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Lowland village paths
    ctx.moveTo(toMapCoord(-20), toMapCoord(-14));
    ctx.lineTo(toMapCoord(2), toMapCoord(10));
    ctx.lineTo(toMapCoord(21), toMapCoord(-2));
    ctx.lineTo(toMapCoord(28), toMapCoord(-10));
    ctx.moveTo(toMapCoord(16), toMapCoord(2));
    ctx.lineTo(toMapCoord(25), toMapCoord(39));

    // West Ridge Cycling Ascent
    ctx.moveTo(toMapCoord(-4), toMapCoord(10));
    ctx.quadraticCurveTo(toMapCoord(-36), toMapCoord(16), toMapCoord(-52), toMapCoord(6));
    ctx.quadraticCurveTo(toMapCoord(-58), toMapCoord(-16), toMapCoord(-50), toMapCoord(-32));
    ctx.quadraticCurveTo(toMapCoord(-32), toMapCoord(-45), toMapCoord(-8), toMapCoord(-47));

    // East Ridge Cycling Descent
    ctx.moveTo(toMapCoord(-8), toMapCoord(-47));
    ctx.quadraticCurveTo(toMapCoord(24), toMapCoord(-46), toMapCoord(44), toMapCoord(-34));
    ctx.quadraticCurveTo(toMapCoord(54), toMapCoord(-14), toMapCoord(46), toMapCoord(8));
    ctx.quadraticCurveTo(toMapCoord(34), toMapCoord(20), toMapCoord(19), toMapCoord(18));
    ctx.stroke();

    // 5. Landmarks Markers
    // Summit Viewpoint Deck (Cyan / gold beacon atop waterfall bluff)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(toMapCoord(-8), toMapCoord(-47), 5.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shrine / Torii
    ctx.fillStyle = '#d13c29';
    ctx.beginPath();
    ctx.arc(toMapCoord(-20), toMapCoord(-14), 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Watermill
    ctx.fillStyle = '#a68052';
    ctx.beginPath();
    ctx.arc(toMapCoord(4.5), toMapCoord(-8), 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Parked Bicycle Beacon (Prominent glowing beacon & icon)
    if (this.world.isBicycleParked) {
      const bx = toMapCoord(this.world.bicyclePosition.x);
      const bz = toMapCoord(this.world.bicyclePosition.z);
      
      // Outer pulsing aura
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.65)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(bx, bz, 8.5, 0, Math.PI * 2);
      ctx.stroke();

      // Inner solid emerald badge
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(bx, bz, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Bike emoji tag above marker
      ctx.save();
      ctx.rotate(Math.PI / 4); // un-rotate text for upright readability
      ctx.restore();
    }

    // 7. Player Indicator (Bright Gold Pip with Viewing Cone)
    const px = toMapCoord(playerPos.x);
    const pz = toMapCoord(playerPos.z);

    // Player pulse circle
    ctx.fillStyle = '#ffdf6d';
    ctx.beginPath();
    ctx.arc(px, pz, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Player facing direction arrow
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(playerRotY);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-3, 0);
    ctx.lineTo(3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}
