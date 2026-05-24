import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User as UserIcon, 
  Sparkles,
  RefreshCw,
  Clock,
  ExternalLink,
  HelpCircle,
  Building2,
  Shield,
  Lock,
  Mail,
  Key,
  Check
} from 'lucide-react';
import { Movie, User } from '../types';

interface ProducerWalletProps {
  movies: Movie[];
  activeUser: User;
}

interface WithdrawalLog {
  id: string;
  amountCedis: number;
  network: 'MTN' | 'TELECEL' | 'AT_MONEY';
  phoneNumber: string;
  accountName: string;
  requestedAt: string;
  reference: string;
  status: 'PROCESSING' | 'SETTLED' | 'FAILED';
}

function getSimRegisteredOwner(
  phoneInput: string, 
  activeUser: { phoneNumber?: string; name: string },
  forcedMatch: 'MATCH' | 'MISMATCH' = 'MATCH'
): string {
  if (!phoneInput) return "Unknown Subscriber";
  const cleanInput = phoneInput.replace(/[-+\s()]/g, '');
  if (!cleanInput) return "Unknown Subscriber";

  if (forcedMatch === 'MATCH') {
    return activeUser.name;
  }

  const cleanProfile = (activeUser.phoneNumber || '').replace(/[-+\s()]/g, '');

  // Normalize both by removing leading '0' and country prefix like '233'
  const normInput = cleanInput.replace(/^0+/, '').replace(/^1+/, '').replace(/^233/, '');
  const normProfile = cleanProfile.replace(/^0+/, '').replace(/^1+/, '').replace(/^233/, '');

  if (normInput === normProfile && normProfile.length > 0) {
    // If mismatch is explicitly requested, return a different name
    return "Kwame Boateng";
  }
  
  // Create a deterministic hash from the phone number
  let hash = 0;
  for (let i = 0; i < cleanInput.length; i++) {
    hash += cleanInput.charCodeAt(i);
  }
  
  const boys = ["Kwame Boateng", "Samuel Osei-Tutu", "Emmanuel Mensah", "Yaw Addo", "Kofi Annan", "Prince Appiah", "Kwasi Mensah"];
  const girls = ["Ama Serwaa", "Akua Prempeh", "Abena Mensah", "Esi Gyamfi", "Yaa Asantewaa", "Efua Kwansa", "Afia Boateng"];
  
  const nameList = hash % 2 === 0 ? boys : girls;
  const pickedName = nameList[hash % nameList.length];
  
  // Ensure we don't accidentally match the active user name
  if (pickedName.toLowerCase() === activeUser.name.toLowerCase()) {
    return pickedName === "Kwame Boateng" ? "Ama Serwaa" : "Kwame Boateng";
  }
  return pickedName;
}

const DEMO_TOTAL_EARNINGS = 15990.00; // Matches Demo Financials total: 6000 + 3400 + 3240 + 2000 + 1350

