import { useState } from 'react';
import { FaGraduationCap, FaChalkboardTeacher } from 'react-icons/fa';

const roles = [
    {
        value: 'student',
        label: 'Student',
        description: 'Browse courses, enroll, and start learning',
        icon: FaGraduationCap,
        color: 'blue',
    },
    {
        value: 'instructor',
        label: 'Teacher / Instructor',
        description: 'Create courses, manage students, and earn',
        icon: FaChalkboardTeacher,
        color: 'emerald',
    },
];

const colorMap = {
    blue: {
        selected: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500',
        icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700',
    },
    emerald: {
        selected: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500',
        icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        button: 'bg-emerald-600 hover:bg-emerald-700',
    },
};

const RolePickerModal = ({ onSelect, userName }) => {
    const [selected, setSelected] = useState('student');
    const [loading, setLoading] = useState(false);

    const handleContinue = () => {
        setLoading(true);
        onSelect(selected);
    };

    const selectedColor = roles.find(r => r.value === selected)?.color || 'blue';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4 text-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        How would you like to use ClasslyAI?
                    </p>
                </div>

                {/* Role Options */}
                <div className="px-6 space-y-3">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selected === role.value;
                        const colors = colorMap[role.color];

                        return (
                            <button
                                key={role.value}
                                onClick={() => setSelected(role.value)}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                    isSelected
                                        ? colors.selected
                                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
                                    <Icon className="text-xl" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                        {role.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {role.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Continue Button */}
                <div className="p-6 pt-5">
                    <button
                        onClick={handleContinue}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50 ${colorMap[selectedColor].button}`}
                    >
                        {loading ? 'Setting up...' : 'Continue'}
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-3">
                        You can change this later from your profile
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RolePickerModal;
