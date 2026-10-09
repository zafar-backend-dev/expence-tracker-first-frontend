import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Timer,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Wallet,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react';
import { authApi, extractErrorMessage } from '../../services/api';
import { UserInfo, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface AuthViewProps {
  onSuccess: (user: UserInfo, token: string) => void;
  lang: Language;
  setLang: (l: Language) => void;
  initialMode?: 'sign-in' | 'sign-up';
}

type AuthMode =
  | 'sign-in'
  | 'sign-in-verify'
  | 'sign-up'
  | 'sign-up-verify'
  | 'forgot-password'
  | 'reset-password';

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  lang,
  setLang,
  initialMode = 'sign-in',
}) => {
  const t = translations[lang];

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  // Sign up fields
  const [fullName, setFullName] = useState('');
  const [birthdate, setBirthdate] = useState('2000-01-01');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reset password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // 2-minute (120s) timer
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startTimer = () => {
    setTimeLeft(120);
    setTimerActive(true);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. SIGN IN SUBMIT
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) {
      setError(t.fillRequiredFields);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await authApi.signIn({ login: login.trim(), password });
      if (res.success) {
        setSuccessMessage(t.codeSentHint);
        setMode('sign-in-verify');
        setVerifyCode('');
        startTimer();
      } else {
        setError(extractErrorMessage(res, lang, t.serverError));
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, lang, t.serverError));
    } finally {
      setLoading(false);
    }
  };

  // 2. SIGN IN VERIFY SUBMIT
  const handleSignInVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setError(t.enterVerificationCode);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.signInVerify({
        login: login.trim(),
        code: verifyCode.trim(),
      });

      if (res.success && res.data?.accessToken) {
        const token = res.data.accessToken;
        localStorage.setItem('moliya_access_token', token);
        if (res.data.refreshToken) {
          localStorage.setItem('moliya_refresh_token', res.data.refreshToken);
        }

        const userRes = await authApi.getUserInfo(token);
        if (userRes.success && userRes.data) {
          onSuccess(userRes.data, token);
        } else {
          const fallbackUser: UserInfo = {
            pkey: 'user_' + Date.now(),
            username: login.trim(),
            fullName: login.trim(),
            email: login.includes('@') ? login : `${login}@example.com`,
            role: 'USER',
            createdAt: new Date().toISOString(),
          };
          onSuccess(fallbackUser, token);
        }
      } else {
        setError(extractErrorMessage(res, lang, t.enterVerificationCode));
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, lang, t.serverError));
    } finally {
      setLoading(false);
    }
  };

  // 3. SIGN UP SUBMIT
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }
    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.signUp({
        fullName: fullName.trim(),
        birthdate,
        role: 'USER',
        password,
        confirmPassword,
        username: username.trim(),
        email: email.trim(),
      });

      if (res.success) {
        setSuccessMessage(t.codeSentHint);
        setMode('sign-up-verify');
        setVerifyCode('');
        startTimer();
      } else {
        setError(extractErrorMessage(res, lang, t.serverError));
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, lang, t.serverError));
    } finally {
      setLoading(false);
    }
  };

  // 4. SIGN UP VERIFY SUBMIT
  const handleSignUpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setError(t.enterVerificationCode);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.signUpVerify({
        email: email.trim(),
        code: verifyCode.trim(),
      });

      if (res.success) {
        setSuccessMessage(
          lang === 'tr'
            ? 'Hesabınız başarıyla doğrulandı! Giriş yapabilirsiniz.'
            : 'Your account is verified! You can now sign in.'
        );
        setMode('sign-in');
        setLogin(username || email);
      } else {
        setError(extractErrorMessage(res, lang, t.enterVerificationCode));
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, lang, t.serverError));
    } finally {
      setLoading(false);
    }
  };

  // 5. FORGOT PASSWORD SUBMIT
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t.fillRequiredFields);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      if (res.success) {
        setSuccessMessage(
          lang === 'tr'
            ? 'Şifre sıfırlama kodu e-postanıza gönderildi!'
            : 'Password recovery code sent to your email!'
        );
        setMode('reset-password');
        setVerifyCode('');
        startTimer();
      } else {
        setError(extractErrorMessage(res, lang, t.serverError));
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, lang, t.serverError));
    } finally {
      setLoading(false);
    }
  };

  // 6. RESET PASSWORD SUBMIT
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.resetPassword({
        email: email.trim(),
        code: verifyCode.trim(),
        newPassword,
        confirmPassword: confirmNewPassword,
      });

      if (res.success) {
        setSuccessMessage(
          lang === 'tr'
            ? 'Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapın.'
            : 'Password reset successfully! Sign in with your new password.'
        );
        setMode('sign-in');
        setLogin(email);
        setPassword('');
      } else {
        setError(extractErrorMessage(res, lang, t.serverError));
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, lang, t.serverError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm fixed inset-0 z-50 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-6 text-white text-center relative">
          {/* Language Switcher on Header */}
          <div className="absolute right-4 top-4 flex items-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl px-2.5 py-1 border border-white/25 text-xs font-bold transition shadow-xs">
            <Globe className="w-3.5 h-3.5 text-white mr-1.5 shrink-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              aria-label={t.language}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1 appearance-none [&>option]:text-slate-900"
            >
              <option value="en">🇬🇧 English</option>
              <option value="tr">🇹🇷 Türkçe</option>
            </select>
          </div>

          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <Wallet className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.appName}</h2>
          <p className="text-xs text-indigo-100 mt-1">{t.appTagline}</p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-white/90">
            {mode === 'sign-in' && (lang === 'tr' ? 'Giriş Yap' : 'Sign In')}
            {mode === 'sign-in-verify' && (lang === 'tr' ? '2FA Doğrulama' : '2FA Verification')}
            {mode === 'sign-up' && (lang === 'tr' ? 'Kayıt Ol' : 'Sign Up')}
            {mode === 'sign-up-verify' && (lang === 'tr' ? 'Kayıt Doğrulama' : 'Registration Verification')}
            {mode === 'forgot-password' && (lang === 'tr' ? 'Şifre Kurtarma' : 'Password Recovery')}
            {mode === 'reset-password' && (lang === 'tr' ? 'Yeni Şifre' : 'New Password')}
          </div>
        </div>

        {/* Alerts */}
        <div className="p-6 pb-2 space-y-3">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">{successMessage}</div>
            </div>
          )}
        </div>

        {/* FORMS */}
        <div className="p-6 pt-2">
          {/* 1. SIGN IN FORM */}
          {mode === 'sign-in' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.loginOrEmail}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="admin / email"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">{t.password}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode('forgot-password');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{lang === 'tr' ? 'Giriş Yap' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
                {t.dontHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('sign-up');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold ml-1 cursor-pointer"
                >
                  {lang === 'tr' ? 'Kayıt Ol' : 'Sign Up'}
                </button>
              </div>
            </form>
          )}

          {/* 2. SIGN IN VERIFY FORM */}
          {mode === 'sign-in-verify' && (
            <form onSubmit={handleSignInVerify} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{login}</span> — {t.codeSentHint}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.verificationCode}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoFocus
                    required
                    className="w-full pl-10 pr-3.5 py-3 text-center tracking-widest text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* 2-minute timer */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Timer
                    className={`w-4 h-4 ${
                      timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-indigo-500'
                    }`}
                  />
                  <span>{t.codeExpiresIn}</span>
                  <span
                    className={`font-mono font-bold ${
                      timeLeft < 30 ? 'text-red-600' : 'text-slate-800'
                    }`}
                  >
                    {formatTimer(timeLeft)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={timeLeft > 0 || loading}
                  onClick={handleSignIn}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-40 cursor-pointer"
                >
                  {t.resendCode}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t.verifyAndLogin}
              </button>

              <button
                type="button"
                onClick={() => setMode('sign-in')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
              >
                {t.changeLogin}
              </button>
            </form>
          )}

          {/* 3. SIGN UP FORM */}
          {mode === 'sign-up' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.fullName}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Zafar Ziyatov"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.username}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.birthdate}
                  </label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    required
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.confirmPassword}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (lang === 'tr' ? 'Kayıt Ol' : 'Sign Up')}
              </button>

              <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
                {t.alreadyHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('sign-in');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold ml-1 cursor-pointer"
                >
                  {lang === 'tr' ? 'Giriş Yap' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* 4. SIGN UP VERIFY FORM */}
          {mode === 'sign-up-verify' && (
            <form onSubmit={handleSignUpVerify} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900">
                <span className="font-semibold">{email}</span> — {t.codeSentHint}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.verificationCode}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoFocus
                    required
                    className="w-full pl-10 pr-3.5 py-3 text-center tracking-widest text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* 2-minute timer */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Timer
                    className={`w-4 h-4 ${
                      timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-indigo-500'
                    }`}
                  />
                  <span>{t.codeExpiresIn}</span>
                  <span
                    className={`font-mono font-bold ${
                      timeLeft < 30 ? 'text-red-600' : 'text-slate-800'
                    }`}
                  >
                    {formatTimer(timeLeft)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={timeLeft > 0 || loading}
                  onClick={handleSignUp}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-40 cursor-pointer"
                >
                  {t.resendCode}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t.verifyAndRegister}
              </button>

              <button
                type="button"
                onClick={() => setMode('sign-up')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
              >
                {t.changeLogin}
              </button>
            </form>
          )}

          {/* 5. FORGOT PASSWORD FORM */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-600">{t.forgotPasswordHint}</p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t.sendRecoveryCode}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('sign-in');
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
              >
                {t.backToLogin}
              </button>
            </form>
          )}

          {/* 6. RESET PASSWORD FORM */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.verificationCode}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg text-center font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.newPassword}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.confirmNewPassword}
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t.updatePassword}
              </button>

              <button
                type="button"
                onClick={() => setMode('sign-in')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
              >
                {t.cancel}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
