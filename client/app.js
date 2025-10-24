const { useState, useEffect } = React;

function App() {
  const [grid, setGrid] = useState(
    Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ''))
  );
  
  const [clientId, setClientId] = useState('');

  const [players, setPlayers] = useState(0);

  const [message, setMessage] = useState('');
 
  const [cooldownUntil, setCooldownUntil] = useState(0);

  // History related state. When viewing history, updates are disabled.
  const [historyList, setHistoryList] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [viewingHistory, setViewingHistory] = useState(false);

  // Establish the SSE connection on first render.
  useEffect(() => {
    const evtSource = new EventSource('/events');

    // The server sends an 'init' event when a new connection is opened. It
    // contains the initial grid, the number of players and a unique client id.
    evtSource.addEventListener('init', (e) => {
      try {
        const data = JSON.parse(e.data);
        setGrid(data.grid);
        setClientId(data.clientId);
        setPlayers(data.players);
        // If server reports history count, fetch the list to enable history view.
      } catch (err) {
        console.error('Failed to parse init event', err);
      }
    });
    // Grid updates are broadcast to all clients via a 'grid' event.
    evtSource.addEventListener('grid', (e) => {
      try {
        const newGrid = JSON.parse(e.data);
        // Only update the grid if not currently viewing a historical snapshot.
        setGrid((prev) => {
          if (!viewingHistory) {
            return newGrid;
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to parse grid event', err);
      }
    });
    // Player count updates are emitted whenever someone connects or disconnects.
    evtSource.addEventListener('players', (e) => {
      const count = parseInt(e.data, 10);
      setPlayers(count);
    });
    // Clean up the connection on unmount
    return () => {
      evtSource.close();
    };
  }, [viewingHistory]);

  /**
   * Determine whether the user is currently allowed to update a cell.
   */
  function canUpdate() {
    // If viewing history we never allow modifications.
    if (viewingHistory) return false;
    // If no cooldown is set, the player has not yet made any moves.
    if (cooldownUntil === 0) return true;
    return Date.now() >= cooldownUntil;
  }

  /*
   * When a cell is clicked the client prompts for input and sends an update to
   * the server. The server will validate the request and respond with a
   * success or error message.
  */
  function handleCellClick(row, col) {
    setMessage('');
    // If cell already used, do nothing.
    if (grid[row][col] !== '') {
      setMessage('Cell is already filled.');
      return;
    }
    // Check cooldown
    if (!canUpdate()) {
      const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
      setMessage(`Please wait ${seconds} seconds before updating again.`);
      return;
    }
    const char = prompt('Enter a Unicode character:');
    if (!char || char.trim().length === 0) {
      return;
    }
    // Send update to the server
    fetch('/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId, row, col, char }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || 'Update failed');
          });
        }
        return res.json();
      })
      .then(() => {
        // Locally apply cooldown for one minute
        setCooldownUntil(Date.now() + 60000);
        setMessage('Character submitted! You will be able to update again in 60 seconds.');
      })
      .catch((err) => {
        setMessage(err.message);
      });
  }

  /**
   * Load the list of available history timestamps from the server. This will
   * populate the historyList state and set the history index to the latest
   * entry.
   */
  function loadHistory() {
    fetch('/history')
      .then((res) => res.json())
      .then((timestamps) => {
        setHistoryList(timestamps);
        setHistoryIndex(timestamps.length - 1);
        // When history is loaded we start in viewing mode
        setViewingHistory(true);
        // Fetch the latest snapshot for display
        if (timestamps.length > 0) {
          fetch(`/history?index=${timestamps.length - 1}`)
            .then((res) => res.json())
            .then((data) => {
              setGrid(data.grid);
            });
        }
      })
      .catch((err) => setMessage('Failed to load history'));
  }

  /**
   * Navigate to the previous history entry, if available.
   */
  function prevHistory() {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    fetch(`/history?index=${newIdx}`)
      .then((res) => res.json())
      .then((data) => {
        setGrid(data.grid);
        setHistoryIndex(newIdx);
      });
  }

  /**
   * Navigate to the next history entry, if available.
   */
  function nextHistory() {
    if (historyIndex >= historyList.length - 1) return;
    const newIdx = historyIndex + 1;
    fetch(`/history?index=${newIdx}`)
      .then((res) => res.json())
      .then((data) => {
        setGrid(data.grid);
        setHistoryIndex(newIdx);
      });
  }

  /**
   * Exit history viewing mode and return to live updates.
   */
  function exitHistory() {
    setViewingHistory(false);
    setHistoryList([]);
    setHistoryIndex(-1);
    setMessage('');
  }

  return (
    <div>
      <h1>Unicode Grid Multiplayer</h1>
      <div className="info">Players online: {players}</div>
      {viewingHistory ? (
        <div className="info">Viewing historical state (Entry {historyIndex + 1} of {historyList.length})</div>
      ) : null}
      <div id="grid">
        {grid.map((row, rowIndex) =>
          row.map((value, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const used = value !== '';
            return (
              <div
                key={key}
                className={used ? 'cell used' : 'cell'}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {value}
              </div>
            );
          })
        )}
      </div>
      <div className="message">{message}</div>
      {/* Controls for history mode */}
      {viewingHistory ? (
        <div className="history-controls">
          <button onClick={prevHistory} disabled={historyIndex <= 0}>
            Previous
          </button>
          <button
            onClick={nextHistory}
            disabled={historyIndex >= historyList.length - 1}
          >
            Next
          </button>
          <button onClick={exitHistory}>Exit History</button>
        </div>
      ) : (
        <div className="history-controls">
          <button onClick={loadHistory}>View History</button>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);