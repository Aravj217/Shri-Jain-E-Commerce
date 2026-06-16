import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/store';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration specific fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!name || !name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (name.trim().length < 2) {
        setError("Full name must be at least 2 characters.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !email.trim() || !emailRegex.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      // Check unique email before calling register to return exact user message
      const usersStr = localStorage.getItem('sjsm_users');
      let registeredUsers: any[] = [];
      if (usersStr) {
        try {
          registeredUsers = JSON.parse(usersStr);
        } catch (err) {}
      }
      if (registeredUsers.some((u: any) => u.email?.toLowerCase() === email.toLowerCase())) {
        setError("An account with this email already exists.");
        return;
      }

      if (!phone || !/^\d{10}$/.test(phone)) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }

      if (!street || !street.trim()) {
        setError("Please enter your address.");
        return;
      }

      if (!city || !city.trim()) {
        setError("Please enter your city.");
        return;
      }

      if (!password) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (confirmPassword !== password) {
        setError("Passwords do not match.");
        return;
      }

      register({ 
        id: '', // Generated in store
        name: name.trim(), 
        email: email.trim(), 
        phone, 
        street: street.trim(),
        city: city.trim(),
        password 
      }).then(success => {
        if (success) {
          navigate('/');
        } else {
          setError("An account with this email already exists.");
        }
      });
    } else {
      // Login Mode
      login(email, password).then(result => {
        if (result.success) {
          navigate('/');
        } else {
          setError(result.message || "Invalid email or password. Or account does not exist.");
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
           <div className="bg-black text-amber-500 w-20 h-20 flex items-center justify-center rounded-xl shadow-lg border border-amber-500/30 animate-fade-in">
             <div className="flex flex-col items-center leading-none p-2">
                <span className="font-serif font-black text-2xl tracking-widest text-[#f59e0b]">SJSM</span>
                <span className="text-[0.6rem] font-bold mt-1 text-amber-200">EST. 1980</span>
             </div>
           </div>
        </div>
        <h2 className="text-center text-3xl font-bold font-serif text-neutral-900 animate-fade-in">
          {isRegistering ? 'Create your account' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-neutral-200 sm:rounded-lg sm:px-10 border border-neutral-100 animate-fade-in">
          {error && (
            <div id="validation-error-alert" className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm font-bold border border-red-100">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-bold text-neutral-700">Full Name</label>
                  <div className="mt-1">
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-black bg-white font-semibold" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700">Mobile Number</label>
                  <div className="mt-1">
                    <input type="tel" maxLength={10} required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,''))}
                      className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-black bg-white font-mono font-semibold" placeholder="10-digit mobile number"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700">Street Address</label>
                  <div className="mt-1">
                    <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-black bg-white font-semibold" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700">City</label>
                  <div className="mt-1">
                    <input type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-black bg-white font-semibold" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-neutral-700">Email address</label>
              <div className="mt-1">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-black bg-white font-semibold" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-black bg-white font-mono font-semibold" />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-sm font-bold text-neutral-700">Confirm Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-black bg-white font-mono font-semibold" />
                  <button
                    type="button"
                    id="toggle-confirm-password-visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <button type="submit"
                id="submit-auth-form"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-lg text-sm font-black text-white bg-neutral-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors uppercase tracking-widest"
              >
                {isRegistering ? 'Register' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">
                  {isRegistering ? 'Already have an account?' : 'New to Shri Jain Stationery?'}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              id="toggle-auth-mode"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="inline-block px-6 py-2 border-2 border-amber-500 text-amber-500 font-extrabold rounded-full hover:bg-amber-500 hover:text-white transition-all uppercase text-xs tracking-wider"
            >
              {isRegistering ? 'Sign In instead' : 'Create a new account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
