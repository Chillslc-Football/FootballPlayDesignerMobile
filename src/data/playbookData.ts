import { Play, PlayCategory } from '../types/playbook';

const runPlays: Play[] = [
  {
    id: '34-dive',
    name: '34 Dive',
    formation: 'I-Right',
    notes:
      'Weakside dive with the fullback leading on the Mike linebacker. RG and RT double the 3-tech. Halfback presses the hole and gets vertical.',
    assignments: [
      { position: 'QB', assignment: 'Open reverse pivot, secure mesh handoff to FB, carry out boot fake.' },
      { position: 'FB', assignment: 'Lead block on Mike LB; aim for inside shoulder.' },
      { position: 'HB', assignment: 'Take handoff at 6 yards deep, press weakside A-gap.' },
      { position: 'LT', assignment: 'Reach block on DE; sustain to whistle.' },
      { position: 'LG', assignment: 'Down block on 1-tech, climb to Will if free.' },
      { position: 'RG', assignment: 'Drive double with RT on 3-tech.' },
      { position: 'RT', assignment: 'Drive double with RG on 3-tech.' },
      { position: 'TE', assignment: 'Crack on Sam LB or force contain.' },
      { position: 'WR (X)', assignment: 'Stalk block on corner.' },
      { position: 'WR (Z)', assignment: 'Stalk block on safety.' },
    ],
  },
  {
    id: '35-dive',
    name: '35 Dive',
    formation: 'I-Left',
    notes:
      'Strong-side dive mirroring 34. Fullback leads on Will. Pulling guard wraps to second level if Mike is sealed.',
    assignments: [
      { position: 'QB', assignment: 'Reverse pivot, mesh to FB, boot fake away.' },
      { position: 'FB', assignment: 'Lead on Will LB through strongside A-gap.' },
      { position: 'HB', assignment: 'Follow FB downhill; one cut max.' },
      { position: 'LT', assignment: 'Down block on 1-tech.' },
      { position: 'LG', assignment: 'Pull and wrap to Mike at second level.' },
      { position: 'RG', assignment: 'Drive block on 3-tech with RT.' },
      { position: 'RT', assignment: 'Reach on DE.' },
      { position: 'TE', assignment: 'Arc release to Sam.' },
      { position: 'WR (X)', assignment: 'Block support safety.' },
      { position: 'WR (Z)', assignment: 'Crack on corner.' },
    ],
  },
  {
    id: 'power',
    name: 'Power',
    formation: 'Pro Right',
    notes:
      'Gap-scheme power with backside guard pulling for the play-side linebacker. Tight end kicks out the end man on the line.',
    assignments: [
      { position: 'QB', assignment: 'Reverse pivot, handoff to HB, boot fake.' },
      { position: 'HB', assignment: 'Press off-tackle hole behind pulling guard.' },
      { position: 'FB', assignment: 'Kick out or lead on first unblocked defender.' },
      { position: 'LT', assignment: 'Cutoff backside pursuit.' },
      { position: 'LG', assignment: 'Pull through hole; block play-side LB.' },
      { position: 'RG', assignment: 'Down block on 3-tech.' },
      { position: 'RT', assignment: 'Down block on 5-tech.' },
      { position: 'TE', assignment: 'Kick out EMOL (DE).' },
      { position: 'WR (X)', assignment: 'Stalk on corner.' },
      { position: 'WR (Z)', assignment: 'Block safety to boundary.' },
    ],
  },
  {
    id: 'counter',
    name: 'Counter',
    formation: 'Gun Trips Right',
    notes:
      'Counter trey with pulling guard and tackle. RB takes counter step then presses cutback lane behind double teams.',
    assignments: [
      { position: 'QB', assignment: 'Mesh with RB on counter step, boot away.' },
      { position: 'RB', assignment: 'Counter step, press B-gap cutback.' },
      { position: 'H', assignment: 'Kick out or lead on force player.' },
      { position: 'LT', assignment: 'Pull and wrap to second level.' },
      { position: 'LG', assignment: 'Pull and kick out EMOL.' },
      { position: 'RG', assignment: 'Down block 3-tech with RT.' },
      { position: 'RT', assignment: 'Down block 5-tech.' },
      { position: 'TE', assignment: 'Seal backside DE.' },
      { position: 'WR (X)', assignment: 'Crack on overhang.' },
      { position: 'WR (Z)', assignment: 'Block safety.' },
    ],
  },
  {
    id: 'sweep',
    name: 'Sweep',
    formation: 'Spread Right',
    notes:
      'Wide zone stretch to the field. Receivers block support; back presses edge and reads force player.',
    assignments: [
      { position: 'QB', assignment: 'Open flat, pitch to RB on sweep path.' },
      { position: 'RB', assignment: 'Press outside hip of TE, read force.' },
      { position: 'LT', assignment: 'Reach and climb to linebacker.' },
      { position: 'LG', assignment: 'Reach 1-tech, work to second level.' },
      { position: 'RG', assignment: 'Reach 3-tech.' },
      { position: 'RT', assignment: 'Reach 5-tech.' },
      { position: 'TE', assignment: 'Arc to Sam or force player.' },
      { position: 'WR (X)', assignment: 'Block corner at line of scrimmage.' },
      { position: 'WR (Z)', assignment: 'Block safety to sideline.' },
      { position: 'WR (H)', assignment: 'Crack on nickel.' },
    ],
  },
];

