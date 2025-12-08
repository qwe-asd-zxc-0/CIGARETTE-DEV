'use client'; // 标记为客户端组件

import { useState, useEffect } from 'react';

export default function AgeGate() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isVerified = localStorage.getItem('age-verified');
    if (!isVerified) setShowModal(true);
  }, []);

  const handleVerify = () => {
    localStorage.setItem('age-verified', 'true');
    setShowModal(false);
  };

  const handleReject = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!showModal) return null; // 如果不需要显示，就渲染空

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm">
      <div className="border border-red-900/50 bg-zinc-900 p-8 rounded-lg max-w-md text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">AGE VERIFICATION</h2>
        <p className="text-gray-400 mb-8">
          Products contain nicotine. You must be 18+ (or 21+) to enter.
        </p>
        <div className="flex flex-col gap-4">
          <button onClick={handleVerify} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded transition">
            I AM 18+ / ENTER
          </button>
          <button onClick={handleReject} className="w-full border border-zinc-600 text-zinc-400 py-3 rounded hover:bg-zinc-800 transition">
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}