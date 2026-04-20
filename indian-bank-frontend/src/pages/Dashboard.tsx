import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Bell, Power, Menu, CreditCard, Banknote, ShieldCheck, HelpCircle, ReceiptText, Eye, EyeOff, PlusCircle } from "lucide-react";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const API_BASE_URL = "http://127.0.0.1:5000/api";

interface Transaction {
  transaction_id: string;
  sender_account_id: string;
  receiver_account_id: string;
  amount: string;
  transaction_type: string;
  created_at: string;
  recv_acc?: string;
  recv_name?: string;
}

interface AccountSummary {
  full_name: string;
  account_number: string;
  account_type: string;
  balance: string;
}

export function Dashboard({ userId, onNavigateToTransfer, onLogout }: { 
  userId: string; 
  onNavigateToTransfer: () => void;
  onLogout: () => void;
}) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showBalance, setShowBalance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/user/dashboard?user_id=${userId}`);
      if (response.data.success) {
        setSummary(response.data.account);
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadHistoryPDF = () => {
    if (!summary || transactions.length === 0) return;
    const doc = new jsPDF();
    doc.setFillColor(92, 21, 36); // #5c1524
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("INDIAN BANK", 15, 25);
    doc.setFontSize(10);
    doc.text("Official Transaction Statement", 15, 33);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Account Holder: ${summary.full_name}`, 15, 55);
    doc.text(`Account Number: XXXXXXXX${summary.account_number.slice(-4)}`, 15, 62);
    doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 15, 69);
    
    const tableData = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      t.transaction_type,
      t.recv_name || 'Self/Internal',
      `INR ${parseFloat(t.amount).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Date', 'Type', 'Recipient', 'Amount']],
      body: tableData,
      headStyles: { fillStyle: 'F', fillColor: [92, 21, 36] },
    });

    doc.save(`Statement_${summary.account_number}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Corporate Navbar */}
      <header className="bg-corporate-maroon text-white border-b border-white/10 w-full sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-6">
             <div className="bg-white px-3 py-1.5 rounded-sm">
                <img src="/banklogo.png" alt="Indian Bank" className="h-6 object-contain" />
             </div>
             <div className="h-8 w-px bg-white/20 hidden md:block"></div>
             <span className="hidden md:block font-serif italic text-white/90 text-2xl tracking-widest">Imperia</span>
           </div>

           <div className="flex items-center gap-6 flex-1 justify-end">
              <div className="relative hidden lg:block w-96">
                 <input 
                    type="text" 
                    placeholder="Search accounts, services, help..." 
                    className="w-full bg-white text-gray-800 h-10 px-4 rounded-md text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary/30"
                 />
              </div>
              
              <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
                 <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                    <HelpCircle className="size-4" />
                    Support
                 </div>
                 <div className="h-4 w-px bg-white/20"></div>
                 <Bell className="size-5 hover:text-white cursor-pointer transition-all hover:scale-110" />
                 <Power className="size-5 hover:text-secondary cursor-pointer transition-all hover:scale-110" onClick={onLogout} />
              </div>
              
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2 transition-colors">
                 <Menu className="size-4" />
                 <div className="font-bold tracking-wider text-sm capitalize">
                    {summary?.full_name ? summary.full_name.split(' ')[0] : 'Member'}
                 </div>
              </button>
           </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 hidden lg:flex items-center gap-8 text-sm font-semibold text-white/80">
          <div className="py-4 text-white border-b-4 border-white cursor-pointer">Home</div>
          <div className="py-4 hover:text-white cursor-pointer transition-colors border-b-4 border-transparent">Accounts</div>
          <div className="py-4 hover:text-white cursor-pointer transition-colors border-b-4 border-transparent" onClick={onNavigateToTransfer}>Send Money</div>
          <div className="py-4 flex items-center gap-1 hover:text-white cursor-pointer transition-colors border-b-4 border-transparent">Cards <ChevronDown className="size-4" /></div>
          <div className="py-4 flex items-center gap-1 hover:text-white cursor-pointer transition-colors border-b-4 border-transparent">Investments <ChevronDown className="size-4" /></div>
          <div className="py-4 hover:text-white cursor-pointer transition-colors border-b-4 border-transparent">Payments</div>
          <div className="py-4 hover:text-white cursor-pointer transition-colors border-b-4 border-transparent">Loans</div>
        </div>
      </header>

      {/* Main Dashboard Hero Area */}
      <div className="bg-corporate-maroon text-white pt-10 pb-24 relative overflow-hidden">
         <div className="max-w-[1400px] mx-auto px-6 relative z-10 grid lg:grid-cols-[1fr_380px] gap-10">
           
           <div>
              <div className="flex justify-between items-start mb-8 gap-4">
                 <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                       <h1 className="text-4xl font-bold mb-1">Welcome, {summary?.full_name || 'User'}</h1>
                       <p className="text-white/60 text-sm">A/C: XXXXXXXX{summary?.account_number.slice(-4)}</p>
                    </div>
                    
                    {/* ACCESSIBLE BALANCE TOGGLE RIGHT NEXT TO NAME */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-4 border border-white/20 self-start">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-1">Quick Balance</span>
                          <span className="font-mono font-bold text-xl tracking-wider">
                             {showBalance ? `₹${parseFloat(summary?.balance || "0").toLocaleString('en-IN')}` : '••••••••'}
                          </span>
                       </div>
                       <button 
                        onClick={() => setShowBalance(!showBalance)}
                        className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors"
                       >
                          {showBalance ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                       </button>
                    </div>
                 </div>
                 
                 <div className="bg-[#F8E3C0] text-[#5c1524] px-5 py-2.5 rounded-full font-bold text-sm shadow-xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-all">
                    <span className="text-xl leading-none">✨</span>
                    Exclusive Offers
                    <ChevronRight className="size-4" />
                 </div>
              </div>

              {/* Navigation Grid */}
              <div className="inline-flex bg-black/20 backdrop-blur-sm rounded-xl p-1 mb-8 border border-white/10 overflow-x-auto max-w-full">
                 <div className="bg-white/10 rounded-lg px-6 py-3 flex items-center gap-4">
                    <div className="bg-primary p-2 rounded-lg">
                       <CreditCard className="size-5 text-white" />
                    </div>
                    <div className="font-bold">Summary</div>
                 </div>
                 {['Cards', 'FD/RD', 'Loans', 'Invest', 'Insure'].map(item => (
                   <div key={item} className="px-6 py-3 font-semibold text-white/70 hover:text-white cursor-pointer transition-colors">
                     {item}
                   </div>
                 ))}
              </div>

              {/* Balance Detail Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-white text-gray-900 rounded-2xl p-6 shadow-xl relative group h-full flex flex-col justify-between">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                          <div className="p-3 bg-primary/10 text-primary rounded-xl">
                             <Banknote className="size-6" />
                          </div>
                          <ChevronRight className="size-5 text-gray-300 group-hover:text-primary transition-colors" />
                       </div>
                       <div className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-tight">Main Savings A/C</div>
                       <div className="font-mono font-bold text-2xl tracking-widest mb-6">
                          {showBalance ? `₹${parseFloat(summary?.balance || "0").toLocaleString('en-IN')}` : 'XXXXXXXX'}
                       </div>
                    </div>
                    <Button onClick={downloadHistoryPDF} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-xs uppercase tracking-widest">
                       E-Statement
                    </Button>
                 </div>

                 <div className="bg-white text-gray-900 rounded-2xl p-6 shadow-xl relative group h-full flex flex-col justify-between">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                          <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                             <ShieldCheck className="size-6" />
                          </div>
                          <ChevronRight className="size-5 text-gray-300 group-hover:text-primary transition-colors" />
                       </div>
                       <div className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-tight">Investment Assets</div>
                       <div className="font-mono font-bold text-2xl tracking-widest mb-6 text-emerald-600">
                          {showBalance ? '₹0.00' : 'XXXXXXXX'}
                       </div>
                    </div>
                    <Button className="w-full border-2 border-primary text-primary hover:bg-primary/5 font-bold h-12 rounded-xl text-xs uppercase tracking-widest bg-transparent transition-colors">
                       Manage Growth
                    </Button>
                 </div>

                 <div className="bg-gradient-to-br from-primary to-[#7a1c30] text-white rounded-2xl p-6 shadow-xl group lg:block hidden">
                    <div className="flex justify-between items-start mb-10">
                       <div className="p-3 bg-white/20 rounded-xl">
                          <PlusCircle className="size-6" />
                       </div>
                    </div>
                    <div className="font-bold text-xl mb-6 leading-tight">
                       Transfer Instant Funds to anyone across India.
                    </div>
                    <Button onClick={onNavigateToTransfer} className="w-full bg-white text-primary hover:bg-gray-100 font-bold h-12 rounded-xl text-xs uppercase tracking-widest border-none">
                       Send Money Now
                    </Button>
                 </div>
              </div>
           </div>

           <div className="hidden lg:block relative">
              <div className="bg-white rounded-2xl p-8 shadow-2xl space-y-8">
                 <h2 className="text-gray-900 font-bold text-lg border-b pb-4">Quick Shortcuts</h2>
                 <div className="space-y-4">
                    {[
                      { l: "Account Statement", i: "📄" }, 
                      { l: "Open Fix Deposit", i: "⏳" }, 
                      { l: "Tax Declaration", i: "🧾" }, 
                      { l: "Link Aadhaar/PAN", i: "🔗" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer group transition-all border border-transparent hover:border-gray-200">
                         <div className="flex items-center gap-4 text-sm font-semibold text-gray-700">
                            <span className="text-xl grayscale group-hover:grayscale-0">{item.i}</span>
                            <span>{item.l}</span>
                         </div>
                         <ChevronRight className="size-4 text-gray-300 group-hover:text-primary" />
                      </div>
                    ))}
                 </div>
              </div>
           </div>
         </div>
      </div>

      {/* Action Sections Below Hero */}
      <main className="max-w-[1400px] w-full mx-auto px-6 -mt-10 relative z-20 space-y-8 pb-32">
         
         <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
               <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Unified Payment Interface</h2>
               </div>
               <div className="flex gap-4">
                  <button onClick={onNavigateToTransfer} className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                     Start Transfer
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {transactions.slice(0, 3).map((tx, idx) => (
                 <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-bold text-muted-foreground uppercase">{new Date(tx.created_at).toLocaleDateString()}</span>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${tx.transaction_type === 'Transfer' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {tx.transaction_type}
                       </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800 truncate mb-1">{tx.recv_name || 'Self'}</div>
                    <div className="text-2xl font-mono font-bold text-primary">₹{parseFloat(tx.amount).toLocaleString()}</div>
                 </div>
               ))}
               {transactions.length === 0 && (
                 <div className="col-span-3 py-12 text-center text-muted-foreground italic bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    Your recent transaction history will appear here.
                 </div>
               )}
            </div>
         </div>
      </main>
    </div>
  );
}
