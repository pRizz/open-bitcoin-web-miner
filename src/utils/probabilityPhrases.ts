
interface RandomSelectionProbability {
    odds: string;
    oddsDenominator: number;
    description: string;
  }

const RANDOM_SELECTION_PROBABILITIES: RandomSelectionProbability[] = [
  { odds: "1 in 1 million", oddsDenominator: 1e6, description: "picking the correct resident of San Francisco (~1M people)" },
  { odds: "1 in 1 billion", oddsDenominator: 1e9, description: "picking the correct person on Earth (~8B people)" },
  { odds: "1 in 1 trillion", oddsDenominator: 1e12, description: "picking the correct grain of sand in a large sandbox (~1T grains)" },
  { odds: "1 in 1 quadrillion", oddsDenominator: 1e15, description: "picking the correct cell in a human body (~37T cells)" },
  { odds: "1 in 1 quintillion", oddsDenominator: 1e18, description: "picking the correct grain of sand on a small beach (~1 quintillion grains)" },
  { odds: "1 in 1 sextillion", oddsDenominator: 1e21, description: "picking the correct bacterium on Earth (~5 sextillion bacteria)" },
  { odds: "1 in 1 septillion", oddsDenominator: 1e24, description: "picking the correct star in the observable universe (~1 septillion stars)" },
  { odds: "1 in 1 octillion", oddsDenominator: 1e27, description: "picking the correct water molecule in a bathtub (~1 octillion molecules)" },
  { odds: "1 in 1 nonillion", oddsDenominator: 1e30, description: "picking the correct DNA base pair in all humans combined (~1 nonillion base pairs)" },
  { odds: "1 in 1 decillion", oddsDenominator: 1e33, description: "picking the correct atom in a grain of sand (~1 decillion atoms)" },
  { odds: "1 in 1 undecillion", oddsDenominator: 1e36, description: "picking the correct virus particle on Earth (~1 undecillion viruses)" },
  { odds: "1 in 1 duodecillion", oddsDenominator: 1e39, description: "picking the correct photon in a bright sunlight beam (~1 duodecillion photons)" },
  { odds: "1 in 1 tredecillion", oddsDenominator: 1e42, description: "picking the correct grain of sand from all beaches on Earth (~1 tredecillion grains)" },
  { odds: "1 in 1 quattuordecillion", oddsDenominator: 1e45, description: "picking the correct neutrino passing through your body (~1 quattuordecillion neutrinos per second)" },
  { odds: "1 in 1 quindecillion", oddsDenominator: 1e48, description: "picking the correct electron in the observable universe (~1 quindecillion electrons)" },
  { odds: "1 in 1 sexdecillion", oddsDenominator: 1e51, description: "picking the correct hydrogen atom in the entire Milky Way (~1 sexdecillion atoms)" }
];

const calculateProbability = (zeroes: number) => {
  return 1 / Math.pow(2, zeroes);
};

const findClosestComparison = (probability: number): RandomSelectionProbability | undefined => {
  const targetValue = 1 / probability;
  const targetLog = Math.log10(targetValue);

  return RANDOM_SELECTION_PROBABILITIES.reduce((closest, current) => {
    const currentDelta = Math.abs(Math.log10(current.oddsDenominator) - targetLog);
    const closestDelta = Math.abs(Math.log10(closest.oddsDenominator) - targetLog);
    return currentDelta < closestDelta ? current : closest;
  });
};

const getDescriptionPrefix = (probability: number, comparison: RandomSelectionProbability | undefined): string | undefined => {
  if (!comparison) {
    return undefined;
  }
  const comparisonProbability = 1 / comparison.oddsDenominator;
  if (probability < comparisonProbability) {
    console.log(`probability: ${probability}, comparison: ${comparisonProbability}`);
    return `That's harder than`;
  }
  return `That's like`;
};

export const getDescriptionStatement = (maybeRequiredBinaryZeroes: number | undefined): string | undefined => {
  const probability = maybeRequiredBinaryZeroes ? calculateProbability(maybeRequiredBinaryZeroes) : undefined;
  const comparison = probability ? findClosestComparison(probability) : undefined;
  const descriptionPrefix = probability ? getDescriptionPrefix(probability, comparison) : undefined;
  return comparison && `${descriptionPrefix} ${comparison.description}`;
};
