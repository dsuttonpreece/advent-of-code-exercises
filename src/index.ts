import source from "./source";

const sampleSource = `
two1nine
eightwothree
abcone2threexyz
xtwone3four
4nineeightseven2
zoneight234
7pqrstsixteen
`;

const digits = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

const lines = source.split("\n").filter(Boolean);

const calibrationValues = lines.map((line) => {
  const firstMatch = line.match(
    new RegExp(`([0-9]|${digits.join("|")}).*$`),
  )?.[1];
  const lastMatch = line.match(
    new RegExp(`^.*([0-9]|${digits.join("|")})`),
  )?.[1];

  if (!firstMatch || !lastMatch) {
    throw new Error(`Could not find a number in line: ${line}`);
  }

  const firstNumber = /\d/.test(firstMatch)
    ? firstMatch
    : digits.indexOf(firstMatch);
  const lastNumber = /\d/.test(lastMatch)
    ? lastMatch
    : digits.indexOf(lastMatch);

  return `${firstNumber}${lastNumber}`;
});

const total = calibrationValues.reduce((subtotal, value) => {
  console.log(value);
  const valueAsNumber = parseInt(value, 10);

  return subtotal + valueAsNumber;
}, 0);

console.log(total);
