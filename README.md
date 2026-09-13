# 寄り道 (Yorimichi)

A peaceful, stylized 3D Japanese countryside exploration game built with **Three.js**, **TypeScript**, and **Vite**.

## ✨ Features
- **Stylized Ghibli Aesthetic**: Painterly textures, soft cel-shading contours, and atmospheric depth.
- **Dynamic Day & Night Cycle**: Smooth celestial transitions between morning sun and silver-blue moonlight with twinkling stars, glowing stone lanterns (*tōrō*), and drifting fireflies (*Hotaru*).
- **Subtle Water Dynamics**: Trochoidal wave displacement, backlit subsurface scattering, dual-power specular glints, and an unbroken multi-tiered waterfall gorge with a summit overlook deck.
- **Interactive Character**: Chibi traveler with bicycle riding, bench resting, dynamic camera modes (Isometric & 3rd Person), and footstep sounds.
- **Procedural Soundscape**: Web Audio API ambient audio featuring spatial water, morning birds, evening crickets (*Suzumushi*), and wind.

## 🎮 Controls
| Key / Action | Description |
| :--- | :--- |
| **W, A, S, D** / Arrow Keys | Move character |
| **Shift** | Sprint |
| **E** | Interact (Mount/Dismount Bicycle, Sit on Bench) |
| **C** | Toggle Camera Mode (Isometric ↔ 3rd Person) |
| **N** / Header Button | Toggle Day ↔ Night Mode |
| **M** / Header Button | Toggle Audio Mute |

## 🛠️ Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 📖 Documentation
Detailed architectural and artistic guidelines are preserved in the [`docs/`](./docs) directory:
- [Art Direction Bible](./docs/ART_DIRECTION.md)
- [Technical Architecture](./docs/ARCHITECTURE.md)
- [Architecture Decisions](./docs/DECISIONS.md)
