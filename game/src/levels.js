// SHADOW VAULT — level data. Three hand-built vault floors, drawn from tile rows.
// Legend: # = shelf/wall (cover, blocks sight), . = marble floor, , = shadow rug
// (hiding in shadow slows detection hard), L = lantern light pool (detection is
// faster here), P = player start, E = exit door, R = relic, o = coin stash.
export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;

export const LEVELS = [
  {
    name: 'Floor I — The Reading Room',
    tip: 'Cross the lantern light quickly, or crawl through the shadow rugs. Shift = sneak, Ctrl/Space hold = crawl.',
    rows: [
      '########################',
      '#P....#.......#........#',
      '#.##..#..LLL..#..####..#',
      '#.##..#..LLL..#........#',
      '#.....#.......#..##....#',
      '#..,,....R....#..##..o.#',
      '#..,,..#####..#........#',
      '#......#...#..####..####',
      '#.####.#...#.....#.....E',
      '#....#.....#####.#.#####',
      '#....#..o......#.#.....#',
      '#.####..####...#.#..R..#',
      '#......,,..#.......#...#',
      '#..R...,,..#....o......#',
      '########################',
    ],
    guards: [
      { path: [[5, 1], [5, 6], [2, 6], [2, 1]], speed: 52 },
      { path: [[12, 3], [12, 10], [17, 10], [17, 3]], speed: 58 },
      { path: [[20, 12], [22, 12], [22, 7], [20, 7]], speed: 48 },
    ],
  },
  {
    name: 'Floor II — The Lantern Gallery',
    tip: 'Throw a coin (click or Q) to pull a guard off his patrol. Footsteps on marble carry — crawl past sleepers.',
    rows: [
      '########################',
      '#P..#........#.........#',
      '#...#..####..#..####...#',
      '#...#..#..#..#..#..#...#',
      '#......#..#.....#..#..R#',
      '####..##..#####.##.....#',
      '#......,,......,,..##..#',
      '#..##..,,..R...,,..##..#',
      '#..##..................#',
      '#.....####..#####..#...#',
      '#.o...#..#..#...#..#.#.#',
      '#.....#..#..#...#....#.#',
      '#..######..#..####...#.#',
      '#..R....o......E.......#',
      '########################',
    ],
    guards: [
      { path: [[6, 1], [11, 1], [11, 5], [6, 5]], speed: 62 },
      { path: [[15, 8], [21, 8], [21, 12], [15, 12]], speed: 66 },
      { path: [[3, 10], [3, 13], [9, 13], [9, 10]], speed: 56 },
      { path: [[19, 2], [22, 2], [22, 5], [19, 5]], speed: 72 },
    ],
  },
  {
    name: 'Floor III — The Vault of Dawn',
    tip: 'The Dawn Wardens scan as they pause. Chain coin throws, hug the shelves, and ghost the last door.',
    rows: [
      '########################',
      '#P.#......#......#....E#',
      '#..#..##..#..##..#..####',
      '#..#..##..#..##..#.....#',
      '#.....##.....##..###.#.#',
      '#.####..##..##......#..#',
      '#....#..,,..,,..##..#..#',
      '#.R..#..,,..,,..##.....#',
      '#....####..####..######.#',
      '#.o......#....#........#',
      '#..####..#..R.#..####..#',
      '#.....#..#....#..#..#..#',
      '#.##..#..####.#..#..#..#',
      '#..R..#..o......#....R.#',
      '########################',
    ],
    guards: [
      { path: [[4, 4], [9, 4], [9, 8], [4, 8]], speed: 74, scan: true },
      { path: [[13, 1], [17, 1], [17, 6], [13, 6]], speed: 78, scan: true },
      { path: [[11, 10], [11, 13], [18, 13], [18, 10]], speed: 70, scan: true },
      { path: [[21, 8], [21, 12], [19, 12], [19, 8]], speed: 84, scan: true },
      { path: [[6, 12], [2, 12], [2, 9], [6, 9]], speed: 66, scan: true },
    ],
  },
];