const passPlays: Play[] = [
  {
    id: 'mesh-concept',
    name: 'Mesh',
    formation: 'Trips Right',
    notes: 'Hi-low mesh with shallow crossers at 6 yards. QB reads middle hook to flat.',
    assignments: [
      { position: 'QB', assignment: 'Read mesh to flat; throw on rhythm.' },
      { position: 'X', assignment: 'Shallow cross at 6 yards.' },
      { position: 'H', assignment: 'Mesh cross opposite X.' },
      { position: 'Z', assignment: 'Corner route at 12 yards.' },
      { position: 'RB', assignment: 'Check swing to flat.' },
    ],
  },
  {
    id: 'four-verticals',
    name: 'Four Verticals',
    formation: 'Spread',
    notes: 'Seam reads vs Cover 2/3. QB works inside-out on safeties.',
    assignments: [
      { position: 'QB', assignment: 'Read seams and dig; take what defense gives.' },
      { position: 'X', assignment: 'Go route.' },
      { position: 'H', assignment: 'Seam.' },
      { position: 'Z', assignment: 'Go route.' },
      { position: 'Y', assignment: 'Seam or dig based on coverage.' },
    ],
  },
];

const rpoPlays: Play[] = [
  {
    id: 'zone-rpo',
    name: 'Inside Zone RPO',
    formation: 'Gun 2x2',
    notes: 'Inside zone with bubble conflict key. QB reads flat defender.',
    assignments: [
      { position: 'QB', assignment: 'Mesh zone read; throw bubble if flat widens.' },
      { position: 'RB', assignment: 'Inside zone track.' },
      { position: 'H', assignment: 'Quick bubble.' },
      { position: 'OL', assignment: 'Zone combo blocks; no climb past LB on RPO.' },
    ],
  },
];

const redZonePlays: Play[] = [
  {
    id: 'stick',
    name: 'Stick',
    formation: 'Trips Right',
    notes: 'Quick game stick route with flat check. Primary in compressed field.',
    assignments: [
      { position: 'QB', assignment: 'One-step drop; hit stick or flat.' },
      { position: 'H', assignment: 'Stick at 5 yards.' },
      { position: 'RB', assignment: 'Flat route.' },
    ],
  },
];

