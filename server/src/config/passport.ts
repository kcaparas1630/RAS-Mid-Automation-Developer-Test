import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { JwtPayload } from '../types';

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  issuer: process.env.JWT_ISSUER || 'your-app',
  audience: process.env.JWT_AUDIENCE || 'your-app-users',
};

// JWT Strategy
passport.use(
  new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
    try {
      // Here you would typically verify the user exists in your database
      // For now, we'll just return the payload
      // Example:
      // const user = await getUserById(payload.id);
      // if (!user) {
      //   return done(null, false);
      // }
      // return done(null, user);

      return done(null, payload);
    } catch (error) {
      return done(error, false);
    }
  })
);

export default passport;
