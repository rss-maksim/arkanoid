import React, { useCallback, useEffect, useRef, useState, Component } from 'react';

import { Keyboard } from '../../constants/Keyboard';
import './ArkanoidGame.css';

const width = 700;
const height = 500;
const ballSize = 8;
const ballSpeed = 1.5;
const panelWidth = 17;
const panelHeight = 60;
const panelShift = 20;
const canvasColor = '#000';
const ballColor = '#f2f20c';
const leftPanelColor = '#eb0b0b';
const rightPanelColor = '#5d9cec';

interface ArkanoidGameProps {
    players: number;
}

interface pausedState {
    x: number;
    y: number;
    dx: number;
    dy: number;
};

interface score {
    leftPlayer: number;
    rightPlayer: number;
};
interface ArkanoidGameState {
    isEnd: boolean;
    isPaused: boolean;
    pausedState: pausedState | null;
    score: score;
}

export class ArkanoidGame extends Component<ArkanoidGameProps, ArkanoidGameState> {
    canvasRef: HTMLCanvasElement | null = null;
    ballX: number = width / 2;
    ballY: number = height / 2;
    dx = ballSpeed;
    dy = -ballSpeed;

    panelLeftX = panelWidth / 2;
    panelLeftY = (height - panelHeight) / 2;
    
    panelRightX = width - panelWidth / 2;
    panelRightY = (height - panelHeight) / 2;

    ctx: CanvasRenderingContext2D | null = null;
    raf?: number;


    state: ArkanoidGameState = {
        isEnd: false,
        isPaused: false,
        pausedState: null,
        score: {
            leftPlayer: 0,
            rightPlayer: 0
        }
    };
    
    componentDidMount(): void {
        if (this.canvasRef) {
            this.canvasRef.width = width;
            this.canvasRef.height = height;
        }
        document.addEventListener('keydown', this.keyDownHandler);
        this.init();
        this.raf = requestAnimationFrame(this.game)
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keyDownHandler);
        if (this.raf) {
            cancelAnimationFrame(this.raf);
        }
    }

    setRef = (ref: HTMLCanvasElement): void => {
        this.canvasRef = ref;
        this.ctx = ref?.getContext('2d') as CanvasRenderingContext2D;
    }

    init = (): void => {
        const { pausedState } = this.state;
        setTimeout(() => this.setState({ isEnd: false }), 500);
        this.ballX = pausedState?.x || width / 2;
        this.ballY = pausedState?.y || height / 2;
        this.dx = pausedState?.dx || this.makeRandomSign() * ballSpeed;
        this.dy = pausedState?.dy || -this.dx * ballSpeed;
    };

    drawRect = (color: string, x: number, y: number, width: number, height: number): void => {
        if (this.canvasRef && this.ctx) {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.rect(x, y, width, height);
            this.ctx.fill();
            this.ctx.stroke();
        }
    };

    drawCircle = (color: string, x: number, y: number, r: number): void => {
        if (this.canvasRef && this.ctx) {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, 2 * Math.PI, false);
            this.ctx.fill();
        }
    };

    draw = (): void => {
        this.drawRect(canvasColor, 0, 0, width, height);
        this.drawCircle(ballColor, this.ballX, this.ballY, ballSize);
        
        this.drawRect(leftPanelColor, this.panelLeftX - panelWidth / 2, this.panelLeftY, panelWidth, panelHeight);
        this.drawRect(rightPanelColor, this.panelRightX - panelWidth / 2, this.panelRightY, panelWidth, panelHeight);
    };

    move = (): boolean => {
        if (this.state.isPaused) {
            return false;
        }
        
        if (
            this.ballX + 2 * ballSize + this.dx > this.panelRightX &&
            this.ballY >= this.panelRightY &&
            this.ballY <= this.panelRightY + panelHeight
        ) {
            this.dx = -this.dx;
            this.dy = this.makeRandomSign() * this.dy;
            return true;
        }

        if (
            this.ballX + this.dx < this.panelLeftX + panelWidth &&
            this.ballY >= this.panelLeftY &&
            this.ballY <= this.panelLeftY + panelHeight
        ) {
            this.dx = -this.dx;
            this.dy = this.makeRandomSign() * this.dy;
            return true;
        }

        if (this.ballX + this.dx < 0) {
            this.setState((state) => {
                const score = { ...state.score, rightPlayer: state.score.rightPlayer + 1 };
                return { ...state, score }
            });
            if (this.raf) {
                this.setState({ isEnd: true });
                cancelAnimationFrame(this.raf);
            }
            return false;
        }

        if (this.ballX + ballSize + this.dx > width) {
            this.setState((state) => {
                const score = { ...state.score, leftPlayer: state.score.leftPlayer + 1 };
                return { ...state, score }
            });
            if (this.raf) {
                this.setState({ isEnd: true });
                cancelAnimationFrame(this.raf);
            }
            return false;
        }
        
        if (
            this.ballY - ballSize + this.dy < 0 ||
            this.ballY + ballSize + this.dy > height
        ) {
            this.dy = -this.dy;
        }

        this.ballX += this.dx;
        this.ballY += this.dy;
        return true;
    };

    game = (): void => {
        if (!this.move()) {
            this.init();
        }
        this.draw();
        this.raf = requestAnimationFrame(this.game)
    };

    keyDownHandler = ({ keyCode }: KeyboardEvent): void => {
        if (keyCode === Keyboard.Tab) {
            const nextIsPaused = !this.state.isPaused;
            this.setState((state) => {
                const pausedState = !state.isPaused ? {
                    x: this.ballX,
                    y: this.ballY,
                    dx: this.dx,
                    dy: this.dy
                } : null;
                return { ...state, isPaused: !state.isPaused, pausedState };
            });
            if (nextIsPaused) {
                return;
            }
        }
        if (this.state.isPaused) {
            return;
        }
        if (keyCode === Keyboard.PlayerLeftDown) {
            this.panelLeftY = this.panelLeftY + panelHeight < height - panelShift
                ? this.panelLeftY + panelShift
                : height - panelHeight
        } else if (keyCode === Keyboard.PlayerLeftUp) {
            this.panelLeftY = this.panelLeftY > panelShift ? this.panelLeftY - panelShift : 0;
        } else if (keyCode === Keyboard.PlayerRightDown) {
            this.panelRightY = this.panelRightY + panelHeight < height - panelShift
                ? this.panelRightY + panelShift
                : height - panelHeight;
        } else if (keyCode === Keyboard.PlayerRightUp) {
            this.panelRightY = this.panelRightY > panelShift
                ? this.panelRightY - panelShift
                : 0;
        }
    };

    makeRandomSign = (): number => {
        return Math.random() < 0.5 ? -1 : 1;
    }

    render(): JSX.Element {
        const { isPaused, score } = this.state;

        return (
            <div className="game">
                <div className="score">
                    <div className="left-player-score-value">{score.leftPlayer}</div>
                    <div>|</div>
                    <div className="right-player-score-value">{score.rightPlayer}</div>
                </div>
                <div className="game-board">
                    {isPaused && (
                        <div className="pause">
                            <h2>PAUSE</h2>
                        </div>
                    )}
                    <canvas className="canvas" ref={this.setRef} />
                </div>
            </div>
            );
    }
}