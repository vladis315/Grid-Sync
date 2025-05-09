import { Request, Response, NextFunction } from 'express';
/**
 * Express middleware to validate API key
 */
export declare const apiKeyMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * WebSocket API key validator
 */
export declare const validateApiKey: (apiKey: string, callback: (error: Error | null, tenant?: {
    id: string;
    name: string;
}) => void) => void;
