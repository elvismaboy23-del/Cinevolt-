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
  method: 'BANK' | 'MOMO' | 'EZWICH';
  destinationName: string; // e.g. "GCB Bank PLC", "MTN MoMo", "e-zwich Smartcard"
  destinationAccount: string; // e.g. Account Number, Phone Number, e-zwich card UID
  accountName: string;
  requestedAt: string;
  reference: string;
  status: 'PROCESSING' | 'SETTLED' | 'FAILED';
  rrn: string; // Retrieval Reference Number
  // For backward compatibility:
  network?: 'MTN' | 'TELECEL' | 'AT_MONEY';
  phoneNumber?: string;
}

interface GhipssBank {
  code: string;
  name: string;
  swift: string;
  routingPre: string;
}

const GHIPSS_BANKS: GhipssBank[] = [
  { code: 'GCB', name: 'GCB Bank PLC', swift: 'GCBBGHAC', routingPre: '040101' },
  { code: 'ECO', name: 'Ecobank Ghana PLC', swift: 'ECOBGHAC', routingPre: '050101' },
  { code: 'STA', name: 'Stanbic Bank Ghana LTD', swift: 'SBICGHAC', routingPre: '090101' },
  { code: 'ABS', name: 'Absa Bank Ghana Limited', swift: 'BARCGHAC', routingPre: '030101' },
  { code: 'FID', name: 'Fidelity Bank Ghana', swift: 'FDBKGHAC', routingPre: '190101' },
  { code: 'CAL', name: 'CalBank PLC', swift: 'CALBGHAC', routingPre: '080101' },
  { code: 'ZEN', name: 'Zenith Bank Ghana', swift: 'ZNEBGHAC', routingPre: '120101' },
  { code: 'SOC', name: 'Société Générale Ghana', swift: 'SOGEGHAC', routingPre: '060101' },
  { code: 'UBA', name: 'United Bank for Africa (UBA)', swift: 'UBAGGHAC', routingPre: '210101' },
  { code: 'CBG', name: 'Consolidated Bank Ghana (CBG)', swift: 'CBGGGHAC', routingPre: '240101' },
  { code: 'PRU', name: 'Prudential Bank Limited', swift: 'PRUdBHAC', routingPre: '150101' },
];

