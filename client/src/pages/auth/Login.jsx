import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return; // Prevent multiple submissions

        setIsLoading(true);
        try {
            const user = await login(email, password);
            navigate('/');
            toast.success('Logged in successfully');
        } catch (error) {
            toast.error(error.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-12 w-12 rounded-xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.949 49.949 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.009 50.009 0 0 0 7.5 2.174v-.224c0-.131.067-.248.182-.305l9.9-4.28a.75.75 0 0 0 .6 0l5.035 2.175A60.8 60.8 0 0 1 11.7 2.805Z" />
                        <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 0 1-.46.71 47.878 47.878 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.877 47.877 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 0 1 6 13.18v1.27a1.5 1.5 0 0 0 1.5 1.5h1" />
                        <path fillRule="evenodd" d="M14.408 10.65a46.416 46.416 0 0 0-5.202-2.321 48.009 48.009 0 0 1 6.094 3.743 48.995 48.995 0 0 1 2.508 1.84V13.5a1.5 1.5 0 0 0-1.5-1.5h-2.902Z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Welcome back
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                    Sign in to your account to continue learning
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl border border-gray-100 dark:border-slate-800 sm:rounded-xl sm:px-10">
                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={onChange}
                                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm sm:leading-6 bg-transparent transition-all"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">
                                Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={onChange}
                                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm sm:leading-6 bg-transparent transition-all"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center items-center gap-2 rounded-lg bg-slate-900 dark:bg-blue-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-slate-800 dark:hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
                                    New here?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                                Create an account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
