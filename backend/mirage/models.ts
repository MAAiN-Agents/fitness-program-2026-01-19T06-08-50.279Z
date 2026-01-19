import { Model, hasMany, belongsTo } from 'miragejs';

export default {
  week: Model.extend({
   sessions: hasMany('session', { inverse: 'week' }),
  }),
  session: Model.extend({
    week: belongsTo('week', { inverse: 'sessions' }),
  }),
  exerciseEntry: Model.extend({
    session: belongsTo(),
  }),
  nutritionDay: Model.extend({
    meals: hasMany(),
  }),
  meal: Model.extend({
    nutritionDay: belongsTo(),
  }),
  plan: Model,
  exercise: Model,
  affiliatePromotion: Model,
};
