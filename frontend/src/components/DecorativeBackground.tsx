import React from 'react';
import { motion } from 'framer-motion';

export const DecorativeBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Dynamic Grid */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                    backgroundSize: '40px 40px',
                    color: 'hsl(var(--primary))'
                }}
            />

            {/* Animated Beams / Scanning Lines */}
            <motion.div
                initial={{ top: '-10%', left: '0%', opacity: 0 }}
                animate={{
                    top: ['-10%', '110%'],
                    opacity: [0, 0.5, 0]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 1
                }}
                className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm"
            />

            {/* Data Packets along grid */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`packet-${i}`}
                    className="absolute w-[1px] h-12 bg-gradient-to-b from-transparent via-primary to-transparent opacity-20"
                    style={{
                        left: `${20 + i * 15}%`,
                        top: '-10%'
                    }}
                    animate={{
                        top: ['-10%', '110%'],
                    }}
                    transition={{
                        duration: 6 + Math.random() * 4,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 2
                    }}
                />
            ))}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`packet-h-${i}`}
                    className="absolute h-[1px] w-12 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20"
                    style={{
                        top: `${15 + i * 20}%`,
                        left: '-10%'
                    }}
                    animate={{
                        left: ['-10%', '110%'],
                    }}
                    transition={{
                        duration: 8 + Math.random() * 5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 1.5
                    }}
                />
            ))}

            {/* Floating Nodes - Left Side */}
            <div className="absolute left-0 top-0 w-1/4 h-full hidden lg:block">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={`left-${i}`}
                        className="absolute rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center p-2"
                        style={{
                            left: `${Math.random() * 60}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 40 + 20}px`,
                            height: `${Math.random() * 40 + 20}px`,
                        }}
                        animate={{
                            y: [0, Math.random() * 40 - 20, 0],
                            x: [0, Math.random() * 20 - 10, 0],
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <div className="w-1 h-1 rounded-full bg-primary/40" />
                    </motion.div>
                ))}
            </div>

            {/* Floating Nodes - Right Side */}
            <div className="absolute right-0 top-0 w-1/4 h-full hidden lg:block">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={`right-${i}`}
                        className="absolute rounded-full border border-suspicious/20 bg-suspicious/5 flex items-center justify-center p-2"
                        style={{
                            right: `${Math.random() * 60}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 40 + 20}px`,
                            height: `${Math.random() * 40 + 20}px`,
                        }}
                        animate={{
                            y: [0, Math.random() * 40 - 20, 0],
                            x: [0, Math.random() * 20 - 10, 0],
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    >
                        <div className="w-1 h-1 rounded-full bg-suspicious/40" />
                    </motion.div>
                ))}
            </div>

            {/* Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-suspicious/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
};
