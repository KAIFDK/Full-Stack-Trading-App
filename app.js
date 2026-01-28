import 'express-async-errors';
import express from 'express';
import dotenv from 'dotenv';  
import {createServer} from 'http';
import swaggerUI from 'swagger-ui-express';
import notFoundMiddleware from './MiddleWare/not-found.js';
import errorHandlerMiddleware from './MiddleWare/error-handler.js';
import YAML from 'yamljs';
import cors from 'cors';
import connectDB from './db/connectDB.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());

const httpServer = createServer(app);

app.get('/', (req, res) => {
    res.send('<h1>Trading Platform API</h1><a href="/api-docs">API Documentation</a>');
});

//Swagger API Documentation

const swaggerDocument = YAML.load(join(__dirname, './swagger.yaml'));
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

//ROUTES
app.use('/api/v1/auth', authRouter);

//Middlewares
app.use(cors());
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start Server

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        const PORT = process.env.PORT || 3000;
        httpServer.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));
    } catch (error) {
        console.log(error);
    }
}

start();