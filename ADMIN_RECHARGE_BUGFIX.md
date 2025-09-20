# Critical Bug Fix: Admin Recharge Balance Override Issue

## Problem Description
When an admin used the `/admin/operate` functionality to recharge a user's balance, instead of **adding** the recharge amount to the existing balance, the system was **replacing** the entire balance with the recharge amount.

**Example:**
- User has $100 USDT balance
- Admin recharges $10 USDT  
- Expected result: $110 USDT
- **Actual result: $10 USDT (CRITICAL BUG!)**

## Root Cause Analysis
The issue was in `/pages/api/admin/funds/recharge.js` at lines 45-57:

### Problematic Code (Before Fix):
```javascript
// Upsert portfolio - create if doesn't exist, update if exists
const { data: pf, error: pfError } = await supabaseAdmin
  .from('portfolios')
  .upsert(
    { user_id: userId, currency, balance: 0 },  // ❌ OVERWRITES existing balance with 0!
    { onConflict: 'user_id,currency', ignoreDuplicates: false }
  )
  .select()
  .single();

// Update balance
const newBalance = Number(pf.balance) + amt;  // ❌ pf.balance is always 0 due to upsert!
```

### The Problem:
1. The `upsert` operation with `balance: 0` **overwrote** existing balances
2. This meant `pf.balance` was always `0`, regardless of the user's actual balance
3. The calculation `newBalance = 0 + rechargeAmount` only resulted in the recharge amount

## Solution Applied
Replaced the problematic upsert logic with the proper `adjust_balance` database function:

### Fixed Code (After Fix):
```javascript
// Use the adjust_balance function to safely add balance
const { data: adjustResult, error: adjustError } = await supabaseAdmin
  .rpc('adjust_balance', {
    p_user_id: userId,
    p_currency: currency,
    p_delta: amt  // ✅ Properly ADDS to existing balance
  });

// Get the updated balance for response
const { data: updatedPortfolio, error: portfolioError } = await supabaseAdmin
  .from('portfolios')
  .select('balance')
  .eq('user_id', userId)
  .eq('currency', currency)
  .single();

const newBalance = updatedPortfolio?.balance || 0;
```

## Why This Fix Works
1. **Atomic Operation**: `adjust_balance` uses row-level locking to prevent race conditions
2. **Proper Addition**: The function adds the `p_delta` amount to the existing balance
3. **Safe Creation**: If no portfolio exists, it creates one with the recharge amount
4. **Production-Ready**: This is the same function used throughout the codebase for all balance operations

## Impact
- **Critical Security Fix**: Prevents admin operations from accidentally destroying user balances
- **Data Integrity**: Ensures all balance operations are atomic and consistent  
- **Production Ready**: Aligns with the existing balance management system

## Testing Verification
After applying this fix:
1. User with $100 USDT balance
2. Admin recharges $10 USDT
3. ✅ **Result: $110 USDT (CORRECT!)**

## Files Modified
- `/pages/api/admin/funds/recharge.js` - Fixed the balance calculation logic

## Deployment Notes
This fix is **immediately production-ready** and should be deployed ASAP to prevent further balance corruption incidents.

---
**Fix Applied Date**: $(date)
**Severity**: Critical - Data Corruption Prevention
**Status**: ✅ RESOLVED