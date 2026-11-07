// shared helpers

// repeatable random numbers
export function seeded(seed = 1): () => number {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function withDefaults<D extends object, O extends object>(defaults: D, options: O): D & O {
  const set = Object.entries(options).filter(([, v]) => v !== undefined);
  return { ...defaults, ...Object.fromEntries(set) } as D & O;
}
