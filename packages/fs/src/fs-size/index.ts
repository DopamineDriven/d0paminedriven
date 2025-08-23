import { statSync } from "fs";
import { relative } from "path";
import type { SizeOpts, Unit } from "@/types/index.ts";
import { FsAtomic } from "@/fs-atomic/index.ts";
import { unitsObj } from "@/types/index.ts";

export class FsSize extends FsAtomic {
  constructor(public override cwd: string) {
    super((cwd ??= process.cwd()));
  }

  private units = unitsObj;
  private u = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

  public autoFileSizeRaw(size: number | bigint) {
    let s = typeof size === "bigint" ? Number(size) : size;
    let i = 0;
    while (s >= 1024 && i < this.u.length - 1) {
      s /= 1024;
      i++;
    }
    return { value: s, unit: this.u[i] };
  }

  public getSize<const S extends Unit | Lowercase<Unit> | "auto">(
    size: number | bigint,
    target: S,
    opts: SizeOpts = { decimals: 4, includeUnits: true }
  ) {
    const { decimals, includeUnits } = opts;

    if (target === "auto") {
      const { value, unit } = this.autoFileSizeRaw(size);
      const rounded = value.toFixed(decimals);
      return includeUnits ? `${rounded} ${unit}` : Number.parseFloat(rounded);
    }

    const key = (
      target as Exclude<S, "auto">
    ).toUpperCase() as keyof typeof this.units;
    const exp = this.units[key];
    const divisor =
      typeof size === "bigint" ? 1024n ** BigInt(exp) : 1024 ** exp;
    let v = 0;
    if (typeof size === "bigint" || typeof divisor === "bigint") {
      if (typeof size === "bigint" && typeof divisor === "bigint")
        v = Number(size / divisor);
      else if (typeof size !== "bigint" && typeof divisor === "bigint")
        v = size / Number(divisor);
      else if (typeof size === "bigint" && typeof divisor !== "bigint")
        v = Number(size) / divisor;
    } else if (typeof size === "number" && typeof divisor === "number") {
      v = size / divisor;
    }
    const rounded = v.toFixed(decimals);

    return includeUnits
      ? (`${rounded} ${key}` as const)
      : Number.parseFloat(rounded);
  }

  public fileSizeMb<const T extends string>(path: T) {
    return statSync(relative(this.cwd, path)).size / (1024 * 1024);
  }

  public fileSize<
    const T extends string,
    const S extends Unit | Lowercase<Unit> | "auto"
  >(path: T, target: S, opts?: SizeOpts) {
    if (!this.exists(path)) throw new Error(`path ${path} does not exist`);
    else {
      return this.getSize(
        statSync(relative(this.cwd, path)).size,
        target,
        opts
      );
    }
  }
}
