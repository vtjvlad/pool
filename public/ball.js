import {
    BALL_RADIUS,
    FRICTION,
    MIN_SPEED,
    CUSHION_RESTITUTION
} from './constants.js';
import { getPlayArea, lighten, darken } from './utils.js';

export class Ball {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = BALL_RADIUS;
        this.isCueBall = options.isCueBall || false;
        this.number = options.number || 0;
        this.ballType = options.ballType || (this.isCueBall ? 'cue' : 'solid');
        this.color = options.color || '#ffffff';
    }

    draw(ctx) {
        const r = this.radius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x + 1.5, this.y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();
        ctx.restore();

        const grad = ctx.createRadialGradient(
            this.x - r * 0.35, this.y - r * 0.35, r * 0.1,
            this.x, this.y, r
        );

        if (this.isCueBall) {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.7, '#f0f0f0');
            grad.addColorStop(1, '#d0d0d0');
        } else if (this.ballType === 'eight') {
            grad.addColorStop(0, '#444');
            grad.addColorStop(0.5, '#1a1a1a');
            grad.addColorStop(1, '#000');
        } else {
            grad.addColorStop(0, lighten(this.color, 40));
            grad.addColorStop(0.55, this.color);
            grad.addColorStop(1, darken(this.color, 30));
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (this.ballType === 'stripe' && !this.isCueBall) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.clip();
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(this.x - r, this.y - r * 0.42, r * 2, r * 0.84);
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - r, this.y - r * 0.28, r * 2, r * 0.56);
            ctx.restore();
        }

        if (!this.isCueBall) {
            const spotR = r * 0.42;
            ctx.beginPath();
            ctx.arc(this.x, this.y, spotR, 0, Math.PI * 2);
            ctx.fillStyle = this.ballType === 'eight' ? '#ffffff' : '#fafafa';
            ctx.fill();

            ctx.fillStyle = this.ballType === 'eight' ? '#111' : '#222';
            ctx.font = `bold ${r * 0.72}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(this.number), this.x, this.y + 0.5);
        }

        ctx.beginPath();
        ctx.arc(this.x - r * 0.32, this.y - r * 0.32, r * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fill();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        if (Math.abs(this.vx) < MIN_SPEED) this.vx = 0;
        if (Math.abs(this.vy) < MIN_SPEED) this.vy = 0;

        const play = getPlayArea();

        if (this.x - this.radius < play.left) {
            this.x = play.left + this.radius;
            this.vx = -this.vx * CUSHION_RESTITUTION;
        } else if (this.x + this.radius > play.right) {
            this.x = play.right - this.radius;
            this.vx = -this.vx * CUSHION_RESTITUTION;
        }

        if (this.y - this.radius < play.top) {
            this.y = play.top + this.radius;
            this.vy = -this.vy * CUSHION_RESTITUTION;
        } else if (this.y + this.radius > play.bottom) {
            this.y = play.bottom - this.radius;
            this.vy = -this.vy * CUSHION_RESTITUTION;
        }
    }

    isMoving() {
        return Math.hypot(this.vx, this.vy) > MIN_SPEED;
    }
}
