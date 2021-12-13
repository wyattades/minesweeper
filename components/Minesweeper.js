import React, { useEffect, useMemo, useRef, useState } from "react";
import _ from "lodash";

const clsx = (...syms) => syms.filter(Boolean).join(" ");

const CellState = {
  UNKNOWN: 0,
  // 1: 1,
  // 2: 2,
  // 3: 3,
  // 4: 4,
  // 5: 5,
  // 6: 6,
  // 7: 7,
  // 8: 8,
  EMPTY: 9,
  FLAGGED: 10,
  QFLAGGED: 11,
  MINE: 12,
};

const MineState = {
  UNSET: 0,
  MINE: 1,
  SAFE: 2,
};

const CellStateClassNames = {
  0: "cell-unknown",
  9: "cell-empty",
  10: "cell-flagged",
  11: "cell-qflagged",
  12: "cell-mine",
};

// [delta-x,delta-y] for the 8 squares surrounding a square
const aroundAllPoints = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
];
// [delta-x,delta-y] for the up,right,down,left squares surrounding a square
const aroundSidePoints = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

// TODO
const isSolvable = (mineState, cellsX, cellsY) => {
  return true;
};

// mine generation algorithm
const generateMines = (cellsX, cellsY, safeX, safeY, mineCount) => {
  const data = unsetMineState(cellsX, cellsY);

  data[cellsX * safeY + safeX] = MineState.SAFE;
  for (const [dx, dy] of aroundAllPoints) {
    data[cellsX * (safeY + dy) + (safeX + dx)] = MineState.SAFE;
  }

  for (let n = 0; n < mineCount; n++) {
    while (true) {
      const index = Math.floor(Math.random() * data.length);
      if (data[index] === MineState.UNSET) {
        data[index] = MineState.MINE;
        break;
      }
    }
  }

  // TODO: enforce that the game is solvable
  // while (!isSolvable(data, cellsX, cellsY)) {
  // }

  for (let i = 0; i < data.length; i++) {
    if (data[i] === MineState.UNSET) data[i] = MineState.SAFE;
  }

  return data;
};

const bfs = (
  x,
  y,
  cellsX,
  cellsY,
  fn,
  visited = Array.from({ length: cellsX * cellsY }).map(() => false)
) => {
  const index = cellsX * y + x;
  if (visited[index]) return;

  visited[index] = true;

  if (fn(x, y)) {
    for (const [dx, dy] of aroundSidePoints) {
      const px = x + dx,
        py = y + dy;
      if (px >= 0 && px < cellsX && py >= 0 && py < cellsY) {
        bfs(px, py, cellsX, cellsY, fn, visited);
      }
    }
  }
};

const emptyInputState = (cellsX, cellsY) =>
  Array.from({ length: cellsX * cellsY }).map(() => CellState.UNKNOWN);
const unsetMineState = (cellsX, cellsY) =>
  Array.from({ length: cellsX * cellsY }).map(() => MineState.UNSET);

const Timer = ({ gameState }) => {
  const [time, setTime] = useState("-");

  useEffect(() => {
    if (gameState === "playing") {
      const startAt = Date.now();
      const interval = setInterval(() => {
        const delta = Date.now() - startAt;

        setTime(`${Math.floor(delta / 1000)}s`);
      }, 100);
      return () => {
        clearInterval(interval);
      };
    } else if (gameState === "ready") {
      setTime("-");
    }
  }, [gameState]);

  return time;
};

