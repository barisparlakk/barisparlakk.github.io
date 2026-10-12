// Bird's-eye sketch of Seyir's perception loop: a road scrolling under the ego
// car, every road user detected with a class, a confidence and a few possible
// futures, plus an occupancy grid around the ego car. The visitor's pointer is
// tracked as a person.
(function () {
  const stage = document.querySelector(".stage");
  const canvas = document.getElementById("scene");
  const zone = document.querySelector(".road-zone");
  if (!stage || !canvas || !zone || !canvas.getContext) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const COLOR = {
    grid: "rgba(233, 236, 238, 0.045)",
    occupied: "rgba(233, 236, 238, 0.11)",
    sidewalk: "rgba(233, 236, 238, 0.035)",
    dash: "rgba(233, 236, 238, 0.5)",
    edge: "rgba(233, 236, 238, 0.7)",
    centre: "#f2c230",
    body: "#3d4751",
    roof: "#4c5762",
    ego: "#e9ecee",
    labelText: "#20262c",
    person: "#ff4b4b",
    car: "#f2c230",
    dolmus: "#5cc8f0",
    motorcycle: "#5cc8f0",
  };

  // Sizes are for a 30 px lane and scale with the real lane height.
  const TYPES = {
    car: { w: 44, h: 19, label: "car" },
    dolmus: { w: 56, h: 21, label: "dolmuş" },
    motorcycle: { w: 21, h: 8, label: "motorcycle" },
  };

  const EGO_SPEED = 95;
  const EGO_LANE = 3;

  let width = 0;
  let height = 0;
  let road = { top: 0, height: 0, sidewalk: 0, lane: 30 };
  let scale = 1;
  let worldX = 0;
  let time = 0;
  let agents = [];
  let walkers = [];
  let running = false;
  let visible = true;
  let lastFrame = 0;
  let mpcMs = 41;

  const pointer = { x: 0, y: 0, vx: 0, vy: 0, seen: -10, active: false, conf: 0.93 };

  const random = (min, max) => min + Math.random() * (max - min);
  const pick = (weights) => {
    let roll = Math.random();
    for (const [key, weight] of weights) {
      roll -= weight;
      if (roll <= 0) {
        return key;
      }
    }
    return weights[0][0];
  };

  function laneY(lane) {
    return road.top + road.sidewalk + road.lane * (lane + 0.5);
  }

  function laneDirection(lane) {
    return lane < 2 ? -1 : 1;
  }

  function makeAgent(lane, x) {
    const type = pick([["car", 0.6], ["dolmus", 0.25], ["motorcycle", 0.15]]);
    const dir = laneDirection(lane);
    const speed = dir < 0 ? random(-135, -100) : random(118, 150);
    return {
      lane,
      type,
      x,
      speed,
      conf: random(0.82, 0.97),
      phase: random(0, Math.PI * 2),
      straight: random(0.62, 0.86),
    };
  }

  function makeWalker(side, x) {
    return {
      side,
      x,
      speed: random(-28, 28),
      conf: random(0.78, 0.95),
      phase: random(0, Math.PI * 2),
      stride: random(0, Math.PI * 2),
    };
  }

  function populate() {
    agents = [];
    const perLane = 2;
    [0, 1, 2].forEach((lane) => {
      for (let i = 0; i < perLane; i += 1) {
        const slot = width / perLane;
        agents.push(makeAgent(lane, slot * i + random(0.1, 0.8) * slot));
      }
    });
    walkers = [];
    const walkerCount = width < 640 ? 2 : 4;
    for (let i = 0; i < walkerCount; i += 1) {
      walkers.push(makeWalker(i % 2, random(0, width)));
    }
  }

  function measure() {
    const stageRect = stage.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();
    const oldWidth = width || stageRect.width;

    width = stageRect.width;
    height = stageRect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const roadHeight = zoneRect.height;
    const sidewalk = roadHeight * 0.15;
    road = {
      top: zoneRect.top - stageRect.top,
      height: roadHeight,
      sidewalk,
      lane: (roadHeight - sidewalk * 2) / 4,
    };
    scale = road.lane / 30;

    if (!agents.length) {
      populate();
    } else {
      const ratio = width / oldWidth;
      agents.forEach((agent) => {
        agent.x *= ratio;
      });
      walkers.forEach((walker) => {
        walker.x *= ratio;
      });
    }
  }

  function egoX() {
    return width < 640 ? width * 0.28 : width * 0.32;
  }

  function respawn(agent) {
    const dir = laneDirection(agent.lane);
    const margin = 120 * scale;
    let x = dir < 0 ? width + margin + random(0, width * 0.5) : -margin - random(0, width * 0.5);
    const blocked = () =>
      agents.some((other) => other !== agent && other.lane === agent.lane && Math.abs(other.x - x) < 110 * scale);
    let guard = 0;
    while (blocked() && guard < 8) {
      x += dir < 0 ? 90 * scale : -90 * scale;
      guard += 1;
    }
    Object.assign(agent, makeAgent(agent.lane, x));
  }

  function step(dt) {
    time += dt;
    worldX += EGO_SPEED * dt;

    agents.forEach((agent) => {
      const prev = agent.x;
      agent.x += (agent.speed - EGO_SPEED) * dt;
      const sameLaneAhead = agents.find(
        (other) =>
          other !== agent &&
          other.lane === agent.lane &&
          Math.sign(other.x - prev) === laneDirection(agent.lane) &&
          Math.abs(other.x - prev) < 70 * scale
      );
      if (sameLaneAhead) {
        agent.speed = sameLaneAhead.speed;
      }
      const margin = 160 * scale;
      if (agent.x < -margin - width * 0.6 || agent.x > width + margin + width * 0.6) {
        respawn(agent);
      }
    });

    walkers.forEach((walker) => {
      walker.x += (walker.speed - EGO_SPEED) * dt;
      walker.stride += dt * 6;
      if (walker.x < -40) {
        Object.assign(walker, makeWalker(walker.side, width + random(20, width * 0.4)));
      }
    });

    if (Math.floor(time * 3) !== Math.floor((time - dt) * 3)) {
      mpcMs = Math.round(random(36, 49));
    }
  }

  function setLabelFont(size) {
    ctx.font = `650 ${size}px Archivo, "Helvetica Neue", Arial, sans-serif`;
    if ("fontStretch" in ctx) {
      ctx.fontStretch = "condensed";
    }
  }

  function drawLabel(text, x, y, color) {
    const size = Math.max(10, Math.round(10.5 * Math.min(scale, 1.25)));
    setLabelFont(size);
    const padX = 4;
    const tabH = size + 5;
    const tabW = ctx.measureText(text).width + padX * 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - tabH, tabW, tabH);
    ctx.fillStyle = COLOR.labelText;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + padX, y - tabH / 2 + 0.5);
  }

  function drawBox(x, y, w, h, color, text) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
    drawLabel(text, Math.round(x) - 0.25, Math.round(y) + 0.5, color);
  }

  function drawGrid() {
    const cell = Math.max(10, 13 * scale);
    const offset = -(worldX % cell);
    ctx.strokeStyle = COLOR.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offset; x < width; x += cell) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = road.top % cell; y < height; y += cell) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();
    return { cell, offset };
  }

  function fillOccupied(grid, x, y, w, h) {
    const ex = egoX();
    const ey = laneY(EGO_LANE);
    const reach = 330 * scale;
    if (Math.hypot(x + w / 2 - ex, y + h / 2 - ey) > reach) {
      return;
    }
    const { cell, offset } = grid;
    const rowStart = road.top % cell;
    const c0 = Math.floor((x - offset) / cell);
    const c1 = Math.floor((x + w - offset) / cell);
    const r0 = Math.floor((y - rowStart) / cell);
    const r1 = Math.floor((y + h - rowStart) / cell);
    ctx.fillStyle = COLOR.occupied;
    for (let c = c0; c <= c1; c += 1) {
      for (let r = r0; r <= r1; r += 1) {
        ctx.fillRect(offset + c * cell + 1, rowStart + r * cell + 1, cell - 1, cell - 1);
      }
    }
  }

  function drawRoad() {
    const { top, height: h, sidewalk, lane } = road;
    ctx.fillStyle = COLOR.sidewalk;
    ctx.fillRect(0, top, width, sidewalk);
    ctx.fillRect(0, top + h - sidewalk, width, sidewalk);

    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.strokeStyle = COLOR.edge;
    ctx.beginPath();
    ctx.moveTo(0, top + sidewalk);
    ctx.lineTo(width, top + sidewalk);
    ctx.moveTo(0, top + h - sidewalk);
    ctx.lineTo(width, top + h - sidewalk);
    ctx.stroke();

    const centre = top + sidewalk + lane * 2;
    ctx.strokeStyle = COLOR.centre;
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(0, centre - 2.5 * scale);
    ctx.lineTo(width, centre - 2.5 * scale);
    ctx.moveTo(0, centre + 2.5 * scale);
    ctx.lineTo(width, centre + 2.5 * scale);
    ctx.stroke();

    const dash = 26 * scale;
    const gap = 22 * scale;
    ctx.strokeStyle = COLOR.dash;
    ctx.lineWidth = Math.max(1.25, 1.75 * scale);
    ctx.setLineDash([dash, gap]);
    ctx.lineDashOffset = worldX % (dash + gap);
    ctx.beginPath();
    [1, 3].forEach((boundary) => {
      const y = top + sidewalk + lane * boundary;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }

  function drawFutures(agent, color, frontX, y) {
    const dir = laneDirection(agent.lane);
    const reach = Math.min(170, Math.abs(agent.speed) * 1.1) * scale;
    const modes = [{ dLane: 0, p: agent.straight }];
    const neighbour = agent.lane === 0 ? 1 : agent.lane === 1 ? 0 : agent.lane === 2 ? 3 : 2;
    const rest = 1 - agent.straight;
    modes.push({ dLane: neighbour - agent.lane, p: rest * 0.75 });
    modes.push({ dLane: 0, p: rest * 0.25, slow: true });

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([3, 4]);
    modes.forEach((mode) => {
      const length = mode.slow ? reach * 0.45 : reach;
      const endX = frontX + dir * length;
      const endY = y + mode.dLane * road.lane;
      ctx.globalAlpha = 0.2 + mode.p * 0.75;
      ctx.beginPath();
      ctx.moveTo(frontX, y);
      ctx.bezierCurveTo(frontX + dir * length * 0.45, y, frontX + dir * length * 0.55, endY, endX, endY);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(endX - 1.5, endY - 1.5, 3, 3);
    });
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  function drawVehicleBody(x, y, w, h, fill, roof) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(4 * scale, h / 2));
    ctx.fill();
    if (roof) {
      ctx.fillStyle = roof;
      ctx.fillRect(x - w * 0.18, y - h * 0.32, w * 0.36, h * 0.64);
    }
  }

  function drawAgents(grid) {
    agents.forEach((agent) => {
      const type = TYPES[agent.type];
      const w = type.w * scale;
      const h = type.h * scale;
      const y = laneY(agent.lane);
      if (agent.x < -w * 3 || agent.x > width + w * 3) {
        return;
      }
      fillOccupied(grid, agent.x - w / 2, y - h / 2, w, h);
    });

    agents.forEach((agent) => {
      const type = TYPES[agent.type];
      const w = type.w * scale;
      const h = type.h * scale;
      const y = laneY(agent.lane);
      if (agent.x < -w * 3 || agent.x > width + w * 3) {
        return;
      }
      const color = COLOR[agent.type];
      const dir = laneDirection(agent.lane);
      drawFutures(agent, color, agent.x + (dir * w) / 2, y);
      drawVehicleBody(agent.x, y, w, h, COLOR.body, agent.type === "motorcycle" ? null : COLOR.roof);
      const conf = agent.conf + Math.sin(time * 2.3 + agent.phase) * 0.015;
      const pad = 3 * scale;
      drawBox(agent.x - w / 2 - pad, y - h / 2 - pad, w + pad * 2, h + pad * 2, color, `${type.label} ${conf.toFixed(2)}`);
    });
  }

  function drawWalkers(grid) {
    walkers.forEach((walker) => {
      const y =
        walker.side === 0 ? road.top + road.sidewalk * 0.5 : road.top + road.height - road.sidewalk * 0.5;
      const r = 4.5 * scale;
      if (walker.x < -40 || walker.x > width + 40) {
        return;
      }
      fillOccupied(grid, walker.x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = COLOR.roof;
      ctx.beginPath();
      ctx.arc(walker.x, y, r, 0, Math.PI * 2);
      ctx.fill();
      const swing = Math.sin(walker.stride) * 2 * scale;
      ctx.fillRect(walker.x - r * 0.4 + swing, y + r * 0.6, r * 0.8, r * 0.7);
      const conf = walker.conf + Math.sin(time * 2 + walker.phase) * 0.02;
      const box = r * 2 + 6 * scale;
      drawBox(walker.x - box / 2, y - box / 2, box, box, COLOR.person, `person ${conf.toFixed(2)}`);
    });
  }

  function drawEgo() {
    const x = egoX();
    const y = laneY(EGO_LANE);
    const w = TYPES.car.w * scale;
    const h = TYPES.car.h * scale;

    // Planned path: MPC horizon points.
    ctx.fillStyle = COLOR.person;
    const points = 12;
    for (let i = 1; i <= points; i += 1) {
      const px = x + w / 2 + i * 13 * scale;
      const r = Math.max(1.2, 2.2 * scale * (1 - i / (points * 1.4)));
      ctx.globalAlpha = 1 - i / (points + 3);
      ctx.beginPath();
      ctx.arc(px, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawVehicleBody(x, y, w, h, COLOR.ego, "#c9ced3");
    drawLabel(`ego  mpc ${mpcMs} ms`, x - w / 2, y - h / 2 - 3 * scale, COLOR.person);
  }

  function drawPointer() {
    if (!pointer.active) {
      return;
    }
    const idle = time - pointer.seen;
    const alpha = Math.max(0, Math.min(1, 1.6 - idle));
    if (alpha <= 0) {
      return;
    }
    ctx.globalAlpha = alpha;
    const bw = 34;
    const bh = 46;
    const conf = pointer.conf + Math.sin(time * 3) * 0.015;
    drawBox(pointer.x - bw / 2, pointer.y - bh / 2, bw, bh, COLOR.person, `person ${conf.toFixed(2)}`);

    const speed = Math.hypot(pointer.vx, pointer.vy);
    if (speed > 25) {
      const horizon = 0.55;
      const baseAngle = Math.atan2(pointer.vy, pointer.vx);
      const length = Math.min(speed * horizon, 220);
      ctx.strokeStyle = COLOR.person;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3, 4]);
      [
        [0, 1],
        [-0.35, 0.45],
        [0.35, 0.45],
      ].forEach(([turn, weight]) => {
        const angle = baseAngle + turn;
        const sx = pointer.x + Math.cos(baseAngle) * (bw / 2);
        const sy = pointer.y + Math.sin(baseAngle) * (bh / 2);
        const ex = sx + Math.cos(angle) * length * (turn ? 0.8 : 1);
        const ey = sy + Math.sin(angle) * length * (turn ? 0.8 : 1);
        ctx.globalAlpha = alpha * weight;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(
          sx + Math.cos(baseAngle) * length * 0.5,
          sy + Math.sin(baseAngle) * length * 0.5,
          ex,
          ey
        );
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    const grid = drawGrid();
    drawRoad();
    drawWalkers(grid);
    drawAgents(grid);
    drawEgo();
    drawPointer();
  }

  function frame(now) {
    if (!running) {
      return;
    }
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now;
    step(dt);
    pointer.vx *= 0.92;
    pointer.vy *= 0.92;
    render();
    window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion.matches || !visible || document.hidden) {
      return;
    }
    running = true;
    lastFrame = 0;
    window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
  }

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (pointer.active) {
      const elapsed = Math.max(time - pointer.seen, 1 / 120);
      pointer.vx = pointer.vx * 0.7 + ((x - pointer.x) / elapsed) * 0.3;
      pointer.vy = pointer.vy * 0.7 + ((y - pointer.y) / elapsed) * 0.3;
    } else {
      pointer.conf = random(0.9, 0.97);
    }
    pointer.x = x;
    pointer.y = y;
    pointer.seen = time;
    pointer.active = true;
    if (!running) {
      render();
    }
  });

  stage.addEventListener("pointerleave", () => {
    pointer.active = false;
    pointer.vx = 0;
    pointer.vy = 0;
    if (!running) {
      render();
    }
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) {
        start();
      } else {
        stop();
      }
    }).observe(stage);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      stop();
      render();
    } else {
      start();
    }
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      measure();
      render();
    }).observe(stage);
  }

  measure();
  render();
  start();

  if (document.fonts) {
    document.fonts.ready.then(() => {
      measure();
      render();
    });
  }
})();
