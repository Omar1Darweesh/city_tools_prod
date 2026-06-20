import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DatabaseService } from './database/database.service';
import * as dotenv from 'dotenv';
import * as os from 'os';
import * as cron from 'node-cron';
import * as express from 'express';
import * as bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

async function bootstrap() {
  try {
    // ── Create a raw Express instance and attach body parsers ──
    // This happens BEFORE NestJS init so NestJS never sees the
    // request before our 10mb limit parsers.
    const server = express();
    server.use(bodyParser.json({ limit: '50mb' }));
    server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      {
        logger: ['error', 'warn', 'log'],
        bodyParser: false,
      },
    );

    // CORS — whitelist known frontends (never reflect arbitrary origins with credentials)
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://city-tools.lamarpos.cloud',
      'https://citytools.lamarpos.cloud',
      'https://citytools.org',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:3012',
    ].filter(Boolean) as string[];

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // API prefix
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

    await app.listen(port, host);

    // Get local IP addresses
    const networkInterfaces = os.networkInterfaces();
    const addresses: string[] = [];

    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        for (const iface of interfaces) {
          if (iface.family === 'IPv4' && !iface.internal) {
            addresses.push(iface.address);
          }
        }
      }
    }

    // Display startup information
    console.log('='.repeat(70));
    console.log('🚀 City Tools Server - Started Successfully!');
    console.log('='.repeat(70));
    console.log(`📍 Local:   http://localhost:${port}/api`);

    if (addresses.length > 0) {
      addresses.forEach((ip) => {
        console.log(`📍 Network: http://${ip}:${port}/api`);
      });
    } else {
      console.log('⚠️  No network IP detected - check network connection');
    }

    console.log('='.repeat(70));
    console.log('✅ Server is ready to accept connections');
    console.log('📝 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔄 Press Ctrl+C to stop the server');
    console.log('='.repeat(70));

    // ============================================
    // START BACKUP SCHEDULER
    // ============================================
    console.log('💾 Starting backup scheduler...');
    console.log('📅 Daily backups scheduled for 9:00 PM');

    // Get DatabaseService instance
    const databaseService = app.get(DatabaseService);

    // Schedule backup at 9:00 PM daily
    // ✅ Production: Daily at 9:00 PM (21:00)
    cron.schedule('0 21 * * *', async () => {


      console.log(`[${new Date().toISOString()}] Starting scheduled backup...`);

      try {
        // Pass false for automatic backup
        const result = await databaseService.createBackup(false);

        console.log('✅ Scheduled backup completed successfully');
        console.log(`📁 File: ${result.filename}`);
        console.log(`📊 Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
      }
    });

    console.log('✅ Backup scheduler is active');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
