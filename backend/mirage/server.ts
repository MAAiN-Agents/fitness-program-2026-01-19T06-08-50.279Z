import { createServer, Model, belongsTo, hasMany, Factory } from 'miragejs';
import * as models from './models';
import routes from './routes';
import seeds from './seeds';

export function makeServer({ environment = 'development' } = {}) {
  if (environment !== 'development') return;
  return createServer({
    environment,
    models: models.default,
    factories: {},
    seeds,
    routes,
  });
}
