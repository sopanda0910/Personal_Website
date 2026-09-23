// All site content lives here. Edit this file to update the website.

export const profile = {
  name: 'Shivam Panda',
  first: 'SHIVAM',
  last: 'PANDA',
  role: 'Physics @ Oxford',
  location: 'Oxford, UK',
  email: 'ompanda0910@gmail.com',
  github: 'https://github.com/sopanda0910',
  linkedin: 'https://www.linkedin.com/in/shivam-panda-072971321/',
  // PDF in /public. Set to null to hide the résumé buttons.
  resume: 'Shivam-Panda-Resume.pdf' as string | null,
  lede:
    'Physics student at the University of Oxford. I work on machine learning for lattice gauge theory, help pick out the light from neutron-star mergers, and do quantitative research. I also design suspension for Oxford’s Formula Student car.',
}

// The repo this site deploys from.
export const site = {
  repo: { owner: 'sopanda0910', name: 'Personal_Website', branch: 'main' },
}

export const SECTIONS = [
  { id: 'about', label: 'About', short: 'About' },
  { id: 'work', label: 'Work', short: 'Work' },
  { id: 'projects', label: 'Projects', short: 'Build' },
  { id: 'education', label: 'Education', short: 'Edu' },
  { id: 'writing', label: 'Blog', short: 'Blog' },
  { id: 'contact', label: 'Contact', short: 'Hello' },
]

// What I'm working on, shown under the hero.
export const focus = [
  { word: 'Lattice', label: 'Diffusion models for gauge theory' },
  { word: 'Astro', label: 'Kilonova scoring for TROVE' },
  { word: 'Quant', label: 'Research at two startups' },
  { word: 'Racing', label: 'Suspension for Formula Student' },
]

export const spec: [string, string][] = [
  ['Model', 'Shivam Panda'],
  ['Firmware', 'MPhys Physics · University College, Oxford'],
  ['Build', '2025 → 2029'],
  ['Location', 'Oxford, UK · Troy, MI'],
  ['Core', 'Python · PyTorch · NumPy/SciPy · TypeScript/React'],
  ['Methods', 'Generative models · Monte Carlo methods (MCMC, HMC) · statistical modelling'],
  ['Peripherals', 'Fusion 360 · Onshape · MATLAB · Postgres · LaTeX'],
  ['Status', 'Online'],
]

export const about = [
  'I like problems where the physics and the computation both have to be right. This summer, that meant teaching a diffusion model to run the renormalisation group backwards and rewriting part of a kilonova-scoring pipeline so that it gives exact answers instead of noisy estimates.',
  'Before Oxford, I was valedictorian at International Academy East, technical captain of its FIRST Robotics team, and dual-enrolled at Washtenaw Community College. I now also lead wheel assembly for Oxford University Racing and tutor students preparing for the ESAT and Oxbridge interviews.',
]

export type Link = { label: string; url: string }

export type Experience = {
  org: string
  role: string
  where: string
  when: string
  kind: 'Research' | 'Quant' | 'Engineering' | 'Teaching'
  collab?: string
  did: string
  learned?: string
  links?: Link[]
}

