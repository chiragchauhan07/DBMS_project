import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ShieldAlert, 
  Search, 
  LogOut, 
  ChevronRight, 
  Activity, 
  ArrowUpRight, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle,
  LayoutDashboard,
  UserPlus,
  ArrowLeft
} from "lucide-react";
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:5000/api";

export function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminData, setAdminData] = useState<{
    users: any[];
    suspicious_transactions: any[];
  } | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  
  // Registration Form State
  const [regData, setRegData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    pan_number: "",
    address: "",
    account_type: "Savings",
    transaction_password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        username,
        password
      });
      if (response.data.success) {
        setIsLoggedIn(true);
        fetchAdminDashboard();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Identification failed. Access denied.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminDashboard = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`);
      if (response.data.success) {
        setAdminData(response.data);
      }
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/user/register`, regData);
      if (response.data.success) {
        alert("Client Account Created Successfully!");
        setShowRegister(false);
        fetchAdminDashboard();
        setRegData({
          full_name: "",
          email: "",
          phone_number: "",
          pan_number: "",
          address: "",
          account_type: "Savings",
          transaction_password: ""
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-corporate-maroon flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
           <div className="text-center mb-10">
              <img src="/banklogo.png" alt="Indian Bank" className="h-12 mx-auto mb-6 bg-white p-2 rounded-lg" />
              <div className="h-0.5 w-12 bg-white/20 mx-auto mb-4"></div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Admin Gateway</h1>
              <p className="text-white/50 text-sm font-medium mt-2">Authorized Access Only</p>
           </div>
           
           <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary text-white py-6">
                 <CardTitle className="text-center flex items-center justify-center gap-2">
                    <ShieldCheck className="size-5" /> Secure Authentication
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                 <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Admin Username</Label>
                       <Input 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Master ID"
                        required
                        className="h-12 border-gray-200 focus:border-primary shadow-sm rounded-xl"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Master Password</Label>
                       <Input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-12 border-gray-200 focus:border-primary shadow-sm rounded-xl"
                       />
                    </div>
                    {error && <div className="text-xs font-bold text-destructive bg-destructive/5 p-3 rounded-lg text-center border border-destructive/10">{error}</div>}
                    <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/95 text-base font-bold rounded-xl shadow-lg transition-all active:scale-95" disabled={isLoading}>
                       {isLoading ? "Verifying Credentials..." : "Enter Admin Portal"}
                    </Button>
                 </form>
              </CardContent>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      {/* Admin Header */}
      <header className="bg-corporate-maroon text-white sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
           <div className="flex items-center gap-6">
             <div className="bg-white px-3 py-1.5 rounded-sm">
                <img src="/banklogo.png" alt="Indian Bank" className="h-6 object-contain" />
             </div>
             <div className="hidden md:flex items-center gap-3 text-white/50 border-l border-white/20 pl-6 ml-2">
                <LayoutDashboard className="size-4" />
                <span className="text-sm font-bold uppercase tracking-widest">Global Admin Dashboard</span>
             </div>
           </div>

           <div className="flex items-center gap-8">
              <div className="hidden lg:flex items-center gap-6 text-sm font-bold opacity-70 italic">
                 Security Mode: ACTIVE
              </div>
               <button 
                onClick={() => setShowRegister(!showRegister)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-all border border-emerald-500 shadow-lg shadow-emerald-500/20"
              >
                 <UserPlus className="size-4" />
                 <span className="font-bold text-xs uppercase tracking-widest text-white">New Client</span>
              </button>
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl transition-all border border-white/10"
              >
                 <LogOut className="size-4" />
                 <span className="font-bold text-xs uppercase tracking-widest text-white">Sign Out</span>
              </button>
           </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full px-8 py-10 space-y-10">
         
         {showRegister && (
            <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden animate-in slide-in-from-top-8 duration-500">
               <CardHeader className="bg-emerald-600 text-white flex flex-row items-center justify-between py-6 px-10">
                  <CardTitle className="flex items-center gap-3">
                     <UserPlus className="size-6" /> Onboard New Banking Client
                  </CardTitle>
                  <button onClick={() => setShowRegister(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                     <ArrowLeft className="size-4" />
                  </button>
               </CardHeader>
               <CardContent className="p-10">
                  <form onSubmit={handleRegister} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Identity Name</Label>
                        <Input value={regData.full_name} onChange={e => setRegData({...regData, full_name: e.target.value})} placeholder="John Doe" required className="rounded-xl h-12" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address (Secure)</Label>
                        <Input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} placeholder="john@example.com" required className="rounded-xl h-12" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Mobile Connection</Label>
                        <Input value={regData.phone_number} onChange={e => setRegData({...regData, phone_number: e.target.value})} placeholder="+91..." required className="rounded-xl h-12" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Income Tax (PAN)</Label>
                        <Input value={regData.pan_number} onChange={e => setRegData({...regData, pan_number: e.target.value})} placeholder="ABCDE1234F" required className="rounded-xl h-12" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Residential Address</Label>
                        <Input value={regData.address} onChange={e => setRegData({...regData, address: e.target.value})} placeholder="City, State" required className="rounded-xl h-12" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Default Account Type</Label>
                        <select 
                           value={regData.account_type} 
                           onChange={e => setRegData({...regData, account_type: e.target.value})}
                           className="w-full h-12 bg-background border border-input rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                           <option>Savings</option>
                           <option>Current</option>
                           <option>Corporate</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Initial Security Password</Label>
                        <Input type="password" value={regData.transaction_password} onChange={e => setRegData({...regData, transaction_password: e.target.value})} placeholder="••••••••" required className="rounded-xl h-12" />
                     </div>
                     <div className="md:col-span-2 lg:col-span-3 pt-4">
                        <Button type="submit" className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 font-bold text-lg rounded-xl shadow-lg" disabled={isLoading}>
                           {isLoading ? "Provisioning Secure Account..." : "Confirm & Open Client Account"}
                        </Button>
                     </div>
                  </form>
               </CardContent>
            </Card>
         )}
         
         {/* Top Stats */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Asset Holders", val: adminData?.users.length || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Alerts Flagged", val: adminData?.suspicious_transactions.length || 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "System Uptime", val: "99.9%", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Security Level", val: "TIER 1", icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                 <CardContent className="p-6 flex items-center gap-5">
                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                       <stat.icon className="size-7" />
                    </div>
                    <div>
                       <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                       <div className="text-2xl font-bold text-gray-900 mt-1">{stat.val}</div>
                    </div>
                 </CardContent>
              </Card>
            ))}
         </div>

         <div className="grid lg:grid-cols-[1fr_450px] gap-8">
            
            {/* User Directory */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden min-h-[600px]">
               <CardHeader className="bg-white border-b px-8 py-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                       <UserCheck className="size-6 text-primary" /> User Database
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 font-medium italic">Full list of registered bank account holders</p>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                     <input type="text" placeholder="Search account..." className="pl-10 pr-4 py-2 bg-gray-50 border rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                          <tr>
                             <th className="px-8 py-5">Client Name</th>
                             <th className="px-8 py-5">Account Details</th>
                             <th className="px-8 py-5">Total Funds</th>
                             <th className="px-8 py-5">Risk Status</th>
                             <th className="px-8 py-5 text-right">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y text-sm">
                          {adminData?.users.map((user: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                               <td className="px-8 py-5">
                                  <div className="font-bold text-gray-900">{user.full_name}</div>
                                  <div className="flex flex-col gap-0.5">
                                     <div className="text-[10px] text-muted-foreground font-mono">{user.phone_number}</div>
                                     <div className="text-[10px] text-primary italic font-medium">{user.email}</div>
                                  </div>
                               </td>
                               <td className="px-8 py-5">
                                  <div className="font-semibold text-gray-700">{user.account_type}</div>
                                  <div className="text-xs bg-gray-100 w-fit px-2 py-0.5 rounded-md font-mono mt-1 uppercase tracking-tighter">#{user.account_number}</div>
                               </td>
                               <td className="px-8 py-5">
                                  <div className="font-bold text-gray-900 font-mono">₹{parseFloat(user.balance).toLocaleString()}</div>
                               </td>
                               <td className="px-8 py-5">
                                  {user.suspicious_tx_count > 0 ? (
                                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase ring-1 ring-red-200">High Risk ({user.suspicious_tx_count})</span>
                                  ) : (
                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase ring-1 ring-emerald-200">Secure Client</span>
                                  )}
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <button className="text-primary font-bold hover:underline">View History</button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </CardContent>
            </Card>

            {/* Suspicious Alerts */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
               <CardHeader className="bg-red-50 border-b border-red-100 px-8 py-6">
                  <CardTitle className="text-red-700 font-bold flex items-center gap-3 uppercase tracking-tighter">
                     <ShieldAlert className="size-6" /> Fraud Monitoring
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  {adminData?.suspicious_transactions.map((tx: any, idx: number) => (
                    <div key={idx} className="flex gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100 border-l-4 border-l-red-500 relative group overflow-hidden">
                       <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight className="size-4 text-red-500 cursor-pointer" />
                       </div>
                       <div className="bg-red-100 text-red-600 p-3 h-fit rounded-xl">
                          <AlertTriangle className="size-5" />
                       </div>
                       <div className="space-y-1">
                          <div className="font-bold text-gray-900 text-sm">{tx.full_name}</div>
                          <div className="text-xs text-muted-foreground font-medium">A/C: {tx.account_number}</div>
                          <div className="flex items-center gap-3 mt-2">
                             <div className="text-lg font-bold text-red-600 font-mono tracking-tight">₹{parseFloat(tx.amount).toLocaleString()}</div>
                             <div className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded font-bold">UNREALISTIC SPIKE</div>
                          </div>
                          <div className="text-[10px] text-gray-300 font-bold pt-1">{new Date(tx.created_at).toLocaleString()}</div>
                       </div>
                    </div>
                  ))}
                  {adminData?.suspicious_transactions.length === 0 && (
                    <div className="text-center py-10">
                       <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full w-fit mx-auto mb-4 border border-emerald-100">
                          <ShieldCheck className="size-10" />
                       </div>
                       <div className="font-bold text-gray-800">System Secure</div>
                       <p className="text-xs text-muted-foreground mt-1">No fraud activity detected in the last 24 hours.</p>
                    </div>
                  )}
               </CardContent>
            </Card>

         </div>
      </main>

      <footer className="bg-gray-900 text-white/40 py-8 text-center text-xs border-t border-white/5">
        GLOBAL ADMIN PORTAL · CONFIDENTIAL & ENCRYPTED · © {new Date().getFullYear()} INDIAN BANK
      </footer>
    </div>
  );
}