const goalLinePlays: Play[] = [
  {
    id: 'qb-sneak',
    name: 'QB Sneak',
    formation: 'Heavy Right',
    notes: 'Short-yardage sneak behind center push. Silent cadence preferred.',
    assignments: [
      { position: 'QB', assignment: 'Quick snap; follow center gap.' },
      { position: 'OL', assignment: 'Low pad level; vertical push.' },
      { position: 'FB', assignment: 'Lead on first linebacker.' },
    ],
  },
];

export const playbookCategories: PlayCategory[] = [
  {
    id: 'offense',
    name: 'Offense',
    icon: '🏈',
    subcategories: [
      { id: 'run-plays', name: 'Run Plays', plays: runPlays },
      { id: 'pass-plays', name: 'Pass Plays', plays: passPlays },
      { id: 'rpo', name: 'RPO', plays: rpoPlays },
      { id: 'red-zone', name: 'Red Zone', plays: redZonePlays },
      { id: 'goal-line', name: 'Goal Line', plays: goalLinePlays },
    ],
  },
  {
    id: 'defense',
    name: 'Defense',
    icon: '🛡️',
    subcategories: [
      {
        id: 'fronts',
        name: 'Fronts',
        plays: [
          {
            id: '43-over',
            name: '4-3 Over',
            formation: 'Base',
            notes: 'Over front with 3-tech to strong side. Linebackers align off EMOL.',
            assignments: [
              { position: 'DE (Strong)', assignment: 'Set edge; contain rush.' },
              { position: 'DT (3-tech)', assignment: 'Penetrate B-gap.' },
              { position: 'Mike', assignment: 'Fit A-gap; scrape to flow.' },
            ],
          },
        ],
      },
      {
        id: 'coverages',
        name: 'Coverages',
        plays: [
          {
            id: 'cover-3',
            name: 'Cover 3',
            formation: 'Nickel',
            notes: 'Three deep, four under. Corners match flats; free safety middle third.',
            assignments: [
              { position: 'FS', assignment: 'Middle third depth at 12-15 yards.' },
              { position: 'CB', assignment: 'Cloud flat technique.' },
              { position: 'Mike', assignment: 'Hook/curl #3 receiver.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'special-teams',
    name: 'Special Teams',
    icon: '🎯',
    subcategories: [
      {
        id: 'kickoff',
        name: 'Kickoff',
        plays: [
          {
            id: 'kickoff-left',
            name: 'Kickoff Left',
            formation: 'Kickoff Unit',
            notes: 'Directional kick to left hash. Cover lanes with sprint discipline.',
            assignments: [
              { position: 'K', assignment: 'Drive ball to left numbers; hang time 3.8+.' },
              { position: 'L1-L5', assignment: 'Maintain lane integrity to ball.' },
            ],
          },
        ],
      },
      {
        id: 'punt',
        name: 'Punt',
        plays: [
          {
            id: 'spread-punt',
            name: 'Spread Punt',
            formation: 'Punt',
            notes: 'Spread protection with gunners releasing early.',
            assignments: [
              { position: 'P', assignment: 'Directional punt away from returner.' },
              { position: 'Gunners', assignment: 'Release and contain return.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'favorites',
    name: 'Favorites',
    icon: '⭐',
    subcategories: [
      {
        id: 'saved-plays',
        name: 'Saved Plays',
        plays: [runPlays[0], runPlays[2], passPlays[0]],
      },
    ],
  },
];

export function getCategoryById(categoryId: string): PlayCategory | undefined {
  return playbookCategories.find((category) => category.id === categoryId);
}

export function getSubcategoryById(categoryId: string, subcategoryId: string) {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find((subcategory) => subcategory.id === subcategoryId);
}

export function getPlayById(playId: string): Play | undefined {
  for (const category of playbookCategories) {
    for (const subcategory of category.subcategories) {
      const play = subcategory.plays.find((item) => item.id === playId);
      if (play) {
        return play;
      }
    }
  }
  return undefined;
}
