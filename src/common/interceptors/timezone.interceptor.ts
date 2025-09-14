import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
  private readonly timezone: string;

  constructor() {
    // Get timezone from environment variable, default to UTC if not set
    this.timezone = process.env.TZ || 'UTC';
    console.log(`Timezone Interceptor initialized with TZ: ${this.timezone}`);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.convertToTimezone(data)),
    );
  }

  private convertToTimezone(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (data instanceof Date) {
      // Convert to configured timezone with proper formatting
      return formatInTimeZone(
        data,
        this.timezone,
        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
      );
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.convertToTimezone(item));
    }

    if (typeof data === 'object') {
      const converted: any = {};
      for (const key in data) {
        // Check for common date field names
        if (
          key === 'createdAt' ||
          key === 'updatedAt' ||
          key === 'deletedAt' ||
          key === 'publishedAt' ||
          key === 'expiredAt' ||
          key === 'startAt' ||
          key === 'endAt' ||
          key.endsWith('Date') ||
          key.endsWith('At')
        ) {
          converted[key] = this.convertToTimezone(data[key]);
        } else if (typeof data[key] === 'object') {
          converted[key] = this.convertToTimezone(data[key]);
        } else {
          converted[key] = data[key];
        }
      }
      return converted;
    }

    return data;
  }
}