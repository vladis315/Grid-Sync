// Sample environment configuration
// Copy this file to env.ts and modify as needed

export const env = {
  // Server Configuration
  port: 3000,
  nodeEnv: 'development',

  // Redis Configuration
  redisUrl: 'redis-cli -u redis://default:LrcJxnTMLuaO85lhSn1ZIApizzj2CSl9@redis-12057.c98.us-east-1-4.ec2.redns.redis-cloud.com:12057',

  // API Keys (for development only)
  // In production, these would be stored in a database
  // Format: apiKey:tenantId:tenantName
  apiKeys: {
    'test-api-key-1': { id: 'tenant1', name: 'Test Tenant 1' },
    'test-api-key-2': { id: 'tenant2', name: 'Test Tenant 2' },
  }
}; 