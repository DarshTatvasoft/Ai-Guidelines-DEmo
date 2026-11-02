import { HttpInterceptorFn } from '@angular/common/http';
import { jwtInterceptor } from './jwt.interceptor';

/**
 * Backward compatibility alias for jwtInterceptor.
 */
export const authInterceptor: HttpInterceptorFn = jwtInterceptor;
