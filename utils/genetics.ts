import { Genotype, Phenotype, Seed } from '../types';

// Helper to check if allele is dominant
const isDominant = (allele: string) => allele === allele.toUpperCase();

export const getPhenotype = (genotype: Genotype): Phenotype => {
  // Genotype format: 4 chars, e.g. "AaBb"
  // Index 0,1 are Height (A/a)
  // Index 2,3 are Shape (B/b)
  
  const hasDominantHeight = isDominant(genotype[0]) || isDominant(genotype[1]);
  const hasDominantShape = isDominant(genotype[2]) || isDominant(genotype[3]);

  return {
    height: hasDominantHeight ? 'High' : 'Short',
    shape: hasDominantShape ? 'Round' : 'Wrinkled',
  };
};

// Chinese Translation Helper
export const getPhenotypeLabel = (phenotype: Phenotype) => {
    return {
        height: phenotype.height === 'High' ? '高茎' : '矮茎',
        shape: phenotype.shape === 'Round' ? '圆粒' : '皱粒'
    };
};

export const createSeed = (genotype: Genotype, isRevealed = false, isTester = false): Seed => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    genotype,
    phenotype: getPhenotype(genotype),
    isRevealed,
    isTester,
  };
};

// Mendel's Laws Logic
export const performCross = (parent1: Genotype, parent2: Genotype): Genotype[] => {
  // We generate 4 offspring to simulate the 9:3:3:1 ratio or 1:2:1 better
  const offspring: Genotype[] = [];

  for (let i = 0; i < 4; i++) {
      // 1. Generate Gametes for Parent 1
      const p1_height = [parent1[0], parent1[1]];
      const p1_shape = [parent1[2], parent1[3]];
      const p1_gametes: string[] = [];
      p1_height.forEach(h => p1_shape.forEach(s => p1_gametes.push(h + s)));

      // 2. Generate Gametes for Parent 2
      const p2_height = [parent2[0], parent2[1]];
      const p2_shape = [parent2[2], parent2[3]];
      const p2_gametes: string[] = [];
      p2_height.forEach(h => p2_shape.forEach(s => p2_gametes.push(h + s)));

      // 3. Random fertilization (Select one gamete from each)
      const gamete1 = p1_gametes[Math.floor(Math.random() * p1_gametes.length)];
      const gamete2 = p2_gametes[Math.floor(Math.random() * p2_gametes.length)];

      // 4. Combine to form zygote
      // Sort height alleles (A first then a)
      const heightAlleles = [gamete1[0], gamete2[0]].sort();
      // Sort shape alleles (B first then b)
      const shapeAlleles = [gamete1[1], gamete2[1]].sort();

      offspring.push(heightAlleles.join('') + shapeAlleles.join(''));
  }

  return offspring;
};

export const getGeneticDescription = (genotype: Genotype) => {
    const isPureHeight = genotype[0] === genotype[1];
    const isPureShape = genotype[2] === genotype[3];
    
    if (isPureHeight && isPureShape) return "纯合子 (纯种)";
    if (!isPureHeight && !isPureShape) return "双杂合子";
    return "单杂合子";
};