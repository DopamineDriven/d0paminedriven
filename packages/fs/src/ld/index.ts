import { Extract } from "@/extract/index.ts";

export class LevenshteinDistance extends Extract {
  constructor() {
    super();
  }
  private createMatrix(rows: number, cols: number, initialValue: number) {
    const matrix = Array.of<number[]>();
    for (let r = 0; r < rows; r++) {
      const row = new Array<number>(cols).fill(initialValue);
      matrix.push(row);
    }
    return matrix satisfies number[][];
  }
  private inBounds(matrix: number[][], row: number, col: number) {
    if (!matrix[row]) return false;
    return (
      row >= 0 && row < matrix.length && col >= 0 && col < matrix[row].length
    );
  }
  private getCell(matrix: number[][], row: number, col: number) {
    if (!matrix[row]) {
      throw new Error(`getRow: row does not exist`);
    }
    if (!this.inBounds(matrix, row, col) || !matrix[row][col]) return 0;
    return matrix[row][col];
  }

  private setCell(
    matrix: number[][],
    row: number,
    col: number,
    value: number
  ): boolean {
    if (!matrix[row]) return false;
    if (!this.inBounds(matrix, row, col)) {
      return false;
    }
    matrix[row][col] = value;
    return true;
  }
  /**
   * Computes the Levenshtein distance between two strings, i.e.,
   * the minimum number of single-character edits (insertions,
   * deletions, or substitutions) needed to transform `a` into `b`.
   */
  public calculateLD(a?: string | null, b?: string | null) {
    const strA = a ?? "";
    const strB = b ?? "";

    // Build the DP matrix of size (strA.length+1) x (strB.length+1).
    const dp = this.createMatrix(strA.length + 1, strB.length + 1, 0);

    // Fill the dp matrix
    for (let i = 0; i < dp.length; i++) {
      for (let j = 0; j < (dp[i] ?? []).length; j++) {
        if (i === 0) {
          // If first row => cost = j (all insertions)
          this.setCell(dp, i, j, j);
        } else if (j === 0) {
          // If first column => cost = i (all deletions)
          this.setCell(dp, i, j, i);
        } else {
          // Compare the characters from strA, strB
          const charA = strA[i - 1];
          const charB = strB[j - 1];

          if (charA === charB) {
            // Characters match => copy diagonal
            const diag = this.getCell(dp, i - 1, j - 1);
            this.setCell(dp, i, j, diag);
          } else {
            // If different => 1 + min(deletion, insertion, substitution)
            const top = this.getCell(dp, i - 1, j); // deletion
            const left = this.getCell(dp, i, j - 1); // insertion
            const diag = this.getCell(dp, i - 1, j - 1); // substitution
            const val = 1 + Math.min(top, left, diag);
            this.setCell(dp, i, j, val);
          }
        }
      }
    }

    // return bottom-right cell eg, dp[strA.length][strB.length]
    return this.getCell(dp, strA.length, strB.length);
  }
}
