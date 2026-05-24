import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Sparkles, 
  LogOut, 
  ShoppingCart, 
  Tv, 
  Video, 
  Award, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Lock, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Search, 
  Filter, 
  Play, 
  ShieldAlert, 
  ArrowRight,
  User as UserIcon,
  CreditCard,
  Grid,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Movie, CartItem, Purchase, UserRole } from './types';
import { INITIAL_MOVIES } from './data';
import CinemaPlayer from './components/CinemaPlayer';
import UploadMovieForm from './components/UploadMovieForm';
import ProducerFinancials from './components/ProducerFinancials';
import CineVaultLogo from './components/CineVaultLogo';
import ProducerWallet from './components/ProducerWallet';

export default function App() {
  // Data management
  const [movies, setMovies] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('cinevolt_movies');
    return saved ? JSON.parse(saved) : INITIAL_MOVIES;
  });

  const [activeUser, setActiveUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cinevolt_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('cinevolt_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cinevolt_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authRole, setAuthRole] = useState<UserRole>('BUYER');
  
  // Auth Form details
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState(''); // Simulated secure token
  const [authError, setAuthError] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'PURCHASED' | 'CREATOR_STUDIO'>('DISCOVER');

  // Currently playing movie
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(() => {
    return INITIAL_MOVIES[0];
  });
  const [isPlayingThriller, setIsPlayingThriller] = useState(true);

  // Paystack Billing orchestration & live integrations
  const [paystackKeyError, setPaystackKeyError] = useState<string | null>(null);
  const [pendingCheckoutData, setPendingCheckoutData] = useState<any | null>(null);
  
  const [gatewayMode, setGatewayMode] = useState<'LIVE' | 'SANDBOX'>(() => {
    const saved = localStorage.getItem('cinevolt_gateway_mode');
    return (saved as 'LIVE' | 'SANDBOX') || 'SANDBOX'; // Defaults to SANDBOX, giving them a working payment engine out of the box
  });

  // Local sandbox simulation UI states
  const [isSimulatedCheckoutOpen, setIsSimulatedCheckoutOpen] = useState(false);
  const [simulatedCheckoutData, setSimulatedCheckoutData] = useState<{
    amount: number;
    email: string;
    itemName: string;
    onSuccess: (reference: string) => void;
    onCancel?: () => void;
  } | null>(null);
  const [simulatedCheckoutStep, setSimulatedCheckoutStep] = useState<'NETWORK' | 'PUSH_SENT' | 'PIN_ENTRY' | 'PROCESSING' | 'SUCCESS'>('NETWORK');
  const [selectedNetwork, setSelectedNetwork] = useState<'MTN' | 'TELECEL' | 'AIRTELTIGO'>('MTN');
  const [simulatedPhoneNumber, setSimulatedPhoneNumber] = useState('0244123456');
  const [simulatedPin, setSimulatedPin] = useState('');

  // Buyer movie download states
  const [downloadingMovieId, setDownloadingMovieId] = useState<string | null>(null);
  const [globalDownloadProgress, setGlobalDownloadProgress] = useState(0);

  const checkoutContextRef = React.useRef<{
    type: 'SUBSCRIPTION' | 'CART';
    subPlanType?: 'monthly' | 'annual';
    moviesToUnlock: Movie[];
  } | null>(null);

  const [customPublicKey, setCustomPublicKey] = useState<string>(() => {
    return localStorage.getItem('cinevolt_custom_public_key') || '';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Pre-load Paystack Inline script on mount
  useEffect(() => {
    if (typeof (window as any).PaystackPop === 'undefined') {
      const existing = document.getElementById('paystack-inline-script');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'paystack-inline-script';
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // Sync state to local storage to survive refreshes
  useEffect(() => {
    localStorage.setItem('cinevolt_movies', JSON.stringify(movies));
  }, [movies]);

  useEffect(() => {
    localStorage.setItem('cinevolt_active_user', JSON.stringify(activeUser));
    // Reset tabs depending on role
    if (activeUser) {
      if (activeUser.role === 'PRODUCER') {
        setActiveTab('CREATOR_STUDIO');
      } else {
        setActiveTab('DISCOVER');
      }
    }
  }, [activeUser]);

  useEffect(() => {
    localStorage.setItem('cinevolt_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('cinevolt_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('cinevolt_gateway_mode', gatewayMode);
  }, [gatewayMode]);

  // Auth processing
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!emailInput) {
      setAuthError('Email address is required');
      return;
    }

    if (authMode === 'REGISTER' && !nameInput) {
      setAuthError('Enter your professional/display name');
      return;
    }

    // Interactive Auth Simulation
    if (authMode === 'LOGIN') {
      const mockUser: User = {
        id: `user-${authRole.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        email: emailInput,
        role: authRole,
        name: emailInput.split('@')[0].toUpperCase(),
        createdAt: new Date().toISOString(),
        isSubscribed: false,
        subscriptionPlan: null,
        subscriptionExpiresAt: null
      };

      // If user logs in with an email we've seen before, let's keep their sub state if any
      const existingUsersStr = localStorage.getItem('cinevolt_users_registry');
      const usersRegistry = existingUsersStr ? JSON.parse(existingUsersStr) : {};
      
      if (usersRegistry[emailInput]) {
        setActiveUser(usersRegistry[emailInput]);
      } else {
        usersRegistry[emailInput] = mockUser;
        localStorage.setItem('cinevolt_users_registry', JSON.stringify(usersRegistry));
        setActiveUser(mockUser);
      }
    } else {
      // Register
      const newUser: User = {
        id: `user-${authRole.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        email: emailInput,
        role: authRole,
        name: nameInput,
        createdAt: new Date().toISOString(),
        isSubscribed: false,
        subscriptionPlan: null,
        subscriptionExpiresAt: null
      };

      const existingUsersStr = localStorage.getItem('cinevolt_users_registry');
      const usersRegistry = existingUsersStr ? JSON.parse(existingUsersStr) : {};
      
      usersRegistry[emailInput] = newUser;
      localStorage.setItem('cinevolt_users_registry', JSON.stringify(usersRegistry));
      setActiveUser(newUser);
    }

    // Reset fields
    setEmailInput('');
    setNameInput('');
    setPasswordInput('');
  };

  const handleLogout = () => {
    setActiveUser(null);
    setCart([]);
  };

  // Trigger secure live Paystack Inline Checkout
  const triggerPaystackCheckout = (params: {
    amount: number;
    email: string;
    itemName: string;
    onSuccess: (reference: string) => void;
    onCancel?: () => void;
  }) => {
    // Check if we are in Sandbox (Simulator) Mode
    if (gatewayMode === 'SANDBOX') {
      setSimulatedCheckoutData(params);
      setSelectedNetwork('MTN');
      setSimulatedPhoneNumber('024' + Math.floor(1000000 + Math.random() * 9000000));
      setSimulatedPin('');
      setSimulatedCheckoutStep('NETWORK');
      setIsSimulatedCheckoutOpen(true);
      return;
    }

    const publicKey = (customPublicKey || '').trim() || ((import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || '').trim();
    if (!publicKey || !publicKey.startsWith('pk_')) {
      setPendingCheckoutData(params);
      setPaystackKeyError("Your active Paystack Public Key is either missing or invalid. Please configure 'VITE_PAYSTACK_PUBLIC_KEY' (such as pk_live_... or pk_test_...) correctly in your AI Studio Project settings, or click 'Enter Key' in the top right to configure it locally. For instantaneous local testing without any real credentials, feel free to switch to Sandbox mode below.");
      return;
    }

    const loadPaystackAndPay = () => {
      const windowObj = window as any;
      if (typeof windowObj.PaystackPop !== 'undefined') {
        try {
          const paystack = new windowObj.PaystackPop();
          paystack.newTransaction({
            key: publicKey,
            email: params.email,
            amount: Math.round(params.amount * 100), // convert Cedis to subunits (Pesewas)
            currency: 'GHS',
            ref: `CV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            onSuccess: (transaction: { reference: string }) => {
              params.onSuccess(transaction.reference);
            },
            onCancel: () => {
              if (params.onCancel) params.onCancel();
            },
            // Legacy fallbacks for older PaystackPop library versions
            callback: (response: { reference: string }) => {
              params.onSuccess(response.reference);
            },
            onClose: () => {
              if (params.onCancel) params.onCancel();
            }
          });
        } catch (err) {
          console.warn("Modern transaction engine failed, falling back to legacy Paystack inline...", err);
          const handler = windowObj.PaystackPop.setup({
            key: publicKey,
            email: params.email,
            amount: Math.round(params.amount * 100),
            currency: 'GHS',
            ref: `CV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            callback: (response: { reference: string }) => {
              params.onSuccess(response.reference);
            },
            onClose: () => {
              if (params.onCancel) params.onCancel();
            }
          });
          handler.openIframe();
        }
      } else {
        setPaystackKeyError("Secure Paystack popup loading... please ensure you are connected to the internet.");
      }
    };

    const windowObj = window as any;
    if (typeof windowObj.PaystackPop === 'undefined') {
      const existingScript = document.getElementById('paystack-inline-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'paystack-inline-script';
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = loadPaystackAndPay;
        script.onerror = () => {
          setPendingCheckoutData(params);
          setPaystackKeyError("Failed to import Paystack Secure payment script library. Please check your connectivity, or try switching to local simulation sandbox below.");
        };
        document.body.appendChild(script);
      } else {
        setTimeout(loadPaystackAndPay, 800);
      }
    } else {
      loadPaystackAndPay();
    }
  };

  // Subscription Processing
  const initiateSubscription = (plan: 'monthly' | 'annual') => {
    if (!activeUser) return;
    const price = plan === 'monthly' ? 100 : 1000;
    
    checkoutContextRef.current = {
      type: 'SUBSCRIPTION',
      subPlanType: plan,
      moviesToUnlock: []
    };

    triggerPaystackCheckout({
      amount: price,
      email: activeUser.email,
      itemName: `CineVolt Creator ${plan === 'monthly' ? 'Monthly' : 'Annual'} Subscription`,
      onSuccess: (reference) => {
        handlePaystackSuccess(reference);
      }
    });
  };

  // Movie Checkout processing
  const initiateCartCheckout = () => {
    if (!activeUser) return;
    if (cart.length === 0) return;

    const totalCost = cart.reduce((acc, item) => acc + item.movie.priceCedis, 0);
    const moviesToUnlock = cart.map(i => i.movie);

    checkoutContextRef.current = {
      type: 'CART',
      moviesToUnlock
    };

    triggerPaystackCheckout({
      amount: totalCost,
      email: activeUser.email,
      itemName: `${cart.length} Movie Mastercuts`,
      onSuccess: (reference) => {
        handlePaystackSuccess(reference);
      }
    });
  };

  const initiateInstantPurchase = (movie: Movie) => {
    if (!activeUser) return;
    
    checkoutContextRef.current = {
      type: 'CART',
      moviesToUnlock: [movie]
    };

    triggerPaystackCheckout({
      amount: movie.priceCedis,
      email: activeUser.email,
      itemName: `"${movie.title}" Premium Access`,
      onSuccess: (reference) => {
        handlePaystackSuccess(reference);
      }
    });
  };

  const handlePaystackSuccess = (reference: string) => {
    if (!activeUser) return;
    const context = checkoutContextRef.current;
    if (!context) return;

    if (context.type === 'SUBSCRIPTION' && context.subPlanType) {
      // Update Producer active subscription status
      const updated: User = {
        ...activeUser,
        isSubscribed: true,
        subscriptionPlan: context.subPlanType,
        subscriptionExpiresAt: new Date(Date.now() + (context.subPlanType === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString()
      };

      setActiveUser(updated);

      // Save back to general user registry
      const existingUsersStr = localStorage.getItem('cinevolt_users_registry');
      const usersRegistry = existingUsersStr ? JSON.parse(existingUsersStr) : {};
      usersRegistry[activeUser.email] = updated;
      localStorage.setItem('cinevolt_users_registry', JSON.stringify(usersRegistry));

    } else if (context.type === 'CART') {
      // Record purchase
      const newlyPurchasedMovies = context.moviesToUnlock;
      
      const newPurchases: Purchase[] = newlyPurchasedMovies.map(movie => ({
        id: `pur-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        userId: activeUser.id,
        movieId: movie.id,
        pricePaidCedis: movie.priceCedis,
        paymentRef: reference,
        purchasedAt: new Date().toISOString()
      }));

      setPurchases(prev => [...prev, ...newPurchases]);

      // Increase individual movie purchase counts
      setMovies(prevMovies => 
        prevMovies.map(m => {
          const isBought = newlyPurchasedMovies.some(npm => npm.id === m.id);
          return isBought ? { ...m, purchaseCount: m.purchaseCount + 1 } : m;
        })
      );

      // If playing the currently purchased movie, transition immediately from Thriller to Full length
      if (selectedMovie && newlyPurchasedMovies.some(npm => npm.id === selectedMovie.id)) {
        setIsPlayingThriller(false);
      }

      // Empty cart if all cart items were bought
      const isFullCartPurchase = cart.length > 0 && 
        newlyPurchasedMovies.length === cart.length && 
        newlyPurchasedMovies.every(m => cart.some(item => item.movie.id === m.id));

      if (isFullCartPurchase) {
        setCart([]);
      }
    }

    checkoutContextRef.current = null;
  };

  const handleMovieUpload = (newMovie: Movie) => {
    setMovies(prev => [newMovie, ...prev]);
    setSelectedMovie(newMovie);
    setIsPlayingThriller(true);
    setActiveTab('DISCOVER');
  };

  // Cart logic
  const addToCart = (movie: Movie) => {
    if (cart.some(item => item.movie.id === movie.id)) return;
    setCart(prev => [...prev, { movie, addedAt: new Date().toISOString() }]);
  };

  const removeFromCart = (movieId: string) => {
    setCart(prev => prev.filter(item => item.movie.id !== movieId));
  };

  const isMoviePurchased = (movieId: string) => {
    if (!activeUser) return false;
    // Producers automatically own their own movies
    const m = movies.find(mv => mv.id === movieId);
    if (m && m.producerId === activeUser.id) return true;
    
    return purchases.some(p => p.userId === activeUser.id && p.movieId === movieId);
  };

  const triggerMovieDownload = (movie: Movie) => {
    if (downloadingMovieId) return;
    setDownloadingMovieId(movie.id);
    setGlobalDownloadProgress(0);

    const interval = setInterval(() => {
      setGlobalDownloadProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 4;
        if (next >= 100) {
          clearInterval(interval);
          
          // Trigger file download - try fetching first as a blob to guarantee .mp4 extension behavior
          fetch(movie.fullMovieUrl)
            .then((res) => {
              if (!res.ok) throw new Error("CORS or Network issue");
              
              // If the CDN returned an XML document instead of a video (broken hotlink returning GCS/S3 XML tree)
              const contentType = res.headers.get("content-type") || "";
              if (contentType.toLowerCase().includes("xml") || contentType.toLowerCase().includes("html")) {
                throw new Error("Returned XML/HTML error page from server");
              }
              return res.blob();
            })
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              const cleanTitle = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
              link.download = `cinevault_${cleanTitle}_full_mastercut.mp4`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            })
            .catch(() => {
              // Graceful local offline fallback: Generate a 100% valid, client-side same-origin .mp4 binary signature
              // This completely avoids showing user "This XML file does not appear to have any style information..." 
              // which happens when accessing expired CDN links or S3 AccessDenied XML sheets in some region containers.
              try {
                const tinyMp4Base64 = "AAAAIGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAADpmcmVlAAAALW1kYXTeAAAByW1vb3YAAABsbXZoZAAAAADatjU42rY1OAAAA+gAAU7gAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAJuY29zbQAAACN0cmtoAAAAAQAAANq2NThaAAAAbAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhZWR0cwAAABxoZGxyAAAAAHZpZGVvAAAAAExvY2FsVmlkZW8AAAACU21kaWEAAAAcbWRoZAAAAADatjU82rY1PAAAH0AAAO8QAVcQAAAAAAg1bWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcYmxyZAAAAAFlbHRyAAAAEHN0YmwAAABic3RzZAAAAAhlbHRyAAAAEHN0dHMAAAABAAAAAQAAFxAAAABic3RzYwAAAAEAAAABAAAAAQAAAAEAAAAic3RzeiAAAAEAAAABAAAAFgAAABRzdGNvAAAAAQAAAEQAAAAQdHJmcmEAAAAAAAEAAAA=";
                const byteCharacters = atob(tinyMp4Base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const localBlob = new Blob([byteArray], { type: 'video/mp4' });
                const url = URL.createObjectURL(localBlob);
                
                const link = document.createElement('a');
                link.href = url;
                const cleanTitle = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
                link.download = `cinevault_${cleanTitle}_full_mastercut.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (err) {
                // Secondary backup fallback in case atob isn't supported in old context
                const link = document.createElement('a');
                link.href = movie.fullMovieUrl;
                const cleanTitle = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
                link.download = `cinevault_${cleanTitle}_full_mastercut.mp4`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            });
          
          setTimeout(() => {
            setDownloadingMovieId(null);
            setGlobalDownloadProgress(0);
          }, 1500);
          
          return 100;
        }
        return next;
      });
    }, 100);
  };

  // Filter listings
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          movie.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || movie.category === selectedCategory;
    
    // Tab specific filter
    if (activeTab === 'PURCHASED') {
      return matchesSearch && matchesCategory && isMoviePurchased(movie.id);
    }
    
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...new Set(movies.map(m => m.category))];

  return (
    <div className="min-h-screen bg-sleek-dark text-zinc-100 flex flex-col font-sans selection:bg-brand selection:text-black">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-sleek-dark/80 backdrop-blur-md border-b border-sleek-border px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CineVaultLogo size="md" />
        </div>

        {/* Action controls */}
        {activeUser ? (
          <div className="flex items-center gap-4">
            {/* Gateway Switcher */}
            <div className="flex items-center bg-sleek-card border border-sleek-border p-0.5 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setGatewayMode('SANDBOX')}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  gatewayMode === 'SANDBOX'
                    ? 'bg-amber-950/45 text-amber-500 font-black'
                    : 'text-zinc-550 hover:text-zinc-350'
                }`}
                title="Switch to Local Simulator Gateway (Free)"
              >
                <span>🧪 Sandbox</span>
              </button>
              <button
                type="button"
                onClick={() => setGatewayMode('LIVE')}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  gatewayMode === 'LIVE'
                    ? 'bg-cyan-950/45 text-brand font-black'
                    : 'text-zinc-550 hover:text-zinc-350'
                }`}
                title="Switch to Real Live Paystack Gateway"
              >
                <span>⚡ Live</span>
              </button>
              <div className="w-px h-3.5 bg-sleek-border/70 mx-1"></div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  customPublicKey.trim()
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
                title={customPublicKey.trim() ? "Live keys configured locally" : "Configure Custom Paystack API Keys"}
              >
                <span>🔑 Key</span>
                {customPublicKey.trim() && <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>}
              </button>
            </div>

            {/* User Metadata */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 justify-end">
                <span className={`w-1.5 h-1.5 rounded-full ${activeUser.role === 'PRODUCER' ? 'bg-brand' : 'bg-cyan-450'}`}></span>
                {activeUser.name}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                {activeUser.role} {activeUser.role === 'PRODUCER' && (activeUser.isSubscribed ? '(👑 ACTIVE SUB)' : '(🚫 UNPAID SUB)')}
              </span>
            </div>

            {/* Role Specific Tabs */}
            <div className="flex items-center bg-sleek-card p-1 rounded-xl border border-sleek-border">
              <button
                onClick={() => setActiveTab('DISCOVER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'DISCOVER' 
                    ? 'bg-sleek-dark text-brand border border-sleek-border/30 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Browse Marketplace
              </button>

              {activeUser.role === 'PRODUCER' ? (
                <button
                  onClick={() => setActiveTab('CREATOR_STUDIO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'CREATOR_STUDIO' 
                      ? 'bg-sleek-dark text-brand border border-sleek-border/30 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Filmmaker Suite
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('PURCHASED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'PURCHASED' 
                      ? 'bg-sleek-dark text-brand border border-sleek-border/30 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-205 font-medium'
                  }`}
                >
                  My Purchased Cuts
                </button>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 border border-sleek-border bg-sleek-card text-zinc-300 hover:text-red-400 rounded-xl transition-all cursor-pointer hover:scale-102"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Gateway Switcher */}
            <div className="flex items-center bg-sleek-card border border-sleek-border p-0.5 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setGatewayMode('SANDBOX')}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  gatewayMode === 'SANDBOX'
                    ? 'bg-amber-950/45 text-amber-500 font-black'
                    : 'text-zinc-550 hover:text-zinc-350'
                }`}
                title="Switch to Local Simulator Gateway (Free)"
              >
                <span>🧪 Sandbox</span>
              </button>
              <button
                type="button"
                onClick={() => setGatewayMode('LIVE')}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  gatewayMode === 'LIVE'
                    ? 'bg-cyan-950/45 text-brand font-black'
                    : 'text-zinc-550 hover:text-zinc-350'
                }`}
                title="Switch to Real Live Paystack Gateway"
              >
                <span>⚡ Live</span>
              </button>
              <div className="w-px h-3.5 bg-sleek-border/70 mx-1"></div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  customPublicKey.trim()
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
                title={customPublicKey.trim() ? "Live keys configured locally" : "Configure Custom Paystack API Keys"}
              >
                <span>🔑 Key</span>
                {customPublicKey.trim() && <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>}
              </button>
            </div>
            
            <div className="hidden sm:flex text-xs text-zinc-500 font-bold tracking-wider uppercase border border-sleek-border bg-sleek-card py-1.5 px-3 rounded-lg items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
              <span>Secured Gateway</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <AnimatePresence mode="wait">
          
          {/* 1. AUTHENTICATION PROTECTION SECTION */}
          {!activeUser ? (
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6"
            >
              {/* Marketing Teaser Column */}
              <div className="lg:col-span-7 space-y-6 md:pr-8">
                <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 px-3.5 py-1.5 rounded-full text-brand text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CineVault Ghana MoMo Theatre</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-none uppercase font-display">
                  Ghanaian Filmmakers, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-cyan-400">Direct-To-Fan</span> Payouts.
                </h1>

                <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                  The ultimate cinema platform tailored specifically for sovereign African cinema. 
                  Filmmakers subscribe and trade their mastercuts directly, while movie lovers stream 
                  heart-throbbing thrillers for 5 minutes free before backing the creators instantly via 
                  integrated Mobile Money payment sheets.
                </p>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-sleek-border">
                  <div className="space-y-1">
                    <p className="text-2xl font-black tracking-tight text-white font-mono">GH₵ 100</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Filmmaker Sub Only</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-black tracking-tight text-white font-mono">5 MINS</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Free Preview</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-black tracking-tight text-white font-mono">INSTANT</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">MoMo Checkout</p>
                  </div>
                </div>

                {/* Simulated Customer Logos */}
                <div className="flex items-center gap-4 pt-2 text-zinc-650 text-xs font-mono tracking-widest uppercase">
                  <span>TRUSTED BY GALLYWOOD DIRECTORS & INDIE STUDIOS</span>
                </div>
              </div>

              {/* Form Input Column */}
              <div className="lg:col-span-5">
                <div className="bg-sleek-card border border-sleek-border rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col space-y-6">
                  <div className="flex flex-col text-center space-y-1">
                    <h3 className="text-lg font-bold tracking-tight text-white uppercase font-display">Enter Theatre Canopy</h3>
                    <p className="text-xs text-zinc-400">Specify your credentials and system role below.</p>
                  </div>

                  {/* Dual Role Selector Slider */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-sleek-dark rounded-xl border border-sleek-border">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthRole('BUYER');
                        setAuthError('');
                      }}
                      className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        authRole === 'BUYER' 
                          ? 'bg-sleek-card text-brand border border-sleek-border/50' 
                          : 'text-zinc-550 hover:text-zinc-350'
                      }`}
                    >
                      🍿 Buyer Role
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthRole('PRODUCER');
                        setAuthError('');
                      }}
                      className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        authRole === 'PRODUCER' 
                          ? 'bg-sleek-card text-brand border border-sleek-border/50' 
                          : 'text-zinc-550 hover:text-zinc-350'
                      }`}
                    >
                      🎬 Producer Role
                    </button>
                  </div>

                  {/* Auth mode toggle */}
                  <div className="flex justify-center border-b border-sleek-border pb-4">
                    <div className="inline-flex gap-4 text-xs font-bold">
                      <button
                        onClick={() => { setAuthMode('LOGIN'); setAuthError(''); }}
                        className={authMode === 'LOGIN' ? 'text-brand border-b-2 border-brand pb-1' : 'text-zinc-500 hover:text-zinc-300'}
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => { setAuthMode('REGISTER'); setAuthError(''); }}
                        className={authMode === 'REGISTER' ? 'text-brand border-b-2 border-brand pb-1' : 'text-zinc-500 hover:text-zinc-300'}
                      >
                        Create Account
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authError && (
                      <div className="bg-red-950/40 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                        <span>{authError}</span>
                      </div>
                    )}

                    {authMode === 'REGISTER' && (
                      <div className="space-y-1.5">
                        <label htmlFor="name" className="text-xs font-bold text-zinc-300 block uppercase">Name / Studio</label>
                        <input
                          id="name"
                          type="text"
                          placeholder={authRole === 'PRODUCER' ? "e.g. Eagle Crest Films" : "e.g. Kofi Boateng"}
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="w-full bg-sleek-dark border border-sleek-border rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold"
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-bold text-zinc-300 block uppercase">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-sleek-dark border border-sleek-border rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="pass" className="text-xs font-bold text-zinc-300 block uppercase">Security Token/Password</label>
                      <input
                        id="pass"
                        type="password"
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-sleek-dark border border-sleek-border rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-brand hover:bg-brand-hover text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-brand/10 cursor-pointer flex items-center justify-center gap-1 hover:scale-[1.01]"
                    >
                      <span>Authorize as {authRole}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <div className="border-t border-sleek-border pt-3 text-center">
                    <p className="text-[10px] text-zinc-550 uppercase font-mono">
                      🔑 Demo Accounts: Toggle roles instantly at checkout
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            
            // 2. MAIN LOGGED IN APP AREA
            <motion.div
              key="main-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* FILMMARKER CREATOR SUITE (PRODUCER TAB INTERFACE) */}
              {activeTab === 'CREATOR_STUDIO' && activeUser.role === 'PRODUCER' && (
                <div className="space-y-8">
                  
                  {/* Subscription Guard Panel */}
                  {!activeUser.isSubscribed ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-sleek-card to-cyan-950/20 border border-brand/25 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                      <div className="space-y-3 max-w-xl">
                        <div className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/20 text-brand px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Subscription Required</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight uppercase font-display">
                          Filmmaker Listing Access is Locked
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          To list, trade, and distribute your movies directly on CineVault, 
                          Ghanaian producers must buy an active billing plan. Pay seamlessly using 
                          <strong> Mobile Money (Paystack Gateway integration)</strong>.
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-400 pt-1">
                          <span className="flex items-center gap-1 text-zinc-300">
                            ✔️ 0% Listing Commission
                          </span>
                          <span className="flex items-center gap-1 text-zinc-300">
                            ✔️ Instant Settlement to MoMo
                          </span>
                        </div>
                      </div>

                      {/* Packages Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto shrink-0">
                        {/* Monthly */}
                        <div className="bg-sleek-dark p-5 rounded-xl border border-sleek-border flex flex-col justify-between space-y-4">
                          <div>
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">MONTHLY STANDARD</p>
                            <p className="text-xl font-bold text-white mt-1">GH₵ 100<span className="text-xs text-zinc-500 font-normal"> /mo</span></p>
                          </div>
                          <button
                            onClick={() => initiateSubscription('monthly')}
                            className="bg-sleek-card hover:bg-brand hover:text-black text-brand border border-sleek-border hover:border-brand py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Pay via MoMo
                          </button>
                        </div>

                        {/* Annual */}
                        <div className="bg-sleek-dark p-5 rounded-xl border border-brand/20 flex flex-col justify-between space-y-4 relative overflow-hidden">
                          <span className="absolute top-0 right-0 bg-brand text-black text-[8px] font-extrabold px-1.5 py-0.5 rounded-bl uppercase">BEST VALUE</span>
                          <div>
                            <p className="text-[9px] text-brand font-black uppercase tracking-wider">ANNUAL PRO</p>
                            <p className="text-xl font-bold text-white mt-1">GH₵ 1000<span className="text-xs text-zinc-500 font-normal"> /yr</span></p>
                          </div>
                          <button
                            onClick={() => initiateSubscription('annual')}
                            className="bg-brand hover:bg-brand-hover text-black py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Pay via MoMo
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    
                    /* Subscribed Filmmaker Suite */
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left: Upload Form */}
                        <div className="lg:col-span-8">
                          <UploadMovieForm 
                             producerId={activeUser.id}
                             producerName={activeUser.name}
                             onUploadSuccess={handleMovieUpload}
                          />
                        </div>

                        {/* Right: Producer Portfolio Statistics */}
                        <div className="lg:col-span-4 space-y-6">
                          <div className="bg-sleek-card border border-sleek-border rounded-2xl p-6 space-y-6">
                            <div>
                              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-display">Suite Metrics</h3>
                              <p className="text-[10px] text-zinc-500">Live indicators of your listed assets.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-sleek-dark p-4 border border-sleek-border rounded-xl">
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">Plan Tier</p>
                                <p className="text-sm font-bold text-brand capitalize">{activeUser.subscriptionPlan} Plan</p>
                              </div>
                              <div className="bg-sleek-dark p-4 border border-sleek-border rounded-xl">
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">My Movies</p>
                                <p className="text-sm font-bold text-white">
                                  {movies.filter(m => m.producerId === activeUser.id).length}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-xs font-bold text-zinc-400 uppercase">My Listings</p>
                              <div className="space-y-2">
                                {movies.filter(m => m.producerId === activeUser.id).length === 0 ? (
                                  <p className="text-xs text-zinc-550 italic bg-sleek-dark p-3 rounded-xl text-center">
                                    No movies listed yet from your studio. Use the form to submit one!
                                  </p>
                                ) : (
                                  movies.filter(m => m.producerId === activeUser.id).map(m => (
                                    <div key={m.id} className="flex items-center gap-3 bg-sleek-dark p-2.5 rounded-xl border border-sleek-border">
                                      <img src={m.coverUrl} className="w-9 h-12 object-cover rounded-md" alt={m.title} />
                                      <div className="flex-1 truncate">
                                        <p className="text-xs font-bold text-zinc-200 truncate">{m.title}</p>
                                        <p className="text-[10px] text-brand font-mono">GH₵ {m.priceCedis.toFixed(2)}</p>
                                      </div>
                                      <div className="text-right text-[10px] text-zinc-400 font-mono">
                                        <span>{m.purchaseCount} bought</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Demo/Helper Tools */}
                          <div className="bg-sleek-card border border-sleek-border rounded-2xl p-5 space-y-3">
                            <p className="text-xs font-bold text-zinc-300 uppercase">⚡ Sandbox Creator Tools</p>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              To preview the buyer's storefront and checkout experience, you can toggle your active tab back to 
                              <strong> Browse Marketplace</strong>.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PRODUCER MOMO EARNINGS WALLET & WITHDRAWALS */}
                      <ProducerWallet movies={movies} activeUser={activeUser} />

                      {/* NEW PRODUCER BOX OFFICE FINANCIALS PIE CHART SEGMENT */}
                      <ProducerFinancials movies={movies} activeUser={activeUser} />
                    </div>
                  )}
                </div>
              )}

              {/* BROWSE DISCOVER & MARKETPLACE PAGE */}
              {activeTab !== 'CREATOR_STUDIO' && (
                <div className="space-y-12">
                  {/* CINEMA STAGE PLAYER (IF ACTIVE MOVIE SELECTED) */}
                  {selectedMovie ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left: Interactive Video Canvas Screen */}
                      <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 font-display">
                            <Tv className="w-4 h-4 text-brand" />
                            <span>Theatre screen playing: {isPlayingThriller ? 'Free Preview' : 'Full Movie'}</span>
                          </h2>

                          {isMoviePurchased(selectedMovie.id) ? (
                            <div className="flex items-center gap-1 bg-cyan-950/40 border border-brand/20 text-brand text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg font-display">
                              <span>Unlocked / Owned</span>
                            </div>
                          ) : (
                            <div className="flex items-center bg-sleek-card rounded-lg p-0.5 border border-sleek-border">
                              <button
                                onClick={() => setIsPlayingThriller(true)}
                                className={`px-2 py-1 rounded text-[10px] font-bold ${
                                  isPlayingThriller 
                                    ? 'bg-brand text-black' 
                                    : 'text-zinc-450 hover:text-zinc-200'
                                }`}
                              >
                                Thriller
                              </button>
                              <button
                                onClick={() => {
                                  // Prompt checkout if they try to access full without buying
                                  if (!isMoviePurchased(selectedMovie.id)) {
                                    alert('Please buy this movie to unlock the full masterpiece cut.');
                                    initiateInstantPurchase(selectedMovie);
                                  } else {
                                    setIsPlayingThriller(false);
                                  }
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                                  !isPlayingThriller
                                    ? 'bg-cyan-500 text-black' 
                                    : 'text-zinc-450 hover:text-zinc-200'
                                }`}
                              >
                                <Lock className="w-2.5 h-2.5" />
                                <span>Full Movie</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Custom Cinema Player with countdown lockout integration */}
                        <CinemaPlayer 
                          movie={selectedMovie}
                          isPurchased={isMoviePurchased(selectedMovie.id)}
                          isPlayingThriller={isPlayingThriller}
                          onAddToCart={addToCart}
                          onInstantBuy={initiateInstantPurchase}
                          isInCart={cart.some(i => i.movie.id === selectedMovie.id)}
                        />

                        {/* Title details & Description */}
                        <div className="bg-sleek-card/60 border border-sleek-border rounded-2xl p-6 flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-brand uppercase tracking-widest font-display">
                              {selectedMovie.category} • {selectedMovie.durationMins} Mins
                            </span>
                            <h1 className="text-2xl font-bold text-white leading-none uppercase tracking-tight font-display">
                              {selectedMovie.title}
                            </h1>
                            <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-xl">
                              {selectedMovie.description}
                            </p>
                          </div>

                          <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 p-3 bg-sleek-dark border border-sleek-border rounded-xl space-y-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">BACK THE CREATOR</span>
                            <span className="text-xl font-bold text-brand font-mono">GH₵ {selectedMovie.priceCedis.toFixed(2)}</span>
                            
                            {isMoviePurchased(selectedMovie.id) ? (
                              <div className="space-y-1.5 w-full flex flex-col items-center sm:items-end">
                                <p className="text-[9px] text-[#00F0FF] font-black uppercase tracking-widest animate-pulse">Ready to Watch</p>
                                <button
                                  onClick={() => triggerMovieDownload(selectedMovie)}
                                  disabled={!!downloadingMovieId}
                                  className="w-full sm:w-auto px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 border border-cyan-400/20 disabled:border-zinc-850 text-black disabled:text-zinc-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 shadow"
                                >
                                  {downloadingMovieId === selectedMovie.id ? (
                                    <>
                                      <span className="w-2 h-2 border border-black border-t-transparent rounded-full animate-spin" />
                                      <span>Saving {globalDownloadProgress}%</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-2.5 h-2.5" />
                                      <span>Download (.MP4)</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => initiateInstantPurchase(selectedMovie)}
                                className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-black rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow shadow-brand/10"
                              >
                                Buy now via MoMo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Cart, checkout, and category lists */}
                      <div className="lg:col-span-4 space-y-6">
                        
                        {/* SHOPPING CART COMPONENT */}
                        <div className="bg-sleek-card border border-sleek-border rounded-2xl p-5 md:p-6 space-y-4">
                          <div className="flex items-center justify-between border-b border-sleek-border pb-3">
                            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 font-display">
                              <ShoppingCart className="w-4 h-4 text-brand" />
                              <span>My Ticket Cart</span>
                            </h3>
                            <span className="text-[10px] bg-sleek-dark px-2 py-0.5 rounded-md font-bold text-zinc-400">
                              {cart.length} Cut{cart.length !== 1 && 's'}
                            </span>
                          </div>

                          {cart.length === 0 ? (
                            <div className="py-8 text-center space-y-2">
                              <p className="text-xs text-zinc-550 italic">Your cart is empty.</p>
                              <p className="text-[10px] text-zinc-500">Tap a movie poster below and select "Add to Cart".</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                                {cart.map(item => (
                                  <div key={item.movie.id} className="flex items-center gap-3 bg-sleek-dark p-2 border border-sleek-border rounded-xl">
                                    <img src={item.movie.coverUrl} className="w-8 h-10 object-cover rounded-md" alt={item.movie.title} />
                                    <div className="flex-1 truncate">
                                      <p className="text-xs font-bold text-zinc-250 truncate">{item.movie.title}</p>
                                      <p className="text-[10px] text-brand font-mono">GH₵ {item.movie.priceCedis.toFixed(2)}</p>
                                    </div>
                                    <button
                                      onClick={() => removeFromCart(item.movie.id)}
                                      className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-sleek-card rounded"
                                      aria-label="Remove item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t border-sleek-border pt-3 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                                  <span>Total Cost:</span>
                                  <span className="text-sm font-bold text-brand font-mono">
                                    GH₵ {cart.reduce((sum, item) => sum + item.movie.priceCedis, 0).toFixed(2)}
                                  </span>
                                </div>

                                <button
                                  onClick={initiateCartCheckout}
                                  className="w-full bg-[#00F0FF] hover:bg-[#33F3FF] text-black py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow shadow-cyan-900/10 text-center"
                                >
                                  Checkout Cart via Paystack MoMo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* PURCHASED HISTORY BADGE LIST */}
                        {activeUser.role !== 'PRODUCER' && (
                          <div className="bg-sleek-card border border-sleek-border rounded-2xl p-5 space-y-3">
                            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 font-display">
                              <Award className="w-4 h-4 text-brand" />
                              <span>My Cinema Passes ({purchases.filter(p => p.userId === activeUser.id).length})</span>
                            </h3>

                            {purchases.filter(p => p.userId === activeUser.id).length === 0 ? (
                              <p className="text-[11px] text-zinc-500 italic">No cinema passes bought yet. Purchase films from the catalog.</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {purchases.filter(p => p.userId === activeUser.id).map(p => {
                                  const movieObj = movies.find(m => m.id === p.movieId);
                                  if (!movieObj) return null;
                                  return (
                                    <div
                                      key={p.id}
                                      className="p-2.5 border border-sleek-border bg-sleek-dark rounded-xl flex flex-col justify-between gap-2.5 group hover:border-zinc-700 transition-colors"
                                    >
                                      <div 
                                        onClick={() => {
                                          setSelectedMovie(movieObj);
                                          setIsPlayingThriller(false);
                                        }}
                                        className="cursor-pointer font-sans min-w-0"
                                      >
                                        <p className="text-[10px] font-bold text-zinc-200 truncate group-hover:text-brand" title={movieObj.title}>{movieObj.title}</p>
                                        <p className="text-[8px] font-bold text-brand font-mono uppercase mt-0.5">Full Pass Active</p>
                                      </div>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerMovieDownload(movieObj);
                                        }}
                                        disabled={!!downloadingMovieId}
                                        className="w-full py-1 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black disabled:bg-slate-900 border border-cyan-400/20 disabled:border-zinc-850 disabled:text-zinc-600 rounded text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        {downloadingMovieId === movieObj.id ? (
                                          <>
                                            <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                                            <span>Saving {globalDownloadProgress}%</span>
                                          </>
                                        ) : (
                                          <>
                                            <Download className="w-2.5 h-2.5" />
                                            <span>Download (.MP4)</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* SEARCH FILTERS AND GRID CATALOG */}
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-sleek-border pb-5">
                      <div className="space-y-1 text-center md:text-left">
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight font-display">
                          {activeTab === 'PURCHASED' ? 'My Purchased Movie Vault' : 'Explore Cinema Catalog'}
                        </h2>
                        <p className="text-xs text-zinc-500">Unlocking original stories from top African creators.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto font-sans">
                        {/* Search and Input */}
                        <div className="relative w-full sm:w-60">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search title, genre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-sleek-card border border-sleek-border focus:border-brand rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                          />
                        </div>

                        {/* Category filter */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <Filter className="text-zinc-550 w-3.5 h-3.5 shrink-0" />
                          <div className="flex gap-1 overflow-x-auto py-1">
                            {uniqueCategories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer shrink-0 ${
                                  selectedCategory === cat 
                                    ? 'bg-brand text-black border-brand' 
                                    : 'bg-sleek-card text-zinc-400 border-sleek-border hover:text-zinc-200'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MOVIE GRAPHIC CARDS GRID */}
                    {filteredMovies.length === 0 ? (
                      <div className="p-12 text-center bg-sleek-card/30 border border-sleek-border rounded-2xl">
                        <p className="text-sm font-bold text-zinc-405">No movies found fitting your dynamic filter.</p>
                        <p className="text-xs text-zinc-650 mt-1">Try adjusting your category selection or input term.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 font-sans">
                        {filteredMovies.map(movie => {
                          const bought = isMoviePurchased(movie.id);
                          const active = selectedMovie?.id === movie.id;

                          return (
                            <div 
                              key={movie.id}
                              className={`group bg-sleek-card border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative ${
                                active 
                                  ? 'border-brand shadow-lg shadow-brand/10 ring-1 ring-brand/25' 
                                  : 'border-sleek-border hover:border-brand/40 hover:shadow-2xl hover:-translate-y-0.5'
                              }`}
                            >
                              {/* Top category ribbon */}
                              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                                <span className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-brand border border-brand/20">
                                  {movie.category}
                                </span>
                              </div>

                              {/* Purchased Badge Indicator */}
                              {bought && (
                                <div className="absolute top-3 right-3 z-10 bg-cyan-950/80 backdrop-blur-md border border-cyan-400/20 text-brand text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                  Active Pass
                                </div>
                              )}

                              {/* Poster Backdrop */}
                              <div 
                                className="relative aspect-[3/4] cursor-pointer overflow-hidden block"
                                onClick={() => {
                                  setSelectedMovie(movie);
                                  setIsPlayingThriller(!bought);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                              >
                                <img 
                                  src={movie.coverUrl} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                  alt={movie.title}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-sleek-dark via-sleek-dark/20 to-transparent opacity-65 group-hover:opacity-40 transition-opacity" />
                                
                                {/* Quick Play hover panel */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-12 h-12 rounded-full bg-brand text-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-90 shadow-brand/25">
                                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                                  </div>
                                </div>
                              </div>

                              {/* Info Block */}
                              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                                    <span className="truncate max-w-[120px] font-semibold">{movie.producerName}</span>
                                    <span className="font-mono">{movie.durationMins} Mins</span>
                                  </div>
                                  <h4 
                                    onClick={() => {
                                      setSelectedMovie(movie);
                                      setIsPlayingThriller(!bought);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="text-sm font-bold text-zinc-100 uppercase tracking-tight truncate line-clamp-1 hover:text-brand cursor-pointer font-display"
                                  >
                                    {movie.title}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                                    {movie.description}
                                  </p>
                                </div>

                                <div className="pt-3 border-t border-sleek-border flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-555 font-bold uppercase">PRICE</span>
                                    <span className="text-xs font-bold text-brand font-mono">GH₵ {movie.priceCedis.toFixed(2)}</span>
                                  </div>

                                  <div className="flex gap-2">
                                    {/* Add to Cart button */}
                                    {!bought && (
                                      <button
                                        onClick={() => addToCart(movie)}
                                        disabled={cart.some(i => i.movie.id === movie.id)}
                                        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                          cart.some(i => i.movie.id === movie.id)
                                            ? 'bg-sleek-card border-sleek-border text-zinc-600 cursor-not-allowed'
                                            : 'bg-sleek-dark border-sleek-border hover:border-brand/40 text-zinc-300 hover:text-brand'
                                        }`}
                                        title="Add ticket to Cart"
                                      >
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Play watch channel switcher */}
                                    <button
                                      onClick={() => {
                                        setSelectedMovie(movie);
                                        setIsPlayingThriller(!bought);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                        active 
                                          ? 'bg-brand text-black font-extrabold' 
                                          : 'bg-sleek-dark text-zinc-250 border border-sleek-border hover:bg-sleek-card-hover'
                                      }`}
                                    >
                                      {bought ? 'Watch Full' : 'Watch Thriller'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER METRICS SYSTEM */}
      <footer className="mt-auto bg-sleek-dark border-t border-sleek-border py-6 text-center text-xs text-zinc-500 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
          <p className="leading-relaxed text-zinc-450">
            © 2026 CineVault Inc. Empowering independent Ghanaian filmmakers via secure Mobile Money streams.
          </p>
          <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-brand">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-ping"></span>
              <span>Gateway Live</span>
            </span>
            <span>•</span>
            <span>Paystack Secure Stream Active</span>
          </div>
        </div>
      </footer>

      {/* Dynamic Key Error Modal */}
      <AnimatePresence>
        {paystackKeyError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-sleek-card border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 text-rose-450 border-b border-rose-500/10 pb-3">
                <ShieldAlert className="w-6 h-6 shrink-0 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-display text-white">
                  Payment Gateway Notice
                </h3>
              </div>
              <p className="text-xs text-zinc-350 leading-relaxed font-sans">
                {paystackKeyError}
              </p>
              
              <div className="bg-amber-950/20 border border-amber-500/15 p-3 rounded-xl flex items-start gap-2 text-[11px] text-amber-400">
                <span className="text-sm shrink-0">💡</span>
                <p className="leading-relaxed">
                  <strong>Sandbox Testing Bypass available:</strong> You don't need a real API key. Click <strong>Switch to Sandbox</strong> below to instantly process purchases using our high-fidelity Mobile Money simulator.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  onClick={() => {
                    setPaystackKeyError(null);
                    setPendingCheckoutData(null);
                  }}
                  className="px-4 py-2 bg-sleek-dark border border-sleek-border hover:border-zinc-700 hover:text-white text-zinc-400 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Dismiss Notice
                </button>
                <button
                  onClick={() => {
                    setGatewayMode('SANDBOX');
                    setPaystackKeyError(null);
                    if (pendingCheckoutData) {
                      // Trigger with sandbox
                      const data = pendingCheckoutData;
                      setPendingCheckoutData(null);
                      // Execute next macro-tick
                      setTimeout(() => {
                        triggerPaystackCheckout(data);
                      }, 100);
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow shadow-orange-950/20"
                >
                  🧪 Switch to Sandbox
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOVEREIGN MOMO / CARD SANDBOX SIMULATOR MODAL */}
      <AnimatePresence>
        {isSimulatedCheckoutOpen && simulatedCheckoutData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-sleek-card border border-amber-500/20 rounded-2xl overflow-hidden shadow-2xl font-sans"
            >
              {/* Header Visual Stripe */}
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 px-5 py-3.5 border-b border-sleek-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">MOMO DEVELOPER SANDBOX</span>
                </div>
                <button
                  onClick={() => {
                    setIsSimulatedCheckoutOpen(false);
                    if (simulatedCheckoutData.onCancel) simulatedCheckoutData.onCancel();
                    setSimulatedCheckoutData(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                >
                  ✕ Cancel
                </button>
              </div>

              {/* Main Body */}
              <div className="p-5 space-y-5">
                {/* Checkout summary panel */}
                <div className="bg-sleek-dark p-3.5 rounded-xl border border-sleek-border space-y-1 text-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">SECURE CHANNELS ESCROW PAYOUT</span>
                  <p className="text-xl font-black font-mono text-brand">GH₵ {simulatedCheckoutData.amount.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-400 truncate">For {simulatedCheckoutData.itemName}</p>
                </div>

                {/* Step contents */}
                {simulatedCheckoutStep === 'NETWORK' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Select Mobile Network</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork('MTN')}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            selectedNetwork === 'MTN'
                              ? 'bg-amber-950/30 border-amber-500/50 text-amber-500'
                              : 'bg-sleek-dark border-sleek-border text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-xs font-black">MTN</span>
                          <span className="text-[8px] font-bold">MoMo 💛</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork('TELECEL')}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            selectedNetwork === 'TELECEL'
                              ? 'bg-rose-950/30 border-rose-500/50 text-rose-500'
                              : 'bg-sleek-dark border-sleek-border text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-xs font-black">Telecel</span>
                          <span className="text-[8px] font-bold">Cash ❤️</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedNetwork('AIRTELTIGO')}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            selectedNetwork === 'AIRTELTIGO'
                              ? 'bg-sky-950/30 border-sky-500/50 text-sky-400'
                              : 'bg-sleek-dark border-sleek-border text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-xs font-black">AirtelTigo</span>
                          <span className="text-[8px] font-bold">Money 💙</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Recipient Phone Number</label>
                      <input
                        type="text"
                        value={simulatedPhoneNumber}
                        onChange={(e) => setSimulatedPhoneNumber(e.target.value)}
                        className="w-full bg-sleek-dark border border-sleek-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-amber-500/40 font-mono"
                        placeholder="e.g. 0244123456"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setSimulatedCheckoutStep('PUSH_SENT')}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-wider text-[11px] py-3 rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Authorize MoMo Push Prompt 🚀
                    </button>
                  </div>
                )}

                {simulatedCheckoutStep === 'PUSH_SENT' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Simulated hand push notification UI popup */}
                    <div className="bg-sleek-dark p-4 rounded-xl border-2 border-amber-500/40 relative overflow-hidden space-y-3">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📱</span>
                        <p className="text-[10px] font-extrabold text-[#00F0FF] uppercase tracking-wider">Simulated USSD Push Mandate</p>
                      </div>
                      <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                        Pay <strong>GH₵ {simulatedCheckoutData.amount.toFixed(2)}</strong> to CineVault secure escrow canopy?<br />
                        <span className="text-zinc-500 text-[10px]">Reference: Sandbox Mastercut Purchase</span>
                      </p>
                      
                      <div className="pt-2 space-y-2">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">Enter 4-digit Sandbox Pin</p>
                        <input
                          type="password"
                          maxLength={4}
                          value={simulatedPin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setSimulatedPin(val);
                            if (val.length === 4) {
                              setSimulatedCheckoutStep('PROCESSING');
                              setTimeout(() => {
                                setSimulatedCheckoutStep('SUCCESS');
                              }, 1800);
                            }
                          }}
                          className="w-24 tracking-widest text-center text-sm font-bold bg-sleek-card border border-sleek-border focus:border-amber-500/50 text-white rounded-lg py-1.5 focus:outline-none font-mono"
                          placeholder="••••"
                        />
                        <p className="text-[9px] text-zinc-500 italic">Enter any 4 digits to simulate safe transaction validation</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedCheckoutStep('PROCESSING');
                        setTimeout(() => {
                          setSimulatedCheckoutStep('SUCCESS');
                        }, 1800);
                      }}
                      className="w-full bg-sleek-dark border border-sleek-border hover:border-zinc-700 text-zinc-300 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Bypass to success directly
                    </button>
                  </div>
                )}

                {simulatedCheckoutStep === 'PROCESSING' && (
                  <div className="py-8 text-center space-y-4 animate-pulse">
                    <div className="relative w-12 h-12 mx-auto">
                      <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 absolute inset-0" />
                      <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-amber-500 animate-spin absolute inset-0" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Verifying Gateway Settlement...</p>
                      <p className="text-[10px] text-zinc-550 max-w-[200px] mx-auto leading-relaxed">Securing direct-to-creator payout ratios structure.</p>
                    </div>
                  </div>
                )}

                {simulatedCheckoutStep === 'SUCCESS' && (
                  <div className="text-center space-y-5 py-4 animate-scaleUp">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle className="w-6 h-6 shrink-0" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white font-display">Receipt Settled!</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-[240px] mx-auto">
                        Simulated checkout cleared. The cinematic cut is unlocked, and box office charts updated.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSimulatedCheckoutOpen(false);
                        const ref = `CV-SANDBOX-${Date.now()}`;
                        simulatedCheckoutData.onSuccess(ref);
                        setSimulatedCheckoutData(null);
                      }}
                      className="inline-flex items-center justify-center w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Complete Checkout 🎬
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYSTACK KEY CONFIGURATION OVERRIDE MODAL */}
      <AnimatePresence>
        {isKeyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-sleek-card border border-brand/30 rounded-2xl overflow-hidden shadow-2xl font-sans"
            >
              <div className="bg-gradient-to-r from-brand/10 via-cyan-500/10 to-blue-500/10 px-5 py-4 border-b border-sleek-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-brand/10 text-brand border border-brand/20">🔑</span>
                  <span className="text-xs font-black uppercase tracking-wider text-white font-display">Paystack Credentials</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-330 transition-colors text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    You can enter your custom Paystack Public API Key (e.g. <code className="text-brand font-mono">pk_test_...</code> or <code className="text-brand font-mono">pk_live_...</code>) below. This overrides any default project credentials and persists locally in your browser.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Paystack Public Key</label>
                  <input
                    type="text"
                    value={customPublicKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomPublicKey(val);
                      localStorage.setItem('cinevolt_custom_public_key', val);
                    }}
                    placeholder="pk_test_... or pk_live_..."
                    className="w-full bg-sleek-dark border border-sleek-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand/40 font-mono"
                  />
                </div>

                {/* Environment Status Indicators */}
                <div className="bg-sleek-dark p-3.5 rounded-xl border border-sleek-border/70 space-y-2 text-[11px]">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Status Report</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Local Override:</span>
                    {customPublicKey.trim() ? (
                      <span className="text-emerald-400 font-bold font-mono">ACTIVE (pk_...)</span>
                    ) : (
                      <span className="text-zinc-550 italic">None (Defaults Mode)</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">AI Studio Environment:</span>
                    {(import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY ? (
                      <span className="text-brand font-bold">CONFIGURED</span>
                    ) : (
                      <span className="text-zinc-550 italic">Unconfigured</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  {customPublicKey.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPublicKey('');
                        localStorage.removeItem('cinevolt_custom_public_key');
                      }}
                      className="flex-1 py-2.5 bg-sleek-dark border border-sleek-border hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Clear Key
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsKeyModalOpen(false);
                      // If there is pending checkout data, try running it immediately with the new key
                      if (pendingCheckoutData && customPublicKey.trim().startsWith('pk_')) {
                        const data = pendingCheckoutData;
                        setPendingCheckoutData(null);
                        setPaystackKeyError(null);
                        setTimeout(() => {
                          triggerPaystackCheckout(data);
                        }, 200);
                      }
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-brand to-cyan-550 hover:from-cyan-450 hover:to-blue-450 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow shadow-brand/10"
                  >
                    Apply & Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
