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
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 绘制网格背景（更细致的效果）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
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

    // 绘制蛇（增强视觉效果）
    snake().forEach((segment, index) => {
      const x = segment.x * GRID_SIZE
      const y = segment.y * GRID_SIZE
      
      if (index === 0) {
        // 蛇头 - 渐变效果和发光
        const gradient = ctx.createRadialGradient(
          x + GRID_SIZE/2, y + GRID_SIZE/2, 0,
          x + GRID_SIZE/2, y + GRID_SIZE/2, GRID_SIZE/2
        )
        gradient.addColorStop(0, '#00ff87')
        gradient.addColorStop(0.7, '#00d16e')
        gradient.addColorStop(1, '#00a855')
        
        ctx.fillStyle = gradient
        ctx.shadowColor = '#00ff87'
        ctx.shadowBlur = 10
        ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2)
        
        // 眼睛
        ctx.fillStyle = '#0a0a0a'
        ctx.shadowBlur = 0
        ctx.fillRect(x + 4, y + 4, 3, 3)
        ctx.fillRect(x + GRID_SIZE - 7, y + 4, 3, 3)
      } else {
        // 蛇身 - 渐变效果
        const intensity = Math.max(0.3, 1 - (index / snake().length))
        const gradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE)
        gradient.addColorStop(0, `rgba(0, 255, 135, ${intensity})`)
        gradient.addColorStop(1, `rgba(0, 168, 85, ${intensity * 0.8})`)
        
        ctx.fillStyle = gradient
        ctx.shadowColor = '#00ff87'
        ctx.shadowBlur = 3
        ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4)
      }
    })

    // 绘制食物（增强视觉效果）
    const currentFood = food()
    const foodX = currentFood.x * GRID_SIZE
    const foodY = currentFood.y * GRID_SIZE
    
    // 食物发光效果
    const foodGradient = ctx.createRadialGradient(
      foodX + GRID_SIZE/2, foodY + GRID_SIZE/2, 0,
      foodX + GRID_SIZE/2, foodY + GRID_SIZE/2, GRID_SIZE/2
    )
    foodGradient.addColorStop(0, '#ff4757')
    foodGradient.addColorStop(0.7, '#ff3742')
    foodGradient.addColorStop(1, '#ff1e2d')
    
    ctx.fillStyle = foodGradient
    ctx.shadowColor = '#ff4757'
    ctx.shadowBlur = 15
    
    // 绘制圆形食物
    ctx.beginPath()
    ctx.arc(
      foodX + GRID_SIZE/2, 
      foodY + GRID_SIZE/2, 
      (GRID_SIZE - 4) / 2, 
      0, 
      2 * Math.PI
    )
    ctx.fill()
    
    // 重置阴影
    ctx.shadowBlur = 0
  })

  return (
    <div class="game-container">
      {/* 粒子背景效果 */}
      <div class="particle" style="top: 10%; left: 10%;"></div>
      <div class="particle" style="top: 20%; left: 80%;"></div>
      <div class="particle" style="top: 60%; left: 20%;"></div>
      <div class="particle" style="top: 80%; left: 60%;"></div>
      
      <h1>🐍 SOLID SNAKE</h1>
      
      <div class="game-info">
        <div class={`score ${score() > 0 ? 'score-increase' : ''}`}>
          🎯 分数: {score()}
        </div>
        <div class={`high-score ${score() === highScore() && score() > 0 ? 'new-record' : ''}`}>
          最高分: {highScore()}
        </div>
        <div class="game-status">
          {gameState() === GameState.WAITING && '🎮 按空格键开始游戏'}
          {gameState() === GameState.PLAYING && '🎯 游戏进行中'}
          {gameState() === GameState.PAUSED && '⏸️ 游戏已暂停'}
          {gameState() === GameState.GAME_OVER && '💀 游戏结束！'}
        </div>
      </div>

      <div class={`game-board ${gameState() === GameState.GAME_OVER ? 'game-over-animation' : ''}`}>
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
              🚀 开始游戏
            </button>
          )}
          {gameState() === GameState.PLAYING && (
            <button onClick={() => setGameState(GameState.PAUSED)} class="control-btn pause-btn">
              ⏸️ 暂停游戏
            </button>
          )}
          {gameState() === GameState.PAUSED && (
            <button onClick={() => setGameState(GameState.PLAYING)} class="control-btn resume-btn">
              ▶️ 继续游戏
            </button>
          )}
          {gameState() === GameState.GAME_OVER && (
            <button onClick={resetGame} class="control-btn restart-btn">
              🔄 重新开始
            </button>
          )}
          <button onClick={resetGame} class="control-btn reset-btn">
            🔃 重置游戏
          </button>
        </div>

        <div class="instructions">
          <p>🎮 使用方向键控制蛇的移动</p>
          <p>⏯️ 空格键: 开始/暂停游戏</p>
          <p>🔄 R键: 重新开始</p>
        </div>
      </div>
    </div>
  )
}

export default App