export const Minesweeper = () => {
  const cellsY = 16;
  const cellsX = 16;
  const mineCount = Math.floor(cellsX * cellsY * 0.5);

  const [gameState, setGameState] = useState("ready");

  const [mineState, setMineState] = useState(() => {
    return unsetMineState(cellsX, cellsY);
  });

  const [inputState, setInputState] = useState(() => {
    return emptyInputState(cellsX, cellsY);
  });

  const reset = () => {
    setMineState(unsetMineState(cellsX, cellsY));
    setInputState(emptyInputState(cellsX, cellsY));
    setGameState("ready");
  };

  const setCell = (x, y, state) => {
    const next = [...inputState];
    next[cellsX * y + x] = state;
    setInputState(next);
  };

  const setEmptyCells = (x, y, currentMineState = mineState) => {
    // setCell(x, y, CellState.EMPTY);

    const next = [...inputState];

    next[cellsX * y + x] = CellState.EMPTY;

    bfs(x, y, cellsX, cellsY, (px, py) => {
      const i = cellsX * py + px;
      if (currentMineState[i] === MineState.SAFE) {
        next[i] = CellState.EMPTY;
        return true;
      }
      return false;
    });

    // set adjacent mine counts
    for (let px = 0; px < cellsX; px++) {
      for (let py = 0; py < cellsY; py++) {
        const cell = next[cellsX * py + px];
        if (cell === CellState.EMPTY) {
          let adjacentMines = 0;
          for (const [dx, dy] of aroundAllPoints) {
            const nx = px + dx,
              ny = py + dy;
            if (
              nx >= 0 &&
              ny >= 0 &&
              nx < cellsX &&
              ny < cellsY &&
              currentMineState[cellsX * ny + nx] === MineState.MINE
            )
              adjacentMines++;
          }
          if (adjacentMines > 0) {
            next[cellsX * py + px] = adjacentMines;
          }
        }
      }
    }

    setInputState(next);
  };

  const gameDOMRef = useRef();

  useEffect(() => {
    const cb = (e) => {
      e.preventDefault();
    };
    const el = gameDOMRef.current;
    el.addEventListener("contextmenu", cb);
    return () => {
      el.removeEventListener("contextmenu", cb);
    };
  }, []);

  const clickCell = (e) => {
    let { x, y } = e.target.dataset;
    x = Number(x);
    y = Number(y);

    const cell = inputState[cellsX * y + x];
    const cellMine = mineState[cellsX * y + x];

    const rightClick = e.button === 2;

    if (rightClick) {
      if (cell === CellState.UNKNOWN) setCell(x, y, CellState.FLAGGED);
      else if (cell === CellState.FLAGGED) setCell(x, y, CellState.QFLAGGED);
      else if (cell === CellState.QFLAGGED) setCell(x, y, CellState.UNKNOWN);
    } else {
      if (cell === CellState.UNKNOWN) {
        if (cellMine === MineState.UNSET) {
          const newMineState = generateMines(cellsX, cellsY, x, y, mineCount);
          setMineState(newMineState);
          setEmptyCells(x, y, newMineState);
          setGameState("playing");
        } else if (cellMine === MineState.MINE) {
          setInputState(
            mineState.map((m) =>
              m === MineState.MINE ? CellState.MINE : CellState.EMPTY
            )
          );

          setGameState("lose");
        } else {
          setEmptyCells(x, y);
        }
      }
    }
  };

  const foundMineCount = useMemo(() => {
    return _.sumBy(inputState, (v) => (v === CellState.FLAGGED ? 1 : 0));
  }, [inputState]);

  useEffect(() => {
    if (foundMineCount === mineCount) {
      let valid = true;
      for (let i = 0; i < inputState.length; i++) {
        if (
          inputState[i] === CellState.FLAGGED &&
          mineState[i] !== MineState.MINE
        ) {
          valid = false;
          break;
        }
      }
      if (valid) {
        setGameState("win");
      }
    }
  }, [inputState, foundMineCount]);

  return (
    <>
      <div className="flex flex-col items-center">
        {gameState === "win" ? (
          <p className="text-lg text-green-500 font-bold mb-8">You win!</p>
        ) : gameState === "lose" ? (
          <p className="text-lg text-red-500 font-bold mb-8">You lose!</p>
        ) : null}

        <div
          className="game-grid border-4 border-gray-600 mb-10"
          ref={gameDOMRef}
        >
          {Array.from({ length: cellsY }).map((_a, y) => {
            return (
              <div key={y} className="game-row">
                {Array.from({ length: cellsX }).map((_b, x) => {
                  const cell = inputState[cellsX * y + x];

                  const clickable =
                    cell === CellState.UNKNOWN ||
                    cell === CellState.FLAGGED ||
                    cell === CellState.QFLAGGED;

                  return (
                    <button
                      key={x}
                      className={clsx("game-cell", CellStateClassNames[cell])}
                      disabled={!clickable}
                      data-x={x}
                      data-y={y}
                      data-adjacent-mines={
                        cell >= 1 && cell <= 8 ? cell : undefined
                      }
                      // onClick={clickCell}
                      onMouseUp={clickCell}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center w-full">
          <button
            onClick={reset}
            className="px-3 py-1 border border-red-400 rounded bg-red-100 hover:bg-red-200"
          >
            Reset
          </button>

          <p className="px-3 py-1 border border-gray-400 rounded bg-gray-200">
            Mines found: {foundMineCount} out of {mineCount}
          </p>

          <p className="px-3 py-1 border border-gray-400 rounded bg-gray-200">
            Time elapsed: <Timer gameState={gameState} />
          </p>
        </div>
      </div>

      <style jsx global>{`
        .game-grid {
          display: inline-flex;
          flex-direction: column;
          background: #ddd;
        }

        .game-row {
        }

        .game-cell {
          width: 32px;
          height: 32px;
          margin: 2px;
          border-radius: 2px;
          background: #bbb;
          border: 1px solid #aaa;
          position: relative;
        }

        .game-cell:not([disabled]):hover {
          background: #ccc;
        }

        .game-cell.cell-empty {
          border-color: #bbb;
          background: #ddd;
        }

        .game-cell.cell-flagged::after {
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 1rem;

          content: "🚩";
        }
        .game-cell.cell-qflagged::after {
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 1rem;

          content: "❓";
        }
        .game-cell.cell-mine::after {
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 1rem;

          content: "💣";
        }

        .game-cell[data-adjacent-mines] {
          border-color: #bbb;
          background: #ddd;
        }
        .game-cell[data-adjacent-mines]::after {
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);

          font-size: 1.5rem;
          content: attr(data-adjacent-mines);
          color: black;
          font-weight: bold;
        }

        .game-cell[data-adjacent-mines="1"]::after {
          color: blue;
        }
        .game-cell[data-adjacent-mines="2"]::after {
          color: green;
        }
        .game-cell[data-adjacent-mines="3"]::after {
          color: red;
        }
        .game-cell[data-adjacent-mines="4"]::after {
          color: navy;
        }
        .game-cell[data-adjacent-mines="5"]::after {
          color: brown;
        }
        .game-cell[data-adjacent-mines="6"]::after {
          color: #009fff;
        }
        .game-cell[data-adjacent-mines="7"]::after {
          color: black;
        }
        .game-cell[data-adjacent-mines="8"]::after {
          color: grey;
        }
      `}</style>
    </>
  );
};
