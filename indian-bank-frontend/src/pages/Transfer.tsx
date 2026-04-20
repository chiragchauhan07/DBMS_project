import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Send, ShieldCheck, Landmark, CheckCircle2, ChevronRight, HelpCircle, Power, Smartphone } from "lucide-react";
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:5000/api";

export function Transfer({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [receiverPhone, setReceiverPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/user/transfer`, {
        user_id: userId,
        receiver_phone: receiverPhone,
        amount: parseFloat(amount),
        transaction_password: password
      });

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "The secure transaction could not be processed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center p-10 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none rounded-3xl animate-in zoom-in-95 duration-500">
           <div className="p-5 bg-emerald-100 rounded-full w-fit mx-auto border-4 border-white shadow-xl">
              <CheckCircle2 className="size-20 text-emerald-600 animate-in zoom-in duration-500" />
           </div>
           <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Payment Successful</h2>
              <p className="text-muted-foreground font-medium">₹{parseFloat(amount).toLocaleString()} credited to {receiverPhone}</p>
           </div>
           <div className="p-6 bg-gray-50 rounded-2xl text-left space-y-4 border border-gray-100 shadow-inner">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                 <span>Transaction ID</span>
                 <span className="text-gray-900 font-mono tracking-normal">TXN{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                 <span>Status</span>
                 <span className="text-emerald-600">Settled ✓</span>
              </div>
           </div>
           <Button className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 shadow-xl rounded-xl" onClick={onBack}>Return to Portfolio</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Unified Corporate Navbar */}
      <header className="bg-corporate-maroon text-white border-b border-white/10 w-full sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-6">
             <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
                <ArrowLeft className="size-6" />
             </button>
             <div className="bg-white px-3 py-1.5 rounded-sm">
                <img src="/banklogo.png" alt="Indian Bank" className="h-6 object-contain" />
             </div>
             <div className="h-8 w-px bg-white/20 hidden md:block"></div>
             <span className="hidden md:block font-serif italic text-white/90 text-2xl tracking-widest">Fund Transfer</span>
           </div>

           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
                 <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors font-bold">
                    <HelpCircle className="size-4" />
                    Support
                 </div>
              </div>
              <div className="bg-white/10 rounded-full px-4 py-2 text-xs font-bold tracking-widest uppercase border border-white/20">
                Secure Session
              </div>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-corporate-maroon">
         <Card className="w-full max-w-xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-none rounded-3xl overflow-hidden animate-in slide-in-from-bottom-12 duration-700">
            <CardHeader className="bg-primary text-white text-center pb-8 pt-10 px-10">
               <div className="p-4 bg-white/10 w-fit mx-auto rounded-2xl mb-6 backdrop-blur-md border border-white/10">
                  <Landmark className="size-10" />
               </div>
               <CardTitle className="text-3xl font-bold tracking-tight mb-2">Secure Fund Transfer</CardTitle>
               <CardDescription className="text-white/60 font-medium">Verify recipient details and security password</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
               <form onSubmit={handleTransfer} className="space-y-8">
                  <div className="space-y-3">
                     <Label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1">Recipient Mobile</Label>
                     <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                           placeholder="Enter 10-digit number" 
                           value={receiverPhone}
                           onChange={(e) => setReceiverPhone(e.target.value)}
                           required
                           className="h-14 pl-12 text-lg border-gray-200 focus:border-primary focus:ring-primary shadow-sm bg-gray-50/50 rounded-xl"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <Label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1">Amount to Send</Label>
                     <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400 group-focus-within:text-primary transition-colors">₹</span>
                        <Input 
                           type="number"
                           placeholder="0.00" 
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           required
                           className="h-16 pl-10 text-3xl font-bold border-gray-200 focus:border-primary focus:ring-primary shadow-sm bg-white rounded-xl"
                        />
                     </div>
                  </div>

                  <div className="p-6 bg-red-50 rounded-2xl space-y-4 border border-red-100 shadow-inner">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-red-700 uppercase tracking-[0.2em]">
                        <ShieldCheck className="size-4" />
                        Identity Verification
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs text-red-900/60 font-bold ml-1 uppercase tracking-widest">Transaction Password</Label>
                        <Input 
                           type="password"
                           placeholder="••••••••" 
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           required
                           className="h-12 border-red-200 focus:border-primary focus:ring-primary bg-white shadow-sm rounded-xl"
                        />
                     </div>
                  </div>

                  {error && (
                    <div className="p-4 text-sm font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                       {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/95 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-3 rounded-xl disabled:opacity-50" disabled={isLoading}>
                     {isLoading ? "Processing Security Layer..." : "Verify & Authorize Payment"}
                     {!isLoading && <ChevronRight className="size-6" />}
                  </Button>
               </form>
            </CardContent>
         </Card>

         <div className="mt-12 flex items-center gap-3 text-[10px] text-white/40 uppercase font-bold tracking-[0.3em]">
            <ShieldCheck className="size-4" />
            256-Bit SSL End-to-End Encryption
         </div>
      </main>
    </div>
  );
}
