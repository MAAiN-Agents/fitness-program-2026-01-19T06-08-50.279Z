export default function() {
  this.namespace = 'api';

  // Fitness Tracker Weeks
  this.get('/tracker/weeks', (schema) => {
    return schema.weeks.all().models.map(week => {
      const sessions = schema.sessions.where({ weekId: week.id }).models.map(session => {
        const entries = schema.exerciseEntries.where({ sessionId: session.id }).models.map(entry => entry.attrs);
        return { ...session.attrs, entries };
      });
      return { ...week.attrs, sessions };
    });
  });
  this.post('/tracker/weeks', (schema, request) => {
    const attrs = JSON.parse(request.requestBody);
    const created = schema.weeks.create(attrs);
    return { ...created.attrs, sessions: [] };
  });
  this.get('/tracker/weeks/:id', (schema, request) => {
    const week = schema.weeks.find(request.params.id);
    if (!week) {
      return null;
    }
    const sessions = schema.sessions.where({ weekId: week.id }).models.map(session => {
      const entries = schema.exerciseEntries.where({ sessionId: session.id }).models.map(entry => entry.attrs);
      return { ...session.attrs, entries };
    });
    return { ...week.attrs, sessions };
  });
  this.delete('/tracker/weeks/:id');
  this.post('/tracker/weeks/inject', (schema, request) => {
    const { startDate, weekLabel } = JSON.parse(request.requestBody);
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return schema.weeks.create({
      startDate,
      endDate: end.toISOString().slice(0, 10),
      label: weekLabel,
      sessions: [],
    });
  });

  // Sessions
  this.get('/tracker/weeks/:weekId/sessions', (schema, request) => {
    let weekId = request.params.weekId;
    return schema.sessions.where({ weekId }).models.map(session => {
      const entries = schema.exerciseEntries.where({ sessionId: session.id }).models.map(entry => entry.attrs);
      return { ...session.attrs, entries };
    });
  });
  this.post('/tracker/weeks/:weekId/sessions', (schema, request) => {
    let weekId = request.params.weekId;
    let attrs = JSON.parse(request.requestBody);
    attrs.weekId = weekId;
    const created = schema.sessions.create(attrs);
    return { ...created.attrs, entries: [] };
  });
  this.get('/tracker/sessions/:id', (schema, request) => {
    const session = schema.sessions.find(request.params.id);
    if (!session) {
      return null;
    }
    const entries = schema.exerciseEntries.where({ sessionId: session.id }).models.map(entry => entry.attrs);
    return { ...session.attrs, entries };
  });
  this.patch('/tracker/sessions/:id', (schema, request) => {
    const session = schema.sessions.find(request.params.id);
    if (!session) {
      return null;
    }
    const attrs = JSON.parse(request.requestBody);
    session.update(attrs);
    const entries = schema.exerciseEntries.where({ sessionId: session.id }).models.map(entry => entry.attrs);
    return { ...session.attrs, entries };
  });
  this.delete('/tracker/sessions/:id');

  // Exercise Entries
  this.get('/tracker/sessions/:sessionId/entries', (schema, request) => {
    let sessionId = request.params.sessionId;
    return schema.exerciseEntries.where({ sessionId });
  });
  this.post('/tracker/sessions/:sessionId/entries', (schema, request) => {
    let sessionId = request.params.sessionId;
    let attrs = JSON.parse(request.requestBody);
    attrs.sessionId = sessionId;
    return schema.exerciseEntries.create(attrs);
  });
  this.patch('/tracker/entries/:id');
  this.delete('/tracker/entries/:id');

  // Nutrition Days
  this.get('/nutrition/days', (schema) => {
    return schema.nutritionDays.all().models.map(day => {
      const meals = schema.meals.where({ dayId: day.id }).models.map(meal => meal.attrs);
      return { ...day.attrs, meals };
    });
  });
  this.post('/nutrition/days', (schema, request) => {
    const attrs = JSON.parse(request.requestBody);
    const created = schema.nutritionDays.create(attrs);
    return { ...created.attrs, meals: [] };
  });
  this.get('/nutrition/days/:id', (schema, request) => {
    const day = schema.nutritionDays.find(request.params.id);
    if (!day) {
      return null;
    }
    const meals = schema.meals.where({ dayId: day.id }).models.map(meal => meal.attrs);
    return { ...day.attrs, meals };
  });
  this.patch('/nutrition/days/:id', (schema, request) => {
    const day = schema.nutritionDays.find(request.params.id);
    if (!day) {
      return null;
    }
    const attrs = JSON.parse(request.requestBody);
    day.update(attrs);
    const meals = schema.meals.where({ dayId: day.id }).models.map(meal => meal.attrs);
    return { ...day.attrs, meals };
  });
  this.delete('/nutrition/days/:id');
  this.post('/nutrition/days/upsert', (schema, request) => {
    const { date, patch } = JSON.parse(request.requestBody);
    const existing = schema.nutritionDays.findBy({ date });
    if (existing) {
      existing.update(patch);
      const meals = schema.meals.where({ dayId: existing.id }).models.map(meal => meal.attrs);
      return { ...existing.attrs, meals };
    }
    const created = schema.nutritionDays.create(patch);
    const meals = schema.meals.where({ dayId: created.id }).models.map(meal => meal.attrs);
    return { ...created.attrs, meals };
  });

  // Meals
  this.get('/nutrition/days/:dayId/meals', (schema, request) => {
    let dayId = request.params.dayId;
    return schema.meals.where({ dayId });
  });
  this.post('/nutrition/days/:dayId/meals', (schema, request) => {
    let dayId = request.params.dayId;
    let attrs = JSON.parse(request.requestBody);
    attrs.dayId = dayId;
    return schema.meals.create(attrs);
  });
  this.patch('/nutrition/meals/:id');
  this.delete('/nutrition/meals/:id');

  // Preset Workout Plans
  this.get('/plans');
  this.get('/plans/:id');
  this.get('/plans/:id/download', (schema, request) => {
    let id = request.params.id;
    let format = request.queryParams.format;
    let plan = schema.plans.find(id);
    if (format === 'pdf') {
      return new Response(200, { 'Content-Type': 'application/pdf' }, 'PDFDATA');
    }
    return plan;
  });

  // Exercise Library
  this.get('/exercise-library');
  this.get('/exercise-library/:id');

  // Affiliate Promotion
  this.get('/affiliate/promotion');
}