export const experience: Experience[] = [
  {
    org: 'Lattice Gauge Theory',
    role: 'Diffusion models for configuration generation',
    collab: 'with Jinchen He (Fermilab) & Yong Zhao (Argonne)',
    where: 'Remote',
    when: 'Summer 2026',
    kind: 'Research',
    did: 'Simulations of gauge theories get stuck as the lattice gets finer: the Markov chain stops moving between topological sectors. I built a gauge-covariant diffusion model that runs one step of the renormalisation group in reverse, turning a coarse configuration into a fine one, so the simulation can start close to equilibrium instead of from scratch. I tested it on 2D U(1) and U(2) gauge theories against exact results, and I am first author on the resulting paper draft.',
    learned: 'How to make a generative model respect a symmetry exactly, and how to design checks that tell a genuinely correct sampler apart from one that only looks converged.',
    links: [{ label: 'Code', url: 'https://github.com/sopanda0910/inverse_rg_testing' }],
  },
  {
    org: 'Northwestern University · CIERA',
    role: 'Undergraduate Researcher',
    collab: 'advised by Prof. Wen-fai Fong',
    where: 'Evanston, IL',
    when: 'Summer 2026',
    kind: 'Research',
    did: 'When LIGO detects a neutron-star merger, telescopes find hundreds of candidate flashes, and someone has to decide which one could be the kilonova. I worked on KilonovaSCORER, which ranks candidates by comparing them with simulated kilonova light curves. I replaced its Monte Carlo core with an exact closed-form expression, which made the scores deterministic and the pipeline several times faster, and I fixed how scores from different nights are combined. I also helped bring TROVE, a platform for vetting gravitational-wave counterparts, to its beta release, added scoring for AGN flares caused by black-hole mergers, and presented my distance-scoring work at the Rubin Community Workshop.',
    learned: 'How to read a research codebase closely enough to rewrite its maths safely, and how much of multi-messenger astronomy comes down to careful statistics under time pressure.',
    links: [
      { label: 'TROVE', url: 'https://datatrove.as.arizona.edu/' },
      { label: 'TROVE code', url: 'https://github.com/astro-trove/candidate_vetting' },
      { label: 'KilonovaSCORER', url: 'https://github.com/phelipedarc/KilonovaSCORER' },
    ],
  },
  {
    org: 'Golden Road',
    role: 'Quantitative Research Assistant',
    collab: 'GPU compute futures & perpetuals exchange',
    where: 'Remote',
    when: 'Jun – Aug 2026',
    kind: 'Quant',
    did: 'I did quantitative research for an early-stage exchange that is building markets for GPU compute, working with the team on analysis that fed into its products.',
    learned: 'How ideas from finance carry over to a brand-new market, and how research becomes production code in a small, fast-moving team.',
  },
  {
    org: 'AITHORA',
    role: 'Quantitative Research Assistant',
    collab: 'Senior-care intelligence platform',
    where: 'Remote',
    when: 'Aug 2026 – Now',
    kind: 'Quant',
    did: 'I do statistical modelling for a startup building data tools for the senior-care sector, and I contribute to the product through reviewed code.',
    learned: 'How to work inside a production codebase, and how to explain uncertainty to people who have to make decisions with it.',
  },
  {
    org: 'Oxford University Racing',
    role: 'Wheel Assembly Chief',
    collab: 'Formula Student',
    where: 'Oxford, UK',
    when: 'Oct 2025 – Now',
    kind: 'Engineering',
    did: 'I lead the wheel assembly team for the 2026 car and designed its suspension and steering geometry. I traced the previous car’s heavy steering to the geometry of its steering axis and redesigned that axis. I also sized the springs and rockers and engineered the team’s first anti-roll bar, using a Python sweep to choose its materials and geometry.',
    learned: 'How to turn physics into parts that can actually be machined, and how to make design decisions with a team and a deadline.',
  },
  {
    org: 'TutorChase',
    role: 'ESAT & Oxbridge Interview Tutor',
    where: 'Remote',
    when: 'Apr 2026 – Now',
    kind: 'Teaching',
    did: 'I prepare students for the ESAT admissions test and Oxbridge science interviews by designing problem sets, running mock interviews, and giving structured feedback.',
    learned: 'How to explain an idea three different ways until one of them lands.',
  },
]

export type Category = 'Physics' | 'Astro' | 'Software' | 'Engineering'

export type Project = {
  title: string
  blurb: string
  category: Category
  tags: string[]
  repo?: string
}

