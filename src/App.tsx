import { createSignal, createEffect, onCleanup } from 'solid-js'
import './App.css'

// 游戏配置常量
const GRID_SIZE = 20
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 400
const INITIAL_SPEED = 150

// 类型定义
interface Position {
  x: number
  y: number
}

enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

enum GameState {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

function App() {
  // 游戏状态
  const [gameState, setGameState] = createSignal<GameState>(GameState.WAITING)
  const [score, setScore] = createSignal(0)
  const [highScore, setHighScore] = createSignal(
    parseInt(localStorage.getItem('snakeHighScore') || '0')
  )
  const [snake, setSnake] = createSignal<Position[]>([
    { x: 10, y: 10 }
  ])
  const [direction, setDirection] = createSignal<Direction>(Direction.RIGHT)
  const [food, setFood] = createSignal<Position>({ x: 15, y: 15 })
  const [gameSpeed, setGameSpeed] = createSignal(INITIAL_SPEED)

  // 生成随机食物位置
  const generateFood = (): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE))
      }
    } while (snake().some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }

  // 检查碰撞
  const checkCollision = (head: Position): boolean => {
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= CANVAS_WIDTH / GRID_SIZE ||
        head.y < 0 || head.y >= CANVAS_HEIGHT / GRID_SIZE) {
      return true
    }

    // 检查自身碰撞
    return snake().some(segment => segment.x === head.x && segment.y === head.y)
  }

  // 移动蛇
  const moveSnake = () => {
    if (gameState() !== GameState.PLAYING) return

    const currentSnake = snake()
    const currentDirection = direction()
    const head = currentSnake[0]

    let newHead: Position
    switch (currentDirection) {
      case Direction.UP:
        newHead = { x: head.x, y: head.y - 1 }
        break
      case Direction.DOWN:
        newHead = { x: head.x, y: head.y + 1 }
        break
      case Direction.LEFT:
        newHead = { x: head.x - 1, y: head.y }
        break
      case Direction.RIGHT:
        newHead = { x: head.x + 1, y: head.y }
        break
    }

    // 检查碰撞
    if (checkCollision(newHead)) {
      setGameState(GameState.GAME_OVER)
      // 更新最高分
      const currentScore = score()
      if (currentScore > highScore()) {
        setHighScore(currentScore)
        localStorage.setItem('snakeHighScore', currentScore.toString())
      }
      return
    }

    const newSnake = [newHead, ...currentSnake]

    // 检查是否吃到食物
    const currentFood = food()
    if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
      setScore(score() + 10)
      setFood(generateFood())
      // 增加游戏速度
      if (gameSpeed() > 50) {
        setGameSpeed(gameSpeed() - 2)
      }
    } else {
      // 移除尾部
      newSnake.pop()
    }

    setSnake(newSnake)
  }

  // 重置游戏
  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setDirection(Direction.RIGHT)
    setFood(generateFood())
    setScore(0)
    setGameSpeed(INITIAL_SPEED)
    setGameState(GameState.WAITING)
  }

  // 键盘事件处理
  const handleKeyPress = (event: KeyboardEvent) => {
    const currentDirection = direction()
    const currentState = gameState()

    switch (event.code) {
      case 'ArrowUp':
        event.preventDefault()
        if (currentDirection !== Direction.DOWN && currentState === GameState.PLAYING) {
          setDirection(Direction.UP)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (currentDirection !== Direction.UP && currentState === GameState.PLAYING) {
          setDirection(Direction.DOWN)
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (currentDirection !== Direction.RIGHT && currentState === GameState.PLAYING) {
          setDirection(Direction.LEFT)
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (currentDirection !== Direction.LEFT && currentState === GameState.PLAYING) {
          setDirection(Direction.RIGHT)
        }
        break
      case 'Space':
        event.preventDefault()
        if (currentState === GameState.WAITING) {
          setGameState(GameState.PLAYING)
        } else if (currentState === GameState.PLAYING) {
          setGameState(GameState.PAUSED)
        } else if (currentState === GameState.PAUSED) {
          setGameState(GameState.PLAYING)
        }
        break
      case 'KeyR':
        event.preventDefault()
        resetGame()
        break
    }
  }

  // 设置键盘事件监听
  createEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyPress)
    })
  })

  // 游戏循环
  createEffect(() => {
    let gameInterval: number

    if (gameState() === GameState.PLAYING) {
      gameInterval = setInterval(moveSnake, gameSpeed())
    }

    onCleanup(() => {
      if (gameInterval) {
        clearInterval(gameInterval)
      }
    })
  })

  // 画布渲染
  createEffect(() => {
    const canvas = document.querySelector('.game-canvas') as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 绘制蛇
    ctx.fillStyle = '#4CAF50'
    snake().forEach((segment, index) => {
      if (index === 0) {
        // 蛇头用不同颜色
        ctx.fillStyle = '#66BB6A'
      } else {
        ctx.fillStyle = '#4CAF50'
      }
      ctx.fillRect(
        segment.x * GRID_SIZE,
        segment.y * GRID_SIZE,
        GRID_SIZE - 1,
        GRID_SIZE - 1
      )
    })

    // 绘制食物
    ctx.fillStyle = '#FF5722'
    const currentFood = food()
    ctx.fillRect(
      currentFood.x * GRID_SIZE,
      currentFood.y * GRID_SIZE,
      GRID_SIZE - 1,
      GRID_SIZE - 1
    )

    // 绘制网格线（可选）
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= CANVAS_WIDTH / GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * GRID_SIZE, 0)
      ctx.lineTo(i * GRID_SIZE, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let i = 0; i <= CANVAS_HEIGHT / GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * GRID_SIZE)
      ctx.lineTo(CANVAS_WIDTH, i * GRID_SIZE)
      ctx.stroke()
    }
  })

  return (
    <div class="game-container">
      <h1>贪吃蛇游戏</h1>
      <div class="game-info">
        <div class="score">分数: {score()}</div>
        <div class="high-score">最高分: {highScore()}</div>
        <div class="game-status">
          {gameState() === GameState.WAITING && '按空格键开始游戏'}
          {gameState() === GameState.PLAYING && '游戏进行中'}
          {gameState() === GameState.PAUSED && '游戏已暂停'}
          {gameState() === GameState.GAME_OVER && '游戏结束！'}
        </div>
      </div>

      <div class="game-board">
        <canvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          class="game-canvas"
        />
      </div>

      <div class="game-controls">
        <div class="control-buttons">
          {gameState() === GameState.WAITING && (
            <button onClick={() => setGameState(GameState.PLAYING)} class="control-btn start-btn">
              开始游戏
            </button>
          )}
          {gameState() === GameState.PLAYING && (
            <button onClick={() => setGameState(GameState.PAUSED)} class="control-btn pause-btn">
              暂停游戏
            </button>
          )}
          {gameState() === GameState.PAUSED && (
            <button onClick={() => setGameState(GameState.PLAYING)} class="control-btn resume-btn">
              继续游戏
            </button>
          )}
          {gameState() === GameState.GAME_OVER && (
            <button onClick={resetGame} class="control-btn restart-btn">
              重新开始
            </button>
          )}
          <button onClick={resetGame} class="control-btn reset-btn">
            重置游戏
          </button>
        </div>

        <div class="instructions">
          <p>使用方向键控制蛇的移动</p>
          <p>空格键: 开始/暂停游戏</p>
          <p>R键: 重新开始</p>
        </div>
      </div>
    </div>
  )
}

export default App
