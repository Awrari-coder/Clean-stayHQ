export const BASE_RATE_PER_SQFT = 0.10;
export const BATHROOM_FEE = 20;
export const BEDROOM_FEE = 15;
export const PET_FEE = 25;
export const RESTOCK_FEE = 15;
export const ROUND_TRIP_MULTIPLIER = 1.6;
export const ON_DEMAND_MULTIPLIER = 1.2;

export type CleaningType = 'post_checkout' | 'pre_checkout' | 'round_trip' | 'on_demand';

export interface QuoteInput {
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  hasPets: boolean;
  restockRequested: boolean;
  cleaningType: CleaningType;
}

export interface QuoteBreakdown {
  baseFromSqft: number;
  bathroomsFee: number;
  bedroomsFee: number;
  petFee: number;
  restockFee: number;
  cleaningTypeMultiplier: number;
  subtotal: number;
}

export interface QuoteResult {
  total: number;
  breakdown: QuoteBreakdown;
}

export function calculateCleaningQuote(input: QuoteInput): QuoteResult {
  const baseFromSqft = input.squareFeet * BASE_RATE_PER_SQFT;
  const bathroomsFee = input.bathrooms * BATHROOM_FEE;
  const bedroomsFee = input.bedrooms * BEDROOM_FEE;
  const petFee = input.hasPets ? PET_FEE : 0;
  const restockFee = input.restockRequested ? RESTOCK_FEE : 0;

  const subtotal = baseFromSqft + bathroomsFee + bedroomsFee + petFee + restockFee;

  let cleaningTypeMultiplier = 1;
  if (input.cleaningType === 'round_trip') {
    cleaningTypeMultiplier = ROUND_TRIP_MULTIPLIER;
  } else if (input.cleaningType === 'on_demand') {
    cleaningTypeMultiplier = ON_DEMAND_MULTIPLIER;
  }

  const total = Math.round(subtotal * cleaningTypeMultiplier * 100) / 100;

  return {
    total,
    breakdown: {
      baseFromSqft: Math.round(baseFromSqft * 100) / 100,
      bathroomsFee,
      bedroomsFee,
      petFee,
      restockFee,
      cleaningTypeMultiplier,
      subtotal: Math.round(subtotal * 100) / 100,
    },
  };
}

export function calculatePayoutAmount(quoteAmount: number): number {
  return Math.round(quoteAmount * 0.6 * 100) / 100;
}
