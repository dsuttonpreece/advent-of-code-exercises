import { parseGames } from "./parseGames";
import source from "./source";

const demoSource = `
Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green
`;

const config = {
  red: 12,
  green: 13,
  blue: 14,
};

const lines = source.split("\n").filter(Boolean);

const parsedGames = parseGames(lines);

const onlyValidGames = parsedGames.filter((game) => {
  const largestMoves = game.moves.reduce(
    (acc, move) => ({
      red: Math.max(acc.red, move.red),
      green: Math.max(acc.green, move.green),
      blue: Math.max(acc.blue, move.blue),
    }),
    { red: 0, green: 0, blue: 0 },
  );

  return (
    largestMoves.red <= config.red &&
    largestMoves.green <= config.green &&
    largestMoves.blue <= config.blue
  );
});

console.log(onlyValidGames.reduce((total, { id }) => total + id, 0));
