import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export const setupSwagger = (app: Express) => {
  const swaggerSpecPath = path.join(__dirname, '../swagger/swagger.json');
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerSpecPath, 'utf-8'));

  console.log('Swagger Path Check:', swaggerSpecPath);

  const swaggerOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Trip API Documentation',
  };

  app.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, swaggerOptions),
  );

  // Swagger JSON 엔드포인트
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};
