// Keyboard and mouse input: WASD or arrows to move, Shift to sneak,
// Q for smoke, E for EMP, mouse click to toss a coin, P to pause,
// M to mute, Enter to start, R to restart after a win or a catch.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseInRoom = false;
    this.clickQueue = []; // room-space clicks, consumed once each
    this.pressedQueue = []; // keys pressed since last read, consumed once each
    this.attach();
  }

  attach() {
    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.pressedQueue.push(key);
      }
      this.keys.add(key);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener('blur', () => this.keys.clear());
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (event.clientX - rect.left) * scaleX;
      this.mouseY = (event.clientY - rect.top) * scaleY;
      this.mouseInRoom = true;
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mouseInRoom = false;
    });
    this.canvas.addEventListener('mousedown', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.clickQueue.push({
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      });
      event.preventDefault();
    });
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  get moveX() {
    let x = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    return x;
  }

  get moveY() {
    let y = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    return y;
  }

  get sneaking() {
    return this.keys.has('shift');
  }

  consumeClicks() {
    const clicks = this.clickQueue;
    this.clickQueue = [];
    return clicks;
  }

  consumePressed() {
    const pressed = this.pressedQueue;
    this.pressedQueue = [];
    return pressed;
  }
}
