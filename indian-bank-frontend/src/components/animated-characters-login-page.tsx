"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Smartphone, ShieldCheck, Lock, ChevronRight, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000/api";

export function LoginPage({ onLoginSuccess }: { onLoginSuccess: (userId: string) => void }) {
  const [showOtp, setShowOtp] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regData, setRegData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    pan_number: "",
    address: "",
    account_type: "Savings",
    transaction_password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  
  // Virtual SMS State
  const [smsMessage, setSmsMessage] = useState<string | null>(null);
  const [smsVisible, setSmsVisible] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!otpRequested || !phone) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sms/latest?phone=${encodeURIComponent(phone)}`);
        if (res.data.success && res.data.message) {
          const msg: string = res.data.message;
          setSmsMessage(msg);
          setSmsVisible(true);

          const match = msg.match(/\b(\d{4})\b/);
          if (match) {
            setOtp(match[1]);
          }

          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [otpRequested, phone]);

  const handleRequestOtp = async () => {
    if (!phone) {
      setError("Please enter your mobile number.");
      return;
    }
    setError("");
    setIsLoading(true);
    setSmsMessage(null);
    setSmsVisible(false);
    try {
      const response = await axios.post(`${API_BASE_URL}/user/request-otp`, { 
        phone_number: phone,
        email: email 
      });
      if (response.data.success) {
        setOtpRequested(true);
        setError("");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication system unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpRequested) {
      handleRequestOtp();
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/user/login`, { 
        phone_number: phone, 
        email: email,
        otp 
      });
      if (response.data.success) {
        onLoginSuccess(response.data.user_id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid Security Code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/user/register`, regData);
      if (response.data.success) {
        alert("Account Created Successfully! You can now login using your mobile and email.");
        setIsRegistering(false);
        setPhone(regData.phone_number);
        setEmail(regData.email);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-corporate-maroon flex flex-col font-sans">
      {/* Top Banner / Header (simulating the reference image header) */}
      <header className="w-full h-20 bg-background/95 backdrop-blur-md border-b flex items-center justify-between px-8 absolute top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <img src="/banklogo.png" alt="Indian Bank" className="h-10 object-contain" />
          <div className="h-8 w-px bg-border hidden md:block"></div>
          <span className="hidden md:block font-serif italic text-primary/80 text-xl">NetBanking Portal</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
           <span className="hover:text-primary cursor-pointer transition-colors">Services & Support</span>
           <div className="h-4 w-px bg-border"></div>
           <span className="hover:text-primary cursor-pointer transition-colors">Locate Us</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center pt-24 px-4">
        
        {/* Virtual SMS Notification Card */}
        {smsVisible && smsMessage && (
          <div className="fixed top-24 right-8 z-50 w-80 shadow-2xl animate-in slide-in-from-right-8 duration-500">
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-gray-800">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-green-500 flex items-center justify-center">
                    <MessageSquare className="size-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Messages</span>
                </div>
                <button onClick={() => setSmsVisible(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="size-4" />
                </button>
              </div>
              <div className="px-4 py-4">
                <p className="text-white/90 text-sm leading-relaxed">{smsMessage}</p>
              </div>
              {otp && (
                <div className="mx-4 mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
                  <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Auto-filled</span>
                  <span className="text-green-300 font-mono font-bold text-xl tracking-[0.3em]">{otp}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Box */}
        <div className="w-full max-w-[460px] bg-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
          {/* Header */}
          <div className="bg-primary px-8 py-6 text-primary-foreground relative">
             <h2 className="text-2xl font-bold tracking-tight mb-2">
                {isRegistering ? "Open a New Account" : "Login to NetBanking"}
             </h2>
             <p className="text-primary-foreground/80 text-sm flex items-center gap-2">
                <Lock className="size-4" /> Highly Secure 256-bit Encrypted Session
             </p>
             {isRegistering && (
                <button 
                  onClick={() => setIsRegistering(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                   <X className="size-5" />
                </button>
             )}
          </div>

          {/* Form */}
          <div className="p-8">
            {isRegistering ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Full Name</Label>
                    <Input value={regData.full_name} onChange={e => setRegData({...regData, full_name: e.target.value})} placeholder="As per PAN" required className="h-10 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Mobile</Label>
                      <Input value={regData.phone_number} onChange={e => setRegData({...regData, phone_number: e.target.value})} placeholder="10-digit #" required className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Email</Label>
                      <Input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} placeholder="your@email.com" required className="h-10 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">PAN Number</Label>
                      <Input value={regData.pan_number} onChange={e => setRegData({...regData, pan_number: e.target.value})} placeholder="ABCDE1234F" required className="h-10 rounded-xl uppercase" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Account Type</Label>
                      <select 
                        value={regData.account_type} 
                        onChange={e => setRegData({...regData, account_type: e.target.value})}
                        className="w-full h-10 bg-background border rounded-xl px-3 text-sm focus:ring-1 focus:ring-primary/20 outline-none"
                      >
                        <option>Savings</option>
                        <option>Current</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Address</Label>
                    <Input value={regData.address} onChange={e => setRegData({...regData, address: e.target.value})} placeholder="Permanent Address" required className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Transaction Password</Label>
                    <Input type="password" value={regData.transaction_password} onChange={e => setRegData({...regData, transaction_password: e.target.value})} placeholder="••••••••" required className="h-10 rounded-xl" />
                  </div>
                </div>

                {error && (
                  <div className="p-2 text-[10px] text-destructive bg-destructive/5 border border-destructive/10 rounded-lg text-center font-bold">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 bg-primary font-bold rounded-xl shadow-lg mt-2" disabled={isLoading}>
                   {isLoading ? "Processing Application..." : "Open Digital Account"}
                </Button>
                
                <p className="text-center text-xs text-muted-foreground pt-2">
                   Already have an account? <button type="button" onClick={() => setIsRegistering(false)} className="text-primary font-bold hover:underline">Login Securely</button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
              {!otpRequested ? (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Registered Mobile Number</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="h-14 pl-12 text-lg bg-background border-border focus:border-primary focus:ring-primary shadow-sm rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Registered Email Address</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-14 pl-12 text-lg bg-background border-border focus:border-primary focus:ring-primary shadow-sm rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                  <Label htmlFor="otp" className="text-sm font-bold text-foreground">Secure OTP Validation</Label>
                  <div className="relative">
                    <Input
                      id="otp"
                      type={showOtp ? "text" : "password"}
                      placeholder="Enter 4-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={4}
                      className="h-14 pr-12 text-center text-2xl tracking-[0.5em] font-mono bg-background border-border focus:border-primary focus:ring-primary shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOtp(!showOtp)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showOtp ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Check your email {email?.slice(0, 3)}****@{email?.split('@')[1]} for the security code.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => {
                        setOtpRequested(false);
                        setSmsMessage(null);
                        setSmsVisible(false);
                        setOtp("");
                        if (pollRef.current) clearInterval(pollRef.current);
                      }} 
                      className="text-xs text-secondary hover:underline font-bold"
                    >
                      Change Number
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md font-medium text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : !otpRequested ? "Proceed to Login" : "Secure Login"}
                {!isLoading && <ChevronRight className="size-5 opacity-70" />}
              </Button>
              
              {!otpRequested && (
                <p className="text-center text-xs text-muted-foreground pt-4">
                  Don't have an account? <button type="button" onClick={() => setIsRegistering(true)} className="text-primary font-bold hover:underline">Register Now</button>
                </p>
              )}
            </form>
          )}

          {/* Trust Badges */}
          <div className="mt-10 pt-6 border-t border-border/50">
               <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  <ShieldCheck className="size-4" />
                  Protected By
               </div>
               <div className="flex items-center justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-4" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rupay-Logo.png/1200px-Rupay-Logo.png" alt="RuPay" className="h-3" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/1200px-Mastercard_2019_logo.svg.png" alt="Mastercard" className="h-5" />
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-primary-foreground/60 text-xs">
        © {new Date().getFullYear()} Indian Bank Ltd. All rights reserved. 
      </footer>
    </div>
  );
}
