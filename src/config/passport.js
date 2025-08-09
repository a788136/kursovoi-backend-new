import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { loadEnv } from './env.js';
import { User } from '../models/User.js';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.warn('[passport] Google env not set — Google auth will be disabled');
}

// Сериализация в сессию
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).exec();
    done(null, user || false);
  } catch (e) {
    done(e);
  }
});

// Стратегия Google
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = (profile.emails && profile.emails[0]?.value)?.toLowerCase() || null;
      const providerId = profile.id;
      const avatar = profile.photos && profile.photos[0]?.value ? profile.photos[0].value : '';

      // 1) если есть email — линкуем по email
      let user = email ? await User.findOne({ email }).exec() : null;

      if (!user) {
        // 2) иначе ищем по связке провайдера
        user = await User.findOne({ providers: { $elemMatch: { provider: 'google', providerId } } }).exec();
      }

      if (!user) {
        // 3) создаём нового
        user = await User.create({
          email: email || `google_${providerId}@placeholder.local`,
          name: profile.displayName || 'User',
          provider: 'google',
          providers: [{ provider: 'google', providerId }],
          avatar,
          isAdmin: false,
          isBlocked: false,
          lang: 'ru',
          theme: 'light',
          passwordHash: '' // нет пароля для Google
        });
      } else {
        // добавляем связку провайдера, если её ещё нет
        const hasLink = user.providers?.some(p => p.provider === 'google' && p.providerId === providerId);
        if (!hasLink) {
          user.providers = [...(user.providers || []), { provider: 'google', providerId }];
        }
        if (!user.avatar && avatar) user.avatar = avatar;
        if (user.provider !== 'google') user.provider = 'google'; // помечаем последним входом через Google
        await user.save();
      }

      return done(null, user);
    } catch (e) {
      return done(e);
    }
  }));
}

export default passport;
