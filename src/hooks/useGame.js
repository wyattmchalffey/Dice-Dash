import { useState, useEffect } from 'react';
import { GameService } from '../services/game-service';

export function useGame(gameId) {
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!gameId) return;

        const gameService = new GameService();
        const unsubscribe = gameService.subscribeToGame(gameId, (updatedGame) => {
            setGame(updatedGame);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [gameId]);

    return { game, loading, error };
}