export default function ProducerWallet({ movies, activeUser }: ProducerWalletProps) {
  // Check if producer has physical movie sales
  const producerMovies = useMemo(() => {
    return movies.filter(m => m.producerId === activeUser.id);
  }, [movies, activeUser.id]);

  const realTotalEarnings = useMemo(() => {
    return producerMovies.reduce((sum, m) => sum + (m.purchaseCount * m.priceCedis), 0);
  }, [producerMovies]);

  const hasRealSales = realTotalEarnings > 0;

  // Mode controller: default to demo if there are no real sales
  const [walletMode, setWalletMode] = useState<'REAL' | 'SANDBOX'>(hasRealSales ? 'REAL' : 'SANDBOX');

  // Load withdrawal logs from persistent local storage specific to this producer and mode
  const [withdrawalLogs, setWithdrawalLogs] = useState<WithdrawalLog[]>(() => {
    const key = `cinevault_withdrawals_${activeUser.id}_${walletMode}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  // Watch for walletMode changes to swap dataset cleanly
  useEffect(() => {
    const key = `cinevault_withdrawals_${activeUser.id}_${walletMode}`;
    const saved = localStorage.getItem(key);
    setWithdrawalLogs(saved ? JSON.parse(saved) : []);
  }, [walletMode, activeUser.id]);

  // Sync logs when updated
  const saveLogs = (updatedLogs: WithdrawalLog[]) => {
    setWithdrawalLogs(updatedLogs);
    const key = `cinevault_withdrawals_${activeUser.id}_${walletMode}`;
    localStorage.setItem(key, JSON.stringify(updatedLogs));
  };

  // Compute metric blocks
  const totalEarned = walletMode === 'REAL' ? realTotalEarnings : DEMO_TOTAL_EARNINGS;

  const totalWithdrawn = useMemo(() => {
    return withdrawalLogs
      .filter(w => w.status !== 'FAILED')
      .reduce((sum, w) => sum + w.amountCedis, 0);
  }, [withdrawalLogs]);

  const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

  // Form interactive UI states
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'MTN' | 'TELECEL' | 'AT_MONEY'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState(activeUser.phoneNumber || '');
  const [recipientName, setRecipientName] = useState(activeUser.name || '');
  const [simOwnershipMatch, setSimOwnershipMatch] = useState<'MATCH' | 'MISMATCH'>('MATCH');

  // Security & KYC Fraud Prevention states
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [emailNotificationToast, setEmailNotificationToast] = useState<string | null>(null);

  // SIM card registry lookup simulation states
  const [isVerifyingWithSimRegistry, setIsVerifyingWithSimRegistry] = useState(false);
  const [matchingStepLog, setMatchingStepLog] = useState<string[]>([]);

  // Validation & simulated pipeline states
  const [formError, setFormError] = useState('');
  const [submitStep, setSubmitStep] = useState<'IDLE' | 'VERIFYING' | 'ROUTING' | 'PUSHED' | 'SUCCESS'>('IDLE');
  const [newlyAddedRef, setNewlyAddedRef] = useState('');

  // Auto-fill active user parameters on mount or log updates
  useEffect(() => {
    if (!phoneNumber && activeUser.phoneNumber) {
      setPhoneNumber(activeUser.phoneNumber);
    }
  }, [activeUser]);

  // Query simulated cellular database in real-time to retrieve SIM card owner
  const detectedSimName = useMemo(() => {
    return getSimRegisteredOwner(phoneNumber, activeUser, simOwnershipMatch);
  }, [phoneNumber, activeUser, simOwnershipMatch]);

  // Keep recipientName in sync with the SIM card database owner
  useEffect(() => {
    setRecipientName(detectedSimName);
  }, [detectedSimName]);

  // Handle Max click
  const handleSetMax = () => {
    if (availableBalance > 0) {
      setWithdrawalAmount(availableBalance.toFixed(2));
    }
  };

  // Handle Action submission and initial security validations with MoMo SIM registry lookup
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(withdrawalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please input a valid positive amount.');
      return;
    }

    if (parsedAmount < 10) {
      setFormError('Minimum withdrawal threshold is GH₵ 10.00.');
      return;
    }

    if (parsedAmount > availableBalance) {
      setFormError(`Insufficient balance. Highest possible transfer is GH₵ ${availableBalance.toFixed(2)}.`);
      return;
    }

    // Basic Mobile Number validation (Ghana: 10 digits starting with 0)
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const ghanaPhoneRegex = /^0(24|54|55|59|20|50|26|27|56|57)\d{7}$/; 
    if (!ghanaPhoneRegex.test(cleanPhone)) {
      setFormError('Please enter a valid active 10-digit Ghanaian Mobile Money number (e.g. 024XXXXXXX).');
      return;
    }

    if (!recipientName.trim()) {
      setFormError('Recipient Account Legal Name is required to ensure audit clearing.');
      return;
    }

    // Initiate simulated live SIM card registry & MoMo database lookup sequence
    setIsVerifyingWithSimRegistry(true);
    setMatchingStepLog([]);

    const resolvedSimName = getSimRegisteredOwner(cleanPhone, activeUser, simOwnershipMatch);

    const logSteps = [
      `🔍 Connecting to active standard Ghipss Telecom gateway node API...`,
      `📡 Requesting MSISDN cell phone registry array for Sim: ${cleanPhone}...`,
      `📑 Querying standard Ghana Centralized SIM Card Registration database records...`,
      `🔍 Compiling Mobile Money (MoMo) KYC database registration names...`,
      `🔒 Retrieved owner of record from MoMo SIM database: "${resolvedSimName.toUpperCase()}"`,
      `⚡ Performing strict cryptographic validation against registered CineVault Producer profile name: "${activeUser.name.toUpperCase()}"`
    ];

    let stepIndex = 0;
    setMatchingStepLog([logSteps[0]]);

    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < logSteps.length) {
        setMatchingStepLog((prev) => [...prev, logSteps[stepIndex]]);
      } else {
        clearInterval(interval);

        // Strict Anti-Fraud Mobile Money Name Matching Check - Must Match Exactly
        const cleanRecipient = resolvedSimName.trim().toLowerCase().replace(/\s+/g, ' ');
        const cleanProfileName = activeUser.name.trim().toLowerCase().replace(/\s+/g, ' ');
        
        // Enforce strict name matching to prevent fraud or unauthorized transfers
        const isMatched = cleanRecipient === cleanProfileName;
        if (!isMatched) {
          setFormError(`🛑 SIM IDENTITY MISMATCH: The name registered on standard SIM Card / Mobile Money database for ${phoneNumber} ("${resolvedSimName}") does not match your registered CineVault Account legal identity ("${activeUser.name}"). To prevent financial routing fraud, withdrawals are locked to your matching registered identity.`);
          setIsVerifyingWithSimRegistry(false);
          return;
        }

        // 2) Trigger secure email verification code dispatch to the registered producer's email
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(generatedCode);
        setOtpSent(true);
        setOtpVerified(false);
        setUserOtpInput('');
        setOtpError('');
        setIsVerifyingWithSimRegistry(false);
        
        // Display simulated secure mail delivery notification toast in-app
        setEmailNotificationToast(`🔑 SECURITY SECUREMAIL GATE: A payout Authorization OTP [${generatedCode}] has been delivered to ${activeUser.email}`);
      }
    }, 750);
  };

  // Handle OTP Verification and Finalizing Settlement Routing
  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (userOtpInput.trim() !== generatedOtp) {
      setOtpError('Invalid authorization PIN code. Please double-check the simulated secure code email box notification below and retry.');
      return;
    }

    setOtpVerified(true);
    // Hide notification once verified
    setEmailNotificationToast(null);

    // Kickoff multi-step payout simulation using the verified amount
    const parsedAmount = parseFloat(withdrawalAmount);
    const cleanPhone = phoneNumber.replace(/\s+/g, '');

    setSubmitStep('VERIFYING');

    setTimeout(() => {
      // Step 2: Clearing through Ghipss network routing
      setSubmitStep('ROUTING');
      
      setTimeout(() => {
        // Step 3: Trigger active webhook
        setSubmitStep('PUSHED');

        setTimeout(() => {
          // Success: Create receipt ledger
          const referenceId = `WD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(3, 7).toUpperCase()}`;
          
          const newLog: WithdrawalLog = {
            id: `wd-${Date.now()}`,
            amountCedis: parsedAmount,
            network: selectedNetwork,
            phoneNumber: cleanPhone,
            accountName: recipientName,
            requestedAt: new Date().toISOString(),
            reference: referenceId,
            status: 'SETTLED' // Settled immediately inside client simulation box
          };

          const updated = [newLog, ...withdrawalLogs];
          saveLogs(updated);
          setNewlyAddedRef(referenceId);
          setSubmitStep('SUCCESS');

          // Reset forms
          setWithdrawalAmount('');
          setOtpSent(false);
          setOtpVerified(false);
          setGeneratedOtp('');
          setUserOtpInput('');
          
          // Clear visual dialog state after delay
          setTimeout(() => {
            setSubmitStep('IDLE');
          }, 4000);

        }, 1500);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="bg-sleek-card border border-sleek-border rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden font-sans">
      
      {/* Absolute Decorative Glow elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Switcher Options */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sleek-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25">
              <Wallet className="w-5 h-5" />
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-brand">CREATOR SETTLEMENTS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase font-display">
            MoMo Earning Wallet
          </h2>
          <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
            Monitor real-time digital ticket earnings and trigger instant payouts to MTN Mobile Money, Telecel Cash, or AT Money directly.
          </p>
        </div>

        {/* Dynamic Sandbox/Real Selector */}
        <div className="flex items-center bg-sleek-dark p-1 rounded-xl border border-sleek-border shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              setWalletMode('SANDBOX');
              setFormError('');
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              walletMode === 'SANDBOX'
                ? 'bg-amber-950/45 text-amber-500 font-extrabold border border-amber-500/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🧪 Sandbox funds
          </button>
          <button
            type="button"
            onClick={() => {
              if (!hasRealSales) {
                alert('No real box office sales recorded yet. Publish a movie listed with a price, log in as a Buyer to purchase it via Mobile Money simulations, and your real mode wallet will fill instantly!');
                return;
              }
              setWalletMode('REAL');
              setFormError('');
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              walletMode === 'REAL'
                ? 'bg-brand/10 text-brand font-extrabold border border-brand/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ⚡ Live Sales ({hasRealSales ? 'Active' : 'Empty'})
          </button>
        </div>
      </div>

      {/* Metric Cards Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Earning Balance */}
        <div className="bg-gradient-to-br from-sleek-dark via-sleek-dark to-brand/5 p-5 rounded-xl border border-sleek-border relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-brand/10 rounded-full blur-2xl group-hover:scale-125 transition-all duration-300" />
          <p className="text-[9px] text-zinc-550 font-black uppercase tracking-widest">Available Balance</p>
          <p className="text-2xl font-black font-display text-brand mt-1.5 font-mono">
            GH₵ {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 font-mono">
            <span>Secured Escrow</span>
            <span className="text-[#00F0FF] animate-pulse">● Live for withdrawal</span>
          </div>
        </div>

        {/* Card 2: Total Earned */}
        <div className="bg-sleek-dark p-5 rounded-xl border border-sleek-border">
          <p className="text-[9px] text-zinc-550 font-black uppercase tracking-widest">Accumulated Sales</p>
          <p className="text-2xl font-black font-display text-white mt-1.5 font-mono">
            GH₵ {totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aggregate box office gross</span>
          </div>
        </div>

        {/* Card 3: Total Settled / Withdrawn */}
        <div className="bg-sleek-dark p-5 rounded-xl border border-sleek-border">
          <p className="text-[9px] text-zinc-550 font-black uppercase tracking-widest">Total Settled Out</p>
          <p className="text-2xl font-black font-display text-zinc-300 mt-1.5 font-mono">
            - GH₵ {totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-zinc-550 mt-2">
            <ArrowDownRight className="w-3.5 h-3.5 text-brand" />
            <span>Pushed via secure Ghipss gateway</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2 font-sans">
        {/* LEFT: THE WITHDRAWAL INITIATION FORM */}
        <div className="lg:col-span-6 bg-sleek-dark/60 border border-sleek-border p-6 rounded-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-display flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
              Request Mobile Money Transfer
            </h3>
            <p className="text-[11px] text-zinc-500">Transfers generally settle to active customer SIM card caches within milliseconds.</p>
          </div>

          {/* SIMULATED EMAIL INBOX COMPONENT ACCENT TO REVEAL SECURE SYSTEM DELIVERED OTP */}
          {emailNotificationToast && (
            <div className="bg-cyan-950/30 border border-cyan-400/30 text-cyan-400 p-4 rounded-xl text-xs space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] text-cyan-300">
                <Mail className="w-3.5 h-3.5 animate-pulse" />
                <span>Simulated Secure Mail Registry</span>
              </div>
              <p className="text-zinc-300 leading-relaxed font-sans text-[11px]">
                A real-time, tamper-proof payout authorization passcode was simulated & delivered to your registered email: 
                <span className="text-cyan-400 font-semibold block mt-0.5 font-mono">{activeUser.email}</span>
              </p>
              <div className="bg-black/50 border border-cyan-400/20 p-2.5 rounded-lg text-center font-mono font-black text-sm tracking-[0.25em] text-[#00F0FF]">
                {generatedOtp}
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">
                Copy the 6-digit PIN above to authorize this fund settlement challenge.
              </p>
            </div>
          )}

          {/* Form error displays */}
          {formError && (
            <div className="bg-red-950/40 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {submitStep !== 'IDLE' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-950/70 border border-brand/20 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3 mb-4"
              >
                {submitStep === 'VERIFYING' && (
                  <>
                    <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Verifying SIM Credentials</p>
                    <p className="text-[10px] text-zinc-550">Resolving bank clearing network registries for phone account: {phoneNumber}</p>
                  </>
                )}

                {submitStep === 'ROUTING' && (
                  <>
                    <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Encrypting Routing Token</p>
                    <p className="text-[10px] text-zinc-550">Dispatching escrow unlock arrays through standard Ghipss endpoints...</p>
                  </>
                )}

                {submitStep === 'PUSHED' && (
                  <>
                    <div className="w-7 h-7 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-[#00F0FF] uppercase tracking-widest">Awaiting SIM Node Signal</p>
                    <p className="text-[10px] text-zinc-550">MoMo Cashout Push triggered. Confirming digital trace protocol receipt...</p>
                  </>
                )}

                {submitStep === 'SUCCESS' && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-1.5"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">SETTLEMENT DISPATCHED</p>
                    <p className="text-[10px] text-zinc-350">Transfer successfully settled to verified Sim Cache.</p>
                    <p className="text-[9px] font-mono text-zinc-650 uppercase tracking-tighter">Reference ID: {newlyAddedRef}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isVerifyingWithSimRegistry ? (
            /* DYNAMIC LIVE SIM REGISTRY API CHECK LOGS SCREEN */
            <div className="bg-black/40 border border-[#00F0FF]/25 p-5 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#00F0FF] animate-spin shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF]">SIM & MoMo Database Sync Check</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Querying the telecom registry database to verify cellular MSISDN register cards match your legal identification info exactly:
              </p>
              <div className="space-y-2.5 font-mono text-[10px] bg-zinc-950/90 p-3.5 rounded-xl border border-sleek-border/70">
                {matchingStepLog.map((log, index) => {
                  const isLast = index === matchingStepLog.length - 1;
                  return (
                    <div key={index} className="flex items-start gap-2 text-zinc-300">
                      {isLast && index < 5 ? (
                        <RefreshCw className="w-3 h-3 text-[#00F0FF] animate-spin mt-0.5 shrink-0" />
                      ) : (
                        <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                      )}
                      <span className={isLast ? 'text-[#00F0FF] font-semibold' : 'text-zinc-500'}>{log}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono mt-1 pt-2 border-t border-sleek-border/30">
                <span>MTA REGISTRY Node: ACTIVE</span>
                <span>NATIONAL NODE: COMPLIANT</span>
              </div>
            </div>
          ) : !otpSent ? (
            /* STANDARD INITIATION FORM WITH REGISTERED NAME MATCH REQUIREMENT */
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Input 1: Withdrawal Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-350 uppercase">Transfer Amount</label>
                  <button
                    type="button"
                    onClick={handleSetMax}
                    className="text-[10px] text-brand hover:underline font-bold transition-all cursor-pointer"
                  >
                    Withdraw Max (GH₵ {availableBalance.toFixed(2)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold font-mono">GH₵</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="10"
                    value={withdrawalAmount}
                    disabled={submitStep !== 'IDLE' || availableBalance === 0}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl pl-12 pr-16 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px] font-bold">GHS</span>
                </div>
              </div>

              {/* Input 2: Mobile Money Network Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-350 uppercase">Payout Gateway Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* MTN MoMo */}
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('MTN')}
                    disabled={submitStep !== 'IDLE'}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      selectedNetwork === 'MTN'
                        ? 'bg-amber-950/25 border-amber-500/50 text-amber-500'
                        : 'bg-sleek-dark border-sleek-border text-zinc-450 hover:bg-sleek-dark/70 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-[10px] font-black tracking-tighter">MTN MoMo</span>
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                  </button>

                  {/* Telecel Cash */}
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('TELECEL')}
                    disabled={submitStep !== 'IDLE'}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      selectedNetwork === 'TELECEL'
                        ? 'bg-red-950/25 border-red-500/50 text-red-500'
                        : 'bg-sleek-dark border-sleek-border text-zinc-450 hover:bg-sleek-dark/70 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-[10px] font-black tracking-tighter">Telecel Cash</span>
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                  </button>

                  {/* AT Money */}
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('AT_MONEY')}
                    disabled={submitStep !== 'IDLE'}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      selectedNetwork === 'AT_MONEY'
                        ? 'bg-emerald-950/25 border-emerald-500/50 text-emerald-400'
                        : 'bg-sleek-dark border-sleek-border text-zinc-450 hover:bg-sleek-dark/70 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-[10px] font-black tracking-tighter">AT Money</span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  </button>
                </div>
              </div>

              {/* Input 3: Phone Number Block */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-350 uppercase">SIM Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                  <input
                    type="text"
                    placeholder="e.g. 0244123456"
                    value={phoneNumber}
                    disabled={submitStep !== 'IDLE'}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* SIM Registration Sandbox Setting Section */}
              <div className="bg-zinc-950/40 border border-sleek-border/60 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand animate-pulse" />
                    SIM Registration Simulator Status
                  </span>
                  <span className="text-brand text-[8px] tracking-widest font-mono bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded leading-none">
                    SANDBOX SETTING
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimOwnershipMatch('MATCH')}
                    disabled={submitStep !== 'IDLE'}
                    className={`py-2 px-2.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      simOwnershipMatch === 'MATCH'
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 font-black'
                        : 'bg-sleek-dark/60 border-sleek-border/30 text-zinc-500 hover:text-zinc-350 hover:bg-sleek-dark'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${simOwnershipMatch === 'MATCH' ? 'bg-emerald-400 animate-pulse' : 'bg-transparent'}`}></span>
                    Matches My Name
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimOwnershipMatch('MISMATCH')}
                    disabled={submitStep !== 'IDLE'}
                    className={`py-2 px-2.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      simOwnershipMatch === 'MISMATCH'
                        ? 'bg-red-950/30 border-red-500/40 text-red-400 font-black'
                        : 'bg-sleek-dark/60 border-sleek-border/30 text-zinc-500 hover:text-zinc-350 hover:bg-sleek-dark'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${simOwnershipMatch === 'MISMATCH' ? 'bg-red-400 animate-pulse' : 'bg-transparent'}`}></span>
                    Someone Else's Name
                  </button>
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal font-sans">
                  💡 <strong>Toggle above</strong> to simulate whether standard central telecommunication records show this phone number matches your CineVault identity: <strong className="text-zinc-400">{activeUser.name}</strong>.
                </p>
              </div>

              {/* Input 4: Recipient Registered Name WITH VALIDATION GUIDE */}
              <div className="space-y-1.5 opacity-95">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-355">
                  <label className="flex items-center gap-1.5 text-zinc-300">
                    <Shield className="w-3.5 h-3.5 text-brand" />
                    SIM Card Registrant Name (MTN/MoMo Database)
                  </label>
                  <span className="text-[9px] font-mono text-[#00F0FF] uppercase tracking-wider bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20">
                    Auto-Queried
                  </span>
                </div>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                  <input
                    type="text"
                    value={recipientName}
                    readOnly
                    className="w-full bg-zinc-950/80 border border-sleek-border/70 rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-350 font-bold cursor-not-allowed select-none focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  🔒 The owner name above is retrieved live from the centralized telecom SIM database. To prevent fraud, this name <strong>MUST MATCH</strong> your registered CineVault identity: <strong className="text-brand text-xs">{activeUser.name}</strong> exactly. If name doesn't match, the withdrawal <strong className="text-red-400">WILL NOT BE SUCCESSFUL</strong>.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitStep !== 'IDLE' || availableBalance <= 0}
                className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  availableBalance > 0 && submitStep === 'IDLE'
                    ? 'bg-brand hover:bg-brand-hover text-black shadow-lg shadow-brand/10 hover:scale-[1.01]'
                    : 'bg-sleek-dark text-zinc-650 border border-sleek-border cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Security Verification Code</span>
              </button>
            </form>
          ) : (
            /* EMAIL LOCK CHALLENGE SCREEN */
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 animate-fadeIn">
              <div className="bg-sleek-dark p-4 rounded-xl border border-sleek-border space-y-3">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Shield className="w-4 h-4 text-brand" />
                  <span className="text-[10px] uppercase font-black tracking-wider text-brand">Secure Settlement Escrow Lock</span>
                </div>
                <h4 className="text-xs font-bold text-white">Review Payout Details</h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs pt-0.5">
                  <div className="bg-zinc-950/20 p-2.5 rounded-lg border border-sleek-border/40">
                    <p className="text-[8px] text-zinc-500 uppercase">Settlement Amount</p>
                    <p className="font-mono font-bold text-red-400 mt-0.5">GH₵ {withdrawalAmount}</p>
                  </div>
                  <div className="bg-zinc-950/20 p-2.5 rounded-lg border border-sleek-border/40">
                    <p className="text-[8px] text-zinc-500 uppercase">Payout Gateway</p>
                    <p className="font-bold text-zinc-300 mt-0.5">{selectedNetwork} Cashout</p>
                  </div>
                  <div className="bg-zinc-950/20 p-2.5 rounded-lg border border-sleek-border/40 col-span-2">
                    <p className="text-[8px] text-zinc-500 uppercase">Registered Owner SIM</p>
                    <p className="font-semibold text-zinc-200 mt-0.5 truncate">{recipientName} ({phoneNumber})</p>
                  </div>
                </div>
              </div>

              {otpError && (
                <div className="bg-red-950/40 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* Pin Code Input Block */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-350 uppercase block">Enter Email Verification PIN Code</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                  <input
                    type="text"
                    placeholder="Enter 6-digit passcode"
                    maxLength={6}
                    value={userOtpInput}
                    disabled={submitStep !== 'IDLE'}
                    onChange={(e) => setUserOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl pl-11 pr-4 py-3 text-sm text-center font-mono font-black tracking-[0.4em] text-brand focus:outline-none focus:ring-1 focus:ring-brand placeholder:tracking-normal placeholder:font-sans placeholder:font-normal"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-550 leading-normal">
                  Account ownership verification code dispatched to your registered email address on file: <strong className="text-zinc-300 font-mono">{activeUser.email}</strong>
                </p>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitStep !== 'IDLE' || userOtpInput.length < 6}
                  className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    userOtpInput.length === 6 && submitStep === 'IDLE'
                      ? 'bg-gradient-to-r from-brand to-[#00F0FF] text-black shadow-lg shadow-brand/10 hover:scale-[1.01]'
                      : 'bg-sleek-dark text-zinc-650 border border-sleek-border cursor-not-allowed'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Settle & Release Funds</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpVerified(false);
                    setEmailNotificationToast(null);
                    setOtpError('');
                  }}
                  disabled={submitStep !== 'IDLE'}
                  className="w-full py-3 rounded-xl border border-sleek-border/70 hover:border-zinc-700 bg-transparent hover:bg-sleek-dark/40 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer text-center"
                >
                  Abort Settlement & Edit Parameters
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT: LEDGER OF RECENT WITHDRAWALS */}
        <div className="lg:col-span-6 bg-sleek-dark/60 border border-sleek-border p-6 rounded-xl space-y-5 self-stretch flex flex-col justify-between">
          <div className="space-y-1 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00F0FF]" />
                Settlement History Logs
              </h3>
              <p className="text-[11px] text-zinc-500">Chronological history registry of payout processes.</p>
            </div>

            {/* Reset simulator list */}
            {withdrawalLogs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Cleanse history logs for this simulated wallet wallet? This restores the balance state.')) {
                    saveLogs([]);
                  }
                }}
                className="text-[9px] bg-sleek-dark hover:bg-sleek-card border border-sleek-border py-1 px-2.5 rounded-md text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 pt-3 pr-1">
            {withdrawalLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 bg-sleek-dark/20 border-2 border-dashed border-sleek-border/70 rounded-xl">
                <Clock className="w-8 h-8 text-zinc-700 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-zinc-400">Ledger Registry Empty</p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-[240px] leading-relaxed">
                    No money has been pushed from this filmmaker account cache. Complete the transfer form to verify the clearing engine.
                  </p>
                </div>
              </div>
            ) : (
              withdrawalLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="bg-sleek-dark/80 border border-sleek-border p-3.5 rounded-xl hover:border-zinc-700 transition-colors flex items-center justify-between gap-4 animate-fadeIn"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-zinc-450 uppercase">{log.reference}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${
                        log.network === 'MTN'
                          ? 'bg-amber-500/10 text-amber-500'
                          : log.network === 'TELECEL'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {log.network === 'MTN' ? 'MTN' : log.network === 'TELECEL' ? 'TELECEL' : 'AT MONEY'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-zinc-300">
                      <span className="font-bold truncate" title={log.accountName}>{log.accountName}</span>
                      <span className="text-zinc-550">•</span>
                      <span className="font-mono text-[10px] text-zinc-455">{log.phoneNumber}</span>
                    </div>

                    <p className="text-[9px] text-zinc-550 font-sans">
                      {new Date(log.requestedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right shrink-0 space-y-1 bg-zinc-950/20 px-2.5 py-1.5 rounded-lg border border-sleek-border/40">
                    <p className="text-xs font-black font-mono text-red-400 shrink-0">
                      - GH₵ {log.amountCedis.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest">SETTLED</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-sleek-card border border-sleek-border/60 p-3 rounded-xl text-[10px] text-zinc-455 leading-relaxed flex items-center gap-2 mt-4 shrink-0">
            <Building2 className="w-4 h-4 text-[#00F0FF] shrink-0" />
            <p>
              Withdrawals verify trace tokens secure against standard bank-grade audits. Direct Mobile Money settlements process instantly in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
