import { Request, Response, NextFunction } from 'express';

// In-memory store for API keys (replace with a database in production)
const apiKeyStore: Record<string, { id: string, name: string }> = {
  // Example API keys - would come from a database in production
  'test-api-key-1': { id: 'tenant1', name: 'Test Tenant 1' },
  'test-api-key-2': { id: 'tenant2', name: 'Test Tenant 2' },
};

/**
 * Express middleware to validate API key
 */
export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get API key from headers
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    res.status(401).json({ error: 'API key is required' });
    return;
  }
  
  // Validate API key
  const tenant = apiKeyStore[apiKey];
  
  if (!tenant) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }
  
  // Check if URL tenant ID matches the API key tenant
  const urlTenantId = req.params.tenantId;
  
  if (urlTenantId && urlTenantId !== tenant.id) {
    res.status(403).json({ error: 'Access denied to this tenant' });
    return;
  }
  
  // Add tenant to request object
  (req as any).tenant = tenant;
  
  next();
};

/**
 * WebSocket API key validator
 */
export const validateApiKey = (
  apiKey: string, 
  callback: (error: Error | null, tenant?: { id: string, name: string }) => void
): void => {
  if (!apiKey) {
    callback(new Error('API key is required'));
    return;
  }
  
  const tenant = apiKeyStore[apiKey];
  
  if (!tenant) {
    callback(new Error('Invalid API key'));
    return;
  }
  
  callback(null, tenant);
}; 