export const projects: Project[] = [
  {
    title: 'InverseRG',
    blurb:
      'A score-based diffusion model that turns coarse 2D U(1) lattice configurations into fine ones. It is wrapped in exact Markov-chain corrections, so large lattices can be sampled without getting stuck in a single topological sector.',
    category: 'Physics',
    tags: ['PyTorch', 'Diffusion', 'HMC', 'Lattice'],
    repo: 'https://github.com/sopanda0910/inverse_rg_testing',
  },
  {
    title: 'sensgen',
    blurb:
      'Generates lattice configurations biased toward a chosen topological charge, with an exactly known probability density. Reweighting a ladder of these biased ensembles rebuilds the full charge distribution, including sectors that ordinary HMC never reaches.',
    category: 'Physics',
    tags: ['Importance sampling', 'Topology', 'SciPy'],
    repo: 'https://github.com/sopanda0910/sensitivity-generation',
  },
  {
    title: 'KilonovaSCORER',
    blurb:
      'Ranks optical transients by how well they match simulated kilonova light curves, to identify neutron-star-merger counterparts early. I rewrote its scoring core as an exact closed-form expression and fixed how scores from different nights are combined.',
    category: 'Astro',
    tags: ['Statistics', 'Kilonova', 'TROVE'],
    repo: 'https://github.com/phelipedarc/KilonovaSCORER',
  },
  {
    title: 'Rubin ToO Budget',
    blurb:
      'Re-examines how much telescope time the Vera C. Rubin Observatory should spend following up gravitational-wave alerts, by replaying real LIGO alerts through its scheduler. The published assumptions turn out not to reproduce the published time budget.',
    category: 'Astro',
    tags: ['rubin-scheduler', 'GraceDB', 'HEALPix'],
    repo: 'https://github.com/sopanda0910/ToO-adaptive-thresholds',
  },
  {
    title: 'Distance Scoring',
    blurb:
      'How well does a transient’s distance agree with the distance inferred from a gravitational-wave signal? This project compares several ways of scoring the overlap between the two distributions and tests them on real events. Presented at the Rubin Community Workshop.',
    category: 'Astro',
    tags: ['Statistics', 'Kilonova', 'Jupyter'],
    repo: 'https://github.com/sopanda0910/distance-scoring-tests',
  },
  {
    title: 'TROVE Correlations',
    blurb:
      'Examines how TROVE’s kilonova sub-scores relate to one another. The correlations turn out to be inflated by the way the final score is constructed, and the analysis proposes a fix.',
    category: 'Astro',
    tags: ['pandas', 'Time series'],
    repo: 'https://github.com/sopanda0910/TROVE-Correlations-Analysis',
  },
  {
    title: 'Inkwell',
    blurb:
      'Handwriting portfolios for K–5 teachers. A single photo of a class’s work is split by student, transcribed by an LLM, and measured for legibility with OpenCV, with the teacher always in the loop.',
    category: 'Software',
    tags: ['FastAPI', 'OpenCV', 'React + TS', 'LLMs'],
    repo: 'https://github.com/sopanda0910/handwriting',
  },
  {
    title: 'FS Anti-Roll Bar',
    blurb:
      'Oxford University Racing’s first anti-roll bar: load-transfer calculations, a Python sweep over materials and geometry, adjustable rockers, and CAM toolpaths for milling the parts.',
    category: 'Engineering',
    tags: ['Fusion 360', 'CAM', 'Python'],
  },
  {
    title: 'Physics Sims',
    blurb:
      'Hobby simulations: a chaotic double pendulum derived from the Euler–Lagrange equations, normal modes of coupled masses, binary and open orbits, and orbital impulse burns.',
    category: 'Physics',
    tags: ['VPython', 'matplotlib'],
    repo: 'https://github.com/sopanda0910/physics_sims',
  },
]

export const archive = [
  { title: 'Lattice QCD notes', note: 'Metropolis, VEGAS, and toy gauge and fermion models', repo: 'https://github.com/sopanda0910/lattice_qcd_notes' },
  { title: 'Numerical methods', note: 'Worked notes on Berkeley’s Python Numerical Methods', repo: 'https://github.com/sopanda0910/berkley_numerical_techniques' },
  { title: 'TROVE starter', note: 'A first pass at analysing kilonova sub-scores', repo: 'https://github.com/sopanda0910/TROVE-Starter-Project' },
]

export const education = [
  {
    school: 'University of Oxford',
    sub: 'University College · MPhys Physics',
    when: '2025 – 2029',
    points: ['Prelims: ranked 3rd of 166', 'Commendation for Practical Work', '2026 Classical Mechanics Hall of Fame'],
  },
  {
    school: 'International Academy East',
    sub: 'IB Diploma · Troy, MI',
    when: '2022 – 2025',
    points: ['IB: 42/45', 'Valedictorian', 'Chemistry Department Award', 'FIRST Robotics technical captain', 'Dean’s List semi-finalist'],
  },
  {
    school: 'Washtenaw Community College',
    sub: 'Dual-enrolled · Ann Arbor, MI',
    when: '2023 – 2024',
    points: ['4.0 GPA', 'Multivariable calculus, differential equations, and linear algebra'],
  },
]
