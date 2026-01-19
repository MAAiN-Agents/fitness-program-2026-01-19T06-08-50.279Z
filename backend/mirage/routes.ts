export default function() {
  this.namespace = 'api';

  // Fitness Tracker Weeks
  this.get('/tracker/weeks');
  this.post('/tracker/weeks');
  this.get('/tracker/weeks/:id');
  this.delete('/tracker/weeks/:id');

  // Sessions
  this.get('/tracker/weeks/:weekId/sessions', (schema, request) => {
    let weekId = request.params.weekId;
    return schema.sessions.where({ weekId });
  });
  this.post('/tracker/weeks/:weekId/sessions', (schema, request) => {
    let weekId = request.params.weekId;
    let attrs = JSON.parse(request.requestBody);
    attrs.weekId = weekId;
    return schema.sessions.create(attrs);
  });
  this.get('/tracker/sessions/:id');
  this.patch('/tracker/sessions/:id');
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
  this.get('/nutrition/days');
  this.post('/nutrition/days');
  this.get('/nutrition/days/:id');
  this.patch('/nutrition/days/:id');
  this.delete('/nutrition/days/:id');

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
