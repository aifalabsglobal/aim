import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle group"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {/* Track */}
            <div className="theme-toggle-track">
                {/* Stars (visible in dark mode) */}
                <div className={`theme-toggle-stars ${isDark ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="star star-1" />
                    <span className="star star-2" />
                    <span className="star star-3" />
                </div>

                {/* Clouds (visible in light mode) */}
                <div className={`theme-toggle-clouds ${isDark ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="cloud cloud-1" />
                    <span className="cloud cloud-2" />
                </div>

                {/* Thumb with Sun/Moon */}
                <div className={`theme-toggle-thumb ${isDark ? 'translate-x-[22px]' : 'translate-x-0'}`}>
                    {/* Moon icon (Show in Dark Mode) */}
                    <Moon
                        className={`theme-icon moon-icon ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}
                    />
                    {/* Sun icon (Show in Light Mode) */}
                    <Sun
                        className={`theme-icon sun-icon ${isDark ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`}
                    />

                    {/* Crater details for moon (dark mode) */}
                    <div className={`moon-craters ${isDark ? 'opacity-60' : 'opacity-0'}`}>
                        <span className="crater crater-1" />
                        <span className="crater crater-2" />
                    </div>

                    {/* Sun rays (light mode) */}
                    <div className={`sun-rays ${isDark ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
                        {[...Array(8)].map((_, i) => (
                            <span
                                key={i}
                                className="ray"
                                style={{ transform: `rotate(${i * 45}deg)` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </button>
    );
};

export default ThemeToggle;