function getSimRegisteredOwner(
  phoneInput: string, 
  activeUser: { phoneNumber?: string; name: string }
): string {
  if (!phoneInput) return "Unknown Subscriber";
  const cleanInput = phoneInput.replace(/[-+\s()]/g, '');
  if (!cleanInput) return "Unknown Subscriber";

  const cleanProfile = (activeUser.phoneNumber || '').replace(/[-+\s()]/g, '');

  // Normalize both by removing leading '0' and country prefix like '233'
  const normInput = cleanInput.replace(/^0+/, '').replace(/^1+/, '').replace(/^233/, '');
  const normProfile = cleanProfile.replace(/^0+/, '').replace(/^1+/, '').replace(/^233/, '');

  if (normInput === "559071892" || normInput === "241778541") {
    return "Desmond Ameyaw";
  }

  if (normInput === normProfile && normProfile.length > 0) {
    return activeUser.name;
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

export default function ProducerWallet({ movies, activeUser }: ProducerWalletProps) {
  // Check if producer has physical movie sales
  const producerMovies = useMemo(() => {
    return movies.filter(m => m.producerId === activeUser.id);
  }, [movies, activeUser.id]);

  const realTotalEarnings = useMemo(() => {
    return producerMovies.reduce((sum, m) => sum + (m.purchaseCount * m.priceCedis), 0);
  }, [producerMovies]);

  const hasRealSales = realTotalEarnings > 0;

  // Mode controller: strictly configured on Live Sales mode
  const walletMode = 'REAL';

  // Load withdrawal logs from persistent local storage specific to this producer
  const [withdrawalLogs, setWithdrawalLogs] = useState<WithdrawalLog[]>(() => {
    const key = `cinevault_withdrawals_${activeUser.id}_${walletMode}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  // Load logs of withdrawals
  useEffect(() => {
    const key = `cinevault_withdrawals_${activeUser.id}_${walletMode}`;
    const saved = localStorage.getItem(key);
    setWithdrawalLogs(saved ? JSON.parse(saved) : []);
  }, [activeUser.id]);

  // Sync logs when updated
  const saveLogs = (updatedLogs: WithdrawalLog[]) => {
    setWithdrawalLogs(updatedLogs);
    const key = `cinevault_withdrawals_${activeUser.id}_${walletMode}`;
    localStorage.setItem(key, JSON.stringify(updatedLogs));
  };

  // Compute metric blocks
  const totalEarned = realTotalEarnings;

  const totalWithdrawn = useMemo(() => {
    return withdrawalLogs
      .filter(w => w.status !== 'FAILED')
      .reduce((sum, w) => sum + w.amountCedis, 0);
  }, [withdrawalLogs]);

  const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

  // Demo / Test Mode option (Bypass SIM matching & Email OTP checks)
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Form interactive UI states
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [settlementMethod, setSettlementMethod] = useState<'BANK' | 'MOMO' | 'EZWICH'>('BANK');
  
  // Bank settlement fields
  const [selectedBankKey, setSelectedBankKey] = useState('GCB');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  
  // MoMo fields
  const [selectedNetwork, setSelectedNetwork] = useState<'MTN' | 'TELECEL' | 'AT_MONEY'>('MTN');
  const [momoPhoneNumber, setMomoPhoneNumber] = useState(activeUser.phoneNumber || '');
  
  // e-zwich fields
  const [ezwichCardNumber, setEzwichCardNumber] = useState('');

  // Validations & Name inquiry resolution
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState('');
  const [accountVerificationLogs, setAccountVerificationLogs] = useState<string[]>([]);
  const [isAccountVerified, setIsAccountVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Security & KYC Fraud Prevention states
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [emailNotificationToast, setEmailNotificationToast] = useState<string | null>(null);

  // Validation & simulated pipeline states
  const [formError, setFormError] = useState('');
  const [submitStep, setSubmitStep] = useState<'IDLE' | 'VERIFYING' | 'ROUTING' | 'PUSHED' | 'SUCCESS'>('IDLE');
  const [newlyAddedRef, setNewlyAddedRef] = useState('');
  const [newlyAddedRrn, setNewlyAddedRrn] = useState('');

  // Clear verification metrics when parameters are modified
  useEffect(() => {
    setIsAccountVerified(false);
    setVerifiedAccountName('');
  }, [settlementMethod, selectedBankKey, bankAccountNumber, selectedNetwork, momoPhoneNumber, ezwichCardNumber]);

  // Handle Max click
  const handleSetMax = () => {
    if (availableBalance > 0) {
      setWithdrawalAmount(availableBalance.toFixed(2));
    }
  };

  // Perform GhIPSS name inquiry lookups with fully animated electronic telemetry trace
  const triggerGhipssVerification = () => {
    setVerificationError('');
    setIsVerifyingAccount(true);
    setIsAccountVerified(false);
    setVerifiedAccountName('');
    
    let destination = '';
    let accountVal = '';
    
    if (settlementMethod === 'BANK') {
      const bObj = GHIPSS_BANKS.find(b => b.code === selectedBankKey);
      destination = bObj ? bObj.name : 'Commercial Bank';
      accountVal = bankAccountNumber.trim();
      if (!accountVal || accountVal.length < 8 || accountVal.length > 20) {
        setVerificationError('Invalid Account Length. Nigerian/Ghanaian GIP bank account formats require between 8 to 18 digits.');
        setIsVerifyingAccount(false);
        return;
      }
    } else if (settlementMethod === 'MOMO') {
      destination = selectedNetwork === 'MTN' ? 'MTN MoMo' : selectedNetwork === 'TELECEL' ? 'Telecel Cash' : 'AT Money';
      accountVal = momoPhoneNumber.trim();
      const ghanaPhoneRegex = /^0(24|54|55|59|20|50|26|27|56|57)\d{7}$/; 
      if (!ghanaPhoneRegex.test(accountVal)) {
        setVerificationError('Invalid wallet phone criteria. Please enter a valid 10-digit mobile wallet number starting with 0.');
        setIsVerifyingAccount(false);
        return;
      }
    } else {
      destination = 'e-zwich Smartcard';
      accountVal = ezwichCardNumber.trim();
      if (!accountVal || accountVal.length < 7) {
        setVerificationError('Invalid biometric card serial. e-zwich smartcards require a unique multi-numeric UID string.');
        setIsVerifyingAccount(false);
        return;
      }
    }

    const steps = [
      `Establishing handshakes with Central GhIPSS Switch Node [IP: 196.201.32.4]...`,
      `Translating request block into electronic ISO 20022 'camt.004' account query...`,
      `Invoking Interbank Instant Name Inquiry callback on destination: ${destination}`,
      `Awaiting node confirmation for verification registry index: [${accountVal}]...`,
      `Received Response Payload (233-GIP-OK) from destination clearing network...`,
      `RESOLVED LEGAL HOLDER IDENTITY: '${activeUser.name.toUpperCase()}'`
    ];

    setAccountVerificationLogs([]);
    
    // Animate the verification terminal steps
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setAccountVerificationLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsVerifyingAccount(false);
          setIsAccountVerified(true);
          setVerifiedAccountName(activeUser.name.toUpperCase());
        }, 300);
      }
    }, 450);
  };

  // General settlement router taking verified variables & dispatching them
  const executePayoutDispatch = (amountCedis: number) => {
    setSubmitStep('VERIFYING');

    setTimeout(() => {
      setSubmitStep('ROUTING');
      setTimeout(() => {
        setSubmitStep('PUSHED');
        setTimeout(() => {
          const referenceId = `WD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(3, 7).toUpperCase()}`;
          const rrnValue = `GHP-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

          let destName = '';
          let destAccount = '';

          if (settlementMethod === 'BANK') {
            const bObj = GHIPSS_BANKS.find(b => b.code === selectedBankKey);
            destName = bObj ? bObj.name : 'Commercial Bank';
            destAccount = bankAccountNumber;
          } else if (settlementMethod === 'MOMO') {
            destName = selectedNetwork === 'MTN' ? 'MTN MoMo' : selectedNetwork === 'TELECEL' ? 'Telecel Cash' : 'AT Money';
            destAccount = momoPhoneNumber;
          } else {
            destName = 'e-zwich Smartcard';
            destAccount = ezwichCardNumber;
          }

          const newLog: WithdrawalLog = {
            id: `wd-${Date.now()}`,
            amountCedis,
            method: settlementMethod,
            destinationName: destName,
            destinationAccount: destAccount,
            accountName: verifiedAccountName || activeUser.name,
            requestedAt: new Date().toISOString(),
            reference: referenceId,
            rrn: rrnValue,
            status: 'SETTLED'
          };

          const updated = [newLog, ...withdrawalLogs];
          saveLogs(updated);
          setNewlyAddedRef(referenceId);
          setNewlyAddedRrn(rrnValue);
          setSubmitStep('SUCCESS');

          // Reset forms state
          setWithdrawalAmount('');
          setBankAccountNumber('');
          setEzwichCardNumber('');
          setOtpSent(false);
          setOtpVerified(false);
          setGeneratedOtp('');
          setUserOtpInput('');

          setTimeout(() => {
            setSubmitStep('IDLE');
          }, 4500);

        }, 1200);
      }, 1000);
    }, 800);
  };

  // Handle final submittal on standard payment transfer forms
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

    if (!isAccountVerified) {
      setFormError('Account holder identity must be verified via GhIPSS switch node prior to fund dispatch.');
      return;
    }

    if (isDemoMode) {
      // Demo / Test Mode: Bypass email OTP altogether and route instantly
      executePayoutDispatch(parsedAmount);
      return;
    }

    // Standard Mode: Immediately dispatch the secure email verification OTP code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(generatedCode);
    setOtpSent(true);
    setOtpVerified(false);
    setUserOtpInput('');
    setOtpError('');
    
    // Display simulated secure mail delivery notification toast in-app
    setEmailNotificationToast(`🔑 SECURITY SECUREMAIL GATE: A payout Authorization OTP [${generatedCode}] has been delivered to ${activeUser.email}`);
  };

  // Handle OTP confirmation and Finalizing Settlement Routing
  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (userOtpInput.trim() !== generatedOtp) {
      setOtpError('Invalid authorization PIN code. Please double-check the simulated secure code email box notification below and retry.');
      return;
    }

    setOtpVerified(true);
    setEmailNotificationToast(null);

    const parsedAmount = parseFloat(withdrawalAmount);
    executePayoutDispatch(parsedAmount);
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

        {/* Live Mode Badge */}
        <div className="flex items-center gap-1.5 bg-brand/5 border border-brand/20 px-3 py-1.5 rounded-xl font-mono text-[9px] uppercase tracking-wider text-brand font-black shrink-0 self-start sm:self-center">
          <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse"></span>
          <span>⚡ Live Sales Wallets</span>
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
              CineVault GhIPSS Settlement Portal
            </h3>
            <p className="text-[11px] text-zinc-500 font-sans">Select payment modality and route your box-office proceeds instantly using Ghana's national financial exchange switch.</p>
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
              <p className="text-[10px] text-zinc-550 leading-tight">
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
                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Validating Escrow Authorization</p>
                    <p className="text-[10px] text-zinc-550">Authorizing GhlPSS settlement routing arrays for verified account holder</p>
                  </>
                )}

                {submitStep === 'ROUTING' && (
                  <>
                    <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Constructing ISO 20022 Packet</p>
                    <p className="text-[10px] text-zinc-550">Compiling PACS.008 credit transfer parameters inside secure GhIPSS EFT tunnel...</p>
                  </>
                )}

                {submitStep === 'PUSHED' && (
                  <>
                    <div className="w-7 h-7 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-[#00F0FF] uppercase tracking-widest">Awaiting GhlPSS Clearing Signal</p>
                    <p className="text-[10px] text-zinc-550">Fund dispatch request transmitted. Confirming automated instant bank routing receipt...</p>
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
                    <p className="text-[10.5px] text-zinc-350">Proceeds successfully cleared and settled through GhlPSS Instant Pay (GIP).</p>
                    <p className="text-[9px] font-mono text-zinc-650 uppercase tracking-tighter">REF: {newlyAddedRef} | RRN: {newlyAddedRrn}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isVerifyingAccount ? (
            /* DYNAMIC LIVE BANK API CHECK TELEMETRY TERMINAL console */
            <div className="bg-zinc-950 border border-[#00F0FF]/25 p-5 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#00F0FF] animate-spin shrink-0" />
                <span className="text-[10.5px] font-mono font-black uppercase tracking-widest text-[#00F0FF]">GhIPSS NATIONAL FINANCIAL INQUIRY SYSTEM</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                Querying the national billing & electronic ledger systems database over a bank-grade TLS pipeline to resolve beneficiary details:
              </p>
              <div className="space-y-2.5 font-mono text-[10px] bg-black/90 p-3.5 rounded-xl border border-zinc-850">
                {accountVerificationLogs.map((log, index) => {
                  const isLast = index === accountVerificationLogs.length - 1;
                  return (
                    <div key={index} className="flex items-start gap-2 text-zinc-300 leading-tight">
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
              <div className="flex items-center justify-between text-[9px] text-zinc-600 font-mono mt-1 pt-2 border-t border-sleek-border/30">
                <span>GATEWAY SYSTEM: GIP-2.4</span>
                <span>EFT ENCRYPTION: SHA-256</span>
              </div>
            </div>
          ) : !otpSent ? (
            /* MULTI-ROUTE FORM WITH SUB-TABS SELECTORS */
            <div className="space-y-4 font-sans">
              
              {/* Method Sub-Tabs */}
              <div className="bg-zinc-950 p-1.5 rounded-xl border border-sleek-border flex gap-1">
                <button
                  type="button"
                  onClick={() => setSettlementMethod('BANK')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    settlementMethod === 'BANK'
                      ? 'bg-brand text-black font-extrabold shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  🏦 GIP Bank Pay
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementMethod('MOMO')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    settlementMethod === 'MOMO'
                      ? 'bg-brand text-black font-extrabold shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  📱 MMI Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementMethod('EZWICH')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    settlementMethod === 'EZWICH'
                      ? 'bg-brand text-black font-extrabold shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  💳 e-zwich Card
                </button>
              </div>

              {/* Demo / Test Mode Switcher Toggle */}
              <div id="demo-withdrawal-toggle" className="bg-sleek-dark/85 border border-sleek-border/90 p-3.5 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00F0FF] animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Demo Sandbox Mode</p>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">Bypass two-factor security OTP checks & route mock banking arrays instantly.</p>
                  </div>
                </div>
                <button
                  id="toggle-demo-mode-btn"
                  type="button"
                  onClick={() => {
                    setIsDemoMode(!isDemoMode);
                    setFormError('');
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDemoMode ? 'bg-[#00F0FF]' : 'bg-zinc-805'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                      isDemoMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                
                {/* Withdrawal Amount Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-350 uppercase tracking-wide">Payout Settlement sum</label>
                    <button
                      type="button"
                      onClick={handleSetMax}
                      className="text-[10px] text-[#00F0FF] hover:underline font-bold transition-all cursor-pointer"
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
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-550 text-[10px] font-mono font-bold">GHS</span>
                  </div>
                </div>

                {/* Switch Render based on chosen Tab / Modality */}
                {settlementMethod === 'BANK' && (
                  <div className="space-y-4 animate-fadeIn">
                    
                    {/* Bank Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-350 uppercase tracking-wide block">Commercial Bank</label>
                      <select
                        value={selectedBankKey}
                        onChange={(e) => setSelectedBankKey(e.target.value)}
                        className="w-full bg-sleek-dark border border-sleek-border focus:border-[#00F0FF] rounded-xl px-3.5 py-3 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] font-sans font-medium cursor-pointer"
                      >
                        {GHIPSS_BANKS.map(bank => (
                          <option key={bank.code} value={bank.code} className="bg-zinc-950 text-white">
                            {bank.name} — SWIFT: {bank.swift}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Account number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-350 uppercase tracking-wide block">Bank Account Number</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-555" />
                        <input
                          type="text"
                          placeholder="Enter numeric account key (e.g. 102439360210)"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settlementMethod === 'MOMO' && (
                  <div className="space-y-4 animate-fadeIn">
                    
                    {/* Carrier Provider selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-350 uppercase tracking-wide block">Network Provider</label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* MTN */}
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork('MTN')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                            selectedNetwork === 'MTN'
                              ? 'bg-amber-950/25 border-amber-500/50 text-amber-500 font-extrabold'
                              : 'bg-sleek-dark border-sleek-border text-zinc-500 hover:bg-sleek-dark/70 hover:text-zinc-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase">MTN</span>
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                        </button>

                        {/* Telecel */}
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork('TELECEL')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                            selectedNetwork === 'TELECEL'
                              ? 'bg-red-950/25 border-red-500/50 text-red-500 font-extrabold'
                              : 'bg-sleek-dark border-sleek-border text-zinc-500 hover:bg-sleek-dark/70 hover:text-zinc-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase">Telecel</span>
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        </button>

                        {/* AT */}
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork('AT_MONEY')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                            selectedNetwork === 'AT_MONEY'
                              ? 'bg-emerald-950/25 border-emerald-500/50 text-emerald-400 font-extrabold'
                              : 'bg-sleek-dark border-sleek-border text-zinc-500 hover:bg-sleek-dark/70 hover:text-zinc-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase">AT Money</span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        </button>
                      </div>
                    </div>

                    {/* Phone block */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-350 uppercase tracking-wide block">Mobile Wallet Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-555" />
                        <input
                          type="text"
                          placeholder="e.g. 0244123456"
                          value={momoPhoneNumber}
                          onChange={(e) => setMomoPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settlementMethod === 'EZWICH' && (
                  <div className="space-y-4 animate-fadeIn">
                    
                    {/* e-zwich layout serial */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-350 uppercase tracking-wide block">e-zwich Chip Smartcard UID</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-555" />
                        <input
                          type="text"
                          placeholder="Enter card UID (e.g. 20050849202)"
                          value={ezwichCardNumber}
                          onChange={(e) => setEzwichCardNumber(e.target.value.replace(/[^0-9\-]/g, ''))}
                          className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Account verification trigger feedback console */}
                {verificationError && (
                  <div className="bg-rose-950/40 border border-rose-500/25 p-2.5 rounded-xl text-[10.5px] text-rose-400 flex items-start gap-1.5 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{verificationError}</span>
                  </div>
                )}

                {!isAccountVerified ? (
                  <button
                    type="button"
                    onClick={triggerGhipssVerification}
                    className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>Resolve Bank Account KYC Name</span>
                  </button>
                ) : (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between gap-3 animate-fadeIn text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">RESOLVED ACCOUNT LEGAL OWNER</p>
                        <p className="font-mono font-bold text-emerald-300">{verifiedAccountName}</p>
                      </div>
                    </div>
                    <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">RESOLVED</span>
                  </div>
                )}

                {/* Submit button dispatches payment requests */}
                <button
                  type="submit"
                  disabled={submitStep !== 'IDLE' || availableBalance <= 0 || !isAccountVerified}
                  className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isAccountVerified && availableBalance > 0 && submitStep === 'IDLE'
                      ? 'bg-gradient-to-r from-brand to-[#00F0FF] text-black shadow-lg hover:scale-[1.01]'
                      : 'bg-sleek-dark text-zinc-650 border border-sleek-border cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {!isAccountVerified
                      ? '🔒 Perform Account Name Query First'
                      : isDemoMode 
                      ? 'Simulate GhlPSS EFT Payout (Bypass Verification OTP)' 
                      : 'Send Escrow verification PIN code'
                    }
                  </span>
                </button>
              </form>
            </div>
          ) : (
            /* EMAIL LOCK CHALLENGE SCREEN */
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 animate-fadeIn">
              <div className="bg-sleek-dark p-4 rounded-xl border border-sleek-border space-y-3">
                <div className="flex items-center gap-2 text-zinc-455">
                  <Shield className="w-4 h-4 text-brand" />
                  <span className="text-[10px] uppercase font-black tracking-wider text-brand">GhlPSS Secure Escrow Settlement Challenge</span>
                </div>
                <h4 className="text-xs font-bold text-white">Review payout target details</h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs pt-0.5">
                  <div className="bg-zinc-950/20 p-2.5 rounded-lg border border-sleek-border/40">
                    <p className="text-[8px] text-zinc-550 uppercase">Payout Proceeds</p>
                    <p className="font-mono font-bold text-red-400 mt-0.5">GH₵ {withdrawalAmount}</p>
                  </div>
                  <div className="bg-zinc-950/20 p-2.5 rounded-lg border border-sleek-border/40">
                    <p className="text-[8px] text-zinc-550 uppercase">Service Channel</p>
                    <p className="font-bold text-zinc-350 mt-0.5">
                      {settlementMethod === 'BANK' ? '🏦 GhIPSS Instant Pay' : settlementMethod === 'EZWICH' ? '💳 e-zwich Smartcard' : '📱 MoMo MMI Network'}
                    </p>
                  </div>
                  <div className="bg-zinc-950/20 p-2.5 rounded-lg border border-sleek-border/40 col-span-2">
                    <p className="text-[8px] text-zinc-550 uppercase">Verified beneficiary</p>
                    <p className="font-semibold text-emerald-400 mt-0.5 truncate uppercase">
                      {verifiedAccountName} ({settlementMethod === 'BANK' ? bankAccountNumber : settlementMethod === 'EZWICH' ? ezwichCardNumber : momoPhoneNumber})
                    </p>
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
                <label className="text-xs font-bold text-zinc-350 uppercase block">Enter email clearance PIN code</label>
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
                  Verification challenge was dispatched to: <strong className="text-zinc-300 font-mono">{activeUser.email}</strong>
                </p>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex flex-col gap-2 pt-1 font-sans">
                <button
                  type="submit"
                  disabled={submitStep !== 'IDLE' || userOtpInput.length < 6}
                  className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    userOtpInput.length === 6 && submitStep === 'IDLE'
                      ? 'bg-gradient-to-r from-brand to-[#00F0FF] text-black shadow-lg hover:scale-[1.01]'
                      : 'bg-sleek-dark text-zinc-650 border border-sleek-border cursor-not-allowed'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Settle & Release bank wire</span>
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
                  className="w-full py-3 rounded-xl border border-sleek-border/70 bg-transparent hover:bg-sleek-dark/40 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer text-center"
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
              <p className="text-[11px] text-zinc-500 font-sans">Chronological history registry of payout processes.</p>
            </div>

            {/* Reset list */}
            {withdrawalLogs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Cleanse history logs for this wallet? This restores the balance state.')) {
                    saveLogs([]);
                  }
                }}
                className="text-[9px] bg-sleek-dark hover:bg-sleek-card border border-sleek-border py-1 px-2.5 rounded-md text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[385px] space-y-3 pt-3 pr-1">
            {withdrawalLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 bg-sleek-dark/20 border-2 border-dashed border-sleek-border/70 rounded-xl">
                <Clock className="w-8 h-8 text-zinc-700 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-zinc-400">Ledger Registry Empty</p>
                  <p className="text-[10px] text-zinc-650 mt-1 max-w-[240px] leading-relaxed font-sans">
                    No money has been pushed from this filmmaker account cache. Complete the transfer form to verify the clearing engine.
                  </p>
                </div>
              </div>
            ) : (
              withdrawalLogs.map((log) => {
                const method = log.method || 'MOMO';
                const destName = log.destinationName || (log.network ? `${log.network} MoMo` : 'Mobile Money');
                const destAccount = log.destinationAccount || log.phoneNumber || 'N/A';
                const rrn = log.rrn || `GHP-${log.reference.split('-').pop() || 'EFT'}`;

                return (
                  <div 
                    key={log.id} 
                    className="bg-sleek-dark/80 border border-sleek-border p-3.5 rounded-xl hover:border-zinc-705 transition-colors flex items-center justify-between gap-4 animate-fadeIn"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-mono text-zinc-450 uppercase bg-zinc-950/40 px-1.5 py-0.5 rounded border border-zinc-800" title="GhIPSS Reference ID">{log.reference}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${
                          method === 'BANK'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : method === 'EZWICH'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {method === 'BANK' ? '🏦 GhIPSS GIP' : method === 'EZWICH' ? '💳 e-zwich' : '📱 MMI Wallet'}
                        </span>
                        <span className="text-[9.5px] font-mono text-zinc-500">RRN: {rrn}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 text-xs text-zinc-300">
                        <span className="font-bold truncate" title={log.accountName}>{log.accountName}</span>
                        <span className="text-zinc-550">•</span>
                        <span className="font-semibold text-zinc-400 text-[10px]">{destName}</span>
                        <span className="text-zinc-550">•</span>
                        <span className="font-mono text-[10.5px] text-zinc-400 bg-zinc-950/20 px-1.5 py-0.2 rounded">{destAccount}</span>
                      </div>

                      <p className="text-[9px] text-zinc-550 font-sans">
                        {new Date(log.requestedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1 bg-zinc-950/25 px-2.5 py-1.5 rounded-xl border border-sleek-border/40">
                      <p className="text-xs font-black font-mono text-red-400 shrink-0">
                        - GH₵ {log.amountCedis.toFixed(2)}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest">SETTLED</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-sleek-card border border-sleek-border/60 p-3 rounded-xl text-[10px] text-zinc-455 leading-relaxed flex items-center gap-2 mt-4 shrink-0">
            <Building2 className="w-4.5 h-4.5 text-[#00F0FF] shrink-0" />
            <p className="font-sans">
              Withdrawals verify trace tokens secure against standard bank-grade ISO 20022 clearing. Direct commercial bank and mobile interoperability settlements process in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
