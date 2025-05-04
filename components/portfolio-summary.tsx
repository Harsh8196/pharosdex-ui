"use client"

export default function PortfolioSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="cyberpunk-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm">Portfolio Value</div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold neon-text">$12,450.32</div>
          <div className="text-green-500 text-sm">+$345.21 (2.8%)</div>
        </div>
      </div>

      <div className="cyberpunk-card cyberpunk-card-pink p-4">
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm">Liquidity Positions</div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberblue to-cyberpink flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold neon-text-pink">$3,550.00</div>
          <div className="text-green-500 text-sm">+$120.50 (3.5%)</div>
        </div>
      </div>

      <div className="cyberpunk-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm">Total Fees Earned</div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyberpink to-cyberblue flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold neon-text">$245.87</div>
          <div className="text-green-500 text-sm">+$12.34 (5.3%)</div>
        </div>
      </div>
    </div>
  )
}
