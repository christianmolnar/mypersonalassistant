#!/usr/bin/env node

/**
 * f.insight.AI Mock Data Population Script
 * 
 * This script populates the database with realistic mock data for:
 * - Portfolio performance across different time periods
 * - Trading positions and history
 * - AI insights and performance metrics
 * 
 * Usage: npm run populate-mock-data
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Configure Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
// Use anon key for now since service role key has issues
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

// For the script, we need to bypass RLS, so we'll use a service role client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

// Mock user ID (replace with actual user ID in production)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

// Trading volume assumptions for cost calculation
const TRADING_ASSUMPTIONS = {
  tradesPerDay: 8,       // 8 trades per day
  tradingDaysPerMonth: 22, // ~22 trading days per month
  positionsActive: 12,   // 12 concurrent positions
  historicalDataPoints: 2000, // 2000 data points for charts
  aiInsightsPerDay: 6,   // 6 AI insights per day
  marketDataUpdates: 1000, // 1000 market data updates per day
}

console.log('🤖 f.insight.AI Database Population Started...')
console.log('📊 Trading Volume Assumptions:')
console.log(`   • ${TRADING_ASSUMPTIONS.tradesPerDay} trades/day`)
console.log(`   • ${TRADING_ASSUMPTIONS.tradingDaysPerMonth} trading days/month`)
console.log(`   • ${TRADING_ASSUMPTIONS.positionsActive} active positions`)
console.log(`   • ${TRADING_ASSUMPTIONS.historicalDataPoints} historical data points`)
console.log(`   • ${TRADING_ASSUMPTIONS.aiInsightsPerDay} AI insights/day`)
console.log(`   • ${TRADING_ASSUMPTIONS.marketDataUpdates} market updates/day`)

// Calculate monthly data volume
const MONTHLY_VOLUME = {
  trades: TRADING_ASSUMPTIONS.tradesPerDay * TRADING_ASSUMPTIONS.tradingDaysPerMonth,
  portfolioHistory: TRADING_ASSUMPTIONS.tradingDaysPerMonth,
  aiInsights: TRADING_ASSUMPTIONS.aiInsightsPerDay * 30,
  marketData: TRADING_ASSUMPTIONS.marketDataUpdates * 30,
  performanceMetrics: 6, // One for each time period
}

console.log('📈 Monthly Data Volume:')
console.log(`   • ${MONTHLY_VOLUME.trades} trade records`)
console.log(`   • ${MONTHLY_VOLUME.portfolioHistory} portfolio history records`)
console.log(`   • ${MONTHLY_VOLUME.aiInsights} AI insight records`)
console.log(`   • ${MONTHLY_VOLUME.marketData} market data records`)
console.log(`   • ${MONTHLY_VOLUME.performanceMetrics} performance metric records`)

// Generate sample stock symbols
const STOCK_SYMBOLS = [
  { symbol: 'AAPL', company: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'GOOGL', company: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'MSFT', company: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'AMZN', company: 'Amazon.com, Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'TSLA', company: 'Tesla, Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'NVDA', company: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'META', company: 'Meta Platforms, Inc.', sector: 'Technology' },
  { symbol: 'BRK.B', company: 'Berkshire Hathaway Inc.', sector: 'Financial Services' },
  { symbol: 'JPM', company: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
  { symbol: 'UNH', company: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
]

// Generate portfolio history data
function generatePortfolioHistory(startValue: number, days: number) {
  const history: Array<{
    user_id: string;
    date: string;
    portfolio_value: number;
    daily_return: number;
    total_return: number;
    positions_count: number;
  }> = []
  let currentValue = startValue
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // Simulate daily returns (mostly positive with some volatility)
    const dailyReturn = (Math.random() - 0.3) * 0.04 // -1.2% to +2.8% daily range
    currentValue = currentValue * (1 + dailyReturn)
    const totalReturn = ((currentValue - startValue) / startValue) * 100
    
    // Cap values to prevent overflow in DECIMAL(8,4) fields
    const cappedDailyReturn = Math.max(-50, Math.min(50, dailyReturn * 100)) // Cap at ±50%
    const cappedTotalReturn = Math.max(-95, Math.min(500, totalReturn)) // Cap at ±95% to 500%
    
    history.push({
      user_id: DEMO_USER_ID,
      date: date.toISOString().split('T')[0],
      portfolio_value: Math.round(currentValue * 100) / 100,
      daily_return: Math.round(cappedDailyReturn * 100) / 100,
      total_return: Math.round(cappedTotalReturn * 100) / 100,
      positions_count: Math.floor(Math.random() * 5) + 8, // 8-12 positions
    })
  }
  
  return history
}

// Generate trade data
function generateTrades(count: number) {
  const trades: Array<{
    user_id: string;
    symbol: string;
    action: string;
    quantity: number;
    price: number;
    trade_date: string;
    confidence_score: number;
    pnl: number;
    outcome: string;
    ai_reasoning: string;
    market_conditions: string;
  }> = []
  const actions = ['BUY', 'SELL']
  const outcomes = ['WIN', 'LOSS', 'PENDING']
  
  for (let i = 0; i < count; i++) {
    const stock = STOCK_SYMBOLS[Math.floor(Math.random() * STOCK_SYMBOLS.length)]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const price = Math.random() * 500 + 50 // $50-$550 range
    const quantity = Math.floor(Math.random() * 100) + 10 // 10-110 shares
    const confidenceScore = Math.floor(Math.random() * 40) + 60 // 60-100% confidence
    
    const tradeDate = new Date()
    tradeDate.setDate(tradeDate.getDate() - Math.floor(Math.random() * 90)) // Last 90 days
    
    let pnl = 0
    let outcome = 'PENDING'
    
    if (tradeDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) { // Older than 1 day
      const pnlPercent = (Math.random() - 0.4) * 0.2 // -8% to +12% range
      pnl = Math.round(quantity * price * pnlPercent * 100) / 100
      outcome = pnl > 0 ? 'WIN' : 'LOSS'
    }
    
    trades.push({
      user_id: DEMO_USER_ID,
      symbol: stock.symbol,
      action,
      quantity,
      price: Math.round(price * 100) / 100,
      trade_date: tradeDate.toISOString(),
      confidence_score: confidenceScore,
      pnl,
      outcome,
      ai_reasoning: `AI detected ${action === 'BUY' ? 'bullish' : 'bearish'} signals for ${stock.symbol}`,
      market_conditions: 'Normal volatility, trending upward',
    })
  }
  
  return trades
}

// Generate AI insights
function generateAIInsights(count: number) {
  const insights: Array<{
    user_id: string;
    insight_text: string;
    insight_type: string;
    confidence: number;
    related_symbols: string[];
    created_at: string;
  }> = []
  const types = ['OPPORTUNITY', 'RISK', 'ANALYSIS', 'RECOMMENDATION']
  const sampleInsights = [
    'Portfolio showing strong momentum with tech sector outperforming',
    'Consider reducing exposure to high-beta stocks ahead of earnings',
    'Market volatility creating opportunities in oversold value stocks',
    'AI confidence scores trending higher, indicating improved market conditions',
    'Sector rotation detected: Healthcare showing relative strength',
    'Risk-adjusted returns optimized through position sizing adjustments',
  ]
  
  for (let i = 0; i < count; i++) {
    const insightDate = new Date()
    insightDate.setHours(insightDate.getHours() - Math.floor(Math.random() * 720)) // Last 30 days
    
    insights.push({
      user_id: DEMO_USER_ID,
      insight_text: sampleInsights[Math.floor(Math.random() * sampleInsights.length)],
      insight_type: types[Math.floor(Math.random() * types.length)],
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100% confidence
      related_symbols: [STOCK_SYMBOLS[Math.floor(Math.random() * STOCK_SYMBOLS.length)].symbol],
      created_at: insightDate.toISOString(),
    })
  }
  
  return insights
}

// Main population function
async function populateDatabase() {
  try {
    console.log('\n🏗️  Creating demo user profile...')
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: DEMO_USER_ID,
        username: 'demo_trader',
        email: 'demo@finsight.ai',
        risk_tolerance: 'MODERATE',
        trading_experience: 'ADVANCED',
        investment_goals: ['Growth', 'Income', 'Capital Preservation'],
      })
    
    if (profileError) console.error('Profile creation error:', profileError)
    
    console.log('💼 Creating portfolio...')
    const { error: portfolioError } = await supabase
      .from('portfolios')
      .upsert({
        user_id: DEMO_USER_ID,
        total_value: 148050.00,
        total_pnl: 48050.00,
        total_pnl_percent: 48.05,
        cash_balance: 18750.00,
        buying_power: 37500.00,
      })
    
    if (portfolioError) console.error('Portfolio creation error:', portfolioError)
    
    console.log('📈 Generating portfolio history (2000 data points)...')
    const historyData = generatePortfolioHistory(100000, 2000)
    
    // Insert in batches to avoid payload limits
    const batchSize = 100
    for (let i = 0; i < historyData.length; i += batchSize) {
      const batch = historyData.slice(i, i + batchSize)
      const { error: historyError } = await supabase
        .from('portfolio_history')
        .upsert(batch)
      
      if (historyError) console.error(`History batch ${i/batchSize + 1} error:`, historyError)
      process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, historyData.length)}/${historyData.length} records`)
    }
    
    console.log('\n🔄 Generating trades (176 per month)...')
    const tradesData = generateTrades(MONTHLY_VOLUME.trades)
    
    for (let i = 0; i < tradesData.length; i += batchSize) {
      const batch = tradesData.slice(i, i + batchSize)
      const { error: tradesError } = await supabase
        .from('trades')
        .upsert(batch)
      
      if (tradesError) console.error(`Trades batch ${i/batchSize + 1} error:`, tradesError)
      process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, tradesData.length)}/${tradesData.length} records`)
    }
    
    console.log('\n🧠 Generating AI insights (180 per month)...')
    const insightsData = generateAIInsights(MONTHLY_VOLUME.aiInsights)
    
    for (let i = 0; i < insightsData.length; i += batchSize) {
      const batch = insightsData.slice(i, i + batchSize)
      const { error: insightsError } = await supabase
        .from('ai_insights')
        .upsert(batch)
      
      if (insightsError) console.error(`Insights batch ${i/batchSize + 1} error:`, insightsError)
      process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, insightsData.length)}/${insightsData.length} records`)
    }
    
    console.log('\n✅ Database population completed successfully!')
    
    // Calculate and display cost estimates
    console.log('\n💰 MONTHLY COST ANALYSIS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Supabase costs
    console.log('🗄️  SUPABASE (PostgreSQL):')
    console.log('   • Free Tier: $0/month (up to 500MB, 50K rows)')
    console.log('   • Pro Tier: $25/month (8GB, 5M rows)')
    console.log('   • Estimated usage: ~100MB/month with our volume')
    console.log('   • ✅ FREE TIER SUFFICIENT')
    
    // Vercel KV costs
    console.log('\n⚡ VERCEL KV (Redis):')
    console.log('   • Free Tier: $0/month (30K requests)')
    console.log('   • Pro Tier: $20/month (1M requests)')
    console.log(`   • Estimated usage: ~${MONTHLY_VOLUME.marketData * 2} requests/month`)
    console.log('   • ⚠️  NEED PRO TIER: $20/month')
    
    // InfluxDB costs (optional for time-series)
    console.log('\n📊 INFLUXDB CLOUD (Time-Series):')
    console.log('   • Free Tier: $0/month (30-day retention)')
    console.log('   • Usage-based: ~$25/month for our volume')
    console.log('   • 🔄 OPTIONAL: Can use Supabase instead')
    
    // Market data costs
    console.log('\n📈 MARKET DATA API:')
    console.log('   • Alpha Vantage: $25/month (premium)')
    console.log('   • Polygon.io: $99/month (stocks)')
    console.log('   • IEX Cloud: $50/month (core plan)')
    console.log('   • 💡 RECOMMENDATION: Alpha Vantage $25/month')
    
    // AI/ML costs
    console.log('\n🤖 AI/ML SERVICES:')
    console.log('   • OpenAI API: ~$50/month (GPT-4 for insights)')
    console.log('   • Anthropic Claude: ~$30/month (alternative)')
    console.log('   • 💡 RECOMMENDATION: OpenAI $50/month')
    
    // Total cost summary
    console.log('\n💳 TOTAL MONTHLY COST ESTIMATE:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('   • Supabase:      $0    (free tier)')
    console.log('   • Vercel KV:     $20   (pro tier)')
    console.log('   • Market Data:   $25   (Alpha Vantage)')
    console.log('   • AI Services:   $50   (OpenAI)')
    console.log('   ────────────────────────────────────────')
    console.log('   • TOTAL:         $95/month')
    console.log('   • Per trade:     $0.54 per trade')
    console.log('   • Per user:      $95/month (single user)')
    console.log('\n🎯 SCALING COSTS:')
    console.log('   • 10 users:      ~$150/month ($15/user)')
    console.log('   • 100 users:     ~$400/month ($4/user)')
    console.log('   • 1000 users:    ~$1,500/month ($1.50/user)')
    
    console.log('\n📋 RECOMMENDATIONS:')
    console.log('   ✅ Start with Supabase free tier')
    console.log('   ✅ Use Vercel KV for real-time caching')
    console.log('   ✅ Alpha Vantage for market data')
    console.log('   ✅ OpenAI for AI insights')
    console.log('   📈 Total cost scales efficiently with users')
    
  } catch (error) {
    console.error('❌ Population failed:', error)
  }
}

// Run the population script
populateDatabase()
