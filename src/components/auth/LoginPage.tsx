'use client';

import { Logo } from '@/components/layout/Sidebar';
import React, { useState } from 'react';

interface LoginPageProps {
 onLogin: (email: string, password: string) => Promise<{ error: any }>;
 onRegister: (email: string, password: string) => Promise<{ error: any }>;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
 const [isRegister, setIsRegister] = useState(false);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const [success, setSuccess] = useState('');

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setSuccess('');

 if (!email || !password) {
 setError('Email dan password wajib diisi.');
 return;
 }

 if (isRegister && password !== confirmPassword) {
 setError('Password tidak cocok.');
 return;
 }

 if (password.length < 8) {
 setError('Password minimal 8 karakter.');
 return;
 }

 setLoading(true);

 if (isRegister) {
 const { error: err } = await onRegister(email, password);
 if (err) {
 setError(err.message || 'Pendaftaran gagal.');
 } else {
 setSuccess('Akun dibuat. Cek email untuk konfirmasi jika diminta.');
 }
 } else {
 const { error: err } = await onLogin(email, password);
 if (err) {
 if (err.message?.includes('Email not confirmed')) {
 setError('Email belum dikonfirmasi. Buka dashboard Supabase → Authentication → Users → klik "..." → Confirm User.');
 } else if (err.message?.includes('Invalid login')) {
 setError('Email atau password salah.');
 } else {
 setError(err.message || 'Login gagal.');
 }
 }
 }

 setLoading(false);
 };

 const today = new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
 const input = 'glass-input h-12 md:h-11';
 const modules = ['Tugas & rencana', 'Habit harian', 'Kesehatan & nutrisi', 'Keuangan', 'Jurnal', 'Belajar', 'Review mingguan'];

 return (
 <div className="min-h-screen bg-background grid lg:grid-cols-2">
 <main className="flex items-center justify-center px-6 py-16">
 <div className="w-full max-w-sm">
 <Logo className="mb-12" />

 <h1 className="page-title">
 {isRegister ? 'Buat akun' : 'Masuk'}
 </h1>
 <p className="text-sm text-muted-foreground mt-2 mb-8">
 Catatan harian, habit, kesehatan dan keuangan dalam satu buku kerja pribadi
 </p>

 <form onSubmit={handleSubmit} className="space-y-4" noValidate>
 {error && (
 <p role="alert" className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[13px]">{error}</p>
 )}
 {success && (
 <p role="status" className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-[13px]">{success}</p>
 )}

 <div className="space-y-2">
 <label htmlFor="login-email" className="block text-[13px] text-foreground">Email</label>
 <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className={input} autoComplete="email" />
 </div>

 <div className="space-y-2">
 <label htmlFor="login-password" className="block text-[13px] text-foreground">Password</label>
 <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} />
 </div>

 {isRegister && (
 <div className="space-y-2">
 <label htmlFor="login-confirm" className="block text-[13px] text-foreground">Ulangi password</label>
 <input id="login-confirm" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={input} autoComplete="new-password" minLength={8} />
 </div>
 )}

 <button type="submit" disabled={loading} className="w-full h-12 md:h-11 rounded-full bg-primary text-primary-foreground text-[15px] font-medium transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
 {loading ? 'Memproses' : isRegister ? 'Buat akun' : 'Masuk'}
 </button>
 </form>

 <p className="mt-6 text-[13px] text-muted-foreground">
 {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
 <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }} className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">
 {isRegister ? 'Masuk' : 'Buat akun'}
 </button>
 </p>
 </div>
 </main>

 {/* A ledger page: ruled lines and the index of what the book holds */}
 <aside aria-hidden="true" className="hidden lg:flex items-center justify-center p-6"><div className="card-hero w-full h-full flex items-center justify-center p-12">
 <div className="w-full max-w-md rounded-3xl bg-card shadow-float overflow-hidden">
 <div className="flex items-center justify-between h-12 px-6 border-b border-border">
 <span className="text-[13px] text-muted-foreground">Daftar isi</span>
 <span className="tabular-nums text-xs text-muted-foreground tabular-nums">{today}</span>
 </div>
 <ol className="px-6 py-2">
 {modules.map((m, i) => (
 <li key={m} className="flex items-baseline gap-4 h-11 border-b border-border last:border-0">
 <span className="w-6 tabular-nums text-xs text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</span>
 <span className="flex-1 text-sm text-foreground">{m}</span>
 <span className="w-3 h-px bg-border self-center" />
 </li>
 ))}
 </ol>
 </div>
 </div></aside>
 </div>
 );
}
