process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-123456';
process.env.MONGODB_URI ||= 'mongodb://localhost:27017/zuno-test';
process.env.PLATFORM_PAYSTACK_SECRET_KEY ||= 'sk_test_platform_unit';
process.env.GATEWAY_ENCRYPTION_KEY ||= Buffer.from('12345678901234567890123456789012').toString('base64');
process.env.NODE_ENV = 'test';
process.env.RUN_JOBS = 'false';
