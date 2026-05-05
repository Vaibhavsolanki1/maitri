class NeuralBackground {
  constructor(container, options = {}) {
    this.container = container;

    this.color = options.color || "#6366f1";
    this.trailOpacity = options.trailOpacity || 0.15;
    this.particleCount = options.particleCount || 600;
    this.speed = options.speed || 1;

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.container.appendChild(this.canvas);

    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.particles = [];
    this.mouse = { x: -1000, y: -1000 };

    this.init();
    this.animate();

    window.addEventListener("resize", this.handleResize.bind(this));
    this.container.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.container.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
  }

  init() {
    const dpr = window.devicePixelRatio || 1;

    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.particles = [];

    for (let i = 0; i < this.particleCount; i += 1) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: 0,
      vy: 0,
      age: 0,
      life: Math.random() * 200 + 100
    };
  }

  updateParticle(p) {
    const angle = (Math.cos(p.x * 0.005) + Math.sin(p.y * 0.005)) * Math.PI;

    p.vx += Math.cos(angle) * 0.2 * this.speed;
    p.vy += Math.sin(angle) * 0.2 * this.speed;

    const dx = this.mouse.x - p.x;
    const dy = this.mouse.y - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = 150;

    if (distance < radius) {
      const force = (radius - distance) / radius;
      p.vx -= dx * force * 0.05;
      p.vy -= dy * force * 0.05;
    }

    p.x += p.vx;
    p.y += p.vy;

    p.vx *= 0.95;
    p.vy *= 0.95;

    p.age += 1;

    if (p.age > p.life) {
      Object.assign(p, this.createParticle());
    }

    if (p.x < 0) p.x = this.width;
    if (p.x > this.width) p.x = 0;
    if (p.y < 0) p.y = this.height;
    if (p.y > this.height) p.y = 0;
  }

  drawParticle(p) {
    const alpha = 1 - Math.abs(p.age / p.life - 0.5) * 2;

    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(p.x, p.y, 1.5, 1.5);
  }

  animate() {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${this.trailOpacity})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach((p) => {
      this.updateParticle(p);
      this.drawParticle(p);
    });

    requestAnimationFrame(this.animate.bind(this));
  }

  handleResize() {
    this.init();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  handleMouseLeave() {
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }
}
