import mongoose from 'mongoose';

const ProviderEnum = ['local', 'google'];

const ProviderLinkSchema = new mongoose.Schema({
  provider: { type: String, enum: ProviderEnum, required: true },
  providerId: { type: String, required: true },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  provider: { type: String, enum: ProviderEnum, default: 'local' }, // для бэк-совместимости
  providers: { type: [ProviderLinkSchema], default: [] },            // связи с OAuth-провайдерами
  avatar: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  lang: { type: String, default: 'ru' },
  theme: { type: String, default: 'light' },
  passwordHash: { type: String, default: '' }, // может быть пустым для Google-аккаунтов
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
