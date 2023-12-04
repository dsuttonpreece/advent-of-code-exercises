interface GameMove {
  red: number;
  green: number;
  blue: number;
}

interface ParsedGame {
  id: number;
  moves: GameMove[];
}

export const parseGames = (gamesRaw: string[]): ParsedGame[] =>
  gamesRaw.map((gameRaw): ParsedGame => {
    const [gameName, gameData] = gameRaw.split(/: */);

    if (!gameName || !gameData) {
      throw "Line did not match expected format (e.g. '<game_name>: <game_data>')";
    }

    const gameId = gameName.match(/(\d+)/)?.[1];

    if (!gameId) {
      throw "Game name is missing a number (e.g. 'Game <game_id>')";
    }

    const id = parseInt(gameId, 10);

    const parsedMoves = gameData.split(/; */).map((moveRaw) => {
      const colourGroups = moveRaw.split(/, */);

      const parsedMove = colourGroups.reduce(
        (move, colourGroupRaw) => {
          const [, countRaw, color] =
            colourGroupRaw.match(/(\d+) +(\w+)/) || [];

          if (!countRaw || !color) {
            throw "Colour group did not match expected format (e.g. '<count> <color_label>')";
          }

          const count = parseInt(countRaw, 10);

          if (isNaN(count)) {
            throw "Colour group count is not a number";
          }

          return { ...move, [color]: count };
        },
        { red: 0, green: 0, blue: 0 },
      );

      return parsedMove;
    });

    return { id, moves: parsedMoves };
  });
