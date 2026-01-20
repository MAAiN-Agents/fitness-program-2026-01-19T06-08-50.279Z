export default function(server) {
  const weekId = 'week1';

  server.create('week', {
    id: weekId,
    startDate: '2024-06-10',
    endDate: '2024-06-16',
    label: 'Week 1',
  });

  const sessions = [
    { id: 's1', day: 'Monday', time: 'AM', label: 'Yoga Core' },
    { id: 's2', day: 'Monday', time: 'PM', label: 'Warmup' },
    { id: 's3', day: 'Monday', time: 'PM', label: 'Calestenics' },
    { id: 's4', day: 'Tuesday', time: 'AM', label: 'Yoga Quick AM' },
    { id: 's5', day: 'Tuesday', time: 'AM', label: 'Yoga Stretch' },
    { id: 's6', day: 'Tuesday', time: 'PM', label: 'Warmup' },
    { id: 's7', day: 'Tuesday', time: 'PM', label: 'Calestenics' },
    { id: 's8', day: 'Wednesday', time: 'AM', label: 'Yoga Balance' },
    { id: 's9', day: 'Wednesday', time: 'PM', label: 'Warmup' },
    { id: 's10', day: 'Wednesday', time: 'PM', label: 'Calestenics' },
    { id: 's11', day: 'Thursday', time: 'AM', label: 'Yoga Quick AM' },
    { id: 's12', day: 'Thursday', time: 'AM', label: 'Yoga Flow' },
    { id: 's13', day: 'Thursday', time: 'PM', label: 'Warmup' },
    { id: 's14', day: 'Thursday', time: 'PM', label: 'Calestenics' },
    { id: 's15', day: 'Friday', time: 'AM', label: 'Yoga Flow on the Go' },
    { id: 's16', day: 'Friday', time: 'PM', label: 'Warmup' },
    { id: 's17', day: 'Friday', time: 'PM', label: 'Calestenics' },
    { id: 's18', day: 'Saturday', time: 'AM', label: 'Yoga Quick AM' },
    { id: 's19', day: 'Saturday', time: 'AM', label: 'Yoga Chill' },
    { id: 's20', day: 'Saturday', time: 'PM', label: 'Warmup' },
    { id: 's21', day: 'Saturday', time: 'PM', label: 'Calestenics' },
  ];

  sessions.forEach(session => {
    server.create('session', {
      id: session.id,
      weekId,
      day: session.day,
      time: session.time,
      label: session.label,
    });
  });

  let entryId = 1;
  const createEntry = (sessionId, exerciseId, sets) => {
    server.create('exerciseEntry', {
      id: `e${entryId++}`,
      sessionId,
      exerciseId,
      sets,
    });
  };

  const warmupExercises = ['ex8', 'ex10', 'ex11', 'ex12'];
  const calestenicsExercises = ['ex21', 'ex22', 'ex23', 'ex24', 'ex25', 'ex26', 'ex27', 'ex28', 'ex1'];
  const makeSets = (count, base) => Array.from({ length: count }, () => ({ ...base }));

  createEntry('s1', 'ex6', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 30, unit: 'min' } },
  ]);
  warmupExercises.forEach(exId => {
    createEntry('s2', exId, [{ weight: 0, reps: 10, rpe: 0 }]);
  });
  calestenicsExercises.forEach(exId => {
    const rpe = exId === 'ex1' ? 6 : 0;
    createEntry('s3', exId, makeSets(3, { weight: 0, reps: 30, rpe }));
  });

  createEntry('s4', 'ex3', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 10, unit: 'min' } },
  ]);
  createEntry('s5', 'ex30', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 30, unit: 'min' } },
  ]);
  warmupExercises.forEach(exId => {
    createEntry('s6', exId, [{ weight: 0, reps: 10, rpe: 0 }]);
  });
  calestenicsExercises.forEach(exId => {
    const rpe = exId === 'ex1' ? 6 : 0;
    createEntry('s7', exId, makeSets(3, { weight: 0, reps: 30, rpe }));
  });

  createEntry('s8', 'ex6', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 10, unit: 'min' } },
  ]);
  warmupExercises.forEach(exId => {
    createEntry('s9', exId, [{ weight: 0, reps: 10, rpe: 0 }]);
  });
  calestenicsExercises.forEach(exId => {
    const rpe = exId === 'ex1' ? 6 : 0;
    createEntry('s10', exId, makeSets(3, { weight: 0, reps: 30, rpe }));
  });

  createEntry('s11', 'ex3', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 10, unit: 'min' } },
  ]);
  createEntry('s12', 'ex4', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 30, unit: 'min' } },
  ]);
  warmupExercises.forEach(exId => {
    createEntry('s13', exId, [{ weight: 0, reps: 10, rpe: 0 }]);
  });
  calestenicsExercises.forEach(exId => {
    const rpe = exId === 'ex1' ? 6 : 0;
    createEntry('s14', exId, makeSets(3, { weight: 0, reps: 30, rpe }));
  });

  createEntry('s15', 'ex31', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 10, unit: 'min' } },
  ]);
  warmupExercises.forEach(exId => {
    createEntry('s16', exId, [{ weight: 0, reps: 10, rpe: 0 }]);
  });
  calestenicsExercises.forEach(exId => {
    const rpe = exId === 'ex1' ? 6 : 0;
    createEntry('s17', exId, makeSets(3, { weight: 0, reps: 30, rpe }));
  });

  createEntry('s18', 'ex3', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 10, unit: 'min' } },
  ]);
  createEntry('s19', 'ex30', [
    { weight: 0, reps: 0, rpe: 6, duration: { value: 30, unit: 'min' } },
  ]);
  warmupExercises.forEach(exId => {
    createEntry('s20', exId, [{ weight: 0, reps: 10, rpe: 0 }]);
  });
  calestenicsExercises.forEach(exId => {
    const rpe = exId === 'ex1' ? 6 : 0;
    createEntry('s21', exId, makeSets(3, { weight: 0, reps: 30, rpe }));
  });

  server.create('nutritionDay', {
    id: 'nd1',
    date: '2024-06-10',
    calories: 1800,
    macroPercents: { protein: 40, carbs: 40, fat: 20 },
  });

  server.create('meal', {
    id: 'm1',
    dayId: 'nd1',
    type: 'Breakfast',
    macros: { protein: 25, carbs: 40, fat: 10, calories: 350 },
  });
  server.create('meal', {
    id: 'm2',
    dayId: 'nd1',
    type: 'Lunch',
    macros: { protein: 35, carbs: 60, fat: 15, calories: 500 },
  });
  server.create('meal', {
    id: 'm3',
    dayId: 'nd1',
    type: 'Dinner',
    macros: { protein: 40, carbs: 70, fat: 20, calories: 600 },
  });
  server.create('meal', {
    id: 'm4',
    dayId: 'nd1',
    type: 'Snack',
    macros: { protein: 10, carbs: 30, fat: 8, calories: 200 },
  });

  server.create('plan', {
    id: 'p1',
    title: 'Lightweight / Getting Started',
    category: 'Lightweight / Getting Started',
    description: 'Week 1 routine.',
    chart: [
      {
        day: 'Monday',
        sessions: [
          { label: 'Yoga Core AM', exercises: [ { exerciseId: 'ex6', sets: 1, duration: { value: 30, unit: 'min' } } ] },
          { label: 'Warmup PM', exercises: [
            { exerciseId: 'ex8', sets: 1, reps: 10 },
            { exerciseId: 'ex10', sets: 1, reps: 10 },
            { exerciseId: 'ex11', sets: 1, reps: 10 },
            { exerciseId: 'ex12', sets: 1, reps: 10 },
          ] },
          { label: 'Calestenics PM', exercises: [
            { exerciseId: 'ex21', sets: 3, reps: 30 },
            { exerciseId: 'ex22', sets: 3, reps: 30 },
            { exerciseId: 'ex23', sets: 3, reps: 30 },
            { exerciseId: 'ex24', sets: 3, reps: 30 },
            { exerciseId: 'ex25', sets: 3, reps: 30 },
            { exerciseId: 'ex26', sets: 3, reps: 30 },
            { exerciseId: 'ex27', sets: 3, reps: 30 },
            { exerciseId: 'ex28', sets: 3, reps: 30 },
            { exerciseId: 'ex1', sets: 3, reps: 30 },
          ] },
        ],
      },
      {
        day: 'Tuesday',
        sessions: [
          { label: 'Yoga Quick AM', exercises: [ { exerciseId: 'ex3', sets: 1, duration: { value: 10, unit: 'min' } } ] },
          { label: 'Yoga Stretch AM', exercises: [ { exerciseId: 'ex30', sets: 1, duration: { value: 30, unit: 'min' } } ] },
          { label: 'Warmup PM', exercises: [
            { exerciseId: 'ex8', sets: 1, reps: 10 },
            { exerciseId: 'ex10', sets: 1, reps: 10 },
            { exerciseId: 'ex11', sets: 1, reps: 10 },
            { exerciseId: 'ex12', sets: 1, reps: 10 },
          ] },
          { label: 'Calestenics PM', exercises: [
            { exerciseId: 'ex21', sets: 3, reps: 30 },
            { exerciseId: 'ex22', sets: 3, reps: 30 },
            { exerciseId: 'ex23', sets: 3, reps: 30 },
            { exerciseId: 'ex24', sets: 3, reps: 30 },
            { exerciseId: 'ex25', sets: 3, reps: 30 },
            { exerciseId: 'ex26', sets: 3, reps: 30 },
            { exerciseId: 'ex27', sets: 3, reps: 30 },
            { exerciseId: 'ex28', sets: 3, reps: 30 },
            { exerciseId: 'ex1', sets: 3, reps: 30 },
          ] },
        ],
      },
      {
        day: 'Wednesday',
        sessions: [
          { label: 'Yoga Balance AM', exercises: [ { exerciseId: 'ex6', sets: 1, duration: { value: 10, unit: 'min' } } ] },
          { label: 'Warmup PM', exercises: [
            { exerciseId: 'ex8', sets: 1, reps: 10 },
            { exerciseId: 'ex10', sets: 1, reps: 10 },
            { exerciseId: 'ex11', sets: 1, reps: 10 },
            { exerciseId: 'ex12', sets: 1, reps: 10 },
          ] },
          { label: 'Calestenics PM', exercises: [
            { exerciseId: 'ex21', sets: 3, reps: 30 },
            { exerciseId: 'ex22', sets: 3, reps: 30 },
            { exerciseId: 'ex23', sets: 3, reps: 30 },
            { exerciseId: 'ex24', sets: 3, reps: 30 },
            { exerciseId: 'ex25', sets: 3, reps: 30 },
            { exerciseId: 'ex26', sets: 3, reps: 30 },
            { exerciseId: 'ex27', sets: 3, reps: 30 },
            { exerciseId: 'ex28', sets: 3, reps: 30 },
            { exerciseId: 'ex1', sets: 3, reps: 30 },
          ] },
        ],
      },
      {
        day: 'Thursday',
        sessions: [
          { label: 'Yoga Quick AM', exercises: [ { exerciseId: 'ex3', sets: 1, duration: { value: 10, unit: 'min' } } ] },
          { label: 'Yoga Flow AM', exercises: [ { exerciseId: 'ex4', sets: 1, duration: { value: 30, unit: 'min' } } ] },
          { label: 'Warmup PM', exercises: [
            { exerciseId: 'ex8', sets: 1, reps: 10 },
            { exerciseId: 'ex10', sets: 1, reps: 10 },
            { exerciseId: 'ex11', sets: 1, reps: 10 },
            { exerciseId: 'ex12', sets: 1, reps: 10 },
          ] },
          { label: 'Calestenics PM', exercises: [
            { exerciseId: 'ex21', sets: 3, reps: 30 },
            { exerciseId: 'ex22', sets: 3, reps: 30 },
            { exerciseId: 'ex23', sets: 3, reps: 30 },
            { exerciseId: 'ex24', sets: 3, reps: 30 },
            { exerciseId: 'ex25', sets: 3, reps: 30 },
            { exerciseId: 'ex26', sets: 3, reps: 30 },
            { exerciseId: 'ex27', sets: 3, reps: 30 },
            { exerciseId: 'ex28', sets: 3, reps: 30 },
            { exerciseId: 'ex1', sets: 3, reps: 30 },
          ] },
        ],
      },
      {
        day: 'Friday',
        sessions: [
          { label: 'Yoga Flow on the Go AM', exercises: [ { exerciseId: 'ex31', sets: 1, duration: { value: 10, unit: 'min' } } ] },
          { label: 'Warmup PM', exercises: [
            { exerciseId: 'ex8', sets: 1, reps: 10 },
            { exerciseId: 'ex10', sets: 1, reps: 10 },
            { exerciseId: 'ex11', sets: 1, reps: 10 },
            { exerciseId: 'ex12', sets: 1, reps: 10 },
          ] },
          { label: 'Calestenics PM', exercises: [
            { exerciseId: 'ex21', sets: 3, reps: 30 },
            { exerciseId: 'ex22', sets: 3, reps: 30 },
            { exerciseId: 'ex23', sets: 3, reps: 30 },
            { exerciseId: 'ex24', sets: 3, reps: 30 },
            { exerciseId: 'ex25', sets: 3, reps: 30 },
            { exerciseId: 'ex26', sets: 3, reps: 30 },
            { exerciseId: 'ex27', sets: 3, reps: 30 },
            { exerciseId: 'ex28', sets: 3, reps: 30 },
            { exerciseId: 'ex1', sets: 3, reps: 30 },
          ] },
        ],
      },
      {
        day: 'Saturday',
        sessions: [
          { label: 'Yoga Quick AM', exercises: [ { exerciseId: 'ex3', sets: 1, duration: { value: 10, unit: 'min' } } ] },
          { label: 'Yoga Chill AM', exercises: [ { exerciseId: 'ex30', sets: 1, duration: { value: 30, unit: 'min' } } ] },
          { label: 'Warmup PM', exercises: [
            { exerciseId: 'ex8', sets: 1, reps: 10 },
            { exerciseId: 'ex10', sets: 1, reps: 10 },
            { exerciseId: 'ex11', sets: 1, reps: 10 },
            { exerciseId: 'ex12', sets: 1, reps: 10 },
          ] },
          { label: 'Calestenics PM', exercises: [
            { exerciseId: 'ex21', sets: 3, reps: 30 },
            { exerciseId: 'ex22', sets: 3, reps: 30 },
            { exerciseId: 'ex23', sets: 3, reps: 30 },
            { exerciseId: 'ex24', sets: 3, reps: 30 },
            { exerciseId: 'ex25', sets: 3, reps: 30 },
            { exerciseId: 'ex26', sets: 3, reps: 30 },
            { exerciseId: 'ex27', sets: 3, reps: 30 },
            { exerciseId: 'ex28', sets: 3, reps: 30 },
            { exerciseId: 'ex1', sets: 3, reps: 30 },
          ] },
        ],
      },
    ],
  });

  server.create('plan', {
    id: 'p2',
    title: 'Minimal Equipment (Van Life)',
    category: 'Minimal Equipment (Van Life)',
    description: 'Bodyweight and resistance band routines.',
    chart: [
      {
        day: 'Monday',
        sessions: [
          {
            label: 'Bodyweight Circuit',
            exercises: [
              { exerciseId: 'ex2', sets: 3, reps: 15 },
            ],
          },
        ],
      },
    ],
  });

  server.create('plan', {
    id: 'p3',
    title: 'Gym Membership (Van + Gym)',
    category: 'Gym Membership (Van + Gym)',
    description: 'Full gym training with yoga recovery.',
    chart: [
      {
        day: 'Monday',
        sessions: [
          {
            label: 'Barbell Squat',
            exercises: [
              { exerciseId: 'ex5', sets: 4, reps: 8 },
            ],
          },
          {
            label: 'Yoga - Recovery',
            exercises: [
              { exerciseId: 'ex4', sets: 1, duration: { value: 20, unit: 'min' } },
            ],
          },
        ],
      },
    ],
  });

  server.create('exercise', {
    id: 'ex0',
    title: 'Running',
    description: 'Classic running outdoors or a treadmill.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png',
    type: 'Cardio',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex1',
    title: 'Push Up',
    description: 'Classic bodyweight push up. Hands shoulder-width, core tight.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png',
    type: 'Strength',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex2',
    title: 'Squat',
    description: 'Bodyweight squat. Feet shoulder-width, back straight.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Strength',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex3',
    title: 'Yoga - 10 min quick session',
    description: 'Short yoga flow for flexibility and mobility.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048972.png',
    type: 'Yoga',
    yogaCategory: '10 min quick session',
  });
  server.create('exercise', {
    id: 'ex4',
    title: 'Yoga - Flow',
    description: 'Continuous yoga movement for balance and strength.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048973.png',
    type: 'Yoga',
    yogaCategory: 'Flow',
  });
  server.create('exercise', {
    id: 'ex6',
    title: 'Yoga - Core',
    description: 'Yoga that focuses on strengthening the core.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048973.png',
    type: 'Yoga',
    yogaCategory: 'Core',
  });
  server.create('exercise', {
    id: 'ex30',
    title: 'Yoga - Stretch',
    description: 'Yoga that focuses on stretching the core.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048973.png',
    type: 'Yoga',
    yogaCategory: 'Stretch',
  });
  server.create('exercise', {
    id: 'ex31',
    title: 'Yoga - Flow on the Go',
    description: 'Yoga that focuses on stringing together motions smoothly with breathing through stretching positions.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048973.png',
    type: 'Yoga',
    yogaCategory: 'Flow on the go',
  });
  server.create('exercise', {
    id: 'ex32',
    title: 'Yoga - Chill',
    description: 'Very low level of effort yoga.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048973.png',
    type: 'Yoga',
    yogaCategory: 'Recovery',
  });
  server.create('exercise', {
    id: 'ex7',
    title: 'Barbell Squat',
    description: 'Weighted squat for lower body strength.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Strength',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex8',
    title: 'Standing Knee Hugs',
    description: 'Yoga type balance by alternating standing on each leg and then pulling the leg into the chest for stretch.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Warmup',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex9',
    title: 'Standing Quad Stretches',
    description: 'Standing Quad Stretches w/overhead reach.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Warmup',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex10',
    title: 'Step back Hamstring stretch',
    description: 'Yoga style stretch where the motion is stepping backwards into a hamstring stretch.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Warmup',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex11',
    title: 'Prone/Plank to low lunge rotation',
    description: 'Prone position to low lunge rotation.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Warmup',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex12',
    title: 'Windmill Stretch',
    description: 'Alternating Windmill Stretch from vertical starfish to right hand to left foot.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Warmup',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex21',
    title: 'Seated Sprinter Crunch',
    description: 'From a seated position, drive one knee toward the chest while rotating the opposite elbow across the body in a sprinting motion.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Core',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex22',
    title: 'Arm High Crunch',
    description: 'Lying on your back with arms extended overhead, perform a crunch while keeping arms straight to increase core tension.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Core',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex23',
    title: 'Seated Flutter Kicks',
    description: 'From a seated lean-back position, alternate straight-leg kicks while keeping the core braced and chest lifted.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Core',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex24',
    title: 'Scissor Kicks',
    description: 'Lying on your back, alternate straight-leg lifts in a scissoring motion while keeping the lower back pressed into the floor.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Core',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex25',
    title: 'Arm-Leg Raises',
    description: 'From a supine position, raise opposite arm and leg simultaneously while maintaining core stability.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Core',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex26',
    title: 'Plank Crunch',
    description: 'From a high plank, draw one knee toward the chest under control, alternating sides while keeping hips stable.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Core',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex27',
    title: 'Medicine Ball Mountain Climbers',
    description: 'Hands on a medicine ball in plank position, alternate driving knees toward the chest for added instability and core engagement.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Conditioning',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex28',
    title: 'Side Plank Crunch',
    description: 'From a side plank position, bring the top knee toward the elbow while maintaining a straight line through the body.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048962.png',
    type: 'Core',
    yogaCategory: null,
  });

  server.create('affiliatePromotion', {
    cta: 'Get $1/month at Planet Fitness',
    url: 'https://www.planetfitness.com/referrals?referralCode=NNNG1FLY',
    qrCodeUrl: 'https://www.planetfitness.com/referrals?referralCode=NNNG1FLY',
    disclosure: '',
    copy: 'This link gets you a $1 month at Planet Fitness -- and I receive an affiliate benefit if you sign up. We could hit the gym together.',
  });
}
