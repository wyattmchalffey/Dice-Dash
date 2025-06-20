// src/components/debug/BoardDebugPanel.js
import React from 'react';

const BoardDebugPanel = ({ board, boardManager, game, currentPlayer }) => {
    // Check what data we have
    const debugInfo = {
        boardExists: !!board,
        boardSpaces: board?.spaces?.length || 0,
        boardDimensions: board ? `${board.width}x${board.height}` : 'N/A',
        boardManagerExists: !!boardManager,
        playerPositions: boardManager ? Array.from(boardManager.playerPositions.entries()) : [],
        gameExists: !!game,
        gameStatus: game?.status || 'N/A',
        playerCount: game?.players?.length || 0,
        currentPlayerExists: !!currentPlayer,
        currentPlayerId: currentPlayer?.userId || 'N/A'
    };

    return (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-md z-50">
            <h3 className="font-bold mb-2">🐛 Board Debug Info</h3>
            <div className="space-y-1 text-sm font-mono">
                <div className={debugInfo.boardExists ? 'text-green-400' : 'text-red-400'}>
                    Board: {debugInfo.boardExists ? '✓' : '✗'} ({debugInfo.boardSpaces} spaces)
                </div>
                <div>Dimensions: {debugInfo.boardDimensions}</div>
                <div className={debugInfo.boardManagerExists ? 'text-green-400' : 'text-red-400'}>
                    BoardManager: {debugInfo.boardManagerExists ? '✓' : '✗'}
                </div>
                <div className={debugInfo.gameExists ? 'text-green-400' : 'text-red-400'}>
                    Game: {debugInfo.gameExists ? '✓' : '✗'} (Status: {debugInfo.gameStatus})
                </div>
                <div>Players: {debugInfo.playerCount}</div>
                <div className={debugInfo.currentPlayerExists ? 'text-green-400' : 'text-red-400'}>
                    Current Player: {debugInfo.currentPlayerId}
                </div>
                
                {debugInfo.playerPositions.length > 0 && (
                    <div className="mt-2">
                        <div className="font-bold">Player Positions:</div>
                        {debugInfo.playerPositions.map(([playerId, position]) => (
                            <div key={playerId} className="ml-2">
                                {playerId.substring(0, 8)}...: Space {position}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Quick actions for testing */}
            <div className="mt-4 space-y-2">
                <button 
                    onClick={() => console.log('Board:', board)}
                    className="w-full px-2 py-1 bg-blue-600 rounded hover:bg-blue-700 text-xs"
                >
                    Log Board to Console
                </button>
                <button 
                    onClick={() => console.log('BoardManager:', boardManager)}
                    className="w-full px-2 py-1 bg-purple-600 rounded hover:bg-purple-700 text-xs"
                >
                    Log BoardManager to Console
                </button>
                <button 
                    onClick={() => console.log('Game:', game)}
                    className="w-full px-2 py-1 bg-green-600 rounded hover:bg-green-700 text-xs"
                >
                    Log Game to Console
                </button>
            </div>
        </div>
    );
};

export default BoardDebugPanel;