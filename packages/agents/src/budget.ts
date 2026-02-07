export class BudgetTracker {
  private spent = 0;
  private readonly maxBudget: number;

  constructor(maxBudgetUsd: number) {
    this.maxBudget = maxBudgetUsd;
  }

  get totalSpent(): number {
    return this.spent;
  }

  get remaining(): number {
    return this.maxBudget - this.spent;
  }

  get isOverBudget(): boolean {
    return this.spent >= this.maxBudget;
  }

  addCost(usd: number): void {
    this.spent = this.spent + usd;
  }

  canAfford(estimatedCostUsd: number): boolean {
    return this.spent + estimatedCostUsd <= this.maxBudget;
  }

  reset(): void {
    this.spent = 0;
  }
}
