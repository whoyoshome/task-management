import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type ApiKeyProvider = () => string;

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
    private readonly getApiKey: ApiKeyProvider;

    constructor(apiKeyProvider: ApiKeyProvider) {
        if (!apiKeyProvider) {
            throw new Error('ApiKeyProvider is required');
        }
        this.getApiKey = apiKeyProvider;
    }

    use(req: Request, res: Response, next: NextFunction) {
        const apiKey = req.headers['x-api-key'];
        const validApiKey = this.getApiKey();

        if (!apiKey) {
            throw new UnauthorizedException('API key is missing');
        }

        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        next();
    }
}
