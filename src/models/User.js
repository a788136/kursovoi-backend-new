import mongoose from 'mongoose';

const ProviderEnum = ['local']; // на будущее можно добавить 'google','github'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  provider: { type: String, enum: ProviderEnum, default: 'local' },
  avatar: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  lang: { type: String, default: 'ru' },   // ru / en и т.п.
  theme: { type: String, default: 'light' }, // light / dark / system
  passwordHash: { type: String, required: true }, // техническое поле для локальной аутентификации
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

UserSchema.methods.toClient = function toClient() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    provider: this.provider,
    avatar: this.avatar,
    isAdmin: this.isAdmin,
    isBlocked: this.isBlocked,
    lang: this.lang,
    theme: this.theme,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model('User', UserSchema);
