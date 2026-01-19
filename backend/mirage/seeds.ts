export default function(server) {
  // Weeks
  server.create('week', {
    id: 'w1',
    startDate: '2024-06-10',
    endDate: '2024-06-16',
    label: 'Week 1',
  });
  
  // Sessions
  server.create('session', {
    id: 's1',
    weekId: 'w1',
    day: 'Monday',
    time: 'AM',
    label: 'Morning Strength',
  });

  // Exercise Entries
  server.create('exerciseEntry', {
    id: 'e1',
    sessionId: 's1',
    exerciseId: 'ex1',
    sets: [
      { weight: 50, reps: 8, rpe: 7 },
      { weight: 50, reps: 8, rpe: 7 },
    ],
  });

  // Nutrition Days
  server.create('nutritionDay', {
    id: 'n1',
    date: '2024-06-10',
    macroGoals: { protein: 120, carbs: 200, fat: 50, calories: 1800 },
  });

  // Meals
  server.create('meal', {
    id: 'm1',
    dayId: 'n1',
    type: 'Breakfast',
    macros: { protein: 20, carbs: 40, fat: 10, calories: 300 },
  });

  // Preset Plans
  server.create('plan', {
    id: 'p1',
    title: 'Lightweight Yoga Start',
    category: 'Lightweight / Getting Started',
    description: 'A gentle yoga-focused routine for beginners.',
    chart: [
      {
        day: 'Monday',
        sessions: [
          {
            label: 'AM Yoga',
            exercises: [
              { exerciseId: 'ex3', duration: 10 },
            ],
          },
        ],
      },
    ],
  });

  // Exercise Library
  server.create('exercise', {
    id: 'ex1',
    title: 'Push Up',
    description: 'Standard push up exercise.',
    image: 'https://cdn.example.com/pushup.png',
    type: 'Strength',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex2',
    title: 'Jogging',
    description: 'Outdoor jogging.',
    image: 'https://cdn.example.com/jogging.png',
    type: 'Cardio',
    yogaCategory: null,
  });
  server.create('exercise', {
    id: 'ex3',
    title: 'Yoga Flow',
    description: '10 min quick yoga flow.',
    image: 'https://cdn.example.com/yoga.png',
    type: 'Yoga',
    yogaCategory: '10 min quick session',
  });

  // Affiliate Promotion
  server.create('affiliatePromotion', {
    cta: 'Join Planet Fitness for $1/month',
    url: 'https://planetfitness.com/aff/nomadicgymlife',
    qrCodeUrl: 'https://cdn.example.com/pf-qr.png',
    disclosure: 'Affiliate link: We receive a benefit if you sign up.',
    copy: 'We could hit the gym together. This link gets you a $1 month at Planet Fitness — and I receive an affiliate benefit if you sign up.'
  });
}
