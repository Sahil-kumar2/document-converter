import React, { useState } from "react";
import { lockDocument, getErrorMessage } from "../api";

export default function ProtectPdfPanel({ file, loading, setLoading, setResult, setResultBlob }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProtect = async () => {
    // Validation
    if (!password || !confirmPassword) {
      setResult({ success: false, error: "Please enter password in both fields" });
      return;
    }

    if (password !== confirmPassword) {
      setResult({ success: false, error: "Passwords do not match" });
      return;
    }

    if (password.length < 4) {
      setResult({ success: false, error: "Password must be at least 4 characters" });
      return;
    }

    setLoading(true);
    try {
      const response = await lockDocument(file[0],password);
      
      // Backend now returns blob
      setResultBlob(response.data);
      setResult({ 
        success: true, 
        fileName: "protected.pdf"
      });
      
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">🔒 Protect PDF</h3>
      
      {file[0] && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Encrypt your PDF with a password</strong>
            </p>
            <p className="text-xs text-blue-700">
              The PDF will require this password to be opened. Make sure to remember it!
            </p>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Password Match Indicator */}
          {password && confirmPassword && (
            <div className={`text-sm ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
              {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}

          {/* Protect Button */}
          <button
            onClick={handleProtect}
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "🔒 Protecting..." : "🔒 Protect PDF"}
          </button>
        </div>
      )}

      {!file[0] && (
        <div className="bg-blue-50 p-4 rounded-lg text-center text-blue-800">
          <p>📄 Upload a PDF file above to protect it with a password</p>
        </div>
      )}
    </>
  );
}
