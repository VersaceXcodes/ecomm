import { Pool } from 'pg';
declare global {
    namespace Express {
        interface Request {
            user?: any;
            admin?: any;
        }
    }
}
declare const app: import("express-serve-static-core").Express;
declare const pool: Pool;
export { app, pool };
//# sourceMappingURL=server.d.ts.map