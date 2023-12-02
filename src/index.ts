import source from './source'

const sampleSource = `
1abc2
pqr3stu8vwx
a1b2c3d4e5f
treb7uchet
`;

const lines = source.split("\n").filter(Boolean);

const calibrationValues = lines.map((line) => {
  const first = line.match(/^[^0-9]*([0-9])/)?.[1];
  const last = line.match(/([0-9])[^0-9]*$/)?.[1];

  return `${first}${last}`;
});

const total = calibrationValues.reduce((subtotal, value) => {
  console.log(value)
  const valueAsNumber = parseInt(value, 10);

  return subtotal + valueAsNumber;
}, 0);

console.log(total